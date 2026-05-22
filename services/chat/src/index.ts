import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import path from 'path';
import routes, { isInQuietHours, quietHours, messageReadBy } from './routes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3004;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'brixstac-dev-secret';
const GATEWAY_URL = process.env.GATEWAY_URL || '*';
const UPLOAD_DIR = '/app/uploads';

app.use(helmet({ contentSecurityPolicy: NODE_ENV === 'production', crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: GATEWAY_URL, credentials: true }));
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));

// Serve uploaded files
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

app.get('/health', (_, res) => res.json({
  service: 'brixstac-chat-service',
  status: 'ok',
  ts: new Date().toISOString(),
}));

app.use('/', routes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: NODE_ENV === 'production' ? 'Internal server error' : err.message });
});

// ─── Socket.IO ───────────────────────────────────────────────────────────────

interface SocketUser {
  userId: string;
  email: string;
  role: string;
}

const io = new SocketIOServer(httpServer, {
  cors: { origin: GATEWAY_URL, credentials: true },
  transports: ['websocket', 'polling'],
});

// JWT auth middleware for Socket.IO
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SocketUser;
    (socket as any).user = decoded;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

// Track active sockets per user: userId → Set<socketId>
const userSockets = new Map<string, Set<string>>();

// Track userId → socketId[] for breakout room targeting
const userSocketMap = new Map<string, string[]>();

// Breakout room state per call room
const breakoutRooms = new Map<string, Array<{ id: string; name: string; participantIds: string[] }>>();

io.on('connection', (socket) => {
  const user = (socket as any).user as SocketUser;
  console.log(`[chat] socket connected: userId=${user.userId} socketId=${socket.id}`);

  // Track socket
  if (!userSockets.has(user.userId)) userSockets.set(user.userId, new Set());
  userSockets.get(user.userId)!.add(socket.id);

  // Track for breakout room targeting
  userSocketMap.set(user.userId, [...(userSocketMap.get(user.userId) || []), socket.id]);

  // ── Room joins ────────────────────────────────────────────────────────────

  socket.on('join:workspace', (workspaceId: string) => {
    socket.join(`workspace:${workspaceId}`);
    console.log(`[chat] userId=${user.userId} joined workspace:${workspaceId}`);
  });

  socket.on('join:channel', (channelId: string) => {
    socket.join(`channel:${channelId}`);
    console.log(`[chat] userId=${user.userId} joined channel:${channelId}`);
  });

  socket.on('leave:channel', (channelId: string) => {
    socket.leave(`channel:${channelId}`);
  });

  // Legacy conversation room support
  socket.on('join:conversation', (conversationId: string) => {
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave:conversation', (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // ── Channel messages ──────────────────────────────────────────────────────

  /**
   * Broadcast new channel message to all channel members.
   * Client sends this after the REST call creates the message.
   */
  socket.on('channel:message', (data: { channelId: string; message: any }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:message', {
      ...data.message,
      channelId: data.channelId,
    });
  });

  /** Broadcast edited channel message */
  socket.on('channel:message:edit', (data: { channelId: string; message: any }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:message:edit', {
      ...data.message,
      channelId: data.channelId,
      edited: true,
    });
  });

  /** Broadcast deleted channel message */
  socket.on('channel:message:delete', (data: { channelId: string; messageId: string }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:message:delete', {
      channelId: data.channelId,
      messageId: data.messageId,
      deletedAt: new Date().toISOString(),
    });
  });

  /** Broadcast reaction added/removed */
  socket.on('channel:reaction', (data: { channelId: string; messageId: string; emoji: string; action: 'add' | 'remove' }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:reaction', {
      ...data,
      userId: user.userId,
    });
  });

  /** Channel typing indicators */
  socket.on('channel:typing:start', (data: { channelId: string }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:typing:start', {
      userId: user.userId,
      channelId: data.channelId,
    });
  });

  socket.on('channel:typing:stop', (data: { channelId: string }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:typing:stop', {
      userId: user.userId,
      channelId: data.channelId,
    });
  });

  /** Member joined/left channel */
  socket.on('channel:join', (data: { channelId: string; workspaceId: string }) => {
    socket.join(`channel:${data.channelId}`);
    socket.to(`channel:${data.channelId}`).emit('channel:join', {
      userId: user.userId,
      channelId: data.channelId,
    });
    socket.to(`workspace:${data.workspaceId}`).emit('channel:join', {
      userId: user.userId,
      channelId: data.channelId,
    });
  });

  socket.on('channel:leave', (data: { channelId: string; workspaceId: string }) => {
    socket.to(`channel:${data.channelId}`).emit('channel:leave', {
      userId: user.userId,
      channelId: data.channelId,
    });
    socket.leave(`channel:${data.channelId}`);
  });

  // ── Presence ──────────────────────────────────────────────────────────────

  /** Broadcast presence/status change to workspace */
  socket.on('presence:update', (data: {
    workspaceId: string;
    status: 'online' | 'away' | 'dnd' | 'offline';
    statusText?: string;
    statusEmoji?: string;
  }) => {
    socket.to(`workspace:${data.workspaceId}`).emit('presence:update', {
      userId: user.userId,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  });

  // Legacy presence event
  socket.on('presence:online', (workspaceId: string) => {
    socket.to(`workspace:${workspaceId}`).emit('presence:online', { userId: user.userId });
  });

  // ── Direct Messages ───────────────────────────────────────────────────────

  /** New DM message — relay to conversation room and target user's personal room */
  socket.on('dm:message', (data: { conversationId: string; message: any; recipientIds: string[] }) => {
    socket.to(`conversation:${data.conversationId}`).emit('dm:message', {
      ...data.message,
      conversationId: data.conversationId,
    });

    // Also deliver to each recipient's personal room for push-style delivery
    for (const recipientId of data.recipientIds ?? []) {
      socket.to(`user:${recipientId}`).emit('dm:message', {
        ...data.message,
        conversationId: data.conversationId,
      });
    }
  });

  // Legacy message:new event
  socket.on('message:new', (data: { conversationId: string; message: any }) => {
    socket.to(`conversation:${data.conversationId}`).emit('message:new', {
      ...data.message,
      conversationId: data.conversationId,
    });
  });

  // ── Typing (legacy & DM) ──────────────────────────────────────────────────

  socket.on('typing:start', (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
      userId: user.userId,
      conversationId: data.conversationId,
    });
  });

  socket.on('typing:stop', (data: { conversationId: string }) => {
    socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      userId: user.userId,
      conversationId: data.conversationId,
    });
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  /** Join personal room so server can push notifications directly */
  socket.join(`user:${user.userId}`);

  /** Server → client only: notification:new is emitted by REST routes via io.to() */

  // ── WebRTC / Calls ────────────────────────────────────────────────────────

  /**
   * call:invite — caller sends invitation to callee(s)
   * data: { callId, callerId, callerName, channelId?, recipientId, type: 'audio'|'video' }
   */
  socket.on('call:invite', (data: {
    callId: string;
    callerId: string;
    callerName: string;
    channelId?: string;
    recipientId: string;
    type: 'audio' | 'video';
  }) => {
    // Relay to recipient's personal room
    io.to(`user:${data.recipientId}`).emit('call:invite', {
      ...data,
      callerId: user.userId,
    });

    // Also broadcast to channel if channelId is provided
    if (data.channelId) {
      socket.to(`channel:${data.channelId}`).emit('call:invite', {
        ...data,
        callerId: user.userId,
      });
    }
  });

  /** call:answer — callee accepts the call */
  socket.on('call:answer', (data: { callId: string; callerId: string }) => {
    io.to(`user:${data.callerId}`).emit('call:answer', {
      callId: data.callId,
      answeredBy: user.userId,
    });
  });

  /** call:decline — callee rejects the call */
  socket.on('call:decline', (data: { callId: string; callerId: string; reason?: string }) => {
    io.to(`user:${data.callerId}`).emit('call:decline', {
      callId: data.callId,
      declinedBy: user.userId,
      reason: data.reason,
    });
  });

  /** call:hangup — any party ends the call */
  socket.on('call:hangup', (data: { callId: string; peerId: string }) => {
    io.to(`user:${data.peerId}`).emit('call:hangup', {
      callId: data.callId,
      hangupBy: user.userId,
    });
  });

  /** call:ice-candidate — relay WebRTC ICE candidate (room-based or peer-to-peer) */
  socket.on('call:ice-candidate', (data: { callId?: string; to?: string; from?: string; roomId?: string; peerId?: string; candidate: any }) => {
    if (data.roomId) {
      // Room-based: relay to all in room
      socket.to(`call:${data.roomId}`).emit('call:ice-candidate', data);
      return;
    }
    // Legacy peer-to-peer relay
    if (data.peerId) {
      io.to(`user:${data.peerId}`).emit('call:ice-candidate', {
        callId: data.callId,
        from: user.userId,
        candidate: data.candidate,
      });
    }
  });

  /** call:offer — relay WebRTC SDP offer (room-based or peer-to-peer) */
  socket.on('call:offer', (data: { callId?: string; to?: string; from?: string; roomId?: string; peerId?: string; sdp?: any; offer?: any }) => {
    if (data.roomId) {
      socket.to(`call:${data.roomId}`).emit('call:offer', data);
      return;
    }
    if (data.peerId) {
      io.to(`user:${data.peerId}`).emit('call:offer', {
        callId: data.callId,
        from: user.userId,
        sdp: data.sdp,
      });
    }
  });

  /** call:answer-sdp — relay WebRTC SDP answer to caller */
  socket.on('call:answer-sdp', (data: { callId?: string; to?: string; from?: string; roomId?: string; peerId?: string; sdp?: any; answer?: any }) => {
    // Room-based relay (useWebRTC hook style)
    if (data.roomId) {
      socket.to(`call:${data.roomId}`).emit('call:answer-sdp', data);
      return;
    }
    // Legacy peer-to-peer relay
    if (data.peerId) {
      io.to(`user:${data.peerId}`).emit('call:answer-sdp', {
        callId: data.callId,
        from: user.userId,
        sdp: data.sdp,
      });
    }
  });

  // ── WebRTC Room-Based Signaling (mesh topology for useWebRTC hook) ─────────

  /** call:join-room — user joins a call room and notifies other participants */
  socket.on('call:join-room', ({ roomId, userId: uid }: { roomId: string; userId: string }) => {
    const room = `call:${roomId}`;
    socket.join(room);
    console.log(`[call] userId=${uid} joined call room:${roomId}`);
    socket.to(room).emit('call:user-joined', {
      userId: uid,
      name: user.email.split('@')[0],
      socketId: socket.id,
    });
  });

  /** call:leave — user leaves a call room */
  socket.on('call:leave', ({ roomId, userId: uid }: { roomId: string; userId: string }) => {
    const room = `call:${roomId}`;
    socket.to(room).emit('call:user-left', { userId: uid });
    socket.leave(room);
    console.log(`[call] userId=${uid} left call room:${roomId}`);
  });

  /** call:mute — broadcast mute state to room */
  socket.on('call:mute', ({ roomId, userId: uid, muted }: { roomId: string; userId: string; muted: boolean }) => {
    socket.to(`call:${roomId}`).emit('call:mute', { userId: uid, muted });
  });

  /** call:camera — broadcast camera state to room */
  socket.on('call:camera', ({ roomId, userId: uid, cameraOff }: { roomId: string; userId: string; cameraOff: boolean }) => {
    socket.to(`call:${roomId}`).emit('call:camera', { userId: uid, cameraOff });
  });

  /** call:screen-share — broadcast screen share state to room */
  socket.on('call:screen-share', ({ roomId, userId: uid, sharing }: { roomId: string; userId: string; sharing: boolean }) => {
    socket.to(`call:${roomId}`).emit('call:screen-share', { userId: uid, sharing });
  });

  /** call:hand-raise — broadcast hand raise to room */
  socket.on('call:hand-raise', ({ roomId, userId: uid, raised }: { roomId: string; userId: string; raised: boolean }) => {
    socket.to(`call:${roomId}`).emit('call:hand-raise', { userId: uid, raised });
  });

  /** call:reaction — broadcast emoji reaction to room */
  socket.on('call:reaction', ({ roomId, userId: uid, reaction }: { roomId: string; userId: string; reaction: string }) => {
    socket.to(`call:${roomId}`).emit('call:reaction', { userId: uid, reaction });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  // ── Breakout Rooms ────────────────────────────────────────────────────────

  socket.on('breakout:create_rooms', ({ callRoomId, rooms }: { callRoomId: string; rooms: Array<{ id: string; name: string; participantIds: string[] }> }) => {
    breakoutRooms.set(callRoomId, rooms);
    // Notify each participant which room they're in
    rooms.forEach(room => {
      room.participantIds.forEach(userId => {
        const socketIds = userSocketMap.get(userId) || [];
        socketIds.forEach(socketId => {
          io.to(socketId).emit('breakout:assigned', { room, callRoomId });
        });
      });
    });
    // Broadcast to call room that breakouts started
    io.to(`call:${callRoomId}`).emit('breakout:started', { rooms });
  });

  socket.on('breakout:join_room', ({ callRoomId, roomId }: { callRoomId: string; roomId: string }) => {
    const breakoutSocketRoom = `breakout:${callRoomId}:${roomId}`;
    socket.join(breakoutSocketRoom);
    socket.to(breakoutSocketRoom).emit('breakout:participant_joined', { userId: user.userId, roomId });
  });

  socket.on('breakout:leave_room', ({ callRoomId, roomId }: { callRoomId: string; roomId: string }) => {
    socket.leave(`breakout:${callRoomId}:${roomId}`);
  });

  socket.on('breakout:end_all', ({ callRoomId }: { callRoomId: string }) => {
    breakoutRooms.delete(callRoomId);
    io.to(`call:${callRoomId}`).emit('breakout:ended', { callRoomId });
  });

  socket.on('breakout:message', ({ callRoomId, roomId, message }: { callRoomId: string; roomId: string; message: any }) => {
    socket.to(`breakout:${callRoomId}:${roomId}`).emit('breakout:message', { message, roomId });
  });

  // ── Read Receipts (#20) ───────────────────────────────────────────────────

  /**
   * read:message — client signals they have read a message.
   * Adds userId to the in-memory messageReadBy Map and broadcasts a read:receipt
   * to the channel room so other clients can update their UI.
   */
  socket.on('read:message', ({ messageId, channelId }: { messageId: string; channelId: string }) => {
    if (!messageId || !channelId) return;
    if (!messageReadBy.has(messageId)) messageReadBy.set(messageId, new Set());
    messageReadBy.get(messageId)!.add(user.userId);
    io.to(`channel:${channelId}`).emit('read:receipt', {
      messageId,
      userId: user.userId,
      readAt: Date.now(),
    });
  });

  // ── Notification Delivery with Quiet Hours suppression (#25) ──────────────

  /**
   * notification:deliver — server-side delivery request (can be triggered by routes
   * or other services). Suppressed if target user is in quiet hours.
   */
  socket.on('notification:deliver', ({ targetUserId, notification }: { targetUserId: string; notification: any }) => {
    if (!isInQuietHours(targetUserId)) {
      const userSocketIds = userSocketMap.get(targetUserId) || [];
      userSocketIds.forEach((sid) => io.to(sid).emit('notification', notification));
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────

  socket.on('disconnect', () => {
    console.log(`[chat] socket disconnected: userId=${user.userId}`);
    // Clean up userSocketMap
    const existingSocketIds = userSocketMap.get(user.userId);
    if (existingSocketIds) {
      const filtered = existingSocketIds.filter(id => id !== socket.id);
      if (filtered.length === 0) {
        userSocketMap.delete(user.userId);
      } else {
        userSocketMap.set(user.userId, filtered);
      }
    }
    const sockets = userSockets.get(user.userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSockets.delete(user.userId);
        // User fully offline — they should call PATCH /presence to update, but
        // we broadcast offline to all workspaces the socket had joined
        // (best-effort: rooms are tracked by socket.io internally)
        socket.rooms.forEach((room) => {
          if (room.startsWith('workspace:')) {
            socket.to(room).emit('presence:update', {
              userId: user.userId,
              status: 'offline',
              updatedAt: new Date().toISOString(),
            });
          }
        });
      }
    }
  });
});

// Export io so routes can emit notifications
export { io };

httpServer.listen(PORT, () =>
  console.log(`[brixstac-chat-service] running on :${PORT} (HTTP + WebSocket)`)
);

export default app;
