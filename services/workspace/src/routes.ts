import { Router } from 'express';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest, requireRole } from './middleware/auth';
import { sendWorkspaceInviteEmail } from './services/email';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

// ── SCIM Router (no JWT auth — uses its own Bearer token) ──────────────────
export const scimRouter = Router();

function getPagination(req: any) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const createWorkspaceSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(30),
  description: z.string().optional(),
  industry: z.string().optional(),
  plan: z.string().optional(),
});

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.string().default('MEMBER'),
});

// ─── Guest Invite In-Memory Store ────────────────────────────────────────────
interface GuestInviteRecord {
  id: string; workspaceId: string; email: string;
  channels: string[]; expiresAt?: string;
  invitedBy: string; createdAt: string; revoked: boolean;
}
const guestInvites = new Map<string, GuestInviteRecord>();
const WORKSPACE_JWT_SECRET = process.env.JWT_SECRET || 'brixstac-dev-secret';

// ─── RBAC: Per-Channel Permissions (feature #53) ─────────────────────────────
interface ChannelPermissions {
  postMessages: 'all' | 'admins_only' | 'moderators_only';
  inviteMembers: 'all' | 'admins_only';
  pinMessages: 'all' | 'admins_only';
  deleteOthersMessages: 'admins_only';
  manageChannel: 'admins_only';
  readHistory: 'all' | 'members_only';
}

const DEFAULT_CHANNEL_PERMISSIONS: ChannelPermissions = {
  postMessages: 'all',
  inviteMembers: 'all',
  pinMessages: 'all',
  deleteOthersMessages: 'admins_only',
  manageChannel: 'admins_only',
  readHistory: 'all',
};

// Map key: channelId
const channelPermissions = new Map<string, { channelId: string; workspaceId: string; permissions: ChannelPermissions }>();

// Map key: channelId, value: Set of userId strings (moderators)
const channelModerators = new Map<string, Set<string>>();

// ─── SCIM Token validation helper ────────────────────────────────────────────
const SCIM_TOKEN = process.env.SCIM_TOKEN || process.env.JWT_SECRET || 'brixstac-dev-secret';

function validateScimToken(req: any, res: any): boolean {
  const authHeader = req.headers.authorization as string | undefined;
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== SCIM_TOKEN) {
    res.status(401).json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'],
      status: '401',
      detail: 'Unauthorized',
    });
    return false;
  }
  return true;
}

function toScimUser(user: any) {
  const nameParts = (user.name || '').split(' ');
  const givenName = nameParts[0] || '';
  const familyName = nameParts.slice(1).join(' ') || '';
  return {
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:User'],
    id: user.id,
    userName: user.email,
    name: { givenName, familyName, formatted: user.name },
    emails: [{ value: user.email, primary: true }],
    active: user.status === 'ACTIVE',
    meta: {
      resourceType: 'User',
      created: user.createdAt,
      lastModified: user.updatedAt,
      location: `/scim/v2/Users/${user.id}`,
    },
  };
}

// All workspace routes require authentication (except SCIM which uses Bearer token)
router.use(authenticateToken);

// ── List My Workspaces ──
router.get('/workspaces', async (req: AuthRequest, res) => {
  try {
    const memberships = await (prisma.workspaceMember as any).findMany({
      where: { userId: req.user!.id, status: 'ACTIVE' },
      include: {
        workspace: {
          include: {
            owner: { select: { id: true, name: true, email: true } },
            _count: { select: { members: true } },
          },
        },
      },
    });

    const validMemberships = memberships.filter((m: any) => m.workspace && !m.workspace.deletedAt);

    res.json(validMemberships.map((m: any) => ({
      ...m.workspace,
      myRole: m.role,
      memberCount: m.workspace._count.members,
    })));
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ error: 'Failed to load workspaces' });
  }
});

// ── Get Workspace by ID ──
router.get('/workspaces/:id', async (req: AuthRequest, res) => {
  try {
    const workspace = await prisma.workspace.findFirst({
      where: { id: req.params.id, deletedAt: null },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true, status: true } } },
        },
        _count: { select: { projects: true, teams: true } },
      },
    });

    if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }

    const membership = workspace.members.find((m) => m.userId === req.user!.id);
    if (!membership) { res.status(403).json({ error: 'Not a member of this workspace' }); return; }

    res.json({ ...workspace, myRole: membership.role });
  } catch (err) {
    console.error('Get workspace error:', err);
    res.status(500).json({ error: 'Failed to load workspace' });
  }
});

// ── Create Workspace ──
router.post('/workspaces', async (req: AuthRequest, res) => {
  try {
    const parsed = createWorkspaceSchema.parse(req.body);

    if (!/^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/.test(parsed.slug)) {
      res.status(400).json({ error: 'Slug must be 2-30 characters, lowercase alphanumeric with hyphens, and cannot start or end with a hyphen' });
      return;
    }

    const existing = await prisma.workspace.findFirst({ where: { slug: parsed.slug } });
    if (existing) { res.status(409).json({ error: 'Workspace slug already taken' }); return; }

    const workspace = await prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: parsed.name,
          slug: parsed.slug,
          description: parsed.description,
          industry: parsed.industry,
          plan: parsed.plan,
          ownerId: req.user!.id,
        },
      });

      await tx.workspaceMember.create({
        data: { workspaceId: ws.id, userId: req.user!.id, role: 'OWNER' },
      });

      return ws;
    });

    res.status(201).json(workspace);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    console.error('Create workspace error:', err);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// ── Update Workspace ──
router.patch('/workspaces/:id', async (req: AuthRequest, res) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, userId: req.user!.id },
  });

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    res.status(403).json({ error: 'Only owners and admins can update workspace' });
    return;
  }

  const allowedFields = ['name', 'description', 'industry', 'timezone', 'language', 'logo', 'require2FA', 'sessionTimeoutMinutes'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }

  const workspace = await prisma.workspace.update({ where: { id: req.params.id }, data });
  res.json(workspace);
});

// ── Delete Workspace ──
router.delete('/workspaces/:id', requireRole(['OWNER']), async (req: AuthRequest, res) => {
  const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });

  if (!workspace || workspace.ownerId !== req.user!.id) {
    res.status(403).json({ error: 'Only the workspace owner can delete it' });
    return;
  }

  await prisma.workspace.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ── Invite Member ──
router.post('/workspaces/:id/invites', async (req: AuthRequest, res) => {
  try {
    const parsed = inviteMemberSchema.parse(req.body);

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId: req.user!.id },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      res.status(403).json({ error: 'Not authorized to invite members' });
      return;
    }

    const workspace = await prisma.workspace.findUnique({ where: { id: req.params.id } });
    if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }

    const existingMember = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, user: { email: parsed.email } },
    });
    if (existingMember) { res.status(409).json({ error: 'User is already a member of this workspace' }); return; }

    const existingInvite = await prisma.workspaceInvite.findFirst({
      where: { workspaceId: req.params.id, email: parsed.email, status: 'PENDING' },
    });
    if (existingInvite) { res.status(409).json({ error: 'An invitation is already pending for this email' }); return; }

    const token = crypto.randomBytes(32).toString('hex');

    const invite = await prisma.workspaceInvite.create({
      data: {
        email: parsed.email,
        role: parsed.role,
        token,
        workspaceId: req.params.id,
        invitedById: req.user!.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await sendWorkspaceInviteEmail(parsed.email, req.user!.email, workspace.name, token);

    res.status(201).json(invite);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Failed to send invitation' });
  }
});

// ── List Members ──
router.get('/workspaces/:id/members', async (req: AuthRequest, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId: req.user!.id },
    });
    if (!membership) { res.status(403).json({ error: 'Not a member' }); return; }

    const { page, limit, skip } = getPagination(req);
    const [members, total] = await Promise.all([
      prisma.workspaceMember.findMany({
        where: { workspaceId: req.params.id },
        include: { user: { select: { id: true, name: true, email: true, avatar: true, status: true } } },
        orderBy: { joinedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.workspaceMember.count({ where: { workspaceId: req.params.id } }),
    ]);
    res.json({ members, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Failed to load members' });
  }
});

// ── List Invites ──
router.get('/workspaces/:id/invites', async (req: AuthRequest, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.id, userId: req.user!.id },
    });

    if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
      res.status(403).json({ error: 'Not authorized' });
      return;
    }

    const { page, limit, skip } = getPagination(req);

    const [invites, total] = await Promise.all([
      prisma.workspaceInvite.findMany({
        where: { workspaceId: req.params.id },
        include: { invitedBy: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.workspaceInvite.count({ where: { workspaceId: req.params.id } }),
    ]);

    res.json({ invites, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List invites error:', err);
    res.status(500).json({ error: 'Failed to load invites' });
  }
});

// ── Cancel Invite ──
router.delete('/workspaces/:id/invites/:inviteId', async (req: AuthRequest, res) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, userId: req.user!.id },
  });

  if (!membership || !['OWNER', 'ADMIN', 'MANAGER'].includes(membership.role)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  await prisma.workspaceInvite.update({
    where: { id: req.params.inviteId },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true });
});

// ── Accept Invite ──
router.post('/workspaces/invites/accept', async (req: AuthRequest, res) => {
  const { token } = req.body;

  const invite = await prisma.workspaceInvite.findFirst({
    where: { token, status: 'PENDING', expiresAt: { gt: new Date() } },
    include: { workspace: true },
  });

  if (!invite) { res.status(400).json({ error: 'Invalid or expired invitation' }); return; }

  if (invite.email !== req.user!.email) {
    res.status(403).json({ error: 'This invitation is for a different email address' });
    return;
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: req.user!.id, role: invite.role },
    }),
    prisma.workspaceInvite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    }),
  ]);

  res.json({ success: true, workspace: invite.workspace });
});

// ── Update Member Role ──
router.patch('/workspaces/:id/members/:memberId', async (req: AuthRequest, res) => {
  const { role } = req.body;

  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, userId: req.user!.id },
  });

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const targetMember = await prisma.workspaceMember.findUnique({ where: { id: req.params.memberId } });

  if (targetMember?.role === 'OWNER') {
    res.status(403).json({ error: 'Cannot change owner role' });
    return;
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: req.params.memberId },
    data: { role },
  });

  res.json(updated);
});

// ── Remove Member ──
router.delete('/workspaces/:id/members/:memberId', async (req: AuthRequest, res) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, userId: req.user!.id },
  });

  if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
    res.status(403).json({ error: 'Not authorized' });
    return;
  }

  const targetMember = await prisma.workspaceMember.findUnique({ where: { id: req.params.memberId } });

  if (targetMember?.role === 'OWNER') { res.status(403).json({ error: 'Cannot remove owner' }); return; }

  await prisma.workspaceMember.delete({ where: { id: req.params.memberId } });
  res.json({ success: true });
});

// ── Leave Workspace ──
router.post('/workspaces/:id/leave', async (req: AuthRequest, res) => {
  const membership = await prisma.workspaceMember.findFirst({
    where: { workspaceId: req.params.id, userId: req.user!.id },
  });

  if (!membership) { res.status(404).json({ error: 'Not a member of this workspace' }); return; }

  if (membership.role === 'OWNER') {
    res.status(400).json({ error: 'Owner cannot leave. Transfer ownership first or delete workspace.' });
    return;
  }

  await prisma.workspaceMember.delete({ where: { id: membership.id } });
  res.json({ success: true });
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// GUEST ACCESS
// ─── ═══════════════════════════════════════════════════════════════ ─────────

/** POST /workspaces/:workspaceId/guests/invite */
router.post('/workspaces/:workspaceId/guests/invite', async (req: AuthRequest, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Admin access required' }); return;
    }

    const { email, channels, expiresAt } = req.body as { email: string; channels: string[]; expiresAt?: string };
    if (!email || !channels?.length) { res.status(400).json({ error: 'email and channels are required' }); return; }

    const guestInviteId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const expTs = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : Math.floor(Date.now() / 1000) + 7 * 24 * 3600;

    const signedToken = jwt.sign(
      { guestInviteId, workspaceId: req.params.workspaceId, channels, email, exp: expTs },
      WORKSPACE_JWT_SECRET,
    );

    const invite: GuestInviteRecord = {
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

    res.status(201).json({
      inviteToken: signedToken,
      inviteUrl: `/join-guest?token=${signedToken}`,
      guestInviteId,
    });
  } catch (err) {
    console.error('Guest invite error:', err);
    res.status(500).json({ error: 'Failed to create guest invite' });
  }
});

/** GET /workspaces/:workspaceId/guests — list guest invites */
router.get('/workspaces/:workspaceId/guests', async (req: AuthRequest, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Admin access required' }); return;
    }

    const guests = Array.from(guestInvites.values())
      .filter((g) => g.workspaceId === req.params.workspaceId && !g.revoked);
    res.json(guests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list guests' });
  }
});

/** DELETE /workspaces/:workspaceId/guests/:userId — revoke guest access */
router.delete('/workspaces/:workspaceId/guests/:userId', async (req: AuthRequest, res) => {
  try {
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId: req.params.workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Admin access required' }); return;
    }

    const { workspaceId, userId } = req.params;
    let found = false;
    for (const invite of guestInvites.values()) {
      if (invite.workspaceId === workspaceId && (invite.id === userId || invite.email === userId)) {
        invite.revoked = true;
        found = true;
      }
    }

    // Also attempt to remove from DB members if stored there
    try {
      const deleted = await prisma.workspaceMember.deleteMany({ where: { workspaceId, userId } });
      if (deleted.count > 0) found = true;
    } catch {}

    if (!found) { res.status(404).json({ error: 'Guest not found' }); return; }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to revoke guest access' });
  }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// RBAC: Per-Channel Permissions  (feature #53)
// ─── ═══════════════════════════════════════════════════════════════ ─────────

// GET /workspaces/:id/channels/:channelId/permissions
router.get('/workspaces/:id/channels/:channelId/permissions', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId } = req.params;

    // Verify requester is a workspace member
    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.id },
    });
    if (!membership) { res.status(403).json({ error: 'Not a member of this workspace' }); return; }

    const stored = channelPermissions.get(channelId);
    res.json(stored ? stored.permissions : DEFAULT_CHANNEL_PERMISSIONS);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get channel permissions' });
  }
});

// PUT /workspaces/:id/channels/:channelId/permissions — requires OWNER or ADMIN
router.put('/workspaces/:id/channels/:channelId/permissions', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId } = req.params;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Only owners and admins can update channel permissions' }); return;
    }

    const existing = channelPermissions.get(channelId)?.permissions || { ...DEFAULT_CHANNEL_PERMISSIONS };
    const incoming = req.body as Partial<ChannelPermissions>;

    // Merge, but enforce immutable fields
    const updated: ChannelPermissions = {
      ...existing,
      ...incoming,
      deleteOthersMessages: 'admins_only', // always admin only — cannot be changed
      manageChannel: 'admins_only',        // always admin only — cannot be changed
    };

    channelPermissions.set(channelId, { channelId, workspaceId, permissions: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update channel permissions' });
  }
});

// GET /workspaces/:id/channels/:channelId/my-permissions — what can this user do?
router.get('/workspaces/:id/channels/:channelId/my-permissions', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId } = req.params;
    const userId = req.user!.id;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId },
    });
    if (!membership) { res.status(403).json({ error: 'Not a member of this workspace' }); return; }

    const perms = channelPermissions.get(channelId)?.permissions || { ...DEFAULT_CHANNEL_PERMISSIONS };
    const role = membership.role; // OWNER | ADMIN | MANAGER | MEMBER
    const isAdmin = role === 'OWNER' || role === 'ADMIN';
    const isModerator = channelModerators.get(channelId)?.has(userId) ?? false;

    function canDo(setting: string): boolean {
      if (setting === 'admins_only') return isAdmin;
      if (setting === 'moderators_only') return isAdmin || isModerator;
      if (setting === 'members_only') return true; // all workspace members
      return true; // 'all'
    }

    res.json({
      canPost: canDo(perms.postMessages),
      canInvite: canDo(perms.inviteMembers),
      canPin: canDo(perms.pinMessages),
      canDeleteOthers: isAdmin, // always admin only
      canManage: isAdmin,       // always admin only
      canRead: canDo(perms.readHistory),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user channel permissions' });
  }
});

// POST /workspaces/:id/channels/:channelId/moderators/:userId — add moderator (admin only)
router.post('/workspaces/:id/channels/:channelId/moderators/:userId', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId, userId: targetUserId } = req.params;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Only owners and admins can manage moderators' }); return;
    }

    // Verify target user is a workspace member
    const targetMembership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: targetUserId },
    });
    if (!targetMembership) { res.status(404).json({ error: 'User is not a member of this workspace' }); return; }

    if (!channelModerators.has(channelId)) {
      channelModerators.set(channelId, new Set());
    }
    channelModerators.get(channelId)!.add(targetUserId);

    res.json({ success: true, channelId, userId: targetUserId, role: 'moderator' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add moderator' });
  }
});

// DELETE /workspaces/:id/channels/:channelId/moderators/:userId — remove moderator (admin only)
router.delete('/workspaces/:id/channels/:channelId/moderators/:userId', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId, userId: targetUserId } = req.params;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.id },
    });
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      res.status(403).json({ error: 'Only owners and admins can manage moderators' }); return;
    }

    const mods = channelModerators.get(channelId);
    if (!mods || !mods.has(targetUserId)) {
      res.status(404).json({ error: 'User is not a moderator of this channel' }); return;
    }

    mods.delete(targetUserId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove moderator' });
  }
});

// GET /workspaces/:id/channels/:channelId/moderators — list moderators
router.get('/workspaces/:id/channels/:channelId/moderators', async (req: AuthRequest, res) => {
  try {
    const { id: workspaceId, channelId } = req.params;

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: req.user!.id },
    });
    if (!membership) { res.status(403).json({ error: 'Not a member of this workspace' }); return; }

    const mods = channelModerators.get(channelId);
    const moderatorIds = mods ? Array.from(mods) : [];

    // Fetch user details for each moderator
    const moderators = moderatorIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: moderatorIds } },
          select: { id: true, name: true, email: true, avatar: true },
        })
      : [];

    res.json({ channelId, moderators });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list moderators' });
  }
});

// ─── ═══════════════════════════════════════════════════════════════ ─────────
// SCIM 2.0 Provisioning  (feature #57)
// Note: SCIM uses its own Bearer token auth, not the workspace JWT.
// The router.use(authenticateToken) above applies to /workspaces/* paths only;
// SCIM routes use the validateScimToken helper instead.
// ─── ═══════════════════════════════════════════════════════════════ ─────────

// GET /scim/v2/ServiceProviderConfig
scimRouter.get('/v2/ServiceProviderConfig', (req, res) => {
  res.json({
    schemas: ['urn:ietf:params:scim:schemas:core:2.0:ServiceProviderConfig'],
    documentationUri: 'https://brixstac.io/docs/scim',
    patch: { supported: true },
    bulk: { supported: false, maxOperations: 0, maxPayloadSize: 0 },
    filter: { supported: false, maxResults: 200 },
    changePassword: { supported: false },
    sort: { supported: false },
    etag: { supported: false },
    authenticationSchemes: [
      {
        type: 'oauthbearertoken',
        name: 'OAuth Bearer Token',
        description: 'Authentication scheme using the OAuth Bearer Token standard',
      },
    ],
    meta: {
      resourceType: 'ServiceProviderConfig',
      location: '/scim/v2/ServiceProviderConfig',
    },
  });
});

// GET /scim/v2/Users — list all users (SCIM ListResponse)
scimRouter.get('/v2/Users', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
    });

    res.json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: users.length,
      startIndex: 1,
      itemsPerPage: users.length,
      Resources: users.map(toScimUser),
    });
  } catch (err) {
    console.error('SCIM list users error:', err);
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Internal server error' });
  }
});

// GET /scim/v2/Users/:id — single user in SCIM format
scimRouter.get('/v2/Users/:id', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
    });

    if (!user) {
      res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }); return;
    }

    res.json(toScimUser(user));
  } catch (err) {
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Internal server error' });
  }
});

// POST /scim/v2/Users — provision a new user
scimRouter.post('/v2/Users', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    const { userName, name, emails, active } = req.body;
    const email = userName || emails?.[0]?.value;
    if (!email) {
      res.status(400).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '400', detail: 'userName (email) is required' }); return;
    }

    const givenName = name?.givenName || '';
    const familyName = name?.familyName || '';
    const fullName = name?.formatted || [givenName, familyName].filter(Boolean).join(' ') || email;

    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      res.status(409).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '409', detail: 'User already exists' }); return;
    }

    const { createHash, randomBytes, scryptSync } = await import('crypto');
    // Use scrypt (built-in) instead of bcryptjs to avoid extra dependency
    const salt = randomBytes(16).toString('hex');
    const randomPassword = salt + ':' + scryptSync(randomBytes(32).toString('hex'), salt, 64).toString('hex');

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: fullName,
        password: randomPassword,
        emailVerified: true, // SCIM-provisioned users are pre-verified
        status: (active === false) ? 'DEACTIVATED' : 'ACTIVE',
      },
      select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
    });

    res.status(201).json(toScimUser(user));
  } catch (err) {
    console.error('SCIM create user error:', err);
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Failed to provision user' });
  }
});

// PUT /scim/v2/Users/:id — replace user attributes
scimRouter.put('/v2/Users/:id', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    const { userName, name, emails, active } = req.body;
    const email = userName || emails?.[0]?.value;

    const givenName = name?.givenName || '';
    const familyName = name?.familyName || '';
    const fullName = name?.formatted || [givenName, familyName].filter(Boolean).join(' ');

    const updateData: any = {};
    if (fullName) updateData.name = fullName;
    if (email) updateData.email = email.toLowerCase();
    if (active !== undefined) updateData.status = active ? 'ACTIVE' : 'DEACTIVATED';

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
    });

    res.json(toScimUser(user));
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }); return;
    }
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Failed to update user' });
  }
});

// PATCH /scim/v2/Users/:id — partial update using SCIM Operations format
scimRouter.patch('/v2/Users/:id', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    const { Operations } = req.body;
    if (!Array.isArray(Operations)) {
      res.status(400).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '400', detail: 'Operations array required' }); return;
    }

    const updateData: any = {};

    for (const op of Operations) {
      const { op: operation, path, value } = op;
      if (operation === 'replace' || operation === 'add') {
        if (path === 'active' || (typeof value === 'object' && value !== null && 'active' in value)) {
          const activeVal = path === 'active' ? value : value.active;
          updateData.status = activeVal ? 'ACTIVE' : 'DEACTIVATED';
        }
        if (path === 'userName') updateData.email = value.toLowerCase();
        if (path === 'name.givenName' || path === 'name.familyName' || path === 'name') {
          // For simplicity, if formatted name is provided use it
          if (typeof value === 'object' && value.formatted) updateData.name = value.formatted;
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      // Nothing to update — return current user
      const user = await prisma.user.findUnique({
        where: { id: req.params.id },
        select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
      });
      if (!user) { res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }); return; }
      res.json(toScimUser(user));
      return;
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true, status: true, createdAt: true, updatedAt: true },
    });

    res.json(toScimUser(user));
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }); return;
    }
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Failed to patch user' });
  }
});

// DELETE /scim/v2/Users/:id — deprovision user
scimRouter.delete('/v2/Users/:id', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    // Remove from all workspaces
    await prisma.workspaceMember.deleteMany({ where: { userId: req.params.id } });

    // Soft-delete the user
    await prisma.user.update({
      where: { id: req.params.id },
      data: { status: 'DEACTIVATED', deletedAt: new Date() },
    });

    res.status(204).send();
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '404', detail: 'User not found' }); return;
    }
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Failed to deprovision user' });
  }
});

// GET /scim/v2/Groups — return workspace roles as SCIM Groups
scimRouter.get('/v2/Groups', async (req, res) => {
  if (!validateScimToken(req, res)) return;
  try {
    // Return system roles as SCIM groups
    const roles = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
    const groups = roles.map((role, idx) => ({
      schemas: ['urn:ietf:params:scim:schemas:core:2.0:Group'],
      id: `role-${role.toLowerCase()}`,
      displayName: role,
      members: [],
      meta: {
        resourceType: 'Group',
        location: `/scim/v2/Groups/role-${role.toLowerCase()}`,
      },
    }));

    res.json({
      schemas: ['urn:ietf:params:scim:api:messages:2.0:ListResponse'],
      totalResults: groups.length,
      startIndex: 1,
      itemsPerPage: groups.length,
      Resources: groups,
    });
  } catch (err) {
    res.status(500).json({ schemas: ['urn:ietf:params:scim:api:messages:2.0:Error'], status: '500', detail: 'Internal server error' });
  }
});

export default router;
