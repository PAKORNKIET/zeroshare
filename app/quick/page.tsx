'use client';

import { useState, useRef } from 'react';
import QRCode from 'qrcode';
import { useI18n } from '@/components/I18nProvider';

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
  const { t } = useI18n();
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
      const presignRes = await fetch('/api/files/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: f.name,
          fileType: f.type,
          fileSize: f.size,
          expiry: '24h', // sensible Quick Drop default
        }),
      });
      const presignBody = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignBody.error || t('err.startUpload'));

      const uploadRes = await fetch(presignBody.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': f.type || 'application/octet-stream' },
        body: f,
      });
      if (!uploadRes.ok) throw new Error(t('err.storageUpload'));

      setResult(presignBody);
      const dataUrl = await QRCode.toDataURL(presignBody.url, { width: 160, margin: 1 });
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
        <h1 className="page-title">{t('quick.title')}</h1>
        <p className="sub">{t('quick.sub')}</p>

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
          <div>{t('quick.drag')}</div>
          <button className="btn ghost" onClick={() => inputRef.current?.click()}>
            {t('quick.select')}
          </button>
          <input
            ref={inputRef}
            type="file"
            hidden
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

        {busy && <p className="sub">{t('common.uploading')}</p>}
        {error && <p className="error-text">{error}</p>}

        {result && qrImage && (
          <div className="qrbox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt={t('common.qrAlt')} />
            <div className="meta">
              <p className="sub tight">{t('quick.scan')}</p>
              <b>{result.url}</b>
              <button
                className="btn ghost sm"
                onClick={() => navigator.clipboard.writeText(result.url)}
              >
                <svg className="icon">
                  <use href="#i-copy" />
                </svg>
                {t('common.copyLink')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}