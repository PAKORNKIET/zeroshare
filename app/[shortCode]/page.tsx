import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import Mascot from '@/components/Mascot';

export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ shortCode: string }>;
}) {
  const { shortCode } = await params;

  const supabase = getSupabaseAdmin();
  const { data: qr } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('short_code', shortCode)
    .maybeSingle();

  const expired = qr?.expires_at && new Date(qr.expires_at) < new Date();

  if (!qr || expired) {
    return (
      <div className="solo">
        <div className="card solo-card">
          <Mascot mood="sad" size={112} />
          <h1>{expired ? 'This code has expired.' : 'This code does not exist.'}</h1>
          <p className="sub">
            The QR code may have been removed, or reached its expiry date.
          </p>
        </div>
      </div>
    );
  }

  // url, file (reference), and dynamic QR types all just redirect to the
  // current destination stored on the row.
  redirect(qr.destination);
}
