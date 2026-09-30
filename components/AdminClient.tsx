'use client';

import { useEffect, useState } from 'react';

type Report = { id: string; target_id: string; reason: string; status: string; created_at: string };
type Ad = {
  id: string;
  name: string;
  type: string;
  placement: string;
  status: string;
  target_url: string | null;
};
type AppUser = { id: string; email: string | null; role: string; created_at: string };

export default function AdminClient() {
  const [tab, setTab] = useState<'reports' | 'ads' | 'users'>('reports');

  const [reports, setReports] = useState<Report[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [adName, setAdName] = useState('');
  const [adType, setAdType] = useState('Image');
  const [adPlacement, setAdPlacement] = useState('homepage_top');
  const [adUrl, setAdUrl] = useState('');

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [reportsRes, adsRes, usersRes] = await Promise.all([
        fetch('/api/admin?resource=reports'),
        fetch('/api/admin?resource=advertisements'),
        fetch('/api/admin?resource=users'),
      ]);
      const [reportsBody, adsBody, usersBody] = await Promise.all([
        reportsRes.json(),
        adsRes.json(),
        usersRes.json(),
      ]);
      if (!reportsRes.ok) throw new Error(reportsBody.error);
      if (!adsRes.ok) throw new Error(adsBody.error);
      if (!usersRes.ok) throw new Error(usersBody.error);
      setReports(reportsBody.reports ?? []);
      setAds(adsBody.advertisements ?? []);
      setUsers(usersBody.users ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function updateReport(id: string, status: string) {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-report', id, status }),
    });
    loadAll();
  }

  async function createAd() {
    if (!adName) return;
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create-ad',
        name: adName,
        type: adType,
        placement: adPlacement,
        target_url: adUrl,
      }),
    });
    setAdName('');
    setAdUrl('');
    loadAll();
  }

  async function toggleAd(id: string, currentStatus: string) {
    const status = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-ad', id, status }),
    });
    loadAll();
  }

  async function deleteAd(id: string) {
    await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete-ad', id }),
    });
    loadAll();
  }

  if (loading) return <div className="card"><p className="sub">Loading…</p></div>;
  if (error) return <div className="card"><p className="error-text">{error}</p></div>;

  return (
    <div className="card">
      <h1 className="page-title">Admin</h1>

      <div className="tabs">
        <button className={`tabbtn ${tab === 'reports' ? 'active' : ''}`} onClick={() => setTab('reports')}>
          <svg className="icon"><use href="#i-mega" /></svg>
          Reports
        </button>
        <button className={`tabbtn ${tab === 'ads' ? 'active' : ''}`} onClick={() => setTab('ads')}>
          <svg className="icon"><use href="#i-mega" /></svg>
          Advertisements
        </button>
        <button className={`tabbtn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <svg className="icon"><use href="#i-users" /></svg>
          Users
        </button>
      </div>

      {tab === 'reports' && (
        <>
          <h2>Reports</h2>
          {reports.length === 0 ? (
            <p className="sub" style={{ marginTop: 10 }}>No reports.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Target</th><th>Reason</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>{r.target_id}</td>
                      <td>{r.reason}</td>
                      <td>
                        <span className={`badge ${r.status === 'Pending' ? 'off' : 'ok'}`}>{r.status}</span>
                      </td>
                      <td>
                        {r.status === 'Pending' && (
                          <>
                            <button className="btn ghost sm" onClick={() => updateReport(r.id, 'Reviewed')}>Review</button>{' '}
                            <button className="btn danger sm" onClick={() => updateReport(r.id, 'Disabled')}>Disable</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'ads' && (
        <>
          <h2>Advertisement manager</h2>
          {ads.length === 0 ? (
            <p className="sub" style={{ marginTop: 10 }}>No advertisements yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Type</th><th>Placement</th><th>Status</th><th></th></tr>
                </thead>
                <tbody>
                  {ads.map((ad) => (
                    <tr key={ad.id}>
                      <td>{ad.name}</td>
                      <td>{ad.type}</td>
                      <td>{ad.placement}</td>
                      <td><span className={`badge ${ad.status === 'ACTIVE' ? 'ok' : 'off'}`}>{ad.status}</span></td>
                      <td>
                        <button className="btn ghost sm" onClick={() => toggleAd(ad.id, ad.status)}>Toggle</button>{' '}
                        <button className="btn danger sm" onClick={() => deleteAd(ad.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <h2 style={{ marginTop: 22 }}>Add advertisement</h2>
          <label>Name</label>
          <input type="text" value={adName} onChange={(e) => setAdName(e.target.value)} placeholder="Summer campaign" />
          <div className="row">
            <div className="col">
              <label>Type</label>
              <select value={adType} onChange={(e) => setAdType(e.target.value)}>
                <option value="Image">Image</option>
                <option value="Video">Video</option>
              </select>
            </div>
            <div className="col">
              <label>Placement</label>
              <select value={adPlacement} onChange={(e) => setAdPlacement(e.target.value)}>
                <option>homepage_top</option>
                <option>homepage_bottom</option>
                <option>qr_generator</option>
                <option>file_share</option>
                <option>download_page</option>
              </select>
            </div>
          </div>
          <label>Destination URL</label>
          <input type="url" value={adUrl} onChange={(e) => setAdUrl(e.target.value)} placeholder="https://example.com" />
          <button className="btn primary" onClick={createAd}>
            <svg className="icon"><use href="#i-plus" /></svg>
            Create advertisement
          </button>
        </>
      )}

      {tab === 'users' && (
        <>
          <h2>Users</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Email</th><th>Role</th><th>Joined</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}