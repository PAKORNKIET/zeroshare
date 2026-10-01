import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import Mascot from '@/components/Mascot';
import { getLocale } from '@/lib/i18n-server';
import { createTranslator, dateLocale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = createTranslator(locale);
  const formatExpiry = (value: string | null) => {
    if (!value) return t('common.permanent');
    const date = new Date(value);
    if (date < new Date()) return t('common.expired');
    return date.toLocaleString(dateLocale(locale));
  };

  const authClient = await getSupabaseServer();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return (
      <div className="card empty">
        <Mascot size={104} />
        <div>
          <h1 className="page-title">{t('dash.title')}</h1>
          <p className="sub">{t('dash.guest')}</p>
          <Link href="/login" className="btn primary">
            <svg className="icon">
              <use href="#i-users" />
            </svg>
            {t('dash.login')}
          </Link>
        </div>
      </div>
    );
  }

  const supabase = getSupabaseAdmin();

  const { data: appUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  const ownerId = appUser?.id ?? null;

  const [{ data: qrCodes }, { data: files }] = await Promise.all([
    ownerId
      ? supabase
          .from('qr_codes')
          .select('*')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
    ownerId
      ? supabase
          .from('files')
          .select('*, links(token, download_count, max_downloads, expires_at)')
          .eq('owner_id', ownerId)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as Record<string, unknown>[] }),
  ]);

  const qrList = (qrCodes ?? []) as {
    id: string;
    type: string;
    destination: string;
    short_code: string;
    expires_at: string | null;
  }[];

  const fileList = (files ?? []) as {
    id: string;
    name: string;
    size: number;
    expires_at: string | null;
    download_count: number;
    download_limit: number | null;
    links: { token: string }[] | { token: string } | null;
  }[];

  const totalDownloads = fileList.reduce((sum, f) => sum + (f.download_count ?? 0), 0);

  return (
    <div>
      <div className="card">
        <h1 className="page-title">{t('dash.title')}</h1>
        <p className="sub">{t('dash.signedInAs', { email: user.email ?? '' })}</p>

        <div className="grid3">
          <div className="box">
            <div className="stat">
              <svg className="icon-lg">
                <use href="#i-qr" />
              </svg>
              <div>
                <b>{qrList.length}</b>
                <span>{t('dash.qrCount')}</span>
              </div>
            </div>
          </div>
          <div className="box">
            <div className="stat">
              <svg className="icon-lg">
                <use href="#i-file" />
              </svg>
              <div>
                <b>{fileList.length}</b>
                <span>{t('dash.filesShared')}</span>
              </div>
            </div>
          </div>
          <div className="box">
            <div className="stat">
              <svg className="icon-lg">
                <use href="#i-drop" />
              </svg>
              <div>
                <b>{totalDownloads}</b>
                <span>{t('dash.downloads')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>{t('dash.myQr')}</h2>
        {qrList.length === 0 ? (
          <p className="sub tight">{t('dash.noQr')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('col.code')}</th>
                  <th>{t('col.type')}</th>
                  <th>{t('col.destination')}</th>
                  <th>{t('col.expires')}</th>
                </tr>
              </thead>
              <tbody>
                {qrList.map((qr) => (
                  <tr key={qr.id}>
                    <td className="mono">{qr.short_code}</td>
                    <td>{qr.type}</td>
                    <td className="truncate">
                      {qr.destination}
                    </td>
                    <td>{formatExpiry(qr.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2>{t('dash.myFiles')}</h2>
        {fileList.length === 0 ? (
          <p className="sub tight">{t('dash.noFiles')}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{t('col.file')}</th>
                  <th>{t('col.size')}</th>
                  <th>{t('col.downloads')}</th>
                  <th>{t('col.expires')}</th>
                </tr>
              </thead>
              <tbody>
                {fileList.map((f) => (
                  <tr key={f.id}>
                    <td className="truncate">
                      {f.name}
                    </td>
                    <td>{formatSize(f.size)}</td>
                    <td>
                      {f.download_count ?? 0}
                      {f.download_limit ? ` / ${f.download_limit}` : ''}
                    </td>
                    <td>{formatExpiry(f.expires_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}