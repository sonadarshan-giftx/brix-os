import { Router } from 'express';
import { prisma } from './utils/prisma';
import { authenticateToken, AuthRequest } from './middleware/auth';

const router = Router();
router.use(authenticateToken);

// ── Get My Subscription ──
router.get('/billing', async (req: AuthRequest, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user!.id },
    include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
  });

  if (!subscription) { res.json(null); return; }
  res.json(subscription);
});

// ── Get Plans ──
router.get('/billing/plans', async (req: AuthRequest, res) => {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      priceUnit: 'free forever',
      description: 'For small teams getting started',
      features: [
        'Up to 5 team members',
        '3 active projects',
        '1,000 API calls/mo',
        'Basic AI agents',
        'Community support',
      ],
      limits: { seats: 5, storageGB: 1, apiCalls: 1000, aiTokens: 100000 },
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29,
      priceUnit: 'per user / month',
      description: 'For growing teams that need more power',
      features: [
        'Unlimited team members',
        'Unlimited projects',
        '100,000 API calls/mo',
        'Advanced AI agents',
        'Priority support',
        'Custom integrations',
        'SSO & SAML',
        'Audit logs',
      ],
      limits: { seats: -1, storageGB: 100, apiCalls: 100000, aiTokens: 2000000 },
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: null,
      priceUnit: 'Custom pricing',
      description: 'For large organizations with advanced needs',
      features: [
        'Everything in Pro',
        'Dedicated support',
        'Custom AI model training',
        'On-premise deployment option',
        'Advanced security & compliance',
        'SLA guarantees',
        'Custom contracts',
      ],
      limits: { seats: -1, storageGB: -1, apiCalls: -1, aiTokens: -1 },
    },
  ];

  res.json(plans);
});

// ── Create Subscription (Stripe pattern) ──
router.post('/billing/checkout', async (req: AuthRequest, res) => {
  const { plan, workspaceId } = req.body;

  const subscription = await prisma.subscription.create({
    data: {
      userId: req.user!.id,
      workspaceId: workspaceId || null,
      plan: plan === 'starter' ? 'STARTER' : plan === 'pro' ? 'PRO' : 'ENTERPRISE',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  res.status(201).json({
    subscription,
    message: 'Subscription activated (Stripe integration pending)',
  });
});

// ── Cancel Subscription ──
router.post('/billing/cancel', async (req: AuthRequest, res) => {
  const subscription = await prisma.subscription.findFirst({
    where: { userId: req.user!.id, status: 'ACTIVE' },
  });

  if (!subscription) { res.status(404).json({ error: 'No active subscription found' }); return; }

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: 'CANCELLED', cancelAtPeriodEnd: true },
  });

  res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' });
});

// ── GET /billing/subscription — alias for GET /billing ──
router.get('/billing/subscription', async (req: AuthRequest, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user!.id },
      include: { invoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!subscription) {
      // Return a sensible default for teams without a subscription
      return res.json({
        plan: 'STARTER', status: 'ACTIVE',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        cancelAtPeriodEnd: false,
        stripeConfigured: !!process.env.STRIPE_SECRET_KEY,
        invoices: [],
      });
    }
    res.json({ ...subscription, stripeConfigured: !!process.env.STRIPE_SECRET_KEY });
  } catch { res.json({ plan: 'STARTER', status: 'ACTIVE', stripeConfigured: false, invoices: [] }); }
});

// ── PUT /billing/subscription — upgrade/downgrade plan ──
router.put('/billing/subscription', async (req: AuthRequest, res) => {
  const { planId } = req.body;
  if (!planId) { res.status(400).json({ error: 'planId required' }); return; }
  try {
    const existing = await prisma.subscription.findFirst({ where: { userId: req.user!.id } });
    const planEnum = planId === 'starter' ? 'STARTER' : planId === 'pro' ? 'PRO' : 'ENTERPRISE';
    if (existing) {
      const updated = await prisma.subscription.update({ where: { id: existing.id }, data: { plan: planEnum } });
      return res.json({ success: true, subscription: updated, message: `Plan updated to ${planId}${process.env.STRIPE_SECRET_KEY ? '' : ' (Stripe integration pending)'}` });
    }
    const created = await prisma.subscription.create({ data: { userId: req.user!.id, plan: planEnum, status: 'ACTIVE', currentPeriodStart: new Date(), currentPeriodEnd: new Date(Date.now() + 30 * 86_400_000) } });
    res.status(201).json({ success: true, subscription: created });
  } catch (e) { res.status(500).json({ error: 'Failed to update plan' }); }
});

// ── POST /billing/subscription/cancel — cancel plan ──
router.post('/billing/subscription/cancel', async (req: AuthRequest, res) => {
  try {
    const sub = await prisma.subscription.findFirst({ where: { userId: req.user!.id, status: 'ACTIVE' } });
    if (!sub) { return res.json({ success: true, message: 'No active subscription to cancel.' }); }
    await prisma.subscription.update({ where: { id: sub.id }, data: { status: 'CANCELLED', cancelAtPeriodEnd: true } });
    res.json({ success: true, message: 'Subscription cancelled. Access continues until period end.' });
  } catch { res.status(500).json({ error: 'Failed to cancel subscription' }); }
});

// ── GET /billing/invoices — list invoices ──
router.get('/billing/invoices', async (req: AuthRequest, res) => {
  try {
    const sub = await prisma.subscription.findFirst({ where: { userId: req.user!.id }, include: { invoices: { orderBy: { createdAt: 'desc' }, take: 24 } } });
    if (!sub) return res.json([]);
    res.json(sub.invoices || []);
  } catch { res.json([]); }
});

export default router;
