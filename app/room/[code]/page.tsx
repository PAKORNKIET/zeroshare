'use client';

import { useEffect, useRef, useState, use } from 'react';
import { createPeerConnection, getSignalingChannel, JOIN_RETRY_MS } from '@/lib/webrtc';

type Status = 'connecting' | 'connected' | 'receiving' | 'done' | 'error';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);

  const [status, setStatus] = useState<Status>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number; type: string } | null>(null);
  const [received, setReceived] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const chunksRef = useRef<ArrayBuffer[]>([]);

  useEffect(() => {
    const pc = createPeerConnection();
    const channel = getSignalingChannel(code);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        channel.send({ type: 'broadcast', event: 'ice', payload: { candidate: e.candidate } });
      }
    };

    pc.ondatachannel = (event) => {
      const dc = event.channel;
      dc.binaryType = 'arraybuffer';

      dc.onopen = () => setStatus('connected');

      dc.onmessage = (msg) => {
        if (typeof msg.data === 'string') {
          if (msg.data === 'EOF') {
            const blob = new Blob(chunksRef.current, {
              type: meta?.type || 'application/octet-stream',
            });
            setDownloadUrl(URL.createObjectURL(blob));
            setStatus('done');
            return;
          }
          try {
            const parsed = JSON.parse(msg.data);
            setMeta(parsed);
            setStatus('receiving');
            chunksRef.current = [];
            setReceived(0);
          } catch {
            // Ignore anything that isn't valid JSON metadata or "EOF".
          }
          return;
        }
        chunksRef.current.push(msg.data as ArrayBuffer);
        setReceived((prev) => prev + (msg.data as ArrayBuffer).byteLength);
      };
    };

    // If we subscribe before the sender does, our first "join" is lost, so
    // keep re-announcing until an offer arrives.
    let gotOffer = false;
    let joinTimer: ReturnType<typeof setInterval> | null = null;
    const sendJoin = () => channel.send({ type: 'broadcast', event: 'join', payload: {} });
    const stopJoinRetry = () => {
      if (joinTimer) clearInterval(joinTimer);
      joinTimer = null;
    };

    channel
      .on('broadcast', { event: 'offer' }, async ({ payload }) => {
        if (gotOffer) return;
        gotOffer = true;
        stopJoinRetry();
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer } });
        } catch (err) {
          setError((err as Error).message);
          setStatus('error');
        }
      })
      .on('broadcast', { event: 'ice' }, async ({ payload }) => {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch {
          // Safe to ignore candidates that arrive before the remote description.
        }
      })
      .subscribe((subStatus) => {
        if (subStatus === 'SUBSCRIBED' && !gotOffer && !joinTimer) {
          sendJoin();
          joinTimer = setInterval(sendJoin, JOIN_RETRY_MS);
        }
      });

    return () => {
      stopJoinRetry();
      pc.close();
      channel.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const progressPct = meta && meta.size > 0 ? Math.min(100, Math.round((received / meta.size) * 100)) : 0;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.mark} />
          <span style={styles.brandWord}>
            Zero<span style={{ color: '#2F5BFF' }}>Share</span>
          </span>
        </div>

        {status === 'connecting' && <p style={styles.sub}>Connecting to the sender…</p>}
        {status === 'connected' && <p style={styles.sub}>Connected. Waiting for the file…</p>}

        {status === 'receiving' && meta && (
          <>
            <h1 style={styles.title}>{meta.name}</h1>
            <p style={styles.sub}>
              {formatSize(received)} / {formatSize(meta.size)} — {progressPct}%
            </p>
          </>
        )}

        {status === 'done' && meta && downloadUrl && (
          <>
            <h1 style={styles.title}>{meta.name}</h1>
            <p style={styles.sub}>{formatSize(meta.size)} received</p>
            <a href={downloadUrl} download={meta.name} style={styles.button}>
              Download
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 style={styles.title}>Connection failed</h1>
            <p style={styles.sub}>{error ?? 'Something went wrong.'}</p>
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
  brand: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 },
  mark: { width: 22, height: 22, borderRadius: '50%', border: '1.4px solid #14171C' },
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
  sub: { color: '#565B63', fontSize: 14, margin: 0 },
  button: {
    display: 'inline-block',
    marginTop: 18,
    background: '#2F5BFF',
    color: '#fff',
    border: 'none',
    padding: '11px 16px',
    borderRadius: 3,
    fontSize: 14,
    fontWeight: 600,
    textDecoration: 'none',
  },
};