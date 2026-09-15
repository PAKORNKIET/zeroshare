import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase client for auth actions (sign in, sign up, sign
 * out) called from Client Components.
 */
export function getSupabaseBrowserAuth() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}