import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, randomBytes, scryptSync } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { uploadToR2 } from '@/lib/r2';

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

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a file field' },
      { status: 400 }
    );
  }

  const file = form.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const expiry = (form.get('expiry') as string) || '24h';
  const customExpiresAt = form.get('customExpiresAt') as string | null;
  const downloadLimitRaw = form.get('downloadLimit') as string | null;
  const password = form.get('password') as string | null;
  const oneTime = (form.get('oneTime') as string | null) === 'true';

  const downloadLimit = downloadLimitRaw ? parseInt(downloadLimitRaw, 10) : null;
  const expires_at = expiry === 'custom' ? customExpiresAt : expiryToDate(expiry);

  const MAX_FILE_SIZE = 200 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File exceeds the ${MAX_FILE_SIZE / (1024 * 1024)} MB limit` },
      { status: 413 }
    );
  }

  const supabase = getSupabaseAdmin();

  const fileId = randomUUID();
  const storageKey = `uploads/${fileId}-${file.name}`;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadToR2(storageKey, buffer, file.type || 'application/octet-stream');
  } catch (err) {
    return NextResponse.json(
      { error: 'Upload to storage failed: ' + (err as Error).message },
      { status: 500 }
    );
  }

  const { data: fileRow, error: fileError } = await supabase
    .from('files')
    .insert({
      id: fileId,
      name: file.name,
      size: file.size,
      mime_type: file.type || 'application/octet-stream',
      storage_key: storageKey,
      expires_at,
      download_limit: downloadLimit,
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
      one_time: oneTime,
      expires_at,
      max_downloads: downloadLimit,
    })
    .select()
    .single();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  return NextResponse.json({
    token: linkRow.token,
    url: `https://zeroshare.co/s/${linkRow.token}`,
    file_name: fileRow.name,
    size: fileRow.size,
    expires_at: linkRow.expires_at,
    password_protected: !!linkRow.password_hash,
    one_time: linkRow.one_time,
    max_downloads: linkRow.max_downloads,
  });
}