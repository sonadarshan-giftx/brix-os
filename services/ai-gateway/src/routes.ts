/**
 * routes.ts — All AI Gateway API routes
 * POST /ai/chat         — Send message to configured LLM
 * GET  /ai/agents       — List AI agents
 * POST /ai/agents       — Create agent
 * PATCH /ai/agents/:id  — Update agent
 * DELETE /ai/agents/:id — Delete agent
 * GET  /ai/agents/:id/stats — Agent usage stats
 * GET  /ai/usage        — Workspace usage stats
 * GET  /ai/models       — Available LLM models
 * POST /ai/policies     — Create safety policy
 * GET  /ai/audit        — Audit log
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z }             from 'zod';
import { getProvider }   from './providers';
import { runSafetyChecks } from './safety';
import { calculateCost, getAvailableModels, aggregateCosts } from './costs';
import { dataStore }     from './index';

const router = Router();

// ── Validation helpers ────────────────────────────────────────────────────────

function validate<T>(schema: z.ZodSchema<T>, body: unknown, res: Response): T | null {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return null;
  }
  return parsed.data;
}

// ── POST /ai/chat ─────────────────────────────────────────────────────────────

const ChatSchema = z.object({
  model:       z.string().min(1),
  messages:    z.array(z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string() })).min(1),
  agentId:     z.string().optional(),
  workspaceId: z.string().min(1),
  maxTokens:   z.number().min(1).max(32000).optional().default(1024),
  action:      z.string().optional().default('chat'),
});

router.post('/chat', async (req: Request, res: Response) => {
  const body = validate(ChatSchema, req.body, res);
  if (!body) return;

  const agent = body.agentId ? dataStore.agents.find(a => a.id === body.agentId) : null;

  // Safety checks
  const safety = runSafetyChecks({
    agentId:         body.agentId ?? 'anonymous',
    action:          body.action,
    messages:        body.messages as Array<{ role: string; content: string }>,
    maxTokens:       body.maxTokens,
    tokensUsedToday: agent?.tokensUsedToday ?? 0,
    dailyTokenLimit: agent?.dailyTokenLimit ?? 0,
    blockedActions:  agent?.blockedActions  ?? [],
    maxPerMinute:    20,
    maxPerHour:      200,
  });

  if (!safety.allowed) {
    const record = buildUsageRecord(body as any, agent?.id, 0, 0, 0, 'blocked', body.action);
    dataStore.usageRecords.push(record);
    dataStore.auditLog.push(buildAuditEntry('chat_blocked', body.workspaceId, body.agentId, safety.reason, 'blocked'));
    return res.status(403).json({ error: 'Request blocked by safety policy', reason: safety.reason, category: safety.category });
  }

  // Build messages with agent system prompt
  const messages = [...body.messages] as any[];
  const systemPrompt = agent?.systemPrompt;

  try {
    const provider  = getProvider(body.model);
    const llmResult = await provider.chat({
      model:       body.model,
      messages,
      maxTokens:   body.maxTokens,
      systemPrompt,
    });

    const cost = calculateCost(body.model, llmResult.inputTokens, llmResult.outputTokens);

    // Update agent stats
    if (agent) {
      agent.tokensUsedToday += llmResult.inputTokens + llmResult.outputTokens;
      agent.totalCost       += cost;
    }

    // Record usage
    const record = buildUsageRecord(
      body as any, agent?.id,
      llmResult.inputTokens, llmResult.outputTokens, cost,
      'success', body.action, llmResult.latencyMs,
    );
    dataStore.usageRecords.push(record);
    dataStore.auditLog.push(buildAuditEntry('chat_success', body.workspaceId, body.agentId, undefined, 'success'));

    return res.json({
      response:  llmResult.content,
      tokens:    { input: llmResult.inputTokens, output: llmResult.outputTokens, total: llmResult.inputTokens + llmResult.outputTokens },
      cost,
      latency:   llmResult.latencyMs,
      modelUsed: llmResult.model,
      provider:  llmResult.provider,
      mock:      llmResult.mock ?? false,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    const record = buildUsageRecord(body as any, agent?.id, 0, 0, 0, 'error', body.action);
    dataStore.usageRecords.push(record);
    dataStore.auditLog.push(buildAuditEntry('chat_error', body.workspaceId, body.agentId, errMsg, 'error'));
    return res.status(502).json({ error: 'LLM provider error', details: errMsg });
  }
});

// ── GET /ai/agents ────────────────────────────────────────────────────────────

router.get('/agents', (req: Request, res: Response) => {
  const { workspaceId } = req.query;
  const agents = workspaceId
    ? dataStore.agents.filter(a => a.workspaceId === workspaceId)
    : dataStore.agents;
  res.json({ agents, total: agents.length });
});

// ── POST /ai/agents ───────────────────────────────────────────────────────────

const CreateAgentSchema = z.object({
  workspaceId:         z.string().min(1),
  name:                z.string().min(1).max(100),
  role:                z.string().min(1),
  model:               z.string().min(1),
  personality:         z.string().optional().default('professional'),
  systemPrompt:        z.string().optional().default('You are a helpful AI assistant.'),
  capabilities:        z.array(z.string()).optional().default([]),
  dailyTokenLimit:     z.number().min(0).optional().default(100000),
  requireApprovalFor:  z.array(z.string()).optional().default([]),
  blockedActions:      z.array(z.string()).optional().default([]),
});

router.post('/agents', (req: Request, res: Response) => {
  const body = validate(CreateAgentSchema, req.body, res);
  if (!body) return;

  const agent = {
    id:                  uuidv4(),
    workspaceId:         body.workspaceId,
    name:                body.name,
    role:                body.role,
    model:               body.model,
    personality:         body.personality,
    systemPrompt:        body.systemPrompt,
    capabilities:        body.capabilities,
    dailyTokenLimit:     body.dailyTokenLimit,
    requireApprovalFor:  body.requireApprovalFor,
    blockedActions:      body.blockedActions,
    status:              'active' as const,
    tokensUsedToday:     0,
    totalCost:           0,
    createdAt:           new Date().toISOString(),
  };

  dataStore.agents.push(agent);
  dataStore.auditLog.push(buildAuditEntry('agent_created', body.workspaceId, agent.id, `Agent "${body.name}" created`));

  res.status(201).json({ agent });
});

// ── PATCH /ai/agents/:id ──────────────────────────────────────────────────────

const UpdateAgentSchema = z.object({
  name:               z.string().optional(),
  model:              z.string().optional(),
  personality:        z.string().optional(),
  systemPrompt:       z.string().optional(),
  capabilities:       z.array(z.string()).optional(),
  dailyTokenLimit:    z.number().min(0).optional(),
  requireApprovalFor: z.array(z.string()).optional(),
  blockedActions:     z.array(z.string()).optional(),
  status:             z.enum(['active', 'paused', 'deactivated']).optional(),
}).strict();

router.patch('/agents/:id', (req: Request, res: Response) => {
  const agent = dataStore.agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const body = validate(UpdateAgentSchema, req.body, res);
  if (!body) return;

  Object.assign(agent, body);
  dataStore.auditLog.push(buildAuditEntry('agent_updated', agent.workspaceId, agent.id, `Agent "${agent.name}" updated`));

  res.json({ agent });
});

// ── DELETE /ai/agents/:id ─────────────────────────────────────────────────────

router.delete('/agents/:id', (req: Request, res: Response) => {
  const idx = dataStore.agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' });

  const [agent] = dataStore.agents.splice(idx, 1);
  dataStore.auditLog.push(buildAuditEntry('agent_deleted', agent.workspaceId, agent.id, `Agent "${agent.name}" deleted`));

  res.json({ message: 'Agent deleted', id: agent.id });
});

// ── GET /ai/agents/:id/stats ──────────────────────────────────────────────────

router.get('/agents/:id/stats', (req: Request, res: Response) => {
  const agent = dataStore.agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const records = dataStore.usageRecords.filter(r => r.agentId === agent.id);
  const today   = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter(r => r.timestamp.startsWith(today));

  const breakdown = aggregateCosts(records.map(r => ({
    agentId:      r.agentId,
    model:        r.model,
    inputTokens:  r.inputTokens,
    outputTokens: r.outputTokens,
    cost:         r.cost,
  })));

  res.json({
    agent:            { id: agent.id, name: agent.name, status: agent.status },
    today: {
      requests:     todayRecords.length,
      tokensUsed:   todayRecords.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0),
      cost:         todayRecords.reduce((s, r) => s + r.cost, 0),
      dailyLimit:   agent.dailyTokenLimit,
      tokensUsedPct: agent.dailyTokenLimit > 0 ? Math.round((agent.tokensUsedToday / agent.dailyTokenLimit) * 100) : 0,
    },
    allTime: {
      requests:     records.length,
      totalCost:    breakdown.total,
      totalTokens:  breakdown.totalTokens,
      byModel:      breakdown.byModel,
    },
    successRate:  records.length > 0 ? Math.round((records.filter(r => r.status === 'success').length / records.length) * 100) : 100,
    blockedRate:  records.length > 0 ? Math.round((records.filter(r => r.status === 'blocked').length / records.length) * 100) : 0,
  });
});

// ── GET /ai/usage ─────────────────────────────────────────────────────────────

router.get('/usage', (req: Request, res: Response) => {
  const { workspaceId, from, to } = req.query as Record<string, string>;

  let records = workspaceId
    ? dataStore.usageRecords.filter(r => r.workspaceId === workspaceId)
    : dataStore.usageRecords;

  if (from) records = records.filter(r => r.timestamp >= from);
  if (to)   records = records.filter(r => r.timestamp <= to);

  const breakdown = aggregateCosts(records.map(r => ({
    agentId: r.agentId,
    model:   r.model,
    inputTokens:  r.inputTokens,
    outputTokens: r.outputTokens,
    cost:         r.cost,
  })));

  const today    = new Date().toISOString().slice(0, 10);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const todayRecords   = records.filter(r => r.timestamp.startsWith(today));
  const monthlyRecords = records.filter(r => r.timestamp.startsWith(thisMonth));

  res.json({
    summary: {
      totalRequests: breakdown.totalRequests,
      totalTokens:   breakdown.totalTokens,
      totalCost:     breakdown.total,
    },
    today: {
      requests: todayRecords.length,
      tokens:   todayRecords.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0),
      cost:     todayRecords.reduce((s, r) => s + r.cost, 0),
    },
    thisMonth: {
      requests: monthlyRecords.length,
      tokens:   monthlyRecords.reduce((s, r) => s + r.inputTokens + r.outputTokens, 0),
      cost:     monthlyRecords.reduce((s, r) => s + r.cost, 0),
    },
    byModel:  breakdown.byModel,
    byAgent:  breakdown.byAgent,
    recentRequests: records.slice(-20).reverse(),
  });
});

// ── GET /ai/models ────────────────────────────────────────────────────────────

router.get('/models', (_req: Request, res: Response) => {
  const models = getAvailableModels({
    openai:    process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    google:    process.env.GOOGLE_AI_API_KEY,
    ollama:    process.env.OLLAMA_ENABLED === 'true',
  });
  res.json({ models });
});

// ── POST /ai/policies ─────────────────────────────────────────────────────────

const PolicySchema = z.object({
  workspaceId:  z.string().min(1),
  name:         z.string().min(1),
  description:  z.string().optional().default(''),
  conditions:   z.array(z.object({ field: z.string(), operator: z.string(), value: z.string() })),
  action:       z.enum(['allow', 'block', 'monitor', 'alert']),
  priority:     z.number().min(0).optional().default(100),
  enabled:      z.boolean().optional().default(true),
});

router.post('/policies', (req: Request, res: Response) => {
  const body = validate(PolicySchema, req.body, res);
  if (!body) return;

  const policy = {
    id:          uuidv4(),
    workspaceId: body.workspaceId,
    name:        body.name,
    description: body.description,
    conditions:  body.conditions as any,
    action:      body.action,
    priority:    body.priority,
    enabled:     body.enabled,
    createdAt:   new Date().toISOString(),
  };

  dataStore.policies.push(policy);
  dataStore.auditLog.push(buildAuditEntry('policy_created', body.workspaceId, undefined, `Policy "${body.name}" created`));

  res.status(201).json({ policy });
});

router.get('/policies', (req: Request, res: Response) => {
  const { workspaceId } = req.query;
  const policies = workspaceId
    ? dataStore.policies.filter(p => p.workspaceId === workspaceId)
    : dataStore.policies;
  res.json({ policies, total: policies.length });
});

// ── GET /ai/audit ─────────────────────────────────────────────────────────────

router.get('/audit', (req: Request, res: Response) => {
  const { workspaceId, agentId, action, from, to, limit = '100' } = req.query as Record<string, string>;

  let entries = [...dataStore.auditLog].reverse();

  if (workspaceId) entries = entries.filter(e => e.workspaceId === workspaceId);
  if (agentId)     entries = entries.filter(e => e.agentId    === agentId);
  if (action)      entries = entries.filter(e => e.action     === action);
  if (from)        entries = entries.filter(e => e.timestamp  >= from);
  if (to)          entries = entries.filter(e => e.timestamp  <= to);

  const limitN = Math.min(parseInt(limit, 10) || 100, 1000);
  entries = entries.slice(0, limitN);

  res.json({ entries, total: entries.length });
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildUsageRecord(
  body:         { model: string; workspaceId: string; action: string },
  agentId:      string | undefined,
  inputTokens:  number,
  outputTokens: number,
  cost:         number,
  status:       'success' | 'blocked' | 'error',
  action:       string,
  latencyMs?:   number,
) {
  return {
    id:           uuidv4(),
    agentId:      agentId ?? 'anonymous',
    workspaceId:  body.workspaceId,
    model:        body.model,
    inputTokens,
    outputTokens,
    cost,
    latencyMs:    latencyMs ?? 0,
    action,
    status,
    timestamp:    new Date().toISOString(),
  };
}

function buildAuditEntry(
  action:      string,
  workspaceId: string,
  agentId?:    string,
  details?:    string,
  status?:     string,
) {
  return {
    id:          uuidv4(),
    action,
    workspaceId,
    agentId,
    details,
    status:      status ?? 'success',
    timestamp:   new Date().toISOString(),
  };
}

export default router;
