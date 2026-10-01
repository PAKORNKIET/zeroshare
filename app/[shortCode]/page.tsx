import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';
import Mascot from '@/components/Mascot';
import { getT } from '@/lib/i18n-server';

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
    const t = await getT();
    return (
      <div className="solo">
        <div className="card solo-card">
          <Mascot mood="sad" size={88} />
          <h1>{expired ? t('qr.codeExpired') : t('qr.codeMissing')}</h1>
          <p className="sub">{t('qr.goneSub')}</p>
        </div>
      </div>
    );
  }

  // url, file (reference), and dynamic QR types all just redirect to the
  // current destination stored on the row.
  redirect(qr.destination);
}
