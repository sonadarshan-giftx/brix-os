import { Router } from 'express';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authenticateToken);

function getPagination(req: any) {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(10).toUpperCase(),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budgetTotal: z.number().optional(),
});

async function requireWorkspaceMember(req: AuthRequest, res: any, next: any) {
  try {
    const workspaceId = req.params.workspaceId;
    const [member, workspace] = await Promise.all([
      prisma.workspaceMember.findFirst({
        where: { workspaceId, userId: req.user!.id, status: 'ACTIVE' },
      }),
      prisma.workspace.findFirst({
        where: { id: workspaceId, deletedAt: null },
      }),
    ]);
    if (!member || !workspace) {
      return res.status(403).json({ error: 'Workspace not found or access denied' });
    }
    next();
  } catch (err) {
    console.error('Workspace member check error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

// ── List Projects ──
router.get('/:workspaceId/projects', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { workspaceId: req.params.workspaceId, deletedAt: null },
        include: {
          creator: { select: { id: true, name: true } },
          _count: { select: { tickets: true, sprints: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: { workspaceId: req.params.workspaceId, deletedAt: null } }),
    ]);
    res.json({ projects, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

// ── Get Project ──
router.get('/:workspaceId/projects/:projectId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const project = await prisma.project.findFirst({
    where: { id: req.params.projectId, workspaceId: req.params.workspaceId },
    include: {
      creator: { select: { id: true, name: true } },
      tickets: {
        include: { assignee: { select: { id: true, name: true, avatar: true } } },
      },
      sprints: true,
      activities: { orderBy: { createdAt: 'desc' }, take: 20 },
      _count: { select: { tickets: true } },
    },
  });

  if (!project) { res.status(404).json({ error: 'Project not found' }); return; }
  res.json(project);
});

// ── Create Project ──
router.post('/:workspaceId/projects', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const parsed = createProjectSchema.parse(req.body);

    const existing = await prisma.project.findFirst({
      where: { workspaceId: req.params.workspaceId, key: parsed.key },
    });
    if (existing) { res.status(409).json({ error: 'Project key already exists in this workspace' }); return; }

    const project = await prisma.project.create({
      data: {
        ...parsed,
        workspaceId: req.params.workspaceId,
        creatorId: req.user!.id,
      },
    });

    res.status(201).json(project);
  } catch (err: any) {
    if (err.name === 'ZodError') { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// ── Update Project ──
router.patch('/:workspaceId/projects/:projectId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const allowedFields = ['name', 'description', 'status', 'health', 'budgetTotal', 'budgetSpent', 'startDate', 'endDate'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }

  const project = await prisma.project.update({ where: { id: req.params.projectId }, data });
  res.json(project);
});

// ── Delete Project ──
router.delete('/:workspaceId/projects/:projectId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    await prisma.project.update({
      where: { id: req.params.projectId },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// ── List Tickets ──
router.get('/:workspaceId/tickets', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { projectId, status, assigneeId, search } = req.query;
    const { page, limit, skip } = getPagination(req);

    const where: any = {
      project: { workspaceId: req.params.workspaceId, deletedAt: null },
      deletedAt: null,
    };
    if (projectId) where.projectId = projectId as string;
    if (status) where.status = status as string;
    if (assigneeId) where.assigneeId = assigneeId as string;
    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
          creator: { select: { id: true, name: true } },
          sprint: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    res.json({ tickets, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List tickets error:', err);
    res.status(500).json({ error: 'Failed to load tickets' });
  }
});

// ── Get Ticket ──
router.get('/:workspaceId/tickets/:ticketId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: req.params.ticketId,
      project: { workspaceId: req.params.workspaceId },
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
      sprint: true,
      project: { select: { id: true, name: true, key: true } },
    },
  });

  if (!ticket) { res.status(404).json({ error: 'Ticket not found' }); return; }
  res.json(ticket);
});

// ── Create Ticket ──
router.post('/:workspaceId/projects/:projectId/tickets', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, priority, points, assigneeId, dueDate } = req.body;

    const count = await prisma.ticket.count({ where: { projectId: req.params.projectId } });
    const key = `${req.params.projectId.slice(-3).toUpperCase()}-${count + 1}`;

    const ticket = await prisma.ticket.create({
      data: {
        key,
        title,
        description,
        type: type || 'TASK',
        priority: priority || 'MEDIUM',
        points: points || 0,
        projectId: req.params.projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user!.id,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// ── Update Ticket ──
router.patch('/:workspaceId/tickets/:ticketId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const allowedFields = ['title', 'description', 'type', 'status', 'priority', 'points', 'assigneeId', 'sprintId', 'dueDate'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      data[key] = key === 'dueDate' ? new Date(req.body[key]) : req.body[key];
    }
  }

  const ticket = await prisma.ticket.update({ where: { id: req.params.ticketId }, data });
  res.json(ticket);
});

// ── Delete Ticket ──
router.delete('/:workspaceId/tickets/:ticketId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    await prisma.ticket.update({
      where: { id: req.params.ticketId },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete ticket error:', err);
    res.status(500).json({ error: 'Failed to delete ticket' });
  }
});

// ── List Sprints ──
router.get('/:workspaceId/projects/:projectId/sprints', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const sprints = await prisma.sprint.findMany({
      where: { projectId: req.params.projectId, deletedAt: null },
      include: { _count: { select: { tickets: true } } },
      orderBy: { startDate: 'desc' },
    });
    res.json(sprints);
  } catch (err) {
    console.error('List sprints error:', err);
    res.status(500).json({ error: 'Failed to load sprints' });
  }
});

// ── Create Sprint ──
router.post('/:workspaceId/projects/:projectId/sprints', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { name, goal, startDate, endDate } = req.body;

  const sprint = await prisma.sprint.create({
    data: {
      name,
      goal,
      projectId: req.params.projectId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  res.status(201).json(sprint);
});

// ── List Approvals ──
router.get('/:workspaceId/approvals', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { status, type } = req.query;
  const where: any = { workspaceId: req.params.workspaceId };
  if (status) where.status = status;
  if (type) where.type = type;

  const approvals = await prisma.approval.findMany({
    where,
    include: {
      requester: { select: { id: true, name: true, avatar: true } },
      reviewer: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(approvals);
});

// ── Get Approval ──
router.get('/:workspaceId/approvals/:approvalId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const approval = await prisma.approval.findFirst({
    where: { id: req.params.approvalId, workspaceId: req.params.workspaceId },
    include: {
      requester: { select: { id: true, name: true, avatar: true } },
      reviewer: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!approval) { res.status(404).json({ error: 'Approval not found' }); return; }
  res.json(approval);
});

// ── Create Approval ──
router.post('/:workspaceId/approvals', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { title, description, type, priority, amount, dueDate } = req.body;

  const approval = await prisma.approval.create({
    data: {
      title,
      description,
      type: type || 'GENERAL',
      priority: priority || 'MEDIUM',
      amount: amount || null,
      workspaceId: req.params.workspaceId,
      requesterId: req.user!.id,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  });

  res.status(201).json(approval);
});

// ── Review Approval ──
router.patch('/:workspaceId/approvals/:approvalId/review', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { decision, reason } = req.body;

  if (!['APPROVED', 'REJECTED', 'ESCALATED'].includes(decision)) {
    res.status(400).json({ error: 'Invalid decision' });
    return;
  }

  const approval = await prisma.approval.update({
    where: { id: req.params.approvalId },
    data: {
      status: decision,
      reviewerId: req.user!.id,
      decidedAt: new Date(),
      decision: reason || null,
    },
    include: {
      requester: { select: { id: true, name: true } },
      reviewer: { select: { id: true, name: true } },
    },
  });

  res.json(approval);
});

// ── List Meetings ──
router.get('/:workspaceId/meetings', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const where: any = { workspaceId: req.params.workspaceId };
  if (startDate && endDate) {
    where.startTime = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
  }

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(meetings);
});

// ── Get Meeting ──
router.get('/:workspaceId/meetings/:meetingId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const meeting = await prisma.meeting.findFirst({
    where: { id: req.params.meetingId, workspaceId: req.params.workspaceId },
    include: {
      attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
  });

  if (!meeting) { res.status(404).json({ error: 'Meeting not found' }); return; }
  res.json(meeting);
});

// ── Create Meeting ──
router.post('/:workspaceId/meetings', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, startTime, endTime, timezone, attendeeIds } = req.body;

    const meeting = await prisma.$transaction(async (tx) => {
      const mtg = await tx.meeting.create({
        data: {
          title,
          description,
          type: type || 'STANDUP',
          workspaceId: req.params.workspaceId,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          timezone: timezone || 'UTC',
        },
      });

      if (attendeeIds && attendeeIds.length > 0) {
        await tx.meetingAttendee.createMany({
          data: attendeeIds.map((userId: string) => ({ meetingId: mtg.id, userId, status: 'INVITED' })),
        });
      }

      await tx.meetingAttendee.create({
        data: { meetingId: mtg.id, userId: req.user!.id, status: 'ACCEPTED' },
      });

      return mtg;
    });

    res.status(201).json(meeting);
  } catch (err) {
    console.error('Create meeting error:', err);
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// ── Update Meeting ──
router.patch('/:workspaceId/meetings/:meetingId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const allowedFields = ['title', 'description', 'type', 'status', 'startTime', 'endTime', 'timezone', 'meetingUrl', 'recordingUrl', 'transcript'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      data[key] = ['startTime', 'endTime'].includes(key) ? new Date(req.body[key]) : req.body[key];
    }
  }

  const meeting = await prisma.meeting.update({ where: { id: req.params.meetingId }, data });
  res.json(meeting);
});

// ── Delete Meeting ──
router.delete('/:workspaceId/meetings/:meetingId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    await prisma.meeting.update({
      where: { id: req.params.meetingId },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete meeting error:', err);
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// ── Update Attendee Status ──
router.patch('/:workspaceId/meetings/:meetingId/attendees', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { status } = req.body;

  const attendee = await prisma.meetingAttendee.updateMany({
    where: { meetingId: req.params.meetingId, userId: req.user!.id },
    data: { status, joinedAt: status === 'ATTENDED' ? new Date() : undefined },
  });

  res.json(attendee);
});

// ── Calendar Events ──
router.get('/:workspaceId/calendar', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const { startDate, endDate } = req.query;
  const where: any = { workspaceId: req.params.workspaceId };
  if (startDate && endDate) {
    where.startTime = { gte: new Date(startDate as string), lte: new Date(endDate as string) };
  }

  const events = await prisma.calendarEvent.findMany({
    where,
    include: {
      attendees: { include: { user: { select: { id: true, name: true, avatar: true } } } },
    },
    orderBy: { startTime: 'asc' },
  });

  res.json(events);
});

// ── Create Calendar Event ──
router.post('/:workspaceId/calendar', requireWorkspaceMember, async (req: AuthRequest, res) => {
  try {
    const { title, description, type, startTime, endTime, allDay, timezone, recurrence, projectId, attendeeIds } = req.body;

    const event = await prisma.$transaction(async (tx) => {
      const evt = await tx.calendarEvent.create({
        data: {
          title,
          description,
          type: type || 'EVENT',
          workspaceId: req.params.workspaceId,
          startTime: new Date(startTime),
          endTime: endTime ? new Date(endTime) : null,
          timezone: timezone || 'UTC',
          allDay: allDay || false,
          recurrence,
          projectId: projectId || null,
        },
      });

      if (attendeeIds && attendeeIds.length > 0) {
        await tx.eventAttendee.createMany({
          data: attendeeIds.map((userId: string) => ({ eventId: evt.id, userId, status: 'INVITED' })),
        });
      }

      return evt;
    });

    res.status(201).json(event);
  } catch (err) {
    console.error('Create calendar event error:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// ── Update Calendar Event ──
router.patch('/:workspaceId/calendar/:eventId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  const allowedFields = ['title', 'description', 'type', 'startTime', 'endTime', 'allDay', 'timezone', 'recurrence', 'status'];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      data[key] = ['startTime', 'endTime'].includes(key) ? new Date(req.body[key]) : req.body[key];
    }
  }

  const event = await prisma.calendarEvent.update({ where: { id: req.params.eventId }, data });
  res.json(event);
});

// ── Delete Calendar Event ──
router.delete('/:workspaceId/calendar/:eventId', requireWorkspaceMember, async (req: AuthRequest, res) => {
  await prisma.calendarEvent.delete({ where: { id: req.params.eventId } });
  res.json({ success: true });
});

export default router;
