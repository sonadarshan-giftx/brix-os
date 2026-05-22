/**
 * providers.ts — Abstract LLM provider interface
 * Supports: OpenAI, Anthropic, Google Gemini, local Ollama
 * Falls back to mock responses in dev when API key not configured
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role:    'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  model:      string;
  messages:   ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface LLMResponse {
  content:      string;
  inputTokens:  number;
  outputTokens: number;
  model:        string;
  provider:     string;
  latencyMs:    number;
  mock?:        boolean;
}

export interface LLMProvider {
  name:         string;
  models:       string[];
  isAvailable(): boolean;
  chat(req: LLMRequest): Promise<LLMResponse>;
}

// ── Mock responses (dev fallback) ─────────────────────────────────────────────

const MOCK_RESPONSES = [
  'I have processed your request and here is my analysis. The key findings suggest a structured approach would be most effective.',
  'Based on the context provided, I recommend the following course of action: review the current implementation and identify optimization opportunities.',
  'I have completed the task as requested. The results have been compiled and are ready for review.',
  'Thank you for your query. After analyzing the information, I can provide the following insights and recommendations.',
  'I understand your request. Let me break this down into actionable steps that align with your objectives.',
];

function getMockResponse(messages: ChatMessage[]): string {
  const hash = messages.map(m => m.content).join('').length % MOCK_RESPONSES.length;
  return `[MOCK] ${MOCK_RESPONSES[hash]}`;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length * 1.3);
}

// ── OpenAI Provider ───────────────────────────────────────────────────────────

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  models = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'];

  private apiKey = process.env.OPENAI_API_KEY ?? '';

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    if (!this.isAvailable()) {
      return this.mockResponse(req, start);
    }

    const messages: ChatMessage[] = req.systemPrompt
      ? [{ role: 'system', content: req.systemPrompt }, ...req.messages]
      : req.messages;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model:       req.model,
        messages,
        max_tokens:  req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage:   { prompt_tokens: number; completion_tokens: number };
    };

    return {
      content:      data.choices[0].message.content,
      inputTokens:  data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
    };
  }

  private mockResponse(req: LLMRequest, start: number): LLMResponse {
    const content = getMockResponse(req.messages);
    return {
      content,
      inputTokens:  estimateTokens(req.messages.map(m => m.content).join(' ')),
      outputTokens: estimateTokens(content),
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
      mock:         true,
    };
  }
}

// ── Anthropic Provider ────────────────────────────────────────────────────────

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  models = ['claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus'];

  private apiKey = process.env.ANTHROPIC_API_KEY ?? '';

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    if (!this.isAvailable()) {
      return this.mockResponse(req, start);
    }

    // Map model aliases to Anthropic API model IDs
    const modelMap: Record<string, string> = {
      'claude-3-5-sonnet': 'claude-sonnet-4-6',
      'claude-3-5-haiku':  'claude-haiku-4-6',
      'claude-3-opus':     'claude-opus-4-6',
    };
    const apiModel = modelMap[req.model] ?? req.model;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      apiModel,
        max_tokens: req.maxTokens ?? 1024,
        system:     req.systemPrompt,
        messages:   req.messages.filter(m => m.role !== 'system'),
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage:   { input_tokens: number; output_tokens: number };
    };

    const content = data.content.filter(b => b.type === 'text').map(b => b.text).join('');

    return {
      content,
      inputTokens:  data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
    };
  }

  private mockResponse(req: LLMRequest, start: number): LLMResponse {
    const content = getMockResponse(req.messages);
    return {
      content,
      inputTokens:  estimateTokens(req.messages.map(m => m.content).join(' ')),
      outputTokens: estimateTokens(content),
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
      mock:         true,
    };
  }
}

// ── Google Gemini Provider ────────────────────────────────────────────────────

export class GoogleProvider implements LLMProvider {
  name = 'google';
  models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

  private apiKey = process.env.GOOGLE_AI_API_KEY ?? '';

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    if (!this.isAvailable()) {
      return this.mockResponse(req, start);
    }

    const modelMap: Record<string, string> = {
      'gemini-pro':         'gemini-pro',
      'gemini-1.5-pro':     'gemini-1.5-pro',
      'gemini-1.5-flash':   'gemini-1.5-flash',
    };
    const apiModel = modelMap[req.model] ?? req.model;

    // Build Gemini content array (system prompt as first user turn)
    const contents = [];
    if (req.systemPrompt) {
      contents.push({ role: 'user', parts: [{ text: `System: ${req.systemPrompt}` }] });
      contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
    }
    for (const m of req.messages) {
      if (m.role === 'system') continue;
      contents.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: req.maxTokens ?? 1024, temperature: req.temperature ?? 0.7 },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Google AI error ${response.status}: ${err}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number };
    };

    const content = data.candidates[0].content.parts.map(p => p.text).join('');

    return {
      content,
      inputTokens:  data.usageMetadata.promptTokenCount,
      outputTokens: data.usageMetadata.candidatesTokenCount,
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
    };
  }

  private mockResponse(req: LLMRequest, start: number): LLMResponse {
    const content = getMockResponse(req.messages);
    return {
      content,
      inputTokens:  estimateTokens(req.messages.map(m => m.content).join(' ')),
      outputTokens: estimateTokens(content),
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
      mock:         true,
    };
  }
}

// ── Ollama Local Provider ─────────────────────────────────────────────────────

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  models = ['llama3', 'llama3.1', 'mistral'];

  private baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

  isAvailable(): boolean {
    return process.env.OLLAMA_ENABLED === 'true';
  }

  async chat(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();

    if (!this.isAvailable()) {
      return this.mockResponse(req, start);
    }

    const prompt = [
      req.systemPrompt ? `System: ${req.systemPrompt}\n` : '',
      ...req.messages.map(m => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`),
      'Assistant:',
    ].join('\n');

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: req.model, prompt, stream: false, options: { num_predict: req.maxTokens ?? 1024 } }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error ${response.status}`);
    }

    const data = await response.json() as {
      response:          string;
      prompt_eval_count: number;
      eval_count:        number;
    };

    return {
      content:      data.response,
      inputTokens:  data.prompt_eval_count ?? estimateTokens(prompt),
      outputTokens: data.eval_count         ?? estimateTokens(data.response),
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
    };
  }

  private mockResponse(req: LLMRequest, start: number): LLMResponse {
    const content = getMockResponse(req.messages);
    return {
      content,
      inputTokens:  estimateTokens(req.messages.map(m => m.content).join(' ')),
      outputTokens: estimateTokens(content),
      model:        req.model,
      provider:     this.name,
      latencyMs:    Date.now() - start,
      mock:         true,
    };
  }
}

// ── Provider registry ─────────────────────────────────────────────────────────

const PROVIDERS: LLMProvider[] = [
  new OpenAIProvider(),
  new AnthropicProvider(),
  new GoogleProvider(),
  new OllamaProvider(),
];

const PROVIDER_FOR_MODEL: Record<string, string> = {
  'gpt-4':             'openai',
  'gpt-4-turbo':       'openai',
  'gpt-4o':            'openai',
  'gpt-4o-mini':       'openai',
  'gpt-3.5-turbo':     'openai',
  'claude-3-5-sonnet': 'anthropic',
  'claude-3-5-haiku':  'anthropic',
  'claude-3-opus':     'anthropic',
  'gemini-pro':        'google',
  'gemini-1.5-pro':    'google',
  'gemini-1.5-flash':  'google',
  'llama3':            'ollama',
  'llama3.1':          'ollama',
  'mistral':           'ollama',
};

export function getProvider(model: string): LLMProvider {
  const providerName = PROVIDER_FOR_MODEL[model];
  const provider = PROVIDERS.find(p => p.name === providerName);
  if (!provider) {
    throw new Error(`No provider found for model: ${model}`);
  }
  return provider;
}

export function getAllProviders(): LLMProvider[] {
  return PROVIDERS;
}

export { PROVIDER_FOR_MODEL };
