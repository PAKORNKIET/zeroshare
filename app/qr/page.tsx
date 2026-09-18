'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import AdSlot from '@/components/AdSlot';

type QrType = 'url' | 'file' | 'dynamic';

type QrResult = {
  short_code: string;
  short_url: string;
  type: string;
  destination: string;
  expires_at: string | null;
};

function expiryLabel(val: string | null): string {
  if (!val) return 'Permanent';
  return `Expires ${new Date(val).toLocaleString()}`;
}

export default function QrPage() {
  const [qrType, setQrType] = useState<QrType>('url');
  const [destination, setDestination] = useState('');
  const [expiry, setExpiry] = useState('24h');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QrResult | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    if (!destination.trim()) {
      setError('Enter a destination first');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: qrType,
          destination,
          expiry,
          customExpiresAt: expiry === 'custom' ? customExpiresAt : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not generate the QR code.');

      setResult(body);
      const dataUrl = await QRCode.toDataURL(body.short_url, { width: 160, margin: 1 });
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
        <h1 className="page-title">QR generator</h1>
        <p className="sub">
          Turn a link, a file, or a destination you can update later into a
          scannable code.
        </p>

        <div className="tabs">
          {(['url', 'file', 'dynamic'] as QrType[]).map((t) => (
            <button
              key={t}
              className={`tabbtn ${qrType === t ? 'active' : ''}`}
              onClick={() => setQrType(t)}
            >
              <svg className="icon">
                <use href={`#${t === 'url' ? 'i-link' : t === 'file' ? 'i-file' : 'i-qr'}`} />
              </svg>
              {t === 'url' ? 'URL' : t === 'file' ? 'File' : 'Dynamic'}
            </button>
          ))}
        </div>

        {qrType === 'dynamic' && (
          <small className="note" style={{ marginBottom: 8 }}>
            The printed code always points to the same short URL — change the
            destination anytime without reprinting.
          </small>
        )}

        <label>{qrType === 'file' ? 'File name or reference' : 'Destination'}</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={qrType === 'url' ? 'https://example.com' : 'https://...'}
        />

        <label>Expires</label>
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          <option value="permanent">Permanent</option>
          <option value="1h">1 hour</option>
          <option value="6h">6 hours</option>
          <option value="12h">12 hours</option>
          <option value="24h">24 hours</option>
          <option value="3d">3 days</option>
          <option value="7d">7 days</option>
          <option value="30d">30 days</option>
          <option value="custom">Custom date</option>
        </select>

        {expiry === 'custom' && (
          <>
            <label>Expiry date</label>
            <input
              type="date"
              value={customExpiresAt}
              onChange={(e) => setCustomExpiresAt(e.target.value)}
            />
          </>
        )}

        <button className="btn primary" onClick={handleGenerate} disabled={busy}>
          <svg className="icon">
            <use href="#i-qr" />
          </svg>
          {busy ? 'Generating…' : 'Generate QR'}
        </button>

        {error && <p className="error-text">{error}</p>}

        {result && qrImage && (
          <div className="qrbox" style={{ marginTop: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="QR code" />
            <div className="meta">
              <b>{result.short_url}</b>
              <p className="sub" style={{ margin: '6px 0 0' }}>
                {expiryLabel(result.expires_at)}
              </p>
              <button
                className="btn ghost sm"
                style={{ marginTop: 10 }}
                onClick={() => navigator.clipboard.writeText(result.short_url)}
              >
                <svg className="icon">
                  <use href="#i-copy" />
                </svg>
                Copy link
              </button>
            </div>
          </div>
        )}
      </div>
      <AdSlot placement="qr_generator" />
    </div>
  );
}