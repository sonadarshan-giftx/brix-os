import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Mic, Paperclip, ChevronDown,
  Code2, BarChart3, MessageSquare, Users, FolderKanban,
  Calendar, CheckCircle2, Zap, RefreshCw, Copy,
  ThumbsUp, ThumbsDown, Bot, User, Search,
  FileText, GitBranch, Bug, Clock, Star,
  Lightbulb, ArrowRight, X, PlugZap,
} from 'lucide-react';
import { useStore } from '@/store/useStore';

const ACCENT = '#D97757';

/* ── Context cards shown as suggestions ── */
const CONTEXT_SUGGESTIONS = [
  { icon: FolderKanban, label: 'Summarize project status', context: 'Projects', color: ACCENT },
  { icon: Bug, label: 'Find bugs in recent PRs', context: 'Dev', color: '#EF4444' },
  { icon: BarChart3, label: 'Draft sprint retrospective', context: 'PM', color: '#F59E0B' },
  { icon: MessageSquare, label: 'Summarize unread messages', context: 'Chat', color: '#06B6D4' },
  { icon: Calendar, label: 'Prepare for tomorrow\'s meetings', context: 'Calendar', color: '#8B5CF6' },
  { icon: CheckCircle2, label: 'Review pending approvals', context: 'Approvals', color: '#10B981' },
];

/* ── Personas ── */
const PERSONAS = [
  { id: 'general', name: 'General', icon: Sparkles, desc: 'All-purpose workspace assistant', color: ACCENT },
  { id: 'dev', name: 'Developer', icon: Code2, desc: 'Code reviews, debugging, PRs', color: '#3B82F6' },
  { id: 'pm', name: 'Product Manager', icon: BarChart3, desc: 'Sprint planning, metrics, roadmaps', color: '#F59E0B' },
  { id: 'support', name: 'Support', icon: MessageSquare, desc: 'Customer tickets, escalations', color: '#10B981' },
];

/* ── Canned demo conversation ── */
type MsgRole = 'user' | 'assistant';

interface Msg {
  id: string;
  role: MsgRole;
  content: string;
  model?: string;
  routed?: boolean;
  timestamp: string;
  actions?: { label: string; icon: any }[];
}

const INITIAL_MESSAGES: Msg[] = [
  {
    id: 'm0',
    role: 'assistant',
    content: `Hi Sarah! 👋 I'm your BrixOS AI Companion — I have full context of your workspace: projects, tasks, messages, calendar, and team activity.\n\nWhat can I help you with today?`,
    model: 'Llama 3.1 70B',
    routed: true,
    timestamp: 'Just now',
  },
];

const CANNED_RESPONSES: Record<string, Msg> = {
  default: {
    id: 'r1',
    role: 'assistant',
    content: `I've analyzed your current workspace context.\n\n**Here's what I found:**\n- 3 tasks are overdue in the BrixOS MVP project\n- You have 2 unanswered messages from Alex Chen (high-priority)\n- Tomorrow's architecture review at 10 AM has no agenda yet\n\nWould you like me to help with any of these?`,
    model: 'Claude 3.5 Haiku',
    routed: true,
    timestamp: 'Just now',
    actions: [{ label: 'Draft agenda', icon: FileText }, { label: 'Reply to Alex', icon: MessageSquare }, { label: 'Update tasks', icon: CheckCircle2 }],
  },
  sprint: {
    id: 'r2',
    role: 'assistant',
    content: `Here's your **Sprint 24 Retrospective Draft**:\n\n**What went well ✅**\n- Shipped AI Gateway v1 ahead of schedule\n- Zero critical bugs in production this sprint\n- Team velocity up 18% vs last sprint\n\n**What needs improvement ⚠️**\n- 4 tickets moved from this sprint (scope creep)\n- Code review turnaround > 24h on 3 PRs\n\n**Action items 🎯**\n1. Set PR review SLA to 8 hours\n2. Introduce sprint scope lock after day 2\n3. Schedule pair programming sessions for complex tickets\n\n*Routed to Llama 3.1 (summarization task — saved $0.04)*`,
    model: 'Llama 3.1 70B',
    routed: true,
    timestamp: 'Just now',
    actions: [{ label: 'Copy to Docs', icon: Copy }, { label: 'Share with team', icon: Users }, { label: 'Edit draft', icon: FileText }],
  },
  bug: {
    id: 'r3',
    role: 'assistant',
    content: `I scanned recent PRs and found **3 potential issues**:\n\n**🔴 High — auth-service PR #47**\n\`\`\`\nif (user.token == null) { // == instead of ===\n  return redirect('/login');\n}\n\`\`\`\nType coercion bug — falsy values like \`0\` or \`""\` will bypass auth.\n\n**🟡 Medium — payment-gateway PR #51**\nUnhandled promise rejection in \`processRefund()\`. Add try/catch around Stripe API call.\n\n**🟢 Low — user-service PR #53**\nMissing index on \`users.email\` — queries will slow at scale.\n\n*Routed to Claude 3.5 Haiku (code analysis — cost: $0.003)*`,
    model: 'Claude 3.5 Haiku',
    routed: true,
    timestamp: 'Just now',
    actions: [{ label: 'Create bug tickets', icon: Bug }, { label: 'Assign to Dev Agent', icon: Bot }, { label: 'View PRs', icon: GitBranch }],
  },
};

function getCannedResponse(input: string): Msg {
  const l = input.toLowerCase();
  if (l.includes('retro') || l.includes('sprint')) return { ...CANNED_RESPONSES.sprint, id: `r-${Date.now()}`, timestamp: 'Just now' };
  if (l.includes('bug') || l.includes('pr') || l.includes('code')) return { ...CANNED_RESPONSES.bug, id: `r-${Date.now()}`, timestamp: 'Just now' };
  return { ...CANNED_RESPONSES.default, id: `r-${Date.now()}`, timestamp: 'Just now' };
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 14px' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT }}
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg, onAction }: { msg: Msg; onAction: (label: string) => void }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(msg.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  /* Render markdown-like bold/code */
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('```')) return null;
      if (line.endsWith('```')) return null;

      // code block content (simple heuristic)
      if (line.startsWith('if (') || line.startsWith('return ') || line.startsWith('  ')) {
        return (
          <code key={i} style={{ display: 'block', background: '#1e1e2e', color: '#cdd6f4', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'monospace', margin: '2px 0' }}>
            {line}
          </code>
        );
      }

      // bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} style={{ margin: '2px 0', lineHeight: 1.6 }}>
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
        </p>
      );
    }).filter(Boolean);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}
    >
      {/* Avatar */}
      <div style={{
        width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
        background: isUser ? ACCENT : '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: isUser ? 'none' : '1px solid #e5e7eb',
      }}>
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} color={ACCENT} />}
      </div>

      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Model tag for assistant */}
        {!isUser && msg.model && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>AI Companion</span>
            {msg.routed && (
              <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
                via {msg.model}
              </span>
            )}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          background: isUser ? ACCENT : '#fff',
          color: isUser ? '#fff' : '#111827',
          padding: '10px 14px',
          borderRadius: isUser ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
          fontSize: 13, lineHeight: 1.6,
          border: isUser ? 'none' : '1px solid #e5e7eb',
          boxShadow: isUser ? `0 2px 8px ${ACCENT}30` : '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          {renderContent(msg.content)}
        </div>

        {/* Action buttons */}
        {msg.actions && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
            {msg.actions.map(a => {
              const Icon = a.icon;
              return (
                <button
                  key={a.label}
                  onClick={() => onAction(a.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 8,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    background: `${ACCENT}10`, color: ACCENT,
                    border: `1px solid ${ACCENT}25`,
                  }}
                >
                  <Icon size={11} />
                  {a.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Timestamp + copy */}
        {!isUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, color: '#9ca3af' }}>{msg.timestamp}</span>
            <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
              <Copy size={10} />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════
   MAIN COMPONENT
   ═══════════════════ */
export default function AICompanionPage() {
  const currentUser = useStore(s => s.currentUser);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persona, setPersona] = useState(PERSONAS[0]);
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [totalSaved, setTotalSaved] = useState(0.04);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = (text?: string) => {
    const content = (text || input).trim();
    if (!content) return;

    const userMsg: Msg = { id: `u-${Date.now()}`, role: 'user', content, timestamp: 'Just now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const reply = getCannedResponse(content);
      setMessages(prev => [...prev, reply]);
      setTotalSaved(p => +(p + 0.02 + Math.random() * 0.05).toFixed(3));
    }, 1400 + Math.random() * 600);
  };

  const handleAction = (label: string) => {
    send(`Please ${label.toLowerCase()}`);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: '#fafaf9', overflow: 'hidden' }}>

      {/* ── Left sidebar ── */}
      <div style={{ width: 260, flexShrink: 0, borderRight: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', padding: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={16} color={ACCENT} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#111827' }}>AI Companion</div>
            <div style={{ fontSize: 10, color: '#6b7280' }}>Workspace-aware assistant</div>
          </div>
        </div>

        {/* Persona selector */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>Mode</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PERSONAS.map(p => {
              const Icon = p.icon;
              const active = persona.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: active ? `${p.color}12` : 'transparent',
                    textAlign: 'left' as const,
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} color={active ? p.color : '#9ca3af'} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? p.color : '#374151' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af' }}>{p.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Context suggestions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 8 }}>Quick Actions</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {CONTEXT_SUGGESTIONS.map(s => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => send(s.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: 'transparent', textAlign: 'left' as const, transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon size={13} color={s.color} />
                  <span style={{ fontSize: 11, color: '#374151', lineHeight: 1.3 }}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cost savings widget */}
        <div style={{ marginTop: 'auto', background: '#f0fdf4', borderRadius: 10, padding: '12px 14px', border: '1px solid #bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <PlugZap size={12} color="#16a34a" />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' as const }}>Hybrid Routing Active</span>
          </div>
          <div style={{ fontSize: 11, color: '#374151', marginBottom: 4 }}>This session routed to free open-source models where possible.</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>${totalSaved.toFixed(3)}</div>
          <div style={{ fontSize: 10, color: '#6b7280' }}>saved this session vs GPT-4o</div>
        </div>
      </div>

      {/* ── Main chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Chat header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
              {persona.name} Mode
            </span>
            <span style={{ fontSize: 11, color: '#6b7280' }}>— context: Acme Software workspace</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setMessages(INITIAL_MESSAGES); setTotalSaved(0); }}
              style={{ padding: '5px 10px', borderRadius: 6, background: '#f3f4f6', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#6b7280' }}
            >
              <RefreshCw size={11} />
              New chat
            </button>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {messages.map(msg => (
            <MessageBubble key={msg.id} msg={msg} onAction={handleAction} />
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}
            >
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={14} color={ACCENT} />
              </div>
              <div style={{ background: '#fff', borderRadius: '4px 14px 14px 14px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <TypingIndicator />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', background: '#fff' }}>
          {/* Suggested chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' as const }}>
            {['Summarize my day', 'What\'s overdue?', 'Draft standup update', 'Find blockers'].map(s => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  padding: '4px 10px', borderRadius: 99, border: `1px solid #e5e7eb`,
                  background: '#f9fafb', fontSize: 11, fontWeight: 500, color: '#374151', cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.color = ACCENT; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#374151'; }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{ flex: 1, border: `1.5px solid #e5e7eb`, borderRadius: 12, background: '#fafafa', padding: '10px 14px', transition: 'border-color 0.15s' }}
              onFocus={() => {}}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder={`Ask ${persona.name === 'General' ? 'anything about your workspace' : `your ${persona.name} assistant`}…`}
                rows={1}
                style={{
                  width: '100%', resize: 'none', border: 'none', outline: 'none', background: 'transparent',
                  fontSize: 13, color: '#111827', fontFamily: 'inherit', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af', display: 'flex' }}>
                    <Paperclip size={14} />
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#9ca3af', display: 'flex' }}>
                    <Mic size={14} />
                  </button>
                </div>
                <span style={{ fontSize: 10, color: '#d1d5db' }}>Shift+Enter for newline</span>
              </div>
            </div>

            <button
              onClick={() => send()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 40, height: 40, borderRadius: 10, border: 'none', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                background: input.trim() && !isTyping ? ACCENT : '#f3f4f6',
                color: input.trim() && !isTyping ? '#fff' : '#d1d5db',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>

          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={10} color={ACCENT} />
            <span style={{ fontSize: 10, color: '#9ca3af' }}>Responses routed to the most cost-efficient model via BrixOS Hybrid AI Gateway</span>
          </div>
        </div>
      </div>
    </div>
  );
}
