import { getSupabaseBrowserAuth } from './supabase-browser';

export const STUN_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

export function createPeerConnection() {
  return new RTCPeerConnection({ iceServers: STUN_SERVERS });
}

/**
 * A Supabase Realtime channel scoped to one room code, used only to carry
 * signaling messages (SDP offer/answer, ICE candidates) between the two
 * browsers. Once the peer connection is established, the actual file
 * bytes flow directly between browsers over the WebRTC data channel —
 * this channel is never used for file data.
 */
export function getSignalingChannel(roomCode: string) {
  const supabase = getSupabaseBrowserAuth();
  return supabase.channel(`room:${roomCode}`, {
    config: { broadcast: { self: false } },
  });
}

export const CHUNK_SIZE = 16 * 1024; // 16 KB per data-channel message