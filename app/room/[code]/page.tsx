'use client';

import Link from 'next/link';
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
    <div className="solo">
      <div className="card solo-card">
        <Link href="/" className="brand">
          <div className="mark" />
          <div className="word">
            Zero<span>Share</span>
          </div>
        </Link>

        {status === 'connecting' && <p className="sub">Connecting to the sender…</p>}
        {status === 'connected' && <p className="sub">Connected. Waiting for the file…</p>}

        {status === 'receiving' && meta && (
          <>
            <h1>{meta.name}</h1>
            <p className="sub">
              {formatSize(received)} / {formatSize(meta.size)} — {progressPct}%
            </p>
            <div className="progress">
              <div style={{ width: `${progressPct}%` }} />
            </div>
          </>
        )}

        {status === 'done' && meta && downloadUrl && (
          <>
            <h1>{meta.name}</h1>
            <p className="sub">{formatSize(meta.size)} received</p>
            <a href={downloadUrl} download={meta.name} className="btn primary block">
              Download
            </a>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Connection failed</h1>
            <p className="sub">{error ?? 'Something went wrong.'}</p>
          </>
        )}
      </div>
    </div>
  );
}
