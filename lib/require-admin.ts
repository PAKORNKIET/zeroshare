import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';

/**
 * Returns the logged-in user's email + role if they're an admin, or null
 * if they're not logged in or aren't an admin. Use this to guard any
 * admin-only page or route.
 */
export async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  const authClient = await getSupabaseServer();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return null;

  const supabase = getSupabaseAdmin();
  const { data: appUser } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (!appUser || appUser.role !== 'admin') return null;

  return { id: appUser.id, email: appUser.email ?? user.email ?? '' };
}