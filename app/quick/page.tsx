'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';

type UploadResult = {
  token: string;
  url: string;
  file_name: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function QuickDropPage() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(f: File) {
    setFile(f);
    setError(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('expiry', '24h'); // sensible Quick Drop default

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
        <h1 className="page-title">Quick Drop</h1>
        <p className="sub">The fastest path from file to link. Drop it, get a code, done.</p>

        <div
          className={`drop ${dragOver ? 'over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) upload(dropped);
          }}
        >
          <svg className="icon-lg">
            <use href="#i-drop" />
          </svg>
          <div>Drag a file here</div>
          <button className="btn ghost" onClick={() => inputRef.current?.click()}>
            Select file
          </button>
          <input
            ref={inputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const picked = e.target.files?.[0];
              if (picked) upload(picked);
            }}
          />
        </div>

        {file && (
          <ul className="filelist">
            <li>
              <span>{file.name}</span>
              <span>{formatSize(file.size)}</span>
            </li>
          </ul>
        )}

        {busy && <p className="sub">Uploading…</p>}
        {error && <p className="error-text">{error}</p>}

        {result && qrImage && (
          <div className="qrbox" style={{ marginTop: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt="QR code" />
            <div className="meta">
              <p className="sub" style={{ margin: '0 0 6px' }}>
                Scan to download
              </p>
              <b>{result.url}</b>
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
      </div>
    </div>
  );
}