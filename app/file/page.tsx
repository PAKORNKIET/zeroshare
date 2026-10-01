'use client';

import { useState, useRef, useEffect, use } from 'react';
import QRCode from 'qrcode';
import AdSlot from '@/components/AdSlot';
import FilePicker from '@/components/FilePicker';
import { useI18n } from '@/components/I18nProvider';
import { dateLocale, type MessageKey } from '@/lib/i18n';
import { createPeerConnection, getSignalingChannel, CHUNK_SIZE } from '@/lib/webrtc';
import type { RealtimeChannel } from '@supabase/supabase-js';

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

const EXPIRY_OPTIONS = ['1h', '6h', '12h', '24h', '3d', '7d', '30d'] as const;

export default function FilePage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string | string[] }>;
}) {
  const { t, locale } = useI18n();
  // /file?mode=live is the "Direct send" shortcut from the home page and the
  // installed app's shortcut menu.
  const { mode: modeParam } = use(searchParams);
  const [mode, setMode] = useState<'live' | 'link'>(modeParam === 'live' ? 'live' : 'link');

  // --- Live P2P state ---
  const [liveFile, setLiveFile] = useState<File | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomQr, setRoomQr] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<
    'idle' | 'waiting' | 'connected' | 'sending' | 'sent' | 'error'
  >('idle');
  const [liveProgress, setLiveProgress] = useState(0);
  const [liveError, setLiveError] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    return () => {
      dcRef.current?.close();
      pcRef.current?.close();
      channelRef.current?.unsubscribe();
    };
  }, []);

  async function sendFileOverChannel(dc: RTCDataChannel, f: File) {
    dc.send(JSON.stringify({ name: f.name, size: f.size, type: f.type }));

    // Resume sending once the buffer has drained to this level, rather than
    // waiting for it to empty completely (the default threshold is 0).
    dc.bufferedAmountLowThreshold = CHUNK_SIZE * 4;

    const reader = f.stream().getReader();
    let sent = 0;
    setLiveStatus('sending');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // value is a Uint8Array chunk straight from disk — never the whole file.
      let offset = 0;
      while (offset < value.byteLength) {
        const slice = value.slice(offset, offset + CHUNK_SIZE);
        dc.send(slice);
        offset += CHUNK_SIZE;
        sent += slice.byteLength;

        // Yield so we don't flood the data channel's internal buffer.
        if (dc.bufferedAmount > CHUNK_SIZE * 8) {
          await new Promise<void>((resolve) => {
            dc.onbufferedamountlow = () => resolve();
          });
        }
      }

      setLiveProgress(Math.min(100, Math.round((sent / f.size) * 100)));
    }

    dc.send('EOF');
    setLiveStatus('sent');
  }

  async function createRoom() {
    if (!liveFile) {
      setLiveError(t('common.chooseFile'));
      return;
    }
    setLiveError(null);

    const code = Array.from({ length: 5 }, () =>
      'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 33)]
    ).join('');
    setRoomCode(code);
    setLiveStatus('waiting');

    const dataUrl = await QRCode.toDataURL(`${window.location.origin}/room/${code}`, {
      width: 160,
      margin: 1,
    });
    setRoomQr(dataUrl);

    const pc = createPeerConnection();
    pcRef.current = pc;
    const dc = pc.createDataChannel('file');
    dc.binaryType = 'arraybuffer';
    dcRef.current = dc;

    const channel = getSignalingChannel(code);
    channelRef.current = channel;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({ type: 'broadcast', event: 'ice', payload: { candidate: e.candidate } });
      }
    };

    dc.onopen = () => {
      setLiveStatus('connected');
      if (liveFile) sendFileOverChannel(dc, liveFile).catch((err) => {
        setLiveError((err as Error).message);
        setLiveStatus('error');
      });
    };

    // The receiver keeps re-sending "join" until it sees an offer, so only
    // the first one should trigger negotiation.
    let offerSent = false;

    channel
      .on('broadcast', { event: 'join' }, async () => {
        if (offerSent) return;
        offerSent = true;
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } });
        } catch (err) {
          setLiveError((err as Error).message);
          setLiveStatus('error');
        }
      })
      .on('broadcast', { event: 'answer' }, async ({ payload }) => {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        } catch (err) {
          setLiveError((err as Error).message);
          setLiveStatus('error');
        }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Candidates arriving before remote description is set are safe to drop.
        }
      })
      .subscribe();
  }

  function resetRoom() {
    dcRef.current?.close();
    pcRef.current?.close();
    channelRef.current?.unsubscribe();
    setRoomCode(null);
    setRoomQr(null);
    setLiveStatus('idle');
    setLiveProgress(0);
    setLiveFile(null);
  }

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
      setError(t('common.chooseFile'));
      return;
    }

    setBusy(true);
    try {
      // Step 1 — ask the server to create the file/link records and hand
      // back a signed URL for the browser to upload to directly.
      const presignRes = await fetch('/api/files/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          expiry,
          downloadLimit: downloadLimit ? Number(downloadLimit) : undefined,
          password: passwordEnabled ? password : undefined,
          oneTime,
        }),
      });
      const presignBody = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignBody.error || t('err.startUpload'));

      // Step 2 — upload the file bytes straight to R2, bypassing our
      // server (and its request-size limit) entirely.
      const uploadRes = await fetch(presignBody.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
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

  const liveMessage: Record<string, string> = {
    waiting: t('direct.waiting'),
    connected: t('direct.connected'),
    sending: t('direct.sending', { pct: liveProgress }),
    sent: t('direct.sent'),
    error: liveError ?? t('common.somethingWrong'),
  };

  return (
    <div>
      <div className="card">
        <h1 className="page-title">{t('file.title')}</h1>
        <p className="sub">{t('file.sub')}</p>

        <div className="tabs">
          <button
            className={`tabbtn ${mode === 'live' ? 'active' : ''}`}
            onClick={() => setMode('live')}
          >
            <svg className="icon">
              <use href="#i-send" />
            </svg>
            {t('file.tab.direct')}
          </button>
          <button
            className={`tabbtn ${mode === 'link' ? 'active' : ''}`}
            onClick={() => setMode('link')}
          >
            <svg className="icon">
              <use href="#i-link" />
            </svg>
            {t('file.tab.link')}
          </button>
        </div>

        {mode === 'live' && (
          <>
            {liveStatus === 'idle' && (
              <>
                <div className="explainer">
                  <div className="explainer-title">
                    <svg className="icon">
                      <use href="#i-info" />
                    </svg>
                    {t('direct.howTitle')}
                  </div>
                  <ol>
                    <li>{t('direct.step1')}</li>
                    <li>{t('direct.step2')}</li>
                    <li>{t('direct.step3')}</li>
                  </ol>
                  <p>{t('direct.keepOpen')}</p>
                </div>

                <label>{t('direct.fileLabel')}</label>
                <FilePicker file={liveFile} onChange={setLiveFile} />
                <button className="btn primary" onClick={createRoom}>
                  <svg className="icon">
                    <use href="#i-plus" />
                  </svg>
                  {t('direct.create')}
                </button>
                {liveError && <p className="error-text">{liveError}</p>}
              </>
            )}

            {liveStatus !== 'idle' && roomCode && (
              <div className="qrbox">
                {roomQr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={roomQr} alt={t('direct.roomQrAlt')} />
                )}
                <div className="meta">
                  <b>{typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : ''}</b>
                  <p className="sub tight">{liveMessage[liveStatus]}</p>
                  {(liveStatus === 'sending' || liveStatus === 'sent') && (
                    <div className="progress">
                      <div style={{ width: `${liveProgress}%` }} />
                    </div>
                  )}
                  <button className="btn ghost sm" onClick={resetRoom}>
                    {t('direct.close')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {mode === 'link' && (
          <>
            <label>{t('link.file')}</label>
            <FilePicker file={file} onChange={setFile} />

            <div className="row">
              <div className="col">
                <label>{t('link.expires')}</label>
                <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {t(`exp.${opt}` as MessageKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col">
                <label>{t('link.limit')}</label>
                <input
                  type="number"
                  min={1}
                  placeholder={t('link.unlimited')}
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
              {t('link.requirePassword')}
            </label>
            {passwordEnabled && (
              <input
                type="password"
                placeholder={t('link.password')}
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
              {t('link.oneTime')}
            </label>

            <button className="btn primary" onClick={handleUpload} disabled={busy}>
              <svg className="icon">
                <use href="#i-link" />
              </svg>
              {busy ? t('common.uploading') : t('link.generate')}
            </button>

            {error && <p className="error-text">{error}</p>}

            {result && qrImage && (
              <div className="qrbox">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImage} alt={t('common.qrAlt')} />
                <div className="meta">
                  <b>{result.url}</b>
                  <p className="sub tight">
                    {result.expires_at
                      ? t('common.expires', {
                          date: new Date(result.expires_at).toLocaleString(dateLocale(locale)),
                        })
                      : t('common.permanent')}
                    {result.max_downloads ? t('link.cappedAt', { n: result.max_downloads }) : ''}
                    {result.password_protected ? t('link.passwordTag') : ''}
                    {result.one_time ? t('common.oneTimeTag') : ''}
                  </p>
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
          </>
        )}
      </div>
      <AdSlot placement="file_share" />
    </div>
  );
}
