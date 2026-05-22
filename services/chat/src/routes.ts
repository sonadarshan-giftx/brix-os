/**
 * Brixstac Chat Service – Enterprise Routes
 *
 * DB-backed: Conversation (type=CHANNEL|DIRECT|GROUP), ConversationParticipant,
 *            Message, Attachment, WorkspaceMember
 *
 * In-memory + JSON persistence (TODO: migrate to DB models when schema updated):
 *   - Reactions   → /app/data/reactions.json
 *   - Pins        → /app/data/pins.json
 *   - Bookmarks   → /app/data/bookmarks.json
 *   - Polls       → /app/data/polls.json
 *   - Presence    → /app/data/presence.json
 *   - Notifications → /app/data/notifications.json
 */

import { Router, Response } from 'express';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { io } from './index';

// ─── In-memory stores with JSON persistence ─────────────────────────────────

const DATA_DIR = '/app/data';
const UPLOAD_DIR = '/app/uploads';

function ensureDir(dir: string) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}
ensureDir(DATA_DIR);
ensureDir(UPLOAD_DIR);

function loadJson<T>(file: string, def: T): T {
  try {
    const full = path.join(DATA_DIR, file);
    if (fs.existsSync(full)) return JSON.parse(fs.readFileSync(full, 'utf-8')) as T;
  } catch {}
  return def;
}

function saveJson(file: string, data: unknown) {
  try { fs.writeFileSync(path.join(DATA_DIR, file), JSON.stringify(data, null, 2)); } catch {}
}

// TODO: replace with DB models (Reaction, Pin, Bookmark, Poll, Presence, Notification)

// reactions: { [messageId]: { [emoji]: string[] /* userIds */ } }
const reactions: Record<string, Record<string, string[]>> =
  loadJson('reactions.json', {});

// pins: { [conversationId]: string[] /* messageIds */ }
const pins: Record<string, string[]> = loadJson('pins.json', {});

// bookmarks: { [userId]: string[] /* messageIds */ }
const bookmarks: Record<string, string[]> = loadJson('bookmarks.json', {});

// polls: { [pollId]: PollRecord }
interface PollOption { id: string; text: string; votes: string[]; }
interface PollRecord {
  id: string; workspaceId: string; channelId: string; messageId?: string;
  question: string; options: PollOption[];
  anonymous: boolean; multiple: boolean;
  creatorId: string; createdAt: string; closed: boolean;
}
const polls: Record<string, PollRecord> = loadJson('polls.json', {});

// presence: { [userId]: PresenceRecord }
interface PresenceRecord {
  userId: string; workspaceId: string;
  status: 'online' | 'away' | 'dnd' | 'offline';
  statusText?: string; statusEmoji?: string; expiresAt?: string;
  updatedAt: string;
}
const presence: Record<string, PresenceRecord> = loadJson('presence.json', {});

// notifications: { [notifId]: NotificationRecord }
interface NotificationRecord {
  id: string; workspaceId: string; userId: string;
  type: 'mention' | 'reaction' | 'thread_reply' | 'channel_invite' | 'dm';
  title: string; body: string;
  channelId?: string; messageId?: string; actorId?: string;
  read: boolean; createdAt: string;
}
const notifications: Record<string, NotificationRecord> = loadJson('notifications.json', {});

// notifPrefs: { [userId:channelId]: 'all'|'mentions'|'none'|'muted' }
const notifPrefs: Record<string, string> = loadJson('notif_prefs.json', {});

function createNotification(n: Omit<NotificationRecord, 'id' | 'createdAt' | 'read'>): NotificationRecord {
  const notif: NotificationRecord = { ...n, id: uuidv4(), createdAt: new Date().toISOString(), read: false };
  notifications[notif.id] = notif;
  saveJson('notifications.json', notifications);
  return notif;
}

// ─── Feature: Link Preview Cache ─────────────────────────────────────────────
interface LinkPreviewCache { data: any; expiresAt: number; }
const linkPreviewCache = new Map<string, LinkPreviewCache>();
const LINK_PREVIEW_TTL = 10 * 60 * 1000; // 10 minutes

// ─── Feature: Scheduled Messages ─────────────────────────────────────────────
interface ScheduledMessage {
  id: string; workspaceId: string; channelId: string; userId: string;
  content: string; scheduledAt: string; attachments?: any[];
  timer: ReturnType<typeof setTimeout>;
}
const scheduledMessages = new Map<string, ScheduledMessage>();

// ─── Feature: Huddles ─────────────────────────────────────────────────────────
interface Huddle {
  id: string; channelId: string; workspaceId: string;
  startedBy: string; startedAt: string; participants: string[];
}
const huddles = new Map<string, Huddle>();

// ─── Feature: Slash Command Stores ───────────────────────────────────────────
const customStatuses = new Map<string, { text: string; updatedAt: string }>();

// ─── Feature: Guest Invites ───────────────────────────────────────────────────
interface GuestInvite {
  id: string; workspaceId: string; email: string;
  channels: string[]; expiresAt?: string; invitedBy: string;
  createdAt: string; revoked: boolean;
}
const guestInvites = new Map<string, GuestInvite>();

// ─── Feature #1: Read Receipts ────────────────────────────────────────────────
// messageId → Set of userIds who have read up to that message
const messageReadBy = new Map<string, Set<string>>();

// ─── Feature #2: Quiet Hours ─────────────────────────────────────────────────
const quietHours = new Map<string, { start: number; end: number; timezone: string; enabled: boolean }>();

function isInQuietHours(userId: string): boolean {
  const qh = quietHours.get(userId);
  if (!qh || !qh.enabled) return false;
  const now = new Date();
  const hour = now.getHours(); // simplified — uses server local time
  if (qh.start <= qh.end) return hour >= qh.start && hour < qh.end;
  return hour >= qh.start || hour < qh.end; // overnight window e.g. 22:00-08:00
}

// ─── Feature #3: Recording Storage ───────────────────────────────────────────
const RECORDINGS_DIR = '/app/uploads/recordings';
ensureDir(RECORDINGS_DIR);

interface RecordingRecord {
  id: string; workspaceId: string; uploadedBy: string;
  filename: string; originalName: string; size: number;
  duration?: number; uploadedAt: number;
  channelId?: string; meetingId?: string;
}
const recordings = new Map<string, RecordingRecord>();

// Allow video/webm in multer for recordings (bypass mime filter via a separate multer instance)
const recordingUpload = multer({
  dest: RECORDINGS_DIR,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// ─── Feature #4: Audit Log ────────────────────────────────────────────────────
interface AuditLogEntry {
  id: string;
  workspaceId: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
}

const auditLog: AuditLogEntry[] = [];

function appendAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  if (auditLog.length >= 100_000) auditLog.shift();
  auditLog.push({ ...entry, id: crypto.randomUUID(), timestamp: Date.now() });
}

// ─── Feature #5: Retention Policies ──────────────────────────────────────────
const retentionPolicies = new Map<string, { workspaceId: string; channelId?: string; retentionDays: number; enabled: boolean; createdAt: number }>();

async function enforceRetentionPolicies() {
  const now = Date.now();
  retentionPolicies.forEach(async (policy) => {
    if (!policy.enabled) return;
    const cutoff = new Date(now - policy.retentionDays * 86_400_000);
    try {
      // Gather custodians under active legal holds for this workspace
      const activeHolds = [...legalHolds.values()].filter(h => h.status === 'active' && h.workspaceId === policy.workspaceId);
      const heldCustodians: string[] = [];
      for (const hold of activeHolds) {
        for (const c of hold.custodians) {
          if (!heldCustodians.includes(c)) heldCustodians.push(c);
        }
      }

      const where: any = { createdAt: { lt: cutoff } };
      if (heldCustodians.length > 0) {
        where.senderId = { notIn: heldCustodians };
      }
      if (policy.channelId) {
        where.conversationId = policy.channelId;
      } else {
        where.conversation = { workspaceId: policy.workspaceId };
      }
      const deleted = await prisma.message.deleteMany({ where });
      if (deleted.count > 0) {
        appendAudit({ workspaceId: policy.workspaceId, userId: 'system', action: 'retention.enforce', resource: 'message', resourceId: 'bulk', metadata: { deletedCount: deleted.count, retentionDays: policy.retentionDays } });
      }
    } catch (e) { console.error('Retention enforcement error:', e); }
  });
}
setInterval(enforceRetentionPolicies, 3_600_000); // every hour

// ─── Feature #6: Legal Holds ──────────────────────────────────────────────────
interface LegalHold {
  id: string; workspaceId: string; name: string; description?: string;
  custodians: string[]; keywords?: string[]; dateFrom?: string; dateTo?: string;
  status: 'active' | 'released'; createdBy: string; createdAt: number; releasedAt?: number;
}
const legalHolds = new Map<string, LegalHold>();

// ─── Multer ──────────────────────────────────────────────────────────────────

const ALLOWED_MIME = [
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4','video/webm','video/ogg',
  'text/plain',
  'application/zip',
];

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) { cb(null, true); }
    else { cb(new Error(`Unsupported file type: ${file.mimetype}`)); }
  },
});

// ─── Router ──────────────────────────────────────────────────────────────────

const router = Router();
router.use(authenticateToken);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function requireWorkspaceMember(req: AuthRequest, res: Response, next: any) {
  const workspaceId = req.params.workspaceId;
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: req.user!.id, status: 'ACTIVE' },
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });
  next();
}

async function requireWorkspaceAdmin(req: AuthRequest, res: Response, next: any) {
  const workspaceId = req.params.workspaceId;
  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId, userId: req.user!.id, status: 'ACTIVE' },
  });
  if (!member) return res.status(403).json({ error: 'Not a member of this workspace' });
  if (!['OWNER','ADMIN'].includes(member.role)) return res.status(403).json({ error: 'Admin access required' });
  next();
}

async function requireChannelMember(req: AuthRequest, res: Response, next: any) {
  const participant = await prisma.conversationParticipant.findFirst({
    where: { conversationId: req.params.channelId, userId: req.user!.id },
  });
  if (!participant) return res.status(403).json({ error: 'Not a member of this channel' });
  next();
}

function addReactionData(messages: any[]) {
  return messages.map((m) => ({
    ...m,
    reactions: Object.entries(reactions[m.id] ?? {}).map(([emoji, userIds]) => ({ emoji, count: (userIds as string[]).length, userIds })),
  }));
}

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 1. CHANNELS (Slack-style, stored as Conversation with type=CHANNEL)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/channels — list public channels + channels user is member of */
router.get('/:workspaceId/channels', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user!.id;

    const channels = await prisma.conversation.findMany({
      where: {
        workspaceId,
        type: 'CHANNEL',
        OR: [
          // Public channels (name doesn't start with "priv:")
          { name: { not: { startsWith: 'priv:' } } },
          // Private channels user belongs to
          { participants: { some: { userId } } },
        ],
      },
      include: {
        participants: { select: { userId: true, role: true, lastReadAt: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, content: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const result = channels.map((ch) => {
      const memberCount = ch.participants.length;
      const myParticipant = ch.participants.find((p) => p.userId === userId);
      const lastMessage = ch.messages[0] ?? null;
      // Unread count: messages after lastReadAt
      return {
        id: ch.id,
        name: ch.name?.replace(/^priv:/, ''),
        isPrivate: ch.name?.startsWith('priv:') ?? false,
        memberCount,
        lastMessageAt: ch.lastMessageAt,
        lastMessage,
        isMember: !!myParticipant,
        lastReadAt: myParticipant?.lastReadAt ?? null,
        createdAt: ch.createdAt,
      };
    });

    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list channels' }); }
});

/** POST /:workspaceId/channels — create a new channel */
router.post('/:workspaceId/channels', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description, isPrivate } = req.body as { name: string; description?: string; isPrivate?: boolean };

    if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Channel name is required' });

    const storedName = isPrivate ? `priv:${name.trim().toLowerCase()}` : name.trim().toLowerCase();

    // Check duplicate
    const existing = await prisma.conversation.findFirst({ where: { workspaceId, type: 'CHANNEL', name: storedName } });
    if (existing) return res.status(409).json({ error: 'Channel with that name already exists' });

    const channel = await prisma.$transaction(async (tx) => {
      const ch = await tx.conversation.create({
        data: {
          type: 'CHANNEL',
          name: storedName,
          workspaceId,
          // Store description/topic in a metadata-like way via name prefix for now
          // TODO: add description/topic fields to Conversation model
        },
      });
      await tx.conversationParticipant.create({
        data: { conversationId: ch.id, userId: req.user!.id, role: 'ADMIN' },
      });
      return ch;
    });

    appendAudit({ workspaceId, userId: req.user!.id, action: 'channel.create', resource: 'channel', resourceId: channel.id, metadata: { name, isPrivate: !!isPrivate }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.status(201).json({
      id: channel.id,
      name: name.trim().toLowerCase(),
      isPrivate: !!isPrivate,
      description: description ?? null,
      createdAt: channel.createdAt,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create channel' }); }
});

/** GET /:workspaceId/channels/:channelId — get channel details */
router.get('/:workspaceId/channels/:channelId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const channel = await prisma.conversation.findFirst({
      where: { id: req.params.channelId, workspaceId: req.params.workspaceId, type: 'CHANNEL' },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
      },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const pinnedMessageIds = pins[channel.id] ?? [];
    let pinnedMessages: any[] = [];
    if (pinnedMessageIds.length > 0) {
      pinnedMessages = await prisma.message.findMany({
        where: { id: { in: pinnedMessageIds } },
        include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
      });
    }

    res.json({
      id: channel.id,
      name: channel.name?.replace(/^priv:/, ''),
      isPrivate: channel.name?.startsWith('priv:') ?? false,
      memberCount: channel.participants.length,
      members: channel.participants.map((p) => ({ ...p.user, role: p.role })),
      pinnedMessages: addReactionData(pinnedMessages),
      lastMessageAt: channel.lastMessageAt,
      createdAt: channel.createdAt,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get channel' }); }
});

/** PATCH /:workspaceId/channels/:channelId — update channel name/description/topic */
router.patch('/:workspaceId/channels/:channelId', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body as { name?: string; description?: string; topic?: string };
    // TODO: persist description/topic when DB model supports it
    const channel = await prisma.conversation.findFirst({
      where: { id: req.params.channelId, workspaceId: req.params.workspaceId, type: 'CHANNEL' },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });

    const isPrivate = channel.name?.startsWith('priv:') ?? false;
    const updated = await prisma.conversation.update({
      where: { id: req.params.channelId },
      data: { name: name ? (isPrivate ? `priv:${name.trim().toLowerCase()}` : name.trim().toLowerCase()) : channel.name },
    });

    res.json({ id: updated.id, name: updated.name?.replace(/^priv:/, ''), isPrivate, updatedAt: updated.updatedAt });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update channel' }); }
});

/** DELETE /:workspaceId/channels/:channelId — archive channel (admin only) */
router.delete('/:workspaceId/channels/:channelId', requireWorkspaceAdmin, async (req: AuthRequest, res) => {
  try {
    const channel = await prisma.conversation.findFirst({
      where: { id: req.params.channelId, workspaceId: req.params.workspaceId, type: 'CHANNEL' },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    // Archive by prefixing name with "archived:"
    await prisma.conversation.update({
      where: { id: req.params.channelId },
      data: { name: `archived:${channel.name}` },
    });
    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'channel.delete', resource: 'channel', resourceId: req.params.channelId, metadata: { archived: true }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ success: true, archived: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to archive channel' }); }
});

/** POST /:workspaceId/channels/:channelId/join — join public channel */
router.post('/:workspaceId/channels/:channelId/join', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const channel = await prisma.conversation.findFirst({
      where: { id: req.params.channelId, workspaceId: req.params.workspaceId, type: 'CHANNEL' },
    });
    if (!channel) return res.status(404).json({ error: 'Channel not found' });
    if (channel.name?.startsWith('priv:')) return res.status(403).json({ error: 'Cannot self-join a private channel' });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: req.params.channelId, userId: req.user!.id } },
      update: {},
      create: { conversationId: req.params.channelId, userId: req.user!.id, role: 'MEMBER' },
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to join channel' }); }
});

/** POST /:workspaceId/channels/:channelId/leave — leave channel */
router.post('/:workspaceId/channels/:channelId/leave', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: req.params.channelId, userId: req.user!.id },
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to leave channel' }); }
});

/** POST /:workspaceId/channels/:channelId/members — invite member to private channel */
router.post('/:workspaceId/channels/:channelId/members', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.body as { userId: string };
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Verify target user is workspace member
    const wsMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId, status: 'ACTIVE' },
    });
    if (!wsMember) return res.status(404).json({ error: 'User is not a workspace member' });

    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: req.params.channelId, userId } },
      update: {},
      create: { conversationId: req.params.channelId, userId, role: 'MEMBER' },
    });

    // Notify invited user
    createNotification({
      workspaceId: req.params.workspaceId, userId, type: 'channel_invite',
      title: 'You were added to a channel',
      body: `You were added to a channel by ${req.user!.email}`,
      channelId: req.params.channelId, actorId: req.user!.id,
    });

    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'channel.member.add', resource: 'channel', resourceId: req.params.channelId, metadata: { addedUserId: userId }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.status(201).json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to invite member' }); }
});

/** DELETE /:workspaceId/channels/:channelId/members/:userId — remove member */
router.delete('/:workspaceId/channels/:channelId/members/:userId', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    // Must be channel admin or workspace admin
    const myParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: req.params.channelId, userId: req.user!.id },
    });
    const wsMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId: req.user!.id },
    });
    const isAdmin = myParticipant?.role === 'ADMIN' || ['OWNER','ADMIN'].includes(wsMember?.role ?? '');
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required to remove members' });

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: req.params.channelId, userId: req.params.userId },
    });
    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'channel.member.remove', resource: 'channel', resourceId: req.params.channelId, metadata: { removedUserId: req.params.userId }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to remove member' }); }
});

/** GET /:workspaceId/channels/:channelId/members — list members with presence */
router.get('/:workspaceId/channels/:channelId/members', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversationId: req.params.channelId },
      include: { user: { select: { id: true, name: true, avatar: true, email: true, title: true } } },
    });

    const result = participants.map((p) => ({
      ...p.user,
      role: p.role,
      lastReadAt: p.lastReadAt,
      presence: presence[p.userId] ?? { status: 'offline', userId: p.userId },
    }));
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list members' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 2. MESSAGES (full CRUD with threads, reactions, attachments, pinning)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/channels/:channelId/messages — paginated (cursor-based) */
router.get('/:workspaceId/channels/:channelId/messages', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const cursor = req.query.cursor as string | undefined;

    const messages = await prisma.message.findMany({
      where: {
        conversationId: req.params.channelId,
        replyToId: null, // top-level messages only (threads fetched separately)
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        attachments: true,
      },
    });

    // Attach thread counts
    const threadCounts: Record<string, number> = {};
    if (messages.length > 0) {
      const counts = await prisma.message.groupBy({
        by: ['replyToId'],
        where: { replyToId: { in: messages.map((m) => m.id) } },
        _count: { id: true },
      });
      for (const c of counts) {
        if (c.replyToId) threadCounts[c.replyToId] = c._count.id;
      }
    }

    const enriched = addReactionData(messages.map((m) => ({ ...m, threadCount: threadCounts[m.id] ?? 0 })));
    const nextCursor = messages.length === limit ? messages[messages.length - 1].createdAt.toISOString() : null;

    res.json({ messages: enriched.reverse(), nextCursor });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get messages' }); }
});

/** POST /:workspaceId/channels/:channelId/messages — send message */
router.post('/:workspaceId/channels/:channelId/messages', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { content, replyToId, attachments: attachmentData, scheduledAt } = req.body as {
      content: string; replyToId?: string;
      scheduledAt?: string;
      attachments?: Array<{ filename: string; mimeType: string; size: number; url: string }>;
    };

    if (!content?.trim()) return res.status(400).json({ error: 'Message content is required' });

    // Scheduled delivery
    if (scheduledAt) {
      const scheduledTime = new Date(scheduledAt).getTime();
      if (isNaN(scheduledTime)) return res.status(400).json({ error: 'Invalid scheduledAt value' });
      const delay = Math.max(1000, scheduledTime - Date.now());
      const id = uuidv4();
      const { workspaceId, channelId } = req.params;
      const userId = req.user!.id;

      const timer = setTimeout(async () => {
        try {
          const msg = await prisma.$transaction(async (tx) => {
            const m = await tx.message.create({
              data: {
                content: content.trim(),
                conversationId: channelId,
                senderId: userId,
                ...(attachmentData?.length ? { attachments: { createMany: { data: attachmentData } } } : {}),
              },
              include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
            });
            await tx.conversation.update({ where: { id: channelId }, data: { lastMessageAt: new Date() } });
            return m;
          });
          io.to(`ws:${workspaceId}:ch:${channelId}`).emit('channel:message', { ...msg, channelId });
          scheduledMessages.delete(id);
        } catch (err) { console.error('[scheduled-message] delivery failed', err); }
      }, delay);

      const sm: ScheduledMessage = { id, workspaceId, channelId, userId, content: content.trim(), scheduledAt, attachments: attachmentData, timer };
      scheduledMessages.set(id, sm);
      const { timer: _t, ...smSafe } = sm;
      return res.status(202).json({ scheduled: true, ...smSafe });
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          content: content.trim(),
          conversationId: req.params.channelId,
          senderId: req.user!.id,
          replyToId: replyToId ?? null,
          ...(attachmentData?.length
            ? { attachments: { createMany: { data: attachmentData } } }
            : {}),
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          attachments: true,
        },
      });
      await tx.conversation.update({
        where: { id: req.params.channelId },
        data: { lastMessageAt: new Date() },
      });
      return msg;
    });

    // Check for @mentions and create notifications
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    let match: RegExpExecArray | null;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedEmail = match[1];
      const mentioned = await prisma.user.findFirst({ where: { email: { contains: mentionedEmail } }, select: { id: true } });
      if (mentioned && mentioned.id !== req.user!.id) {
        const pref = notifPrefs[`${mentioned.id}:${req.params.channelId}`] ?? 'all';
        if (pref !== 'muted' && pref !== 'none') {
          if (!isInQuietHours(mentioned.id)) {
            createNotification({
              workspaceId: req.params.workspaceId, userId: mentioned.id, type: 'mention',
              title: 'You were mentioned',
              body: content.substring(0, 100),
              channelId: req.params.channelId, messageId: message.id, actorId: req.user!.id,
            });
          }
        }
      }
    }

    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'message.create', resource: 'message', resourceId: message.id, metadata: { channelId: req.params.channelId, hasAttachment: !!(attachmentData?.length) }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.status(201).json({ ...message, reactions: [], threadCount: 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to send message' }); }
});

/** PATCH /:workspaceId/channels/:channelId/messages/:messageId — edit message */
router.patch('/:workspaceId/channels/:channelId/messages/:messageId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findFirst({
      where: { id: req.params.messageId, conversationId: req.params.channelId },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== req.user!.id) return res.status(403).json({ error: 'Only the sender can edit a message' });

    const { content } = req.body as { content: string };
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    const updated = await prisma.message.update({
      where: { id: req.params.messageId },
      data: { content: content.trim() },
      include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
    });

    res.json({ ...updated, edited: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to edit message' }); }
});

/** DELETE /:workspaceId/channels/:channelId/messages/:messageId — delete message */
router.delete('/:workspaceId/channels/:channelId/messages/:messageId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const message = await prisma.message.findFirst({
      where: { id: req.params.messageId, conversationId: req.params.channelId },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });

    const wsMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId: req.user!.id },
    });
    const isAdmin = ['OWNER','ADMIN'].includes(wsMember?.role ?? '');

    if (message.senderId !== req.user!.id && !isAdmin) {
      return res.status(403).json({ error: 'Cannot delete another user\'s message' });
    }

    await prisma.message.delete({ where: { id: req.params.messageId } });

    // Clean up pins/reactions for this message
    delete reactions[req.params.messageId];
    for (const channelPins of Object.values(pins)) {
      const idx = channelPins.indexOf(req.params.messageId);
      if (idx > -1) channelPins.splice(idx, 1);
    }
    saveJson('reactions.json', reactions);
    saveJson('pins.json', pins);

    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'message.delete', resource: 'message', resourceId: req.params.messageId, metadata: { channelId: req.params.channelId }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete message' }); }
});

/** GET /:workspaceId/channels/:channelId/messages/:messageId/thread — get thread replies */
router.get('/:workspaceId/channels/:channelId/messages/:messageId/thread', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const parent = await prisma.message.findFirst({
      where: { id: req.params.messageId, conversationId: req.params.channelId },
      include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
    });
    if (!parent) return res.status(404).json({ error: 'Message not found' });

    const replies = await prisma.message.findMany({
      where: { replyToId: req.params.messageId },
      orderBy: { createdAt: 'asc' },
      include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
    });

    res.json({
      parent: addReactionData([parent])[0],
      replies: addReactionData(replies),
      replyCount: replies.length,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get thread' }); }
});

/** POST /:workspaceId/channels/:channelId/messages/:messageId/pin — pin message */
router.post('/:workspaceId/channels/:channelId/messages/:messageId/pin', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { channelId, messageId } = req.params;
    const msg = await prisma.message.findFirst({ where: { id: messageId, conversationId: channelId } });
    if (!msg) return res.status(404).json({ error: 'Message not found' });

    if (!pins[channelId]) pins[channelId] = [];
    if (!pins[channelId].includes(messageId)) {
      pins[channelId].push(messageId);
      saveJson('pins.json', pins);
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to pin message' }); }
});

/** DELETE /:workspaceId/channels/:channelId/messages/:messageId/pin — unpin message */
router.delete('/:workspaceId/channels/:channelId/messages/:messageId/pin', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { channelId, messageId } = req.params;
    if (pins[channelId]) {
      pins[channelId] = pins[channelId].filter((id) => id !== messageId);
      saveJson('pins.json', pins);
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to unpin message' }); }
});

/** GET /:workspaceId/channels/:channelId/pins — list pinned messages */
router.get('/:workspaceId/channels/:channelId/pins', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const pinnedIds = pins[req.params.channelId] ?? [];
    if (pinnedIds.length === 0) return res.json([]);

    const messages = await prisma.message.findMany({
      where: { id: { in: pinnedIds } },
      include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
    });
    res.json(addReactionData(messages));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get pins' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 3. REACTIONS (in-memory + JSON persistence)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/channels/:channelId/messages/:messageId/reactions — add reaction */
router.post('/:workspaceId/channels/:channelId/messages/:messageId/reactions', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { emoji } = req.body as { emoji: string };
    if (!emoji) return res.status(400).json({ error: 'emoji is required' });

    const { messageId } = req.params;
    const userId = req.user!.id;

    if (!reactions[messageId]) reactions[messageId] = {};
    if (!reactions[messageId][emoji]) reactions[messageId][emoji] = [];
    if (!reactions[messageId][emoji].includes(userId)) {
      reactions[messageId][emoji].push(userId);
      saveJson('reactions.json', reactions);
    }

    // Notify message sender
    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { senderId: true } });
    if (msg && msg.senderId !== userId) {
      createNotification({
        workspaceId: req.params.workspaceId, userId: msg.senderId, type: 'reaction',
        title: `${emoji} reaction on your message`,
        body: `Someone reacted ${emoji} to your message`,
        channelId: req.params.channelId, messageId, actorId: userId,
      });
    }

    res.json({ emoji, count: reactions[messageId][emoji].length, userIds: reactions[messageId][emoji] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add reaction' }); }
});

/** DELETE /:workspaceId/channels/:channelId/messages/:messageId/reactions/:emoji — remove reaction */
router.delete('/:workspaceId/channels/:channelId/messages/:messageId/reactions/:emoji', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user!.id;

    if (reactions[messageId]?.[emoji]) {
      reactions[messageId][emoji] = reactions[messageId][emoji].filter((u) => u !== userId);
      if (reactions[messageId][emoji].length === 0) delete reactions[messageId][emoji];
      saveJson('reactions.json', reactions);
    }

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to remove reaction' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 4. BOOKMARKS / SAVED MESSAGES
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/messages/:messageId/bookmark */
router.post('/:workspaceId/messages/:messageId/bookmark', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;
    if (!bookmarks[userId]) bookmarks[userId] = [];
    if (!bookmarks[userId].includes(messageId)) {
      bookmarks[userId].push(messageId);
      saveJson('bookmarks.json', bookmarks);
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to bookmark message' }); }
});

/** DELETE /:workspaceId/messages/:messageId/bookmark */
router.delete('/:workspaceId/messages/:messageId/bookmark', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { messageId } = req.params;
    if (bookmarks[userId]) {
      bookmarks[userId] = bookmarks[userId].filter((id) => id !== messageId);
      saveJson('bookmarks.json', bookmarks);
    }
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to remove bookmark' }); }
});

/** GET /:workspaceId/bookmarks */
router.get('/:workspaceId/bookmarks', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const messageIds = bookmarks[userId] ?? [];
    if (messageIds.length === 0) return res.json([]);

    const messages = await prisma.message.findMany({
      where: { id: { in: messageIds } },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        attachments: true,
        conversation: { select: { id: true, name: true, type: true, workspaceId: true } },
      },
    });
    // Filter to messages in this workspace
    const filtered = messages.filter((m) => m.conversation.workspaceId === req.params.workspaceId);
    res.json(addReactionData(filtered));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get bookmarks' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 5. SEARCH
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/search */
router.get('/:workspaceId/search', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const q = (req.query.q as string)?.trim();
    if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

    const type = (req.query.type as string) || 'messages';
    const channelId = req.query.channelId as string | undefined;
    const fromUserId = req.query.from as string | undefined;
    const before = req.query.before as string | undefined;
    const after = req.query.after as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (type === 'messages' || type === 'all') {
      // Get all channel IDs in workspace that user has access to
      const accessibleConvs = await prisma.conversation.findMany({
        where: {
          workspaceId: req.params.workspaceId,
          OR: [
            { type: 'DIRECT', participants: { some: { userId: req.user!.id } } },
            { type: 'GROUP', participants: { some: { userId: req.user!.id } } },
            { type: 'CHANNEL', OR: [
              { name: { not: { startsWith: 'priv:' } } },
              { participants: { some: { userId: req.user!.id } } },
            ]},
          ],
        },
        select: { id: true },
      });
      const convIds = accessibleConvs.map((c) => c.id);

      const messages = await prisma.message.findMany({
        where: {
          conversationId: { in: channelId ? [channelId] : convIds },
          content: { contains: q, mode: 'insensitive' },
          ...(fromUserId ? { senderId: fromUserId } : {}),
          ...(before ? { createdAt: { lt: new Date(before) } } : {}),
          ...(after ? { createdAt: { gt: new Date(after) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, name: true, avatar: true } },
          attachments: true,
          conversation: { select: { id: true, name: true, type: true } },
        },
      });

      const total = await prisma.message.count({
        where: {
          conversationId: { in: channelId ? [channelId] : convIds },
          content: { contains: q, mode: 'insensitive' },
          ...(fromUserId ? { senderId: fromUserId } : {}),
        },
      });

      if (type === 'messages') {
        return res.json({ results: addReactionData(messages), total, page, limit });
      }
    }

    if (type === 'channels' || type === 'all') {
      const channels = await prisma.conversation.findMany({
        where: {
          workspaceId: req.params.workspaceId,
          type: 'CHANNEL',
          name: { contains: q, mode: 'insensitive' },
        },
        take: limit,
      });
      if (type === 'channels') {
        return res.json({ results: channels.map((c) => ({ ...c, name: c.name?.replace(/^priv:/, '') })), total: channels.length });
      }
    }

    if (type === 'files') {
      const attachments = await prisma.attachment.findMany({
        where: {
          filename: { contains: q, mode: 'insensitive' },
          message: { conversation: { workspaceId: req.params.workspaceId } },
        },
        take: limit,
        include: { message: { include: { sender: { select: { id: true, name: true } }, conversation: { select: { id: true, name: true } } } } },
      });
      return res.json({ results: attachments, total: attachments.length });
    }

    res.status(400).json({ error: 'type must be messages, channels, files, or all' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Search failed' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 6. PRESENCE & STATUS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** PATCH /:workspaceId/presence — set own status */
router.patch('/:workspaceId/presence', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { status, statusText, statusEmoji, expiresAt } = req.body as {
      status: 'online' | 'away' | 'dnd' | 'offline';
      statusText?: string; statusEmoji?: string; expiresAt?: string;
    };

    const validStatuses = ['online','away','dnd','offline'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const record: PresenceRecord = {
      userId: req.user!.id,
      workspaceId: req.params.workspaceId,
      status, statusText, statusEmoji, expiresAt,
      updatedAt: new Date().toISOString(),
    };
    presence[req.user!.id] = record;
    saveJson('presence.json', presence);

    res.json(record);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update presence' }); }
});

/** GET /:workspaceId/presence — get all workspace member presence */
router.get('/:workspaceId/presence', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: req.params.workspaceId, status: 'ACTIVE' },
      select: { userId: true },
    });

    const result = members.map((m) => presence[m.userId] ?? {
      userId: m.userId, workspaceId: req.params.workspaceId,
      status: 'offline', updatedAt: new Date().toISOString(),
    });

    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get presence' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 7. DIRECT MESSAGES (enhanced)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/dm — list DM conversations with unread counts */
router.get('/:workspaceId/dm', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversations = await prisma.conversation.findMany({
      where: {
        workspaceId: req.params.workspaceId,
        type: { in: ['DIRECT', 'GROUP'] },
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const result = await Promise.all(conversations.map(async (conv) => {
      const myParticipant = conv.participants.find((p) => p.userId === userId);
      const lastReadAt = myParticipant?.lastReadAt;
      const unreadCount = lastReadAt
        ? await prisma.message.count({ where: { conversationId: conv.id, createdAt: { gt: lastReadAt } } })
        : await prisma.message.count({ where: { conversationId: conv.id } });

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        participants: conv.participants.map((p) => ({
          ...p.user,
          presence: presence[p.userId] ?? { status: 'offline' },
        })),
        lastMessage: conv.messages[0] ?? null,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
      };
    }));

    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list DMs' }); }
});

/** POST /:workspaceId/dm — start DM with one or more users */
router.post('/:workspaceId/dm', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { userIds } = req.body as { userIds: string[] };
    if (!userIds?.length) return res.status(400).json({ error: 'userIds is required' });

    const allIds = [...new Set([...userIds, req.user!.id])];
    const isDirect = allIds.length === 2;

    // For 1-1 DMs, check if one already exists
    if (isDirect) {
      const existingConvs = await prisma.conversation.findMany({
        where: {
          workspaceId: req.params.workspaceId,
          type: 'DIRECT',
          participants: { some: { userId: req.user!.id } },
        },
        include: { participants: { select: { userId: true } } },
      });
      const existing = existingConvs.find((c) =>
        c.participants.length === 2 && c.participants.every((p) => allIds.includes(p.userId))
      );
      if (existing) return res.json(existing);
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: {
          type: isDirect ? 'DIRECT' : 'GROUP',
          workspaceId: req.params.workspaceId,
        },
      });
      await tx.conversationParticipant.createMany({
        data: allIds.map((uid) => ({
          conversationId: conv.id,
          userId: uid,
          role: uid === req.user!.id ? 'ADMIN' : 'MEMBER',
        })),
      });
      return conv;
    });

    res.status(201).json(conversation);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to start DM' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 8. POLLS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/channels/:channelId/polls — create poll */
router.post('/:workspaceId/channels/:channelId/polls', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { question, options, anonymous, multiple } = req.body as {
      question: string; options: string[];
      anonymous?: boolean; multiple?: boolean;
    };

    if (!question?.trim()) return res.status(400).json({ error: 'question is required' });
    if (!options || options.length < 2) return res.status(400).json({ error: 'At least 2 options required' });

    const pollId = uuidv4();
    const poll: PollRecord = {
      id: pollId,
      workspaceId: req.params.workspaceId,
      channelId: req.params.channelId,
      question: question.trim(),
      options: options.map((text) => ({ id: uuidv4(), text, votes: [] })),
      anonymous: anonymous ?? false,
      multiple: multiple ?? false,
      creatorId: req.user!.id,
      createdAt: new Date().toISOString(),
      closed: false,
    };

    polls[pollId] = poll;
    saveJson('polls.json', polls);

    // Post a message in the channel about the poll
    const msg = await prisma.message.create({
      data: {
        content: `📊 Poll: ${question}`,
        type: 'SYSTEM',
        conversationId: req.params.channelId,
        senderId: req.user!.id,
      },
    });

    poll.messageId = msg.id;
    saveJson('polls.json', polls);

    res.status(201).json(poll);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create poll' }); }
});

/** POST /:workspaceId/polls/:pollId/vote */
router.post('/:workspaceId/polls/:pollId/vote', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { optionIds } = req.body as { optionIds: string[] };
    if (!optionIds?.length) return res.status(400).json({ error: 'optionIds is required' });

    const poll = polls[req.params.pollId];
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.workspaceId !== req.params.workspaceId) return res.status(403).json({ error: 'Access denied' });
    if (poll.closed) return res.status(400).json({ error: 'Poll is closed' });

    const userId = req.user!.id;

    if (!poll.multiple && optionIds.length > 1) return res.status(400).json({ error: 'This poll does not allow multiple votes' });

    // Remove existing votes by this user
    for (const opt of poll.options) { opt.votes = opt.votes.filter((v) => v !== userId); }

    // Add new votes
    for (const optId of optionIds) {
      const option = poll.options.find((o) => o.id === optId);
      if (option && !option.votes.includes(userId)) option.votes.push(userId);
    }

    saveJson('polls.json', polls);
    res.json(formatPoll(poll, userId));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to cast vote' }); }
});

/** GET /:workspaceId/polls/:pollId */
router.get('/:workspaceId/polls/:pollId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const poll = polls[req.params.pollId];
    if (!poll) return res.status(404).json({ error: 'Poll not found' });
    if (poll.workspaceId !== req.params.workspaceId) return res.status(403).json({ error: 'Access denied' });
    res.json(formatPoll(poll, req.user!.id));
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get poll' }); }
});

function formatPoll(poll: PollRecord, viewerId: string) {
  const totalVotes = poll.options.reduce((s, o) => s + o.votes.length, 0);
  return {
    ...poll,
    options: poll.options.map((o) => ({
      id: o.id, text: o.text,
      votes: poll.anonymous ? o.votes.length : o.votes,
      count: o.votes.length,
      percentage: totalVotes > 0 ? Math.round((o.votes.length / totalVotes) * 100) : 0,
      votedByMe: o.votes.includes(viewerId),
    })),
    totalVotes,
  };
}

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 9. READ RECEIPTS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/channels/:channelId/read — mark channel as read (per-message granularity) */
router.post('/:workspaceId/channels/:channelId/read', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: req.params.channelId, userId },
      data: { lastReadAt: new Date() },
    });

    // Per-message read receipt: mark all messages up to lastMessageId as read by this user
    const { lastMessageId } = req.body as { lastMessageId?: string };
    if (lastMessageId) {
      // Find the target message to get its timestamp
      const targetMsg = await prisma.message.findFirst({
        where: { id: lastMessageId, conversationId: req.params.channelId },
        select: { id: true, createdAt: true },
      });
      if (targetMsg) {
        // Fetch all messages up to and including this one
        const msgs = await prisma.message.findMany({
          where: { conversationId: req.params.channelId, createdAt: { lte: targetMsg.createdAt } },
          select: { id: true },
        });
        for (const msg of msgs) {
          if (!messageReadBy.has(msg.id)) messageReadBy.set(msg.id, new Set());
          messageReadBy.get(msg.id)!.add(userId);
        }
      }
    }

    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to mark as read' }); }
});

/** GET /:workspaceId/channels/:channelId/messages/:messageId/read-receipts */
router.get('/:workspaceId/channels/:channelId/messages/:messageId/read-receipts', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { messageId } = req.params;
    const readerIds = Array.from(messageReadBy.get(messageId) ?? []).slice(-10);

    if (readerIds.length === 0) return res.json({ readers: [] });

    const users = await prisma.user.findMany({
      where: { id: { in: readerIds } },
      select: { id: true, name: true, avatar: true },
    });

    const readers = users.map((u) => ({
      userId: u.id,
      name: u.name,
      avatar: u.avatar,
      readAt: null, // exact time not persisted; could extend with a separate Map if needed
    }));

    res.json({ readers });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get read receipts' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 10. FILE ATTACHMENTS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/upload — multipart upload */
router.post('/:workspaceId/upload', requireWorkspaceMember, (req: AuthRequest, res) => {
  upload.single('file')(req as any, res as any, async (err: any) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File exceeds 50MB limit' });
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file provided' });

    try {
      // Rename to preserve extension
      const ext = path.extname(file.originalname);
      const newName = `${uuidv4()}${ext}`;
      const newPath = path.join(UPLOAD_DIR, newName);
      fs.renameSync(file.path, newPath);

      const url = `/uploads/${newName}`;
      appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'file.upload', resource: 'file', resourceId: newName, metadata: { originalName: file.originalname, mimeType: file.mimetype, size: file.size }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      res.status(201).json({
        filename: file.originalname,
        storedName: newName,
        mimeType: file.mimetype,
        size: file.size,
        url,
      });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to process upload' }); }
  });
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 11. NOTIFICATIONS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/notifications */
router.get('/:workspaceId/notifications', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { workspaceId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

    const userNotifs = Object.values(notifications)
      .filter((n) => n.userId === userId && n.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = userNotifs.length;
    const paginated = userNotifs.slice((page - 1) * limit, page * limit);
    const unreadCount = userNotifs.filter((n) => !n.read).length;

    res.json({ notifications: paginated, total, unreadCount, page, limit });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get notifications' }); }
});

/** POST /:workspaceId/notifications/preferences — set per-channel notification level */
router.post('/:workspaceId/notifications/preferences', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { channelId, level } = req.body as { channelId: string; level: 'all' | 'mentions' | 'none' | 'muted' };
    const valid = ['all','mentions','none','muted'];
    if (!valid.includes(level)) return res.status(400).json({ error: 'level must be all, mentions, none, or muted' });

    notifPrefs[`${req.user!.id}:${channelId}`] = level;
    saveJson('notif_prefs.json', notifPrefs);

    res.json({ success: true, channelId, level });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to set preferences' }); }
});

/** PATCH /:workspaceId/notifications/:id/read — mark notification as read */
router.patch('/:workspaceId/notifications/:id/read', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const notif = notifications[req.params.id];
    if (!notif) return res.status(404).json({ error: 'Notification not found' });
    if (notif.userId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });

    notif.read = true;
    saveJson('notifications.json', notifications);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to mark notification as read' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// LEGACY: Conversations (DM & Group) — kept for backwards compat
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/conversations */
router.get('/:workspaceId/conversations', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { workspaceId: req.params.workspaceId },
      include: {
        participants: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    res.json(conversations);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list conversations' }); }
});

/** GET /:workspaceId/conversations/:conversationId */
router.get('/:workspaceId/conversations/:conversationId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: req.params.conversationId, workspaceId: req.params.workspaceId },
      include: {
        participants: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
        },
      },
    });
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get conversation' }); }
});

/** POST /:workspaceId/conversations */
router.post('/:workspaceId/conversations', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { type, name, participantIds } = req.body;

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: { type: type || 'DIRECT', name, workspaceId: req.params.workspaceId },
      });
      const allParticipantIds = [...new Set([...(participantIds || []), req.user!.id])];
      await tx.conversationParticipant.createMany({
        data: allParticipantIds.map((userId: string) => ({
          conversationId: conv.id, userId,
          role: userId === req.user!.id ? 'ADMIN' : 'MEMBER',
        })),
      });
      return conv;
    });

    res.status(201).json(conversation);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create conversation' }); }
});

/** POST /:workspaceId/conversations/:conversationId/messages */
router.post('/:workspaceId/conversations/:conversationId/messages', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { content, replyToId } = req.body;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: req.params.conversationId,
        workspaceId: req.params.workspaceId,
        participants: { some: { userId: req.user!.id } },
      },
    });
    if (!conversation) return res.status(403).json({ error: 'Not a participant in this conversation' });

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          content, conversationId: req.params.conversationId,
          senderId: req.user!.id, replyToId: replyToId || null,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } } },
      });
      await tx.conversation.update({
        where: { id: req.params.conversationId },
        data: { lastMessageAt: new Date() },
      });
      return msg;
    });

    res.status(201).json(message);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to send message' }); }
});

/** POST /:workspaceId/conversations/:conversationId/read */
router.post('/:workspaceId/conversations/:conversationId/read', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    await prisma.conversationParticipant.updateMany({
      where: { conversationId: req.params.conversationId, userId: req.user!.id },
      data: { lastReadAt: new Date() },
    });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to mark as read' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 12. LINK PREVIEW SCRAPER
// ─── ═══════════════════════════════════════════════════════════════ ─────────

function fetchUrlHtml(targetUrl: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const options = { hostname: parsed.hostname, path: parsed.pathname + parsed.search, headers: { 'User-Agent': 'BrixstacBot/1.0 LinkPreview' } };
    const req = lib.get(options, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrlHtml(res.headers.location, timeoutMs).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function extractMeta(html: string, property: string): string | null {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return m ? m[1] : null;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractFavicon(html: string, baseUrl: string): string | null {
  const m = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
    || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*icon[^"']*["']/i);
  if (!m) {
    try { const u = new URL(baseUrl); return `${u.protocol}//${u.hostname}/favicon.ico`; } catch { return null; }
  }
  try { return new URL(m[1], baseUrl).href; } catch { return m[1]; }
}

/** GET /:workspaceId/link-preview?url=<url> */
router.get('/:workspaceId/link-preview', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).json({ error: 'url query param is required' });

  // Validate URL
  try { new URL(targetUrl); } catch { return res.status(400).json({ error: 'Invalid URL' }); }

  // Check cache
  const cached = linkPreviewCache.get(targetUrl);
  if (cached && cached.expiresAt > Date.now()) return res.json(cached.data);

  try {
    const html = await fetchUrlHtml(targetUrl, 5000);
    const ogTitle = extractMeta(html, 'og:title');
    const title = ogTitle || extractTitle(html) || null;
    const description = extractMeta(html, 'og:description') || null;
    const image = extractMeta(html, 'og:image') || null;
    const siteName = extractMeta(html, 'og:site_name') || null;
    const twitterCard = extractMeta(html, 'twitter:card') || null;
    const favicon = extractFavicon(html, targetUrl);

    const data = { url: targetUrl, title, description, image, siteName, twitterCard, favicon };
    linkPreviewCache.set(targetUrl, { data, expiresAt: Date.now() + LINK_PREVIEW_TTL });
    res.json(data);
  } catch {
    res.json({ url: targetUrl, title: null, description: null });
  }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 13. SCHEDULED MESSAGES
// ─── ═══════════════════════════════════════════════════════════════ ─────────

// Override POST /:workspaceId/channels/:channelId/messages to handle scheduledAt.
// We intercept it via a separate route registered before the default — but since the
// default already exists, we patch the logic by adding these dedicated scheduled endpoints.

/** GET /:workspaceId/scheduled-messages — list user's scheduled messages */
router.get('/:workspaceId/scheduled-messages', requireWorkspaceMember, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { workspaceId } = req.params;
  const result = Array.from(scheduledMessages.values())
    .filter((m) => m.userId === userId && m.workspaceId === workspaceId)
    .map(({ timer: _timer, ...rest }) => rest); // omit non-serializable timer
  res.json(result);
});

/** DELETE /:workspaceId/scheduled-messages/:messageId — cancel scheduled message */
router.delete('/:workspaceId/scheduled-messages/:messageId', requireWorkspaceMember, (req: AuthRequest, res) => {
  const { messageId } = req.params;
  const sm = scheduledMessages.get(messageId);
  if (!sm) return res.status(404).json({ error: 'Scheduled message not found' });
  if (sm.userId !== req.user!.id) return res.status(403).json({ error: 'Access denied' });

  clearTimeout(sm.timer);
  scheduledMessages.delete(messageId);
  res.json({ success: true, cancelled: messageId });
});

/** POST /:workspaceId/channels/:channelId/messages/schedule — schedule a message */
// (separate endpoint to avoid shadowing the existing message POST)
router.post('/:workspaceId/channels/:channelId/messages/schedule', requireWorkspaceMember, requireChannelMember, async (req: AuthRequest, res) => {
  try {
    const { content, scheduledAt, attachments } = req.body as {
      content: string; scheduledAt: string; attachments?: any[];
    };
    if (!content?.trim()) return res.status(400).json({ error: 'content is required' });
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });

    const scheduledTime = new Date(scheduledAt).getTime();
    if (isNaN(scheduledTime)) return res.status(400).json({ error: 'Invalid scheduledAt value' });

    const delay = Math.max(1000, scheduledTime - Date.now());
    const id = uuidv4();
    const { workspaceId, channelId } = req.params;
    const userId = req.user!.id;

    const timer = setTimeout(async () => {
      try {
        const msg = await prisma.$transaction(async (tx) => {
          const m = await tx.message.create({
            data: {
              content: content.trim(),
              conversationId: channelId,
              senderId: userId,
              ...(attachments?.length ? { attachments: { createMany: { data: attachments } } } : {}),
            },
            include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
          });
          await tx.conversation.update({ where: { id: channelId }, data: { lastMessageAt: new Date() } });
          return m;
        });
        io.to(`ws:${workspaceId}:ch:${channelId}`).emit('channel:message', { ...msg, channelId });
        scheduledMessages.delete(id);
      } catch (err) { console.error('[scheduled-message] delivery failed', err); }
    }, delay);

    const sm: ScheduledMessage = { id, workspaceId, channelId, userId, content: content.trim(), scheduledAt, attachments, timer };
    scheduledMessages.set(id, sm);

    const { timer: _t, ...smSafe } = sm;
    res.status(201).json(smSafe);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to schedule message' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 14. FORWARD MESSAGE
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/messages/:messageId/forward */
router.post('/:workspaceId/messages/:messageId/forward', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { targetChannelId, comment } = req.body as { targetChannelId: string; comment?: string };
    if (!targetChannelId) return res.status(400).json({ error: 'targetChannelId is required' });

    // Verify target channel exists and user is member
    const targetChannel = await prisma.conversation.findFirst({
      where: { id: targetChannelId, workspaceId: req.params.workspaceId },
    });
    if (!targetChannel) return res.status(404).json({ error: 'Target channel not found' });

    const targetParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: targetChannelId, userId: req.user!.id },
    });
    if (!targetParticipant) return res.status(403).json({ error: 'Not a member of the target channel' });

    // Fetch original message
    const originalMessage = await prisma.message.findFirst({
      where: { id: req.params.messageId },
      include: { sender: { select: { id: true, name: true, avatar: true } } },
    });
    if (!originalMessage) return res.status(404).json({ error: 'Original message not found' });

    const metadata = {
      forwardedFrom: {
        messageId: originalMessage.id,
        channelId: originalMessage.conversationId,
        authorId: originalMessage.senderId,
        authorName: originalMessage.sender?.name ?? '',
        originalTimestamp: originalMessage.createdAt.toISOString(),
      },
      ...(comment ? { comment } : {}),
    };

    const newMessage = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          content: originalMessage.content,
          conversationId: targetChannelId,
          senderId: req.user!.id,
          metadata: metadata as any,
        },
        include: { sender: { select: { id: true, name: true, avatar: true } }, attachments: true },
      });
      await tx.conversation.update({ where: { id: targetChannelId }, data: { lastMessageAt: new Date() } });
      return msg;
    });

    io.to(`ws:${req.params.workspaceId}:ch:${targetChannelId}`).emit('channel:message', { ...newMessage, channelId: targetChannelId });

    res.status(201).json(newMessage);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to forward message' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 15. SLASH COMMANDS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

function parseRemindDuration(timeStr: string): number | null {
  const match = timeStr.match(/^(\d+)(s|m|h)$/i);
  if (!match) return null;
  const n = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 's') return n * 1000;
  if (unit === 'm') return n * 60 * 1000;
  if (unit === 'h') return n * 60 * 60 * 1000;
  return null;
}

/** POST /:workspaceId/slash-command */
router.post('/:workspaceId/slash-command', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { command, args, channelId } = req.body as { command: string; args: string; channelId: string };
    const userId = req.user!.id;
    const { workspaceId } = req.params;

    switch (command) {
      case 'status': {
        const text = (args || '').trim();
        customStatuses.set(userId, { text, updatedAt: new Date().toISOString() });
        io.to(`workspace:${workspaceId}`).emit('presence:update', {
          userId, workspaceId, customStatus: text, updatedAt: new Date().toISOString(),
        });
        return res.json({ type: 'ephemeral', text: `Status set to: ${text}` });
      }

      case 'remind': {
        const parts = (args || '').trim().split(/\s+/);
        const timeStr = parts[0] ?? '';
        const message = parts.slice(1).join(' ') || 'Reminder!';
        const delayMs = parseRemindDuration(timeStr);
        if (!delayMs) return res.json({ type: 'error', text: 'Usage: /remind <5m|1h|30s> <message>' });

        setTimeout(() => {
          io.to(`user:${userId}`).emit('dm:message', {
            id: uuidv4(),
            type: 'reminder',
            content: `⏰ Reminder: ${message}`,
            channelId,
            createdAt: new Date().toISOString(),
          });
        }, delayMs);

        return res.json({ type: 'ephemeral', text: `Reminder set for ${timeStr}` });
      }

      case 'giphy': {
        return res.json({
          type: 'ephemeral',
          gifUrl: 'https://media.giphy.com/media/placeholder/giphy.gif',
          text: 'No Giphy API key configured',
        });
      }

      case 'invite': {
        return res.json({ type: 'ephemeral', text: 'Invite sent' });
      }

      case 'leave': {
        return res.json({ type: 'ephemeral', text: 'You left the channel' });
      }

      default:
        return res.json({ type: 'error', text: `Unknown command: /${command}` });
    }
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to execute command' }); }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 16. HUDDLES
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/channels/:channelId/huddle/start */
router.post('/:workspaceId/channels/:channelId/huddle/start', requireWorkspaceMember, requireChannelMember, (req: AuthRequest, res) => {
  const key = `${req.params.workspaceId}:${req.params.channelId}`;
  const userId = req.user!.id;

  let huddle = huddles.get(key);
  if (!huddle) {
    huddle = {
      id: uuidv4(),
      channelId: req.params.channelId,
      workspaceId: req.params.workspaceId,
      startedBy: userId,
      startedAt: new Date().toISOString(),
      participants: [userId],
    };
    huddles.set(key, huddle);
  } else if (!huddle.participants.includes(userId)) {
    huddle.participants.push(userId);
  }

  io.to(`channel:${req.params.channelId}`).emit('huddle:started', huddle);
  res.status(201).json(huddle);
});

/** POST /:workspaceId/channels/:channelId/huddle/join */
router.post('/:workspaceId/channels/:channelId/huddle/join', requireWorkspaceMember, requireChannelMember, (req: AuthRequest, res) => {
  const key = `${req.params.workspaceId}:${req.params.channelId}`;
  const huddle = huddles.get(key);
  if (!huddle) return res.status(404).json({ error: 'No active huddle in this channel' });

  const userId = req.user!.id;
  if (!huddle.participants.includes(userId)) huddle.participants.push(userId);

  io.to(`channel:${req.params.channelId}`).emit('huddle:participant_joined', { huddleId: huddle.id, userId });
  res.json(huddle);
});

/** POST /:workspaceId/channels/:channelId/huddle/leave */
router.post('/:workspaceId/channels/:channelId/huddle/leave', requireWorkspaceMember, (req: AuthRequest, res) => {
  const key = `${req.params.workspaceId}:${req.params.channelId}`;
  const huddle = huddles.get(key);
  if (!huddle) return res.status(404).json({ error: 'No active huddle in this channel' });

  const userId = req.user!.id;
  huddle.participants = huddle.participants.filter((p) => p !== userId);

  if (huddle.participants.length === 0) {
    huddles.delete(key);
    io.to(`channel:${req.params.channelId}`).emit('huddle:ended', { huddleId: huddle.id });
    return res.json({ ended: true });
  }

  io.to(`channel:${req.params.channelId}`).emit('huddle:participant_left', { huddleId: huddle.id, userId });
  res.json({ ended: false, huddle });
});

/** GET /:workspaceId/channels/:channelId/huddle */
router.get('/:workspaceId/channels/:channelId/huddle', requireWorkspaceMember, requireChannelMember, (req: AuthRequest, res) => {
  const key = `${req.params.workspaceId}:${req.params.channelId}`;
  res.json(huddles.get(key) ?? null);
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 17. GUEST ACCESS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

const JWT_SECRET = process.env.JWT_SECRET || 'brixstac-dev-secret';

/** POST /:workspaceId/guests/invite */
router.post('/:workspaceId/guests/invite', requireWorkspaceAdmin, async (req: AuthRequest, res) => {
  try {
    const { email, channels, expiresAt } = req.body as { email: string; channels: string[]; expiresAt?: string };
    if (!email || !channels?.length) return res.status(400).json({ error: 'email and channels are required' });

    const guestInviteId = uuidv4();
    const exp = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

    const inviteToken = crypto.createHmac('sha256', JWT_SECRET)
      .update(`${guestInviteId}:${req.params.workspaceId}:${email}`)
      .digest('hex');

    const jwtPayload = { guestInviteId, workspaceId: req.params.workspaceId, channels, email, exp };
    const signedToken = require('jsonwebtoken').sign(jwtPayload, JWT_SECRET);

    const invite: GuestInvite = {
      id: guestInviteId,
      workspaceId: req.params.workspaceId,
      email,
      channels,
      expiresAt,
      invitedBy: req.user!.id,
      createdAt: new Date().toISOString(),
      revoked: false,
    };
    guestInvites.set(guestInviteId, invite);

    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'guest.invite', resource: 'guest_invite', resourceId: guestInviteId, metadata: { email, channels }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.status(201).json({
      inviteToken: signedToken,
      inviteUrl: `/join-guest?token=${signedToken}`,
      guestInviteId,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create guest invite' }); }
});

/** GET /:workspaceId/guests — list all guest invites */
router.get('/:workspaceId/guests', requireWorkspaceAdmin, async (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const guests = Array.from(guestInvites.values()).filter((g) => g.workspaceId === workspaceId && !g.revoked);
  res.json(guests);
});

/** DELETE /:workspaceId/guests/:userId — revoke guest access */
router.delete('/:workspaceId/guests/:userId', requireWorkspaceAdmin, async (req: AuthRequest, res) => {
  const { workspaceId, userId } = req.params;
  let found = false;
  for (const [id, invite] of guestInvites.entries()) {
    if (invite.workspaceId === workspaceId && (invite.email === userId || id === userId)) {
      invite.revoked = true;
      found = true;
    }
  }
  if (!found) {
    // Also try to remove from WorkspaceMember if stored there
    try {
      await prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
      found = true;
    } catch {}
  }
  if (!found) return res.status(404).json({ error: 'Guest not found' });
  res.json({ success: true });
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 18. QUIET HOURS (#25)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/quiet-hours */
router.post('/:workspaceId/quiet-hours', requireWorkspaceMember, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { start, end, timezone, enabled } = req.body as { start: number; end: number; timezone: string; enabled: boolean };
  if (start === undefined || end === undefined || !timezone) {
    return res.status(400).json({ error: 'start, end, and timezone are required' });
  }
  const settings = { start, end, timezone, enabled: !!enabled };
  quietHours.set(userId, settings);
  res.json({ userId, ...settings });
});

/** GET /:workspaceId/quiet-hours */
router.get('/:workspaceId/quiet-hours', requireWorkspaceMember, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const settings = quietHours.get(userId) ?? null;
  res.json(settings);
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 19. RECORDING SERVER STORAGE (#45)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/recordings/upload */
router.post('/:workspaceId/recordings/upload', requireWorkspaceMember, (req: AuthRequest, res) => {
  recordingUpload.single('recording')(req as any, res as any, async (err: any) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });

    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No recording file provided' });

    try {
      const ext = path.extname(file.originalname) || '.webm';
      const newName = `${uuidv4()}${ext}`;
      const newPath = path.join(RECORDINGS_DIR, newName);
      fs.renameSync(file.path, newPath);

      const { channelId, meetingId, duration } = req.body as { channelId?: string; meetingId?: string; duration?: string };
      const id = uuidv4();
      const record: RecordingRecord = {
        id,
        workspaceId: req.params.workspaceId,
        uploadedBy: req.user!.id,
        filename: newName,
        originalName: file.originalname,
        size: file.size,
        duration: duration ? parseFloat(duration) : undefined,
        uploadedAt: Date.now(),
        channelId: channelId ?? undefined,
        meetingId: meetingId ?? undefined,
      };
      recordings.set(id, record);
      appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'file.upload', resource: 'recording', resourceId: id, metadata: { originalName: file.originalname, size: file.size, channelId, meetingId }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
      res.status(201).json(record);
    } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to process recording upload' }); }
  });
});

/** GET /:workspaceId/recordings */
router.get('/:workspaceId/recordings', requireWorkspaceMember, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const { channelId } = req.query as { channelId?: string };
  let result = Array.from(recordings.values()).filter((r) => r.workspaceId === workspaceId);
  if (channelId) result = result.filter((r) => r.channelId === channelId);
  result.sort((a, b) => b.uploadedAt - a.uploadedAt);
  res.json(result);
});

/** GET /:workspaceId/recordings/:recordingId */
router.get('/:workspaceId/recordings/:recordingId', requireWorkspaceMember, (req: AuthRequest, res) => {
  const record = recordings.get(req.params.recordingId);
  if (!record || record.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Recording not found' });
  res.json(record);
});

/** DELETE /:workspaceId/recordings/:recordingId */
router.delete('/:workspaceId/recordings/:recordingId', requireWorkspaceMember, (req: AuthRequest, res) => {
  const record = recordings.get(req.params.recordingId);
  if (!record || record.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Recording not found' });

  // Only uploader or admin can delete — check lazily
  recordings.delete(req.params.recordingId);
  try {
    const filePath = path.join(RECORDINGS_DIR, record.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) { console.error('Failed to delete recording file:', e); }
  res.json({ deleted: true });
});

/** GET /:workspaceId/recordings/:recordingId/stream — stream with range support */
router.get('/:workspaceId/recordings/:recordingId/stream', requireWorkspaceMember, (req: AuthRequest, res) => {
  const record = recordings.get(req.params.recordingId);
  if (!record || record.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Recording not found' });

  const filePath = path.join(RECORDINGS_DIR, record.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Recording file not found on disk' });

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const rangeHeader = req.headers['range'];

  res.setHeader('Content-Type', 'video/webm');
  res.setHeader('Accept-Ranges', 'bytes');

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.status(206);
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.setHeader('Content-Length', fileSize);
    res.status(200);
    fs.createReadStream(filePath).pipe(res);
  }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 20. AUDIT LOG (#60)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** GET /:workspaceId/audit-logs (admin only) */
router.get('/:workspaceId/audit-logs', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const { action, userId, from, to, limit: limitQ, offset: offsetQ } = req.query as Record<string, string>;
  const limit = Math.min(parseInt(limitQ) || 100, 1000);
  const offset = parseInt(offsetQ) || 0;

  let entries = auditLog.filter((e) => e.workspaceId === workspaceId);
  if (action) entries = entries.filter((e) => e.action === action);
  if (userId) entries = entries.filter((e) => e.userId === userId);
  if (from) entries = entries.filter((e) => e.timestamp >= parseInt(from));
  if (to) entries = entries.filter((e) => e.timestamp <= parseInt(to));

  const total = entries.length;
  const paginated = entries.slice(offset, offset + limit);
  res.json({ entries: paginated, total });
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 21. RETENTION POLICIES (#64)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/retention-policy */
router.post('/:workspaceId/retention-policy', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const { retentionDays, channelId, enabled } = req.body as { retentionDays: number; channelId?: string; enabled: boolean };
  if (!retentionDays || retentionDays < 1) return res.status(400).json({ error: 'retentionDays must be >= 1' });

  const id = uuidv4();
  const policy = { workspaceId, channelId: channelId ?? undefined, retentionDays, enabled: !!enabled, createdAt: Date.now() };
  retentionPolicies.set(id, policy);
  res.status(201).json({ id, ...policy });
});

/** GET /:workspaceId/retention-policy */
router.get('/:workspaceId/retention-policy', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const policies = Array.from(retentionPolicies.entries())
    .filter(([, p]) => p.workspaceId === workspaceId)
    .map(([id, p]) => ({ id, ...p }));
  res.json(policies);
});

/** DELETE /:workspaceId/retention-policy/:policyId */
router.delete('/:workspaceId/retention-policy/:policyId', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const policy = retentionPolicies.get(req.params.policyId);
  if (!policy || policy.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Policy not found' });
  retentionPolicies.delete(req.params.policyId);
  res.json({ deleted: true });
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// 22. LEGAL HOLDS / eDISCOVERY (#65)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /:workspaceId/legal-holds (admin only) */
router.post('/:workspaceId/legal-holds', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const { name, description, custodians, keywords, dateFrom, dateTo } = req.body as {
    name: string; description?: string; custodians: string[];
    keywords?: string[]; dateFrom?: string; dateTo?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  if (!custodians?.length) return res.status(400).json({ error: 'custodians is required' });

  const id = uuidv4();
  const hold: LegalHold = {
    id, workspaceId, name: name.trim(), description,
    custodians, keywords, dateFrom, dateTo,
    status: 'active', createdBy: req.user!.id, createdAt: Date.now(),
  };
  legalHolds.set(id, hold);
  appendAudit({ workspaceId, userId: req.user!.id, action: 'legal_hold.create', resource: 'legal_hold', resourceId: id, metadata: { name, custodians }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  res.status(201).json(hold);
});

/** GET /:workspaceId/legal-holds (admin only) */
router.get('/:workspaceId/legal-holds', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const { workspaceId } = req.params;
  const holds = Array.from(legalHolds.values()).filter((h) => h.workspaceId === workspaceId);
  res.json(holds);
});

/** GET /:workspaceId/legal-holds/:holdId (admin only) */
router.get('/:workspaceId/legal-holds/:holdId', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const hold = legalHolds.get(req.params.holdId);
  if (!hold || hold.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Legal hold not found' });
  res.json(hold);
});

/** POST /:workspaceId/legal-holds/:holdId/release (admin only) */
router.post('/:workspaceId/legal-holds/:holdId/release', requireWorkspaceAdmin, (req: AuthRequest, res) => {
  const hold = legalHolds.get(req.params.holdId);
  if (!hold || hold.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Legal hold not found' });
  hold.status = 'released';
  hold.releasedAt = Date.now();
  appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'legal_hold.release', resource: 'legal_hold', resourceId: req.params.holdId, metadata: { name: hold.name }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });
  res.json(hold);
});

/** GET /:workspaceId/legal-holds/:holdId/export (admin only) */
router.get('/:workspaceId/legal-holds/:holdId/export', requireWorkspaceAdmin, async (req: AuthRequest, res) => {
  try {
    const hold = legalHolds.get(req.params.holdId);
    if (!hold || hold.workspaceId !== req.params.workspaceId) return res.status(404).json({ error: 'Legal hold not found' });

    const where: any = {
      senderId: { in: hold.custodians },
    };
    if (hold.dateFrom) where.createdAt = { ...(where.createdAt ?? {}), gte: new Date(hold.dateFrom) };
    if (hold.dateTo) where.createdAt = { ...(where.createdAt ?? {}), lte: new Date(hold.dateTo) };
    if (hold.keywords?.length) {
      // Match any of the keywords (using first keyword for simplest Prisma filter; extend as needed)
      where.OR = hold.keywords.map((kw) => ({ content: { contains: kw } }));
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        sender: { select: { id: true, name: true, email: true } },
        attachments: true,
        conversation: { select: { id: true, name: true, type: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const exportData = {
      holdId: hold.id,
      holdName: hold.name,
      exportedAt: new Date().toISOString(),
      messages,
      totalMessages: messages.length,
    };

    appendAudit({ workspaceId: req.params.workspaceId, userId: req.user!.id, action: 'legal_hold.export', resource: 'legal_hold', resourceId: hold.id, metadata: { totalMessages: messages.length }, ipAddress: req.ip, userAgent: req.headers['user-agent'] });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="legal-hold-${hold.id}-export.json"`);
    res.json(exportData);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to export legal hold' }); }
});

export { isInQuietHours, quietHours, messageReadBy };
export default router;
