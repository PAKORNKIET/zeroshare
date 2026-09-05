'use client';

import { useEffect, useState, use } from 'react';

type Meta = {
  file_name: string;
  size: number;
  mime_type: string;
  password_required: boolean;
  one_time: boolean;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DownloadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [meta, setMeta] = useState<Meta | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/files/${token}`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Something went wrong.');
        setMeta(body);
      })
      .catch((err) => setLoadError(err.message));
  }, [token]);

  async function handleDownload() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/files/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(password ? { password } : {}),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not start the download.');
      window.location.href = body.download_url;
      setDone(true);
    } catch (err) {
      setActionError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.mark} />
          <span style={styles.brandWord}>
            Zero<span style={{ color: '#2F5BFF' }}>Share</span>
          </span>
        </div>

        {loadError && (
          <>
            <h1 style={styles.title}>
              {loadError === 'This link has expired.'
                ? 'This link has expired.'
                : 'This link does not exist.'}
            </h1>
            <p style={styles.sub}>
              The file may have been removed, or the link reached its expiry or
              download limit.
            </p>
          </>
        )}

        {!loadError && !meta && <p style={styles.sub}>Loading&hellip;</p>}

        {meta && !done && (
          <>
            <h1 style={styles.title}>{meta.file_name}</h1>
            <p style={styles.sub}>
              {formatSize(meta.size)} &middot; {meta.mime_type}
              {meta.one_time ? ' · one-time download' : ''}
            </p>

            {meta.password_required && (
              <div style={{ marginTop: 16 }}>
                <label style={styles.label}>This file is password protected</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  style={styles.input}
                />
              </div>
            )}

            <button
              onClick={handleDownload}
              disabled={busy || (meta.password_required && !password)}
              style={{
                ...styles.button,
                opacity: busy || (meta.password_required && !password) ? 0.6 : 1,
              }}
            >
              {busy ? 'Preparing download…' : 'Download'}
            </button>

            {actionError && <p style={styles.error}>{actionError}</p>}
          </>
        )}

        {done && (
          <>
            <h1 style={styles.title}>Your download has started</h1>
            <p style={styles.sub}>
              If nothing happened, check your browser&rsquo;s download prompt or
              pop-up blocker.
            </p>
          </>
        )}
      </div>
    </div>
  );
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
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  mark: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '1.4px solid #14171C',
  },
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
    wordBreak: 'break-word',
  },
  sub: {
    color: '#565B63',
    fontSize: 14,
    margin: 0,
  },
  label: {
    display: 'block',
    fontSize: 12.5,
    fontWeight: 600,
    color: '#565B63',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '9px 10px',
    border: '1px solid #DFE1DD',
    borderRadius: 3,
    fontSize: 14,
  },
  button: {
    width: '100%',
    marginTop: 18,
    background: '#2F5BFF',
    color: '#fff',
    border: 'none',
    padding: '11px 16px',
    borderRadius: 3,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  error: {
    color: '#B4232B',
    fontSize: 13,
    marginTop: 10,
  },
};