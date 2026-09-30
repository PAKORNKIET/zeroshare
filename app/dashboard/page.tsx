import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase';
import Mascot from '@/components/Mascot';

export const dynamic = 'force-dynamic';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatExpiry(value: string | null): string {
  if (!value) return 'Permanent';
  const date = new Date(value);
  if (date < new Date()) return 'Expired';
  return date.toLocaleString();
}

export default async function DashboardPage() {
  const authClient = await getSupabaseServer();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    return (
      <div className="card empty">
        <Mascot size={132} />
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="sub">
            You&rsquo;re browsing as a guest — everything on Zero Share works without
            an account. Sign in to keep track of what you&rsquo;ve shared.
          </p>
          <Link href="/login" className="btn primary">
            <svg className="icon">
              <use href="#i-users" />
            </svg>
            Log in
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
        <h1 className="page-title">Dashboard</h1>
        <p className="sub">Signed in as {user.email}</p>

        <div className="grid3">
          <div className="box">
            <div className="stat">
              <svg className="icon-lg">
                <use href="#i-qr" />
              </svg>
              <div>
                <b>{qrList.length}</b>
                <span>QR codes</span>
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
                <span>Files shared</span>
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
                <span>Total downloads</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>My QR codes</h2>
        {qrList.length === 0 ? (
          <p className="sub" style={{ marginTop: 10 }}>
            Nothing yet. Codes you create while signed in show up here.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Destination</th>
                  <th>Expires</th>
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
        <h2>My files</h2>
        {fileList.length === 0 ? (
          <p className="sub" style={{ marginTop: 10 }}>
            Nothing yet. Files you share while signed in show up here.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Size</th>
                  <th>Downloads</th>
                  <th>Expires</th>
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