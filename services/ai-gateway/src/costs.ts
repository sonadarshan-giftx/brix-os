/**
 * costs.ts — Token cost tracking and budget management
 * Supports per-model pricing, daily/monthly budgets, and cost breakdowns
 */

// ── Pricing table (USD per 1K tokens) ────────────────────────────────────────

export const MODEL_PRICING: Record<string, { input: number; output: number; displayName: string }> = {
  'gpt-4':                  { input: 0.03,    output: 0.06,    displayName: 'GPT-4' },
  'gpt-4-turbo':            { input: 0.01,    output: 0.03,    displayName: 'GPT-4 Turbo' },
  'gpt-4o':                 { input: 0.005,   output: 0.015,   displayName: 'GPT-4o' },
  'gpt-4o-mini':            { input: 0.00015, output: 0.0006,  displayName: 'GPT-4o Mini' },
  'gpt-3.5-turbo':          { input: 0.0005,  output: 0.0015,  displayName: 'GPT-3.5 Turbo' },
  'claude-3-5-sonnet':      { input: 0.003,   output: 0.015,   displayName: 'Claude 3.5 Sonnet' },
  'claude-3-5-haiku':       { input: 0.0008,  output: 0.004,   displayName: 'Claude 3.5 Haiku' },
  'claude-3-opus':          { input: 0.015,   output: 0.075,   displayName: 'Claude 3 Opus' },
  'gemini-pro':             { input: 0.0005,  output: 0.0015,  displayName: 'Gemini Pro' },
  'gemini-1.5-pro':         { input: 0.0035,  output: 0.0105,  displayName: 'Gemini 1.5 Pro' },
  'gemini-1.5-flash':       { input: 0.00035, output: 0.00105, displayName: 'Gemini 1.5 Flash' },
  'llama3':                 { input: 0.0,     output: 0.0,     displayName: 'Llama 3 (Local)' },
  'llama3.1':               { input: 0.0,     output: 0.0,     displayName: 'Llama 3.1 (Local)' },
  'mistral':                { input: 0.0,     output: 0.0,     displayName: 'Mistral (Local)' },
};

export type ModelId = keyof typeof MODEL_PRICING;

// ── Cost calculation ──────────────────────────────────────────────────────────

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;
  const inputCost  = (inputTokens  / 1000) * pricing.input;
  const outputCost = (outputTokens / 1000) * pricing.output;
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000; // 6 decimal places
}

// ── Budget management ─────────────────────────────────────────────────────────

export interface BudgetStatus {
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  dailyPercent: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  monthlyPercent: number;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  level: 'warning' | 'critical';
  message: string;
  threshold: number;
}

export function checkBudgetAlerts(
  dailyUsed: number,
  dailyLimit: number,
  monthlyUsed: number,
  monthlyLimit: number,
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  const dailyPct   = dailyLimit   > 0 ? (dailyUsed   / dailyLimit)   * 100 : 0;
  const monthlyPct = monthlyLimit > 0 ? (monthlyUsed / monthlyLimit) * 100 : 0;

  if (dailyPct >= 100)  alerts.push({ level: 'critical', message: 'Daily budget exceeded',          threshold: 100 });
  else if (dailyPct >= 90) alerts.push({ level: 'critical', message: 'Daily budget at 90%',         threshold: 90 });
  else if (dailyPct >= 75) alerts.push({ level: 'warning',  message: 'Daily budget at 75%',         threshold: 75 });

  if (monthlyPct >= 100)  alerts.push({ level: 'critical', message: 'Monthly budget exceeded',      threshold: 100 });
  else if (monthlyPct >= 90) alerts.push({ level: 'critical', message: 'Monthly budget at 90%',     threshold: 90 });
  else if (monthlyPct >= 75) alerts.push({ level: 'warning',  message: 'Monthly budget at 75%',     threshold: 75 });

  return alerts;
}

// ── Aggregation helpers ───────────────────────────────────────────────────────

export interface CostBreakdown {
  byModel:     Record<string, { cost: number; tokens: number; requests: number }>;
  byAgent:     Record<string, { cost: number; tokens: number; requests: number }>;
  total:       number;
  totalTokens: number;
  totalRequests: number;
}

export function aggregateCosts(records: Array<{
  agentId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}>): CostBreakdown {
  const breakdown: CostBreakdown = {
    byModel: {},
    byAgent: {},
    total: 0,
    totalTokens: 0,
    totalRequests: 0,
  };

  for (const r of records) {
    const tokens = r.inputTokens + r.outputTokens;

    // By model
    if (!breakdown.byModel[r.model]) {
      breakdown.byModel[r.model] = { cost: 0, tokens: 0, requests: 0 };
    }
    breakdown.byModel[r.model].cost     += r.cost;
    breakdown.byModel[r.model].tokens   += tokens;
    breakdown.byModel[r.model].requests += 1;

    // By agent
    if (!breakdown.byAgent[r.agentId]) {
      breakdown.byAgent[r.agentId] = { cost: 0, tokens: 0, requests: 0 };
    }
    breakdown.byAgent[r.agentId].cost     += r.cost;
    breakdown.byAgent[r.agentId].tokens   += tokens;
    breakdown.byAgent[r.agentId].requests += 1;

    breakdown.total         += r.cost;
    breakdown.totalTokens   += tokens;
    breakdown.totalRequests += 1;
  }

  // Round totals
  breakdown.total = Math.round(breakdown.total * 1_000_000) / 1_000_000;

  return breakdown;
}

// ── Available models list ─────────────────────────────────────────────────────

export function getAvailableModels(envKeys: { openai?: string; anthropic?: string; google?: string; ollama?: boolean }) {
  const models: Array<{ id: string; displayName: string; provider: string; available: boolean; costPer1kInput: number; costPer1kOutput: number }> = [];

  const openaiModels  = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];
  const anthropicModels = ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'];
  const googleModels  = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  const localModels   = ['llama3', 'llama3.1', 'mistral'];

  for (const id of openaiModels) {
    const p = MODEL_PRICING[id];
    models.push({ id, displayName: p.displayName, provider: 'openai', available: !!envKeys.openai, costPer1kInput: p.input, costPer1kOutput: p.output });
  }
  for (const id of anthropicModels) {
    const p = MODEL_PRICING[id];
    models.push({ id, displayName: p.displayName, provider: 'anthropic', available: !!envKeys.anthropic, costPer1kInput: p.input, costPer1kOutput: p.output });
  }
  for (const id of googleModels) {
    const p = MODEL_PRICING[id];
    models.push({ id, displayName: p.displayName, provider: 'google', available: !!envKeys.google, costPer1kInput: p.input, costPer1kOutput: p.output });
  }
  for (const id of localModels) {
    const p = MODEL_PRICING[id];
    models.push({ id, displayName: p.displayName, provider: 'ollama', available: !!envKeys.ollama, costPer1kInput: p.input, costPer1kOutput: p.output });
  }

  return models;
}
