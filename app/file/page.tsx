'use client';

import { useState } from 'react';
import QRCode from 'qrcode';

type UploadResult = {
  token: string;
  url: string;
  file_name: string;
  size: number;
  expires_at: string | null;
  password_protected: boolean;
  one_time: boolean;
  max_downloads: number | null;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePage() {
  const [mode, setMode] = useState<'live' | 'link'>('link');

  const [file, setFile] = useState<File | null>(null);
  const [expiry, setExpiry] = useState('24h');
  const [downloadLimit, setDownloadLimit] = useState('');
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState('');
  const [oneTime, setOneTime] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  async function handleUpload() {
    setError(null);
    if (!file) {
      setError('Choose at least one file');
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('expiry', expiry);
      if (downloadLimit) form.append('downloadLimit', downloadLimit);
      if (passwordEnabled && password) form.append('password', password);
      form.append('oneTime', String(oneTime));

      const res = await fetch('/api/files/upload', { method: 'POST', body: form });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Upload failed.');

      setResult(body);
      const dataUrl = await QRCode.toDataURL(body.url, { width: 160, margin: 1 });
      setQrImage(dataUrl);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="card">
        <h1 className="page-title">File sharing</h1>
        <p className="sub">
          Send directly to one recipient, or generate a temporary link anyone
          can open.
        </p>

        <div className="tabs">
          <button
            className={`tabbtn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
          >
            <svg className="icon">
              <use href="#i-link" />
            </svg>
            Live P2P
          </button>
          <button
            className={`tabbtn ${mode === 'link' ? 'active' : ''}`}
            onClick={() => setMode('link')}
          >
            <svg className="icon">
              <use href="#i-clock" />
            </svg>
            Temporary link
          </button>
        </div>

        {mode === 'live' && (
          <p className="sub">
            Live P2P rooms aren&rsquo;t wired up yet — this mode needs a WebRTC
            signaling server, which is a separate build step. Use{' '}
            <strong>Temporary link</strong> for now.
          </p>
        )}

        {mode === 'link' && (
          <>
            <label>File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file && (
              <ul className="filelist">
                <li>
                  <span>{file.name}</span>
                  <span>{formatSize(file.size)}</span>
                </li>
              </ul>
            )}

            <div className="row">
              <div className="col">
                <label>Link expires</label>
                <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                  <option value="1h">1 hour</option>
                  <option value="6h">6 hours</option>
                  <option value="12h">12 hours</option>
                  <option value="24h">24 hours</option>
                  <option value="3d">3 days</option>
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                </select>
              </div>
              <div className="col">
                <label>Download limit</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={downloadLimit}
                  onChange={(e) => setDownloadLimit(e.target.value)}
                />
              </div>
            </div>

            <label>
              <input
                type="checkbox"
                checked={passwordEnabled}
                onChange={(e) => setPasswordEnabled(e.target.checked)}
              />
              Require a password
            </label>
            {passwordEnabled && (
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            <label>
              <input
                type="checkbox"
                checked={oneTime}
                onChange={(e) => setOneTime(e.target.checked)}
              />
              One-time download — link dies after the first open
            </label>

            <button className="btn primary" onClick={handleUpload} disabled={busy}>
              <svg className="icon">
                <use href="#i-link" />
              </svg>
              {busy ? 'Uploading…' : 'Generate link + QR'}
            </button>

            {error && <p className="error-text">{error}</p>}

            {result && qrImage && (
              <div className="qrbox" style={{ marginTop: 18 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt="QR code" />
                <div className="meta">
                  <b>{result.url}</b>
                  <p className="sub" style={{ margin: '6px 0 0' }}>
                    {result.expires_at
                      ? `Expires ${new Date(result.expires_at).toLocaleString()}`
                      : 'Permanent'}
                    {result.max_downloads ? ` · capped at ${result.max_downloads} downloads` : ''}
                    {result.password_protected ? ' · password protected' : ''}
                    {result.one_time ? ' · one-time download' : ''}
                  </p>
                  <button
                    className="btn ghost sm"
                    style={{ marginTop: 10 }}
                    onClick={() => navigator.clipboard.writeText(result.url)}
                  >
                    <svg className="icon">
                      <use href="#i-copy" />
                    </svg>
                    Copy link
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div className="adslot">
        <svg className="icon">
          <use href="#i-mega" />
        </svg>
        Advertisement space — file_share
      </div>
    </div>
  );
}