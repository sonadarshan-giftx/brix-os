import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Mic, Paperclip,
  Code2, BarChart3, MessageSquare, Users, FolderKanban,
  Calendar, CheckCircle2, Zap, RefreshCw, Copy,
  Bot, User, FileText, Bug,
  PlugZap, ChevronRight, Info,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const ACCENT = '#D97757';

/* ── The underlying models BrixIntelSmart routes across ── */
const UNDERLYING_MODELS = [
  { name: 'Llama 3.1 70B', type: 'Open Source', badge: 'FREE', color: '#10B981', tasks: 'Summarization, drafts, classification' },
  { name: 'Mistral 7B',     type: 'Open Source', badge: 'FREE', color: '#06B6D4', tasks: 'Ticket routing, tagging, intent' },
  { name: 'Claude 3.5 Haiku', type: 'Anthropic', badge: '$0.25/1M', color: '#F59E0B', tasks: 'Code, structured output, analysis' },
  { name: 'GPT-4o',         type: 'OpenAI',      badge: '$2.50/1M', color: ACCENT,    tasks: 'Complex reasoning, architecture' },
  { name: 'Claude 3 Opus',  type: 'Anthropic',   badge: '$15/1M',   color: '#EC4899', tasks: 'Legal, critical ops, deep research' },
];

/* ── Quick actions ── */
const QUICK_ACTIONS = [
  { icon: FolderKanban, label: 'Summarize project status', color: ACCENT },
  { icon: Bug,          label: 'Find bugs in recent PRs',  color: '#EF4444' },
  { icon: BarChart3,    label: 'Draft sprint retrospective', color: '#F59E0B' },
  { icon: MessageSquare,label: 'Summarize unread messages', color: '#06B6D4' },
  { icon: Calendar,     label: "Prepare for tomorrow's meetings", color: '#8B5CF6' },
  { icon: CheckCircle2, label: 'Review pending approvals', color: '#10B981' },
];

type MsgRole = 'user' | 'assistant';
interface Msg {
  id: string;
  role: MsgRole;
  content: string;
  routedModel?: string;     // what BrixIntelSmart actually used internally
  timestamp: string;
  actions?: { label: string; icon: any }[];
}

const INITIAL_MESSAGES: Msg[] = [
  {
    id: 'm0',
    role: 'assistant',
    content: `Hi Sarah! I'm your BrixOS AI Companion, powered by **BrixIntelSmart** — our hybrid AI engine that automatically selects the best model for every request.\n\nI have full context of your workspace: projects, tasks, messages, calendar, and team activity. What can I help you with?`,
    routedModel: 'Llama 3.1 70B',
    timestamp: 'Just now',
  },
];

/* Internal routing logic — BrixIntelSmart decides, user never sees this choice */
function pickModel(input: string): string {
  const l = input.toLowerCase();
  if (l.includes('legal') || l.includes('compliance') || l.includes('critical')) return 'Claude 3 Opus';
  if (l.includes('code') || l.includes('bug') || l.includes('pr') || l.includes('review')) return 'Claude 3.5 Haiku';
  if (l.includes('architect') || l.includes('complex') || l.includes('design')) return 'GPT-4o';
  if (l.includes('classif') || l.includes('tag') || l.includes('route') || l.includes('ticket')) return 'Mistral 7B';
  return 'Llama 3.1 70B'; // default: free open-source for simple tasks
}

const CANNED: Record<string, Omit<Msg, 'id' | 'timestamp'>> = {
  default: {
    role: 'assistant',
    content: `I've analyzed your workspace context.\n\n**Here's what needs attention:**\n- 3 tasks are overdue in the BrixOS MVP project\n- 2 unanswered messages from Alex Chen (high-priority)\n- Tomorrow's architecture review at 10 AM has no agenda yet\n\nWould you like me to help with any of these?`,
    routedModel: 'Llama 3.1 70B',
    actions: [{ label: 'Draft agenda', icon: FileText }, { label: 'Reply to Alex', icon: MessageSquare }, { label: 'Update tasks', icon: CheckCircle2 }],
  },
  sprint: {
    role: 'assistant',
    content: `Here's your **Sprint 24 Retrospective Draft**:\n\n**What went well ✅**\n- Shipped AI Gateway v1 ahead of schedule\n- Zero critical bugs in production this sprint\n- Team velocity up 18% vs last sprint\n\n**What needs improvement ⚠️**\n- 4 tickets moved from this sprint (scope creep)\n- Code review turnaround > 24h on 3 PRs\n\n**Action items 🎯**\n1. Set PR review SLA to 8 hours\n2. Introduce sprint scope lock after day 2\n3. Schedule pair programming sessions for complex tickets`,
    routedModel: 'Llama 3.1 70B',
    actions: [{ label: 'Copy to Docs', icon: Copy }, { label: 'Share with team', icon: Users }, { label: 'Edit draft', icon: FileText }],
  },
  bug: {
    role: 'assistant',
    content: `I scanned recent PRs and found **3 potential issues**:\n\n**🔴 High — auth-service PR #47**\n\`\`\`\nif (user.token == null) { // == instead of ===\n  return redirect('/login');\n}\n\`\`\`\nType coercion bug — falsy values bypass auth.\n\n**🟡 Medium — payment-gateway PR #51**\nUnhandled promise rejection in processRefund(). Add try/catch around Stripe API call.\n\n**🟢 Low — user-service PR #53**\nMissing index on users.email — queries will slow at scale.`,
    routedModel: 'Claude 3.5 Haiku',
    actions: [{ label: 'Create bug tickets', icon: Bug }, { label: 'Assign to Dev Agent', icon: Bot }],
  },
};

function getCanned(input: string): Omit<Msg, 'id' | 'timestamp'> {
  const l = input.toLowerCase();
  if (l.includes('retro') || l.includes('sprint')) return { ...CANNED.sprint, routedModel: pickModel(input) };
  if (l.includes('bug') || l.includes('pr') || l.includes('code')) return { ...CANNED.bug, routedModel: pickModel(input) };
  return { ...CANNED.default, routedModel: pickModel(input) };
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }}
          animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
      ))}
    </div>
  );
}

function Bubble({ msg, onAction }: { msg: Msg; onAction: (l: string) => void }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const lines = msg.content.split('\n');
  const rendered = lines.map((line, i) => {
    if (line.startsWith('```') || line.endsWith('```')) return null;
    if (/^(if |return |  )/.test(line)) {
      return <code key={i} style={{ display: 'block', background: '#1e1e2e', color: '#cdd6f4', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', margin: '2px 0' }}>{line}</code>;
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return <p key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>{parts.map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2,-2)}</strong> : p)}</p>;
  }).filter(Boolean);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, marginBottom: 18, alignItems: 'flex-start' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: isUser ? ACCENT : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isUser ? 'none' : '1px solid #e5e7eb' }}>
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color={ACCENT} />}
      </div>

      <div style={{ maxWidth: '76%', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>BrixIntelSmart</span>
            {msg.routedModel && (
              <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                via {msg.routedModel}
              </span>
            )}
          </div>
        )}

        <div style={{
          background: isUser ? ACCENT : '#fff', color: isUser ? '#fff' : '#111827',
          padding: '10px 14px', borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          fontSize: 13, border: isUser ? 'none' : '1px solid #e5e7eb',
          boxShadow: isUser ? `0 2px 8px ${ACCENT}30` : '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {rendered}
        </div>

        {msg.actions && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {msg.actions.map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label} onClick={() => onAction(a.label)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}25` }}>
                  <Icon size={11} />{a.label}
                </button>
              );
            })}
          </div>
        )}

        {!isUser && (
          <div style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{msg.timestamp}</span>
            <button onClick={() => { navigator.clipboard.writeText(msg.content).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Copy size={10} />{copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════ MAIN ═══════════ */
export default function AICompanionPage() {
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(0.04);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const send = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;
    setMessages(p => [...p, { id: `u-${Date.now()}`, role: 'user', content, timestamp: 'Just now' }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const reply = getCanned(content);
      setMessages(p => [...p, { ...reply, id: `r-${Date.now()}`, timestamp: 'Just now' }]);
      setSessionSaved(p => +(p + 0.02 + Math.random() * 0.04).toFixed(3));
    }, 1200 + Math.random() * 600);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: '#fafaf9', overflow: 'hidden' }}>

      {/* ── Left panel ── */}
      <div style={{ width: 248, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color={ACCENT} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>BrixIntelSmart</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Hybrid AI · Context-aware</div>
          </div>
        </div>

        {/* How it works */}
        <div style={{ background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`, borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>How BrixIntelSmart works</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
            Every request is automatically routed to the most cost-efficient model — no manual selection needed. Simple tasks use free open-source models; complex work escalates to premium AI.
          </div>
        </div>

        {/* Model list toggle */}
        <button
          onClick={() => setShowModels(p => !p)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', marginBottom: 8 }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>Underlying Models</span>
          <ChevronRight size={13} color="#9ca3af" style={{ transform: showModels ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <AnimatePresence>
          {showModels && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {UNDERLYING_MODELS.map(m => (
                  <div key={m.name} style={{ background: '#f9fafb', borderRadius: 8, padding: '7px 10px', border: '1px solid #f3f4f6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{m.name}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: m.color + '18', color: m.color }}>{m.badge}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#6b7280', paddingLeft: 12 }}>{m.tasks}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {QUICK_ACTIONS.map(s => {
            const Icon = s.icon;
            return (
              <button key={s.label} onClick={() => send(s.label)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', textAlign: 'left' as const }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <Icon size={13} color={s.color} />
                <span style={{ fontSize: 11, color: '#374151' }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Savings */}
        <div style={{ marginTop: 12, background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <PlugZap size={11} color="#16a34a" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>Hybrid Routing Active</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>${sessionSaved.toFixed(3)}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>saved this session vs GPT-4o only</div>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Chat header */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>BrixIntelSmart</span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>· Acme Software workspace</span>
          </div>
          <button onClick={() => { setMessages(INITIAL_MESSAGES); setSessionSaved(0); }}
            style={{ padding: '5px 10px', borderRadius: 6, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#6b7280' }}>
            <RefreshCw size={11} />New chat
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map(msg => <Bubble key={msg.id} msg={msg} onAction={l => send(`Please ${l.toLowerCase()}`)} />)}
          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color={ACCENT} />
              </div>
              <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', border: '1px solid #e5e7eb' }}>
                <TypingDots />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' as const }}>
            {['Summarize my day', "What's overdue?", 'Draft standup update', 'Find blockers'].map(s => (
              <button key={s} onClick={() => send(s)}
                style={{ padding: '4px 10px', borderRadius: 99, border: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 11, fontWeight: 500, color: '#374151', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}>
                {s}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, border: '1.5px solid #e5e7eb', borderRadius: 12, background: '#fafafa', padding: '10px 14px' }}>
              <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Ask anything about your workspace…"
                rows={1}
                style={{ width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: '#111827', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af', display: 'flex' }}><Paperclip size={14} /></button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af', display: 'flex' }}><Mic size={14} /></button>
                </div>
                <span style={{ fontSize: 10, color: '#d1d5db' }}>Shift+Enter for newline</span>
              </div>
            </div>

            <button onClick={() => send()} disabled={!input.trim() || isTyping}
              style={{ width: 40, height: 40, borderRadius: 10, border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default', background: input.trim() && !isTyping ? ACCENT : '#f3f4f6', color: input.trim() && !isTyping ? '#fff' : '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
              <Send size={16} />
            </button>
          </div>

          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={10} color={ACCENT} />
            <span style={{ fontSize: 10, color: '#9ca3af' }}>BrixIntelSmart automatically routes to the best model — free open-source when possible, paid AI for complex tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
