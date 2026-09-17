import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { requireAdmin } from '@/lib/require-admin';

/**
 * GET /api/admin?resource=reports|advertisements|users
 * POST /api/admin  body: { action, resource, ...fields }
 *   action: 'update-report' | 'create-ad' | 'update-ad' | 'delete-ad'
 *
 * Every request re-checks admin status server-side — the role check on the
 * page itself is not enough on its own, since API routes are reachable
 * directly.
 */

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const resource = req.nextUrl.searchParams.get('resource');
  const supabase = getSupabaseAdmin();

  if (resource === 'reports') {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data });
  }

  if (resource === 'advertisements') {
    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ advertisements: data });
  }

  if (resource === 'users') {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ users: data });
  }

  return NextResponse.json({ error: 'Unknown resource' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { action } = body;

  async function logAudit(actionDescription: string) {
    await supabase.from('audit_logs').insert({
      admin_id: admin!.id,
      action: actionDescription,
    });
  }

  if (action === 'update-report') {
    const { id, status } = body;
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(`Set report ${id} to ${status}`);
    return NextResponse.json({ ok: true });
  }

  if (action === 'create-ad') {
    const { name, type, placement, target_url, media_url, start_at, end_at, status } = body;
    const { error } = await supabase.from('advertisements').insert({
      name,
      type,
      placement,
      target_url,
      media_url,
      start_at: start_at || null,
      end_at: end_at || null,
      status: status || 'ACTIVE',
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(`Created advertisement: ${name}`);
    return NextResponse.json({ ok: true });
  }

  if (action === 'update-ad') {
    const { id, status } = body;
    const { error } = await supabase.from('advertisements').update({ status }).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(`Changed advertisement ${id} status to ${status}`);
    return NextResponse.json({ ok: true });
  }

  if (action === 'delete-ad') {
    const { id } = body;
    const { error } = await supabase.from('advertisements').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await logAudit(`Deleted advertisement ${id}`);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}