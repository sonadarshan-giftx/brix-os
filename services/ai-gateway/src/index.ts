/**
 * AI Gateway Service — Port 3007
 * Routes AI requests through configurable LLM providers
 * Provides: rate limiting, cost tracking, safety filters, audit logging
 */

import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import helmet  from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import aiRoutes from './routes';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AIAgent {
  id:                 string;
  workspaceId:        string;
  name:               string;
  role:               string;
  model:              string;
  personality:        string;
  systemPrompt:       string;
  capabilities:       string[];
  dailyTokenLimit:    number;
  requireApprovalFor: string[];
  blockedActions:     string[];
  status:             'active' | 'paused' | 'deactivated';
  tokensUsedToday:    number;
  totalCost:          number;
  createdAt:          string;
}

export interface AIUsageRecord {
  id:           string;
  agentId:      string;
  workspaceId:  string;
  model:        string;
  inputTokens:  number;
  outputTokens: number;
  cost:         number;
  latencyMs:    number;
  action:       string;
  status:       'success' | 'blocked' | 'error';
  timestamp:    string;
}

export interface AuditEntry {
  id:          string;
  action:      string;
  workspaceId: string;
  agentId?:    string;
  details?:    string;
  status:      string;
  timestamp:   string;
}

export interface SafetyPolicy {
  id:          string;
  workspaceId: string;
  name:        string;
  description: string;
  conditions:  Array<{ field: string; operator: string; value: string }>;
  action:      'allow' | 'block' | 'monitor' | 'alert';
  priority:    number;
  enabled:     boolean;
  createdAt:   string;
}

// ── In-memory data store (replace with DB in production) ──────────────────────

export const dataStore = {
  agents:       [] as AIAgent[],
  usageRecords: [] as AIUsageRecord[],
  auditLog:     [] as AuditEntry[],
  policies:     [] as SafetyPolicy[],
};

// Seed demo data
function seedDemoData() {
  const ws = 'workspace-demo';

  dataStore.agents.push(
    {
      id: uuidv4(), workspaceId: ws, name: 'Aria', role: 'assistant',
      model: 'claude-3-5-sonnet', personality: 'helpful and concise',
      systemPrompt: 'You are Aria, a helpful AI assistant for the Brix OS platform. Be concise, professional, and proactive.',
      capabilities: ['chat', 'summarize', 'draft', 'analyze'],
      dailyTokenLimit: 500000, requireApprovalFor: ['send_email', 'create_invoice'],
      blockedActions: ['delete_data', 'export_all'],
      status: 'active', tokensUsedToday: 12400, totalCost: 0.87, createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(), workspaceId: ws, name: 'Echo', role: 'devops',
      model: 'gpt-4o', personality: 'technical and precise',
      systemPrompt: 'You are Echo, a DevOps AI specializing in infrastructure, CI/CD, and system reliability.',
      capabilities: ['code', 'debug', 'deploy', 'monitor'],
      dailyTokenLimit: 200000, requireApprovalFor: ['deploy_production'],
      blockedActions: ['drop_database'],
      status: 'active', tokensUsedToday: 8900, totalCost: 1.23, createdAt: new Date().toISOString(),
    },
    {
      id: uuidv4(), workspaceId: ws, name: 'Sage', role: 'analyst',
      model: 'gemini-1.5-pro', personality: 'analytical and thorough',
      systemPrompt: 'You are Sage, a data analysis AI. Provide detailed insights from data with clear visualizations recommendations.',
      capabilities: ['analyze', 'report', 'forecast', 'visualize'],
      dailyTokenLimit: 300000, requireApprovalFor: [],
      blockedActions: ['export_pii'],
      status: 'active', tokensUsedToday: 5600, totalCost: 0.45, createdAt: new Date().toISOString(),
    },
  );

  // Seed some usage records
  const models = ['claude-3-5-sonnet', 'gpt-4o', 'gemini-1.5-pro'];
  for (let i = 0; i < 30; i++) {
    const agent  = dataStore.agents[i % dataStore.agents.length];
    const model  = models[i % models.length];
    const inp    = Math.floor(Math.random() * 800) + 100;
    const out    = Math.floor(Math.random() * 400) + 50;
    const { calculateCost } = require('./costs');
    dataStore.usageRecords.push({
      id: uuidv4(), agentId: agent.id, workspaceId: ws, model,
      inputTokens: inp, outputTokens: out, cost: calculateCost(model, inp, out),
      latencyMs: Math.floor(Math.random() * 2000) + 200,
      action: 'chat', status: 'success',
      timestamp: new Date(Date.now() - i * 3_600_000).toISOString(),
    });
  }
}

seedDemoData();

// ── Express app ───────────────────────────────────────────────────────────────

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin:  process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Workspace-Id'],
}));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limit (stricter per-agent limits are in safety.ts)
const globalLimiter = rateLimit({
  windowMs:         60 * 1000, // 1 minute
  max:              300,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many requests from this IP' },
});
app.use(globalLimiter);

// Request logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Health check ──────────────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status:    'ok',
    service:   'ai-gateway',
    version:   '1.0.0',
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
    providers: {
      openai:    !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY,
      google:    !!process.env.GOOGLE_AI_API_KEY,
      ollama:    process.env.OLLAMA_ENABLED === 'true',
    },
    stats: {
      agents:       dataStore.agents.length,
      usageRecords: dataStore.usageRecords.length,
      auditEntries: dataStore.auditLog.length,
    },
  });
});

// ── AI routes ─────────────────────────────────────────────────────────────────

app.use('/ai', aiRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[AI Gateway Error]', err.stack ?? err.message);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3007', 10);

app.listen(PORT, () => {
  console.log(`\n🤖 Brix AI Gateway running on port ${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   Chat:    POST http://localhost:${PORT}/ai/chat`);
  console.log(`   Agents:  GET  http://localhost:${PORT}/ai/agents`);
  console.log(`   Models:  GET  http://localhost:${PORT}/ai/models`);
  console.log(`   Usage:   GET  http://localhost:${PORT}/ai/usage`);
  console.log(`   Audit:   GET  http://localhost:${PORT}/ai/audit\n`);
  console.log('   Providers configured:');
  console.log(`     OpenAI:    ${process.env.OPENAI_API_KEY    ? 'YES' : 'mock mode'}`);
  console.log(`     Anthropic: ${process.env.ANTHROPIC_API_KEY ? 'YES' : 'mock mode'}`);
  console.log(`     Google:    ${process.env.GOOGLE_AI_API_KEY ? 'YES' : 'mock mode'}`);
  console.log(`     Ollama:    ${process.env.OLLAMA_ENABLED === 'true' ? 'YES' : 'disabled'}\n`);
});

export default app;
