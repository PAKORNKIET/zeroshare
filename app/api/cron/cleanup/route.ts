import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { deleteFromR2 } from '@/lib/r2';

/**
 * GET /api/cron/cleanup
 * Header: x-cron-secret: <CRON_SECRET from .env.local>
 *
 * Finds links whose expiry has passed (either the file's own expiry, or a
 * one-time link that already expired itself after its single download),
 * deletes the file's object from R2, then deletes the file row — which
 * cascades to delete the link row too (files.id -> links.file_id ON DELETE
 * CASCADE from the schema).
 *
 * Also removes expired QR codes, which have no storage component to clean.
 *
 * Intended to be called on a schedule (every few minutes) by whatever
 * scheduler ends up running this app — Cloudflare Cron Triggers, Vercel
 * Cron, or a simple external uptime-ping service. For now, trigger it by
 * hand while testing.
 */
export async function GET(req: NextRequest) {
  // Vercel Cron automatically sends "Authorization: Bearer <CRON_SECRET>"
  // when an env var named CRON_SECRET exists on the project. Manual testing
  // (PowerShell, etc.) can use the same header, or the older x-cron-secret
  // header for convenience.
  const authHeader = req.headers.get('authorization');
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const legacySecret = req.headers.get('x-cron-secret');
  const provided = bearerSecret ?? legacySecret;

  if (!provided || provided !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  // 1. Find expired links (join to get the file's storage_key).
  const { data: expiredLinks, error: linksError } = await supabase
    .from('links')
    .select('id, file_id, token, files(id, storage_key, name)')
    .lt('expires_at', nowIso);

  if (linksError) {
    return NextResponse.json({ error: linksError.message }, { status: 500 });
  }

  const deleted: string[] = [];
  const failed: { token: string; error: string }[] = [];

  for (const link of expiredLinks ?? []) {
    const file = Array.isArray(link.files) ? link.files[0] : link.files;
    if (!file) continue;

    try {
      await deleteFromR2(file.storage_key);
    } catch (err) {
      // Object may already be gone — log and continue to remove the DB rows
      // anyway so we don't retry forever on a missing object.
      failed.push({ token: link.token, error: (err as Error).message });
    }

    // Deleting the file row cascades to delete this link row too.
    const { error: deleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', file.id);

    if (deleteError) {
      failed.push({ token: link.token, error: deleteError.message });
    } else {
      deleted.push(link.token);
    }
  }

  // 2. Clean up expired QR codes (no R2 object involved).
  const { error: qrError, count: qrDeletedCount } = await supabase
    .from('qr_codes')
    .delete({ count: 'exact' })
    .lt('expires_at', nowIso);

  return NextResponse.json({
    files_deleted: deleted.length,
    file_tokens_deleted: deleted,
    file_deletion_failures: failed,
    qr_codes_deleted: qrError ? 0 : qrDeletedCount ?? 0,
    qr_deletion_error: qrError?.message ?? null,
    ran_at: nowIso,
  });
}