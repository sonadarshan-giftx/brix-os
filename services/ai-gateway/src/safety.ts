/**
 * safety.ts — Safety filters, PII detection, prompt injection guards,
 *              rate limiting per agent, and content policy enforcement
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SafetyCheckResult {
  allowed: boolean;
  reason?: string;
  category?: SafetyViolationCategory;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export type SafetyViolationCategory =
  | 'pii_detected'
  | 'prompt_injection'
  | 'rate_limit_exceeded'
  | 'token_limit_exceeded'
  | 'blocked_action'
  | 'content_policy'
  | 'jailbreak_attempt';

export interface RateLimitState {
  requestsThisMinute: number;
  requestsThisHour: number;
  lastMinuteReset: number;
  lastHourReset: number;
}

// ── In-memory rate limit store ────────────────────────────────────────────────

const rateLimitStore = new Map<string, RateLimitState>();

function getRateLimitState(agentId: string): RateLimitState {
  const now = Date.now();
  let state = rateLimitStore.get(agentId);

  if (!state) {
    state = { requestsThisMinute: 0, requestsThisHour: 0, lastMinuteReset: now, lastHourReset: now };
    rateLimitStore.set(agentId, state);
    return state;
  }

  // Reset counters if windows have passed
  if (now - state.lastMinuteReset > 60_000) {
    state.requestsThisMinute = 0;
    state.lastMinuteReset    = now;
  }
  if (now - state.lastHourReset > 3_600_000) {
    state.requestsThisHour = 0;
    state.lastHourReset    = now;
  }

  return state;
}

export function checkRateLimit(
  agentId: string,
  maxPerMinute = 20,
  maxPerHour   = 200,
): SafetyCheckResult {
  const state = getRateLimitState(agentId);

  if (state.requestsThisMinute >= maxPerMinute) {
    return {
      allowed:  false,
      reason:   `Rate limit exceeded: ${state.requestsThisMinute}/${maxPerMinute} requests per minute`,
      category: 'rate_limit_exceeded',
      severity: 'medium',
    };
  }
  if (state.requestsThisHour >= maxPerHour) {
    return {
      allowed:  false,
      reason:   `Hourly rate limit exceeded: ${state.requestsThisHour}/${maxPerHour} requests`,
      category: 'rate_limit_exceeded',
      severity: 'medium',
    };
  }

  state.requestsThisMinute += 1;
  state.requestsThisHour   += 1;
  return { allowed: true };
}

// ── PII detection patterns ────────────────────────────────────────────────────

const PII_PATTERNS: Array<{ name: string; pattern: RegExp; severity: 'medium' | 'high' | 'critical' }> = [
  { name: 'SSN',          pattern: /\b\d{3}-\d{2}-\d{4}\b/,                                severity: 'critical' },
  { name: 'Credit Card',  pattern: /\b(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, severity: 'critical' },
  { name: 'Email',        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, severity: 'medium' },
  { name: 'Phone (US)',   pattern: /\b(?:\+1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, severity: 'medium' },
  { name: 'Passport',     pattern: /\b[A-Z]{1,2}\d{6,9}\b/,                                severity: 'high' },
  { name: 'IP Address',   pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/,                          severity: 'medium' },
  { name: 'AWS Key',      pattern: /\bAKIA[0-9A-Z]{16}\b/,                                  severity: 'critical' },
  { name: 'Private Key',  pattern: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,              severity: 'critical' },
  { name: 'JWT Token',    pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, severity: 'high' },
];

export function checkPII(text: string): SafetyCheckResult {
  for (const { name, pattern, severity } of PII_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed:  false,
        reason:   `PII detected: ${name} pattern found in request`,
        category: 'pii_detected',
        severity,
      };
    }
  }
  return { allowed: true };
}

// ── Prompt injection detection ────────────────────────────────────────────────

const INJECTION_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i,       description: 'Ignore instructions directive' },
  { pattern: /forget\s+(all\s+)?previous\s+instructions/i,       description: 'Forget instructions directive' },
  { pattern: /you\s+are\s+now\s+(?:a\s+)?(?:different|new|evil|jailbroken)/i, description: 'Identity override attempt' },
  { pattern: /disregard\s+(?:your|all)\s+(?:previous\s+)?instructions/i, description: 'Disregard instructions' },
  { pattern: /system\s+prompt\s*[:=]/i,                          description: 'System prompt injection' },
  { pattern: /<\|im_start\|>|<\|im_end\|>/i,                    description: 'Token injection (ChatML)' },
  { pattern: /\[INST\]|\[\/INST\]/i,                             description: 'Token injection (Llama)' },
  { pattern: /\bDAN\b.*mode/i,                                   description: 'DAN jailbreak attempt' },
  { pattern: /act\s+as\s+if\s+you\s+have\s+no\s+restrictions/i, description: 'Restriction removal attempt' },
  { pattern: /pretend\s+you\s+are\s+an?\s+(?:AI|assistant)\s+without/i, description: 'Restriction bypass' },
  { pattern: /###\s*OVERRIDE/i,                                  description: 'Override directive' },
  { pattern: /\bconfidential\b.*\bsystem\b.*\bprompt\b/i,       description: 'System prompt extraction attempt' },
];

export function checkPromptInjection(text: string): SafetyCheckResult {
  for (const { pattern, description } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed:  false,
        reason:   `Prompt injection detected: ${description}`,
        category: 'prompt_injection',
        severity: 'high',
      };
    }
  }
  return { allowed: true };
}

// ── Content policy ────────────────────────────────────────────────────────────

const BLOCKED_CONTENT_PATTERNS: RegExp[] = [
  /how\s+to\s+(?:make|build|create)\s+(?:a\s+)?(?:bomb|weapon|malware|ransomware|exploit)/i,
  /(?:generate|write|create)\s+(?:malicious|harmful)\s+code/i,
  /(?:bypass|circumvent|evade)\s+security/i,
];

export function checkContentPolicy(text: string): SafetyCheckResult {
  for (const pattern of BLOCKED_CONTENT_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed:  false,
        reason:   'Content policy violation: request contains prohibited content',
        category: 'content_policy',
        severity: 'critical',
      };
    }
  }
  return { allowed: true };
}

// ── Blocked actions per agent ─────────────────────────────────────────────────

export function checkBlockedActions(action: string, blockedActions: string[]): SafetyCheckResult {
  const normalized = action.toLowerCase();
  for (const blocked of blockedActions) {
    if (normalized.includes(blocked.toLowerCase())) {
      return {
        allowed:  false,
        reason:   `Action blocked by agent policy: "${blocked}"`,
        category: 'blocked_action',
        severity: 'medium',
      };
    }
  }
  return { allowed: true };
}

// ── Token limit check ─────────────────────────────────────────────────────────

export function checkTokenLimit(
  tokensUsedToday: number,
  dailyTokenLimit: number,
  requestedTokens: number,
): SafetyCheckResult {
  if (dailyTokenLimit <= 0) return { allowed: true }; // 0 = unlimited
  if (tokensUsedToday + requestedTokens > dailyTokenLimit) {
    return {
      allowed:  false,
      reason:   `Daily token limit would be exceeded: ${tokensUsedToday + requestedTokens}/${dailyTokenLimit}`,
      category: 'token_limit_exceeded',
      severity: 'medium',
    };
  }
  return { allowed: true };
}

// ── Combined safety check ─────────────────────────────────────────────────────

export interface SafetyCheckOptions {
  agentId:          string;
  action:           string;
  messages:         Array<{ role: string; content: string }>;
  maxTokens:        number;
  tokensUsedToday:  number;
  dailyTokenLimit:  number;
  blockedActions:   string[];
  maxPerMinute?:    number;
  maxPerHour?:      number;
}

export function runSafetyChecks(opts: SafetyCheckOptions): SafetyCheckResult {
  // Rate limit
  const rateCheck = checkRateLimit(opts.agentId, opts.maxPerMinute, opts.maxPerHour);
  if (!rateCheck.allowed) return rateCheck;

  // Token limit
  const tokenCheck = checkTokenLimit(opts.tokensUsedToday, opts.dailyTokenLimit, opts.maxTokens);
  if (!tokenCheck.allowed) return tokenCheck;

  // Blocked actions
  const actionCheck = checkBlockedActions(opts.action, opts.blockedActions);
  if (!actionCheck.allowed) return actionCheck;

  // Check all message content
  const allText = opts.messages.map(m => m.content).join('\n');

  const piiCheck = checkPII(allText);
  if (!piiCheck.allowed) return piiCheck;

  const injectionCheck = checkPromptInjection(allText);
  if (!injectionCheck.allowed) return injectionCheck;

  const contentCheck = checkContentPolicy(allText);
  if (!contentCheck.allowed) return contentCheck;

  return { allowed: true };
}
