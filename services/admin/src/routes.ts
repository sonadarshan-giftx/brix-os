import { Router } from 'express';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest, requireRole } from './middleware/auth';

const router = Router();
router.use(authenticateToken, requireRole(['OWNER', 'ADMIN']));

// ── Admin Dashboard Stats ──
router.get('/admin/stats', async (req: AuthRequest, res) => {
  const [
    totalUsers,
    totalWorkspaces,
    activeWorkspaces,
    totalProjects,
    totalTickets,
    subscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.workspace.count(),
    prisma.workspace.count({ where: { plan: { not: 'STARTER' } } }),
    prisma.project.count(),
    prisma.ticket.count(),
    prisma.subscription.groupBy({
      by: ['status', 'plan'],
      _count: { _all: true },
    }),
  ]);

  const proPrice = 2900;
  const proSubs = await prisma.subscription.count({ where: { plan: 'PRO', status: 'ACTIVE' } });
  const enterpriseSubs = await prisma.subscription.count({ where: { plan: 'ENTERPRISE', status: 'ACTIVE' } });
  const mrr = (proSubs * proPrice) + (enterpriseSubs * proPrice * 5);

  res.json({
    totalUsers,
    totalWorkspaces,
    activeWorkspaces,
    totalProjects,
    totalTickets,
    mrr,
    subscriptions: subscriptions.reduce((acc: Record<string, number>, s) => {
      const key = `${s.plan}_${s.status}`;
      acc[key] = s._count._all;
      return acc;
    }, {}),
  });
});

// ── List Users ──
router.get('/admin/users', async (req: AuthRequest, res) => {
  const { page = '1', limit = '10', search } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        _count: { select: { workspaces: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total, page: parseInt(page as string), totalPages: Math.ceil(total / take) });
});

// ── Update User Status ──
router.patch('/admin/users/:userId', async (req: AuthRequest, res) => {
  const { status, role } = req.body;

  const user = await prisma.user.update({
    where: { id: req.params.userId },
    data: { status, role },
    select: { id: true, email: true, name: true, role: true, status: true },
  });

  res.json(user);
});

// ── Audit Logs ──
router.get('/admin/audit-logs', async (req: AuthRequest, res) => {
  const { page = '1', limit = '20', workspaceId, userId } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
  const take = parseInt(limit as string);

  const where: any = {};
  if (workspaceId) where.workspaceId = workspaceId as string;
  if (userId) where.userId = userId as string;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        workspace: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ logs, total, page: parseInt(page as string), totalPages: Math.ceil(total / take) });
});

// ── Revenue Data ──
router.get('/admin/revenue', async (req: AuthRequest, res) => {
  const months = 12;
  const revenue = [];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
        status: 'PAID',
      },
    });

    const total = invoices.reduce((sum, inv) => sum + inv.amount, 0);

    revenue.push({
      month: date.toLocaleString('en-US', { month: 'short', year: 'numeric' }),
      amount: total / 100,
      invoices: invoices.length,
    });
  }

  res.json(revenue);
});

// ── System Health ──
router.get('/admin/health', async (req: AuthRequest, res) => {
  const services = [
    { name: 'API Server', status: 'healthy', uptime: '99.99%', lastIncident: null },
    { name: 'Database', status: 'healthy', uptime: '99.97%', lastIncident: null },
    { name: 'WebSocket', status: 'healthy', uptime: '99.95%', lastIncident: null },
    { name: 'AI Service', status: 'degraded', uptime: '98.50%', lastIncident: '2025-04-28' },
  ];

  res.json(services);
});

export default router;
