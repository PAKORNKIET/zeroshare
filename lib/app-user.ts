import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * The public.users table holds app-level profile rows keyed off
 * auth_user_id. This finds the row for a logged-in auth user, creating it
 * on first use if it doesn't exist yet, and returns its id — the value
 * used as owner_id on qr_codes / files.
 */
export async function getOrCreateAppUser(
  supabaseAdmin: SupabaseClient,
  authUserId: string,
  email: string | null
): Promise<string> {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from('users')
    .insert({ auth_user_id: authUserId, email })
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}