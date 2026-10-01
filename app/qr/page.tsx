'use client';

import { useState } from 'react';
import QRCode from 'qrcode';
import AdSlot from '@/components/AdSlot';
import { useI18n } from '@/components/I18nProvider';
import { dateLocale, type MessageKey } from '@/lib/i18n';

type QrType = 'url' | 'file' | 'dynamic';

type QrResult = {
  short_code: string;
  short_url: string;
  type: string;
  destination: string;
  expires_at: string | null;
};

const EXPIRY_OPTIONS = ['permanent', '1h', '6h', '12h', '24h', '3d', '7d', '30d', 'custom'] as const;

export default function QrPage() {
  const { t, locale } = useI18n();
  const expiryLabel = (val: string | null) =>
    val ? t('common.expires', { date: new Date(val).toLocaleString(dateLocale(locale)) }) : t('common.permanent');
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
      setError(t('qr.enterDestination'));
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
      if (!res.ok) throw new Error(body.error || t('qr.failed'));

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
        <h1 className="page-title">{t('qr.title')}</h1>
        <p className="sub">{t('qr.sub')}</p>

        <div className="tabs">
          {(['url', 'file', 'dynamic'] as QrType[]).map((type) => (
            <button
              key={type}
              className={`tabbtn ${qrType === type ? 'active' : ''}`}
              onClick={() => setQrType(type)}
            >
              <svg className="icon">
                <use href={`#${type === 'url' ? 'i-link' : type === 'file' ? 'i-file' : 'i-qr'}`} />
              </svg>
              {t(`qr.type.${type}` as MessageKey)}
            </button>
          ))}
        </div>

        {qrType === 'dynamic' && (
          <small className="note">{t('qr.dynamicNote')}</small>
        )}

        <label>{qrType === 'file' ? t('qr.fileRef') : t('qr.destination')}</label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder={qrType === 'url' ? 'https://example.com' : 'https://...'}
        />

        <label>{t('qr.expires')}</label>
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          {EXPIRY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {t(`exp.${opt}` as MessageKey)}
            </option>
          ))}
        </select>

        {expiry === 'custom' && (
          <>
            <label>{t('qr.expiryDate')}</label>
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
          {busy ? t('qr.generating') : t('qr.generate')}
        </button>

        {error && <p className="error-text">{error}</p>}

        {result && qrImage && (
          <div className="qrbox">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImage} alt={t('common.qrAlt')} />
            <div className="meta">
              <b>{result.short_url}</b>
              <p className="sub tight">
                {expiryLabel(result.expires_at)}
              </p>
              <button
                className="btn ghost sm"
                onClick={() => navigator.clipboard.writeText(result.short_url)}
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
      <AdSlot placement="qr_generator" />
    </div>
  );
}