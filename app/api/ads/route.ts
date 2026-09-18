import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * GET /api/ads?placement=homepage_top
 * Returns the most recent ACTIVE ad for that placement whose start/end
 * window (if set) includes right now, or { ad: null } if none applies.
 * Public endpoint — no auth required, matches the "Public can read active
 * advertisements" RLS policy from the schema.
 */
export async function GET(req: NextRequest) {
  const placement = req.nextUrl.searchParams.get('placement');
  if (!placement) {
    return NextResponse.json({ error: 'placement is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('advertisements')
    .select('id, name, type, media_url, target_url, start_at, end_at')
    .eq('placement', placement)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const active = (data ?? []).find((ad) => {
    if (ad.start_at && ad.start_at > nowIso) return false;
    if (ad.end_at && ad.end_at < nowIso) return false;
    return true;
  });

  // Fire-and-forget impression tracking — don't block the response on it.
  if (active) {
    supabase
      .from('ad_events')
      .insert({ advertisement_id: active.id, event_type: 'impression' })
      .then(() => {});
  }

  return NextResponse.json({ ad: active ?? null });
}