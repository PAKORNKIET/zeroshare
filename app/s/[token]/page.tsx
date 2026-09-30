'use client';

import { useEffect, useState, use } from 'react';
import Mascot from '@/components/Mascot';

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
    <div className="solo">
      <div className="card solo-card">
        <Mascot mood={loadError ? 'sad' : meta ? 'happy' : 'wait'} size={112} />

        {loadError && (
          <>
            <h1>
              {loadError === 'This link has expired.'
                ? 'This link has expired.'
                : 'This link does not exist.'}
            </h1>
            <p className="sub">
              The file may have been removed, or the link reached its expiry or
              download limit.
            </p>
          </>
        )}

        {!loadError && !meta && <p className="sub">Loading&hellip;</p>}

        {meta && !done && (
          <>
            <h1>{meta.file_name}</h1>
            <p className="sub">
              {formatSize(meta.size)} &middot; {meta.mime_type}
              {meta.one_time ? ' · one-time download' : ''}
            </p>

            {meta.password_required && (
              <>
                <label>This file is password protected</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
              </>
            )}

            <button
              className="btn primary block"
              onClick={handleDownload}
              disabled={busy || (meta.password_required && !password)}
            >
              {busy ? 'Preparing download…' : 'Download'}
            </button>

            {actionError && <p className="error-text">{actionError}</p>}
          </>
        )}

        {done && (
          <>
            <h1>Your download has started</h1>
            <p className="sub">
              If nothing happened, check your browser&rsquo;s download prompt or
              pop-up blocker.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
