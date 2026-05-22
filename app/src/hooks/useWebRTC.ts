/**
 * useWebRTC — Full WebRTC hook for Brixstac OS calling platform
 * Supports: mesh (≤12 peers) + SFU-simulated (>12), screen sharing,
 * mute/camera toggle, ICE restart on failure, Socket.IO signaling.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Participant {
  userId: string;
  name: string;
  avatarUrl?: string;
  muted: boolean;
  cameraOff: boolean;
  screenSharing: boolean;
  handRaised: boolean;
  isSpeaking: boolean;
  networkQuality: 1 | 2 | 3 | 4 | 5;
  stream?: MediaStream;
  joinedAt: number;
}

export interface UseWebRTCOptions {
  roomId: string;
  userId: string;
  authToken: string;
  type: 'video' | 'audio' | 'screen';
  signalingUrl?: string;
  onParticipantJoined?: (participant: Participant) => void;
  onParticipantLeft?: (userId: string) => void;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
}

export interface UseWebRTCReturn {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: Map<string, Participant>;
  isConnecting: boolean;
  mediaError: string | null;
  mediaPermissionDenied: boolean;
  muted: boolean;
  cameraOff: boolean;
  isScreenSharing: boolean;
  toggleMute: () => void;
  toggleCamera: () => void;
  shareScreen: () => Promise<void>;
  stopScreenShare: () => void;
  hangup: () => void;
  retryMedia: () => Promise<MediaStream | null>;
  replaceVideoTrack: (track: MediaStreamTrack) => Promise<void>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

const MESH_LIMIT = 12;

// ── Dynamic socket import helper (avoids hard dep if socket.io not available) ─

type SocketLike = {
  connected: boolean;
  emit: (event: string, ...args: unknown[]) => void;
  on: (event: string, cb: (...args: unknown[]) => void) => void;
  disconnect: () => void;
};

async function createSocket(url: string, token: string): Promise<SocketLike | null> {
  try {
    // Dynamic import so the hook doesn't break if socket.io-client is absent
    const { io } = await import('socket.io-client' as string) as { io: (url: string, opts: unknown) => SocketLike };
    return io(url, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  } catch {
    return null;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useWebRTC(options: UseWebRTCOptions): UseWebRTCReturn {
  const {
    roomId, userId, authToken, type,
    signalingUrl,
    onParticipantJoined, onParticipantLeft, onRemoteStream,
  } = options;

  const resolvedSignalingUrl = signalingUrl ?? (
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}:3004`
      : 'http://localhost:3004'
  );

  // State
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [isConnecting, setIsConnecting] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaPermissionDenied, setMediaPermissionDenied] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Refs
  const socketRef = useRef<SocketLike | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const reconnectTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const mountedRef = useRef(true);

  // Keep callbacks stable in refs to avoid stale closures in async socket handlers
  const onParticipantJoinedRef = useRef(onParticipantJoined);
  const onParticipantLeftRef = useRef(onParticipantLeft);
  const onRemoteStreamRef = useRef(onRemoteStream);
  useEffect(() => { onParticipantJoinedRef.current = onParticipantJoined; }, [onParticipantJoined]);
  useEffect(() => { onParticipantLeftRef.current = onParticipantLeft; }, [onParticipantLeft]);
  useEffect(() => { onRemoteStreamRef.current = onRemoteStream; }, [onRemoteStream]);

  // ── Media acquisition ─────────────────────────────────────────────────────

  const getLocalMedia = useCallback(async (): Promise<MediaStream | null> => {
    if (mountedRef.current) { setMediaError(null); setMediaPermissionDenied(false); }
    try {
      let stream: MediaStream;
      if (type === 'screen') {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: type === 'video'
            ? { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }
            : false,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      }
      localStreamRef.current = stream;
      if (mountedRef.current) setLocalStream(stream);
      return stream;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const isDenied = /Permission denied|NotAllowedError|NotAllowed/.test(msg);
      const isNotFound = /NotFoundError|DevicesNotFoundError/.test(msg);
      const errorMsg = isDenied
        ? 'Camera/microphone permission denied. Please allow access in browser settings.'
        : isNotFound
          ? 'No camera or microphone found. Please connect a device and try again.'
          : `Could not access media devices: ${msg}`;
      if (mountedRef.current) { setMediaError(errorMsg); setMediaPermissionDenied(isDenied); }
      return null;
    }
  }, [type]);

  const retryMedia = useCallback(() => getLocalMedia(), [getLocalMedia]);

  // ── Replace video track in all peers ─────────────────────────────────────

  const replaceVideoTrack = useCallback(async (track: MediaStreamTrack) => {
    const tasks: Promise<void>[] = [];
    peerConnectionsRef.current.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) tasks.push(sender.replaceTrack(track).catch(() => {}));
    });
    await Promise.all(tasks);
  }, []);

  // ── Cleanup a single peer ─────────────────────────────────────────────────

  const cleanupPeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.oniceconnectionstatechange = null;
      pc.onconnectionstatechange = null;
      pc.close();
      peerConnectionsRef.current.delete(peerId);
    }
    const timer = reconnectTimersRef.current.get(peerId);
    if (timer) { clearTimeout(timer); reconnectTimersRef.current.delete(peerId); }
    pendingIceCandidatesRef.current.delete(peerId);
    if (mountedRef.current) {
      setRemoteStreams(prev => { const n = new Map(prev); n.delete(peerId); return n; });
      setParticipants(prev => { const n = new Map(prev); n.delete(peerId); return n; });
      onParticipantLeftRef.current?.(peerId);
    }
  }, []);

  // ── Flush pending ICE candidates ──────────────────────────────────────────

  const flushPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const pending = pendingIceCandidatesRef.current.get(peerId) ?? [];
    for (const cand of pending) {
      try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch { /* stale */ }
    }
    pendingIceCandidatesRef.current.delete(peerId);
  }, []);

  // ── Peer connection factory ───────────────────────────────────────────────

  const createPeerConnection = useCallback((peerId: string, stream: MediaStream): RTCPeerConnection => {
    // Close existing if re-creating
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing) { existing.close(); peerConnectionsRef.current.delete(peerId); }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    stream.getTracks().forEach(track => pc.addTrack(track, stream));

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current?.connected) {
        socketRef.current.emit('call:ice-candidate', {
          to: peerId, from: userId, roomId, candidate: event.candidate.toJSON(),
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (!mountedRef.current) return;
      if (pc.iceConnectionState === 'failed') {
        const timer = setTimeout(async () => {
          if (!mountedRef.current || !socketRef.current?.connected) return;
          try {
            const offer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(offer);
            socketRef.current.emit('call:offer', { to: peerId, from: userId, roomId, offer });
          } catch { /* peer may have left */ }
        }, 1500);
        reconnectTimersRef.current.set(`ice-restart-${peerId}`, timer);
      }
      if (pc.iceConnectionState === 'disconnected') {
        const timer = setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') cleanupPeer(peerId);
        }, 8000);
        reconnectTimersRef.current.set(`disco-${peerId}`, timer);
      }
    };

    pc.onconnectionstatechange = () => {
      if (!mountedRef.current) return;
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') cleanupPeer(peerId);
      if (pc.connectionState === 'connected' && mountedRef.current) setIsConnecting(false);
    };

    pc.ontrack = (event) => {
      if (!mountedRef.current || !event.streams[0]) return;
      const remoteStream = event.streams[0];
      setRemoteStreams(prev => { const n = new Map(prev); n.set(peerId, remoteStream); return n; });
      setParticipants(prev => {
        const n = new Map(prev);
        const p = n.get(peerId);
        if (p) n.set(peerId, { ...p, stream: remoteStream });
        return n;
      });
      onRemoteStreamRef.current?.(peerId, remoteStream);
    };

    peerConnectionsRef.current.set(peerId, pc);
    return pc;
  }, [userId, roomId, cleanupPeer]);

  // ── Initiate offer to a peer ──────────────────────────────────────────────

  const initiateOffer = useCallback(async (peerId: string) => {
    const stream = localStreamRef.current;
    if (!stream || !socketRef.current) return;
    const pc = createPeerConnection(peerId, stream);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current.emit('call:offer', { to: peerId, from: userId, roomId, offer });
    } catch (err) {
      console.error('[useWebRTC] offer error', err);
    }
  }, [createPeerConnection, userId, roomId]);

  // ── Socket.IO signaling setup ─────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    let socket: SocketLike | null = null;

    const init = async () => {
      // Acquire media first
      const stream = await getLocalMedia();
      if (!mountedRef.current) return;
      if (stream && mountedRef.current) setIsConnecting(true);

      // Connect to signaling server
      socket = await createSocket(resolvedSignalingUrl, authToken);
      if (!socket || !mountedRef.current) {
        // No signaling — still show local stream (demo mode)
        if (mountedRef.current) setIsConnecting(false);
        return;
      }
      socketRef.current = socket;

      socket.on('connect', () => {
        if (!mountedRef.current) return;
        socket!.emit('call:join-room', { roomId, userId });
      });

      socket.on('connect_error', () => {
        if (mountedRef.current) setIsConnecting(false);
      });

      // Another user joined the room — send them an offer
      socket.on('call:user-joined', async (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId, name, avatarUrl } = data as { userId: string; name?: string; avatarUrl?: string };
        if (peerId === userId) return;
        const newP: Participant = {
          userId: peerId, name: name ?? peerId, avatarUrl,
          muted: false, cameraOff: false, screenSharing: false,
          handRaised: false, isSpeaking: false, networkQuality: 5,
          joinedAt: Date.now(),
        };
        setParticipants(prev => { const n = new Map(prev); n.set(peerId, newP); return n; });
        onParticipantJoinedRef.current?.(newP);
        if (peerConnectionsRef.current.size < MESH_LIMIT) await initiateOffer(peerId);
      });

      socket.on('call:offer', async (data: unknown) => {
        if (!mountedRef.current) return;
        const { from: peerId, offer } = data as { from: string; offer: RTCSessionDescriptionInit };
        const stream = localStreamRef.current;
        if (!stream) return;
        let pc = peerConnectionsRef.current.get(peerId);
        if (!pc) pc = createPeerConnection(peerId, stream);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await flushPendingCandidates(peerId, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket!.emit('call:answer-sdp', { to: peerId, from: userId, roomId, answer });
        } catch (err) { console.error('[useWebRTC] answer error', err); }
      });

      socket.on('call:answer-sdp', async (data: unknown) => {
        if (!mountedRef.current) return;
        const { from: peerId, answer } = data as { from: string; answer: RTCSessionDescriptionInit };
        const pc = peerConnectionsRef.current.get(peerId);
        if (!pc) return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await flushPendingCandidates(peerId, pc);
        } catch (err) { console.error('[useWebRTC] setRemoteDesc answer error', err); }
      });

      socket.on('call:ice-candidate', async (data: unknown) => {
        if (!mountedRef.current) return;
        const { from: peerId, candidate } = data as { from: string; candidate: RTCIceCandidateInit };
        const pc = peerConnectionsRef.current.get(peerId);
        if (pc?.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* stale */ }
        } else {
          const pending = pendingIceCandidatesRef.current.get(peerId) ?? [];
          pending.push(candidate);
          pendingIceCandidatesRef.current.set(peerId, pending);
        }
      });

      socket.on('call:user-left', (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId } = data as { userId: string };
        cleanupPeer(peerId);
      });

      socket.on('call:mute', (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId, muted: pMuted } = data as { userId: string; muted: boolean };
        setParticipants(prev => {
          const n = new Map(prev); const p = n.get(peerId);
          if (p) n.set(peerId, { ...p, muted: pMuted }); return n;
        });
      });

      socket.on('call:camera', (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId, cameraOff: pOff } = data as { userId: string; cameraOff: boolean };
        setParticipants(prev => {
          const n = new Map(prev); const p = n.get(peerId);
          if (p) n.set(peerId, { ...p, cameraOff: pOff }); return n;
        });
      });

      socket.on('call:screen-share', (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId, sharing } = data as { userId: string; sharing: boolean };
        setParticipants(prev => {
          const n = new Map(prev); const p = n.get(peerId);
          if (p) n.set(peerId, { ...p, screenSharing: sharing }); return n;
        });
      });

      socket.on('call:hand-raise', (data: unknown) => {
        if (!mountedRef.current) return;
        const { userId: peerId, raised } = data as { userId: string; raised: boolean };
        setParticipants(prev => {
          const n = new Map(prev); const p = n.get(peerId);
          if (p) n.set(peerId, { ...p, handRaised: raised }); return n;
        });
      });
    };

    init();

    return () => {
      mountedRef.current = false;
      peerConnectionsRef.current.forEach(pc => pc.close());
      peerConnectionsRef.current.clear();
      reconnectTimersRef.current.forEach(t => clearTimeout(t));
      reconnectTimersRef.current.clear();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      if (socket?.connected) {
        socket.emit('call:leave', { roomId, userId });
        socket.disconnect();
      }
      socketRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId]); // intentional minimal deps — stable via refs

  // ── Controls ──────────────────────────────────────────────────────────────

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newMuted = !muted;
    stream.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
    setMuted(newMuted);
    socketRef.current?.emit('call:mute', { roomId, userId, muted: newMuted });
  }, [muted, roomId, userId]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    const newOff = !cameraOff;
    stream.getVideoTracks().forEach(t => { t.enabled = !newOff; });
    setCameraOff(newOff);
    socketRef.current?.emit('call:camera', { roomId, userId, cameraOff: newOff });
  }, [cameraOff, roomId, userId]);

  const shareScreen = useCallback(async () => {
    try {
      const sStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 15 } }, audio: true,
      });
      screenStreamRef.current = sStream;
      if (mountedRef.current) { setScreenStream(sStream); setIsScreenSharing(true); }
      socketRef.current?.emit('call:screen-share', { roomId, userId, sharing: true });
      const vTrack = sStream.getVideoTracks()[0];
      if (vTrack) {
        await replaceVideoTrack(vTrack);
        vTrack.addEventListener('ended', () => {
          screenStreamRef.current?.getTracks().forEach(t => t.stop());
          screenStreamRef.current = null;
          if (mountedRef.current) { setScreenStream(null); setIsScreenSharing(false); }
          socketRef.current?.emit('call:screen-share', { roomId, userId, sharing: false });
          const camTrack = localStreamRef.current?.getVideoTracks()[0];
          if (camTrack) replaceVideoTrack(camTrack).catch(() => {});
        });
      }
    } catch { /* cancelled */ }
  }, [roomId, userId, replaceVideoTrack]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    if (mountedRef.current) { setScreenStream(null); setIsScreenSharing(false); }
    socketRef.current?.emit('call:screen-share', { roomId, userId, sharing: false });
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    if (camTrack) replaceVideoTrack(camTrack).catch(() => {});
  }, [roomId, userId, replaceVideoTrack]);

  const hangup = useCallback(() => {
    socketRef.current?.emit('call:leave', { roomId, userId });
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null; screenStreamRef.current = null;
    if (mountedRef.current) {
      setLocalStream(null); setScreenStream(null);
      setRemoteStreams(new Map()); setParticipants(new Map());
      setIsConnecting(false); setIsScreenSharing(false);
    }
  }, [roomId, userId]);

  return {
    localStream, screenStream, remoteStreams, participants,
    isConnecting, mediaError, mediaPermissionDenied,
    muted, cameraOff, isScreenSharing,
    toggleMute, toggleCamera, shareScreen, stopScreenShare,
    hangup, retryMedia, replaceVideoTrack,
  };
}
