import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, randomBytes, scryptSync } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getOrCreateAppUser } from '@/lib/app-user';
import { getR2UploadUrl } from '@/lib/r2';

function randomToken(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function expiryToDate(expiry: string): string | null {
  if (!expiry || expiry === 'permanent') return null;
  const now = new Date();
  const map: Record<string, number> = {
    '1h': 1 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '12h': 12 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  const ms = map[expiry];
  if (!ms) return null;
  return new Date(now.getTime() + ms).toISOString();
}

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB — tune as real usage limits get defined.

/**
 * POST /api/files/presign
 * body (JSON, no file bytes): {
 *   fileName, fileType, fileSize,
 *   expiry, customExpiresAt?, downloadLimit?, password?, oneTime?
 * }
 *
 * Creates the files/links rows up front and returns a short-lived signed
 * PUT URL. The browser then uploads the raw file bytes straight to R2,
 * never touching this server — which sidesteps Vercel's ~4.5MB request
 * body limit on serverless functions.
 */
export async function POST(req: NextRequest) {
  let body: {
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    expiry?: string;
    customExpiresAt?: string;
    downloadLimit?: number;
    password?: string;
    oneTime?: boolean;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    fileName,
    fileType,
    fileSize,
    expiry = '24h',
    customExpiresAt,
    downloadLimit,
    password,
    oneTime,
  } = body;

  if (!fileName || typeof fileSize !== 'number') {
    return NextResponse.json(
      { error: 'fileName and fileSize are required' },
      { status: 400 }
    );
  }

  if (fileSize > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit` },
      { status: 413 }
    );
  }

  const expires_at = expiry === 'custom' ? customExpiresAt ?? null : expiryToDate(expiry);
  const supabase = getSupabaseAdmin();

  let owner_id: string | null = null;
  try {
    const authClient = await getSupabaseServer();
    const { data: authData } = await authClient.auth.getUser();
    if (authData.user) {
      owner_id = await getOrCreateAppUser(
        supabase,
        authData.user.id,
        authData.user.email ?? null
      );
    }
  } catch {
    // Guest uploads should never be blocked by an auth lookup failure.
  }

  const fileId = randomUUID();
  const storageKey = `uploads/${fileId}-${fileName}`;
  const contentType = fileType || 'application/octet-stream';

  const { data: fileRow, error: fileError } = await supabase
    .from('files')
    .insert({
      id: fileId,
      name: fileName,
      size: fileSize,
      mime_type: contentType,
      storage_key: storageKey,
      expires_at,
      download_limit: downloadLimit ?? null,
      owner_id,
    })
    .select()
    .single();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  let token = randomToken();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: existing } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    if (!existing) break;
    token = randomToken();
  }

  const { data: linkRow, error: linkError } = await supabase
    .from('links')
    .insert({
      file_id: fileRow.id,
      token,
      password_hash: password ? hashPassword(password) : null,
      one_time: !!oneTime,
      expires_at,
      max_downloads: downloadLimit ?? null,
    })
    .select()
    .single();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  let uploadUrl: string;
  try {
    uploadUrl = await getR2UploadUrl(storageKey, contentType, 600);
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not create upload URL: ' + (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    uploadUrl,
    token: linkRow.token,
    url: `${req.nextUrl.origin}/s/${linkRow.token}`,
    file_name: fileRow.name,
    size: fileRow.size,
    expires_at: linkRow.expires_at,
    password_protected: !!linkRow.password_hash,
    one_time: linkRow.one_time,
    max_downloads: linkRow.max_downloads,
  });
}