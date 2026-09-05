import { NextRequest, NextResponse } from 'next/server';
import { scryptSync, timingSafeEqual } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getR2DownloadUrl } from '@/lib/r2';

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}

async function loadLink(token: string) {
  const supabase = getSupabaseAdmin();
  const { data: link, error } = await supabase
    .from('links')
    .select('*, files(*)')
    .eq('token', token)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return link;
}

function isExpired(link: { expires_at: string | null; max_downloads: number | null; download_count: number }) {
  if (link.expires_at && new Date(link.expires_at) < new Date()) return true;
  if (link.max_downloads != null && link.download_count >= link.max_downloads) return true;
  return false;
}

/**
 * GET /api/files/[token]
 * Returns file metadata and whether a password is required — never the
 * actual download URL. The frontend uses this to render the download page
 * (and a password prompt, if needed) before calling POST.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let link;
  try {
    link = await loadLink(token);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (!link || !link.files) {
    return NextResponse.json({ error: 'This link does not exist.' }, { status: 404 });
  }

  if (isExpired(link)) {
    return NextResponse.json({ error: 'This link has expired.' }, { status: 410 });
  }

  return NextResponse.json({
    file_name: link.files.name,
    size: link.files.size,
    mime_type: link.files.mime_type,
    password_required: !!link.password_hash,
    one_time: link.one_time,
  });
}

/**
 * POST /api/files/[token]
 * body: { password?: string }
 * Verifies the password (if required) and the expiry/download-limit rules,
 * then returns a short-lived signed URL to download directly from R2.
 * Also increments the download count and applies one-time expiry.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let body: { password?: string } = {};
  try {
    body = await req.json();
  } catch {
    // No body / not JSON — fine, treat as "no password supplied".
  }

  let link;
  try {
    link = await loadLink(token);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  if (!link || !link.files) {
    return NextResponse.json({ error: 'This link does not exist.' }, { status: 404 });
  }

  if (isExpired(link)) {
    return NextResponse.json({ error: 'This link has expired.' }, { status: 410 });
  }

  if (link.password_hash) {
    if (!body.password || !verifyPassword(body.password, link.password_hash)) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 });
    }
  }

  let downloadUrl: string;
  try {
    downloadUrl = await getR2DownloadUrl(link.files.storage_key, 300);
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not generate download link: ' + (err as Error).message },
      { status: 500 }
    );
  }

  const supabase = getSupabaseAdmin();
  const newLinkCount = link.download_count + 1;
  const newFileCount = link.files.download_count + 1;

  const linkShouldExpireNow = link.one_time;

  await supabase
    .from('links')
    .update({
      download_count: newLinkCount,
      ...(linkShouldExpireNow ? { expires_at: new Date().toISOString() } : {}),
    })
    .eq('id', link.id);

  await supabase
    .from('files')
    .update({ download_count: newFileCount })
    .eq('id', link.files.id);

  return NextResponse.json({
    download_url: downloadUrl,
    file_name: link.files.name,
    expires_in_seconds: 300,
  });
}