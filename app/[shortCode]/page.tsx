import { redirect } from 'next/navigation';
import { getSupabaseAdmin } from '@/lib/supabase';

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
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.brand}>
            <div style={styles.mark} />
            <span style={styles.brandWord}>
              Zero<span style={{ color: '#2F5BFF' }}>Share</span>
            </span>
          </div>
          <h1 style={styles.title}>
            {expired ? 'This code has expired.' : 'This code does not exist.'}
          </h1>
          <p style={styles.sub}>
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

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F3F4F1',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #DFE1DD',
    borderRadius: 6,
    padding: '32px 28px',
    maxWidth: 420,
    width: '100%',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  mark: { width: 22, height: 22, borderRadius: '50%', border: '1.4px solid #14171C' },
  brandWord: {
    fontFamily: 'Space Grotesk, system-ui, sans-serif',
    fontWeight: 700,
    fontSize: 16,
    color: '#14171C',
  },
  title: {
    fontFamily: 'Space Grotesk, system-ui, sans-serif',
    fontSize: 20,
    fontWeight: 600,
    color: '#14171C',
    margin: '0 0 6px',
  },
  sub: { color: '#565B63', fontSize: 14, margin: 0 },
};