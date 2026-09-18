'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import AdSlot from '@/components/AdSlot';
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePage() {
  const [mode, setMode] = useState<'live' | 'link'>('link');

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
    const buffer = await f.arrayBuffer();
    let offset = 0;
    setLiveStatus('sending');
    while (offset < buffer.byteLength) {
      const chunk = buffer.slice(offset, offset + CHUNK_SIZE);
      dc.send(chunk);
      offset += CHUNK_SIZE;
      setLiveProgress(Math.min(100, Math.round((offset / buffer.byteLength) * 100)));
      // Yield so we don't flood the data channel's internal buffer.
      if (dc.bufferedAmount > CHUNK_SIZE * 8) {
        await new Promise<void>((resolve) => {
          dc.onbufferedamountlow = () => resolve();
        });
      }
    }
    dc.send('EOF');
    setLiveStatus('sent');
  }

  async function createRoom() {
    if (!liveFile) {
      setLiveError('Choose a file first');
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

    channel
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
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } });
        }
      });
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
      setError('Choose at least one file');
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
      if (!presignRes.ok) throw new Error(presignBody.error || 'Could not start the upload.');

      // Step 2 — upload the file bytes straight to R2, bypassing our
      // server (and its request-size limit) entirely.
      const uploadRes = await fetch(presignBody.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload to storage failed.');

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
          <>
            {liveStatus === 'idle' && (
              <>
                <label>File to send</label>
                <input
                  type="file"
                  onChange={(e) => setLiveFile(e.target.files?.[0] ?? null)}
                />
                {liveFile && (
                  <ul className="filelist">
                    <li>
                      <span>{liveFile.name}</span>
                      <span>{formatSize(liveFile.size)}</span>
                    </li>
                  </ul>
                )}
                <p className="sub" style={{ marginTop: 10 }}>
                  Opens a live room. The file transfers directly to whoever
                  scans the code — nothing is stored on our servers.
                </p>
                <button className="btn primary" onClick={createRoom}>
                  <svg className="icon">
                    <use href="#i-plus" />
                  </svg>
                  Create room
                </button>
                {liveError && <p className="error-text">{liveError}</p>}
              </>
            )}

            {liveStatus !== 'idle' && roomCode && (
              <div className="qrbox" style={{ marginTop: 4 }}>
                {roomQr && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={roomQr} alt="Room QR code" />
                )}
                <div className="meta">
                  <b>{typeof window !== 'undefined' ? `${window.location.origin}/room/${roomCode}` : ''}</b>
                  <p className="sub" style={{ margin: '8px 0 0' }}>
                    {liveStatus === 'waiting' && 'Waiting for someone to open this link…'}
                    {liveStatus === 'connected' && 'Connected — starting transfer…'}
                    {liveStatus === 'sending' && `Sending… ${liveProgress}%`}
                    {liveStatus === 'sent' && 'Transfer complete.'}
                    {liveStatus === 'error' && (liveError ?? 'Something went wrong.')}
                  </p>
                  <button className="btn ghost sm" style={{ marginTop: 10 }} onClick={resetRoom}>
                    Close room
                  </button>
                </div>
              </div>
            )}
          </>
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
      <AdSlot placement="file_share" />
    </div>
  );
}