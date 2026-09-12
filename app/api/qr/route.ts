import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

function randomShortCode(length = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
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
  if (!ms) return null; // 'custom' — caller should pass an explicit date instead
  return new Date(now.getTime() + ms).toISOString();
}

/**
 * POST /api/qr
 * body: {
 *   type: 'url' | 'file' | 'dynamic',
 *   destination: string,          // the URL, file reference, or initial destination
 *   expiry?: string,               // '1h' | '6h' | ... | '30d' | 'permanent' | 'custom'
 *   customExpiresAt?: string       // ISO date, required when expiry === 'custom'
 * }
 */
export async function POST(req: NextRequest) {
  let body: {
    type?: string;
    destination?: string;
    expiry?: string;
    customExpiresAt?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, destination, expiry, customExpiresAt } = body;

  if (!type || !['url', 'file', 'dynamic'].includes(type)) {
    return NextResponse.json(
      { error: "type must be one of 'url', 'file', 'dynamic'" },
      { status: 400 }
    );
  }
  if (!destination || typeof destination !== 'string') {
    return NextResponse.json({ error: 'destination is required' }, { status: 400 });
  }

  const expires_at =
    expiry === 'custom' ? customExpiresAt ?? null : expiryToDate(expiry ?? 'permanent');

  const supabase = getSupabaseAdmin();

  // Guard against a rare short_code collision by retrying a couple of times.
  let short_code = randomShortCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: existing } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('short_code', short_code)
      .maybeSingle();
    if (!existing) break;
    short_code = randomShortCode();
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .insert({
      type,
      destination,
      short_code,
      expires_at,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: data.id,
    short_code: data.short_code,
    short_url: `${req.nextUrl.origin}/${data.short_code}`,
    type: data.type,
    destination: data.destination,
    expires_at: data.expires_at,
  });
}