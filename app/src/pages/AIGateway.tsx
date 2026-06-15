import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Shield, Activity, AlertTriangle,
  CheckCircle2, XCircle, Search,
  BarChart3, Zap, Cpu, Bot,
  Code2, MessageSquare,
  Settings,
  ToggleLeft, ToggleRight, RefreshCw,
  ArrowRight, ChevronDown, ChevronUp,
  Network, TrendingDown, Star,
  FlaskConical, Layers, Lock,
  SlidersHorizontal, Package,
  Terminal,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════════════════════════════════════════
   AI GATEWAY — Hybrid Routing Engine
   Routes AI requests intelligently across models to cut cost
   ═══════════════════════════════════════════════════════════ */

const ACCENT = '#D97757';

/* ── Routing Models ── */
const MODELS = [
  {
    id: 'llama3',
    name: 'Llama 3.1 70B',
    provider: 'Open Source',
    type: 'open-source',
    badge: 'FREE',
    badgeColor: '#10B981',
    cost: '$0.00',
    costPer1k: 0,
    latency: '180ms',
    quality: 72,
    context: '128K',
    strengths: ['Summarization', 'Classification', 'Simple Q&A', 'Draft Generation'],
    icon: FlaskConical,
    color: '#10B981',
    requests: 8420,
    pct: 38,
  },
  {
    id: 'mistral',
    name: 'Mistral 7B',
    provider: 'Open Source',
    type: 'open-source',
    badge: 'FREE',
    badgeColor: '#10B981',
    cost: '$0.00',
    costPer1k: 0,
    latency: '120ms',
    quality: 65,
    context: '32K',
    strengths: ['Ticket Routing', 'Tagging', 'Short Content', 'Intent Detection'],
    icon: Package,
    color: '#06B6D4',
    requests: 5240,
    pct: 24,
  },
  {
    id: 'claude3-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    type: 'paid',
    badge: '$0.25/1M',
    badgeColor: '#F59E0B',
    cost: '$0.25/1M',
    costPer1k: 0.00025,
    latency: '200ms',
    quality: 85,
    context: '200K',
    strengths: ['Code Assist', 'Data Extraction', 'Structured Output', 'Analysis'],
    icon: Star,
    color: '#F59E0B',
    requests: 4360,
    pct: 20,
  },
  {
    id: 'gpt4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'paid',
    badge: '$2.50/1M',
    badgeColor: ACCENT,
    cost: '$2.50/1M',
    costPer1k: 0.0025,
    latency: '650ms',
    quality: 97,
    context: '128K',
    strengths: ['Complex Reasoning', 'Architecture Review', 'Security Analysis', 'Customer Escalations'],
    icon: BrainCircuit,
    color: ACCENT,
    requests: 2450,
    pct: 11,
  },
  {
    id: 'claude3-opus',
    name: 'Claude 3 Opus',
    provider: 'Anthropic',
    type: 'paid',
    badge: '$15/1M',
    badgeColor: '#EC4899',
    cost: '$15/1M',
    costPer1k: 0.015,
    latency: '900ms',
    quality: 99,
    context: '200K',
    strengths: ['Critical Decisions', 'Legal Review', 'High-Stakes Ops', 'Deep Research'],
    icon: Shield,
    color: '#EC4899',
    requests: 1530,
    pct: 7,
  },
];

/* ── Routing Rules ── */
const INITIAL_RULES = [
  { id: 'r1', name: 'Simple summarization', condition: 'token_count < 500 AND task_type = summarize', model: 'llama3', enabled: true, hits: 3820, savings: '$45.84' },
  { id: 'r2', name: 'Ticket classification', condition: 'task_type IN (classify, tag, route)', model: 'mistral', enabled: true, hits: 5240, savings: '$78.60' },
  { id: 'r3', name: 'Code review & gen', condition: 'task_type = code AND complexity < 7', model: 'claude3-haiku', enabled: true, hits: 4360, savings: '$52.32' },
  { id: 'r4', name: 'Complex reasoning', condition: 'complexity >= 7 OR task_type = architecture', model: 'gpt4o', enabled: true, hits: 2450, savings: null },
  { id: 'r5', name: 'Critical / legal / compliance', condition: 'sensitivity = critical OR department = legal', model: 'claude3-opus', enabled: true, hits: 1530, savings: null },
  { id: 'r6', name: 'Draft email / slack messages', condition: 'task_type = draft AND length < 300', model: 'llama3', enabled: true, hits: 4600, savings: '$55.20' },
];

/* ── Audit Log ── */
const AUDIT_LOG = [
  { id: 1, agent: 'Dev Agent', action: 'Code review PR #342', task: 'code', routed: 'claude3-haiku', status: 'allowed', time: '2 min ago', tokens: 1240, savings: '$0.03', risk: 'low' },
  { id: 2, agent: 'PM Agent', action: 'Summarize sprint notes', task: 'summarize', routed: 'llama3', status: 'allowed', time: '5 min ago', tokens: 890, savings: '$0.02', risk: 'low' },
  { id: 3, agent: 'QA Agent', action: 'Security vulnerability analysis', task: 'architecture', routed: 'gpt4o', status: 'allowed', time: '8 min ago', tokens: 2340, savings: null, risk: 'medium' },
  { id: 4, agent: 'Support Agent', action: 'Classify 28 tickets', task: 'classify', routed: 'mistral', status: 'allowed', time: '12 min ago', tokens: 560, savings: '$0.08', risk: 'low' },
  { id: 5, agent: 'Dev Agent', action: 'Attempted /etc/passwd read', task: 'file_access', routed: null, status: 'blocked', time: '15 min ago', tokens: 0, savings: null, risk: 'critical' },
  { id: 6, agent: 'Legal Reviewer', action: 'Contract compliance check', task: 'legal', routed: 'claude3-opus', status: 'allowed', time: '18 min ago', tokens: 4800, savings: null, risk: 'high' },
  { id: 7, agent: 'PM Agent', action: 'Draft weekly update email', task: 'draft', routed: 'llama3', status: 'allowed', time: '22 min ago', tokens: 280, savings: '$0.01', risk: 'low' },
  { id: 8, agent: 'DevOps Agent', action: 'Architecture RFC review', task: 'architecture', routed: 'gpt4o', status: 'allowed', time: '25 min ago', tokens: 3100, savings: null, risk: 'medium' },
  { id: 9, agent: 'QA Agent', action: 'Generate test cases', task: 'code', routed: 'claude3-haiku', status: 'allowed', time: '28 min ago', tokens: 1450, savings: '$0.03', risk: 'low' },
  { id: 10, agent: 'Support Agent', action: 'Tag 150 customer tickets', task: 'tag', routed: 'mistral', status: 'allowed', time: '32 min ago', tokens: 4200, savings: '$0.63', risk: 'low' },
  { id: 11, agent: 'PM Agent', action: 'Critical board report', task: 'legal', routed: 'claude3-opus', status: 'allowed', time: '35 min ago', tokens: 6100, savings: null, risk: 'high' },
  { id: 12, agent: 'Dev Agent', action: 'Export all user emails', task: 'data_export', routed: null, status: 'flagged', time: '40 min ago', tokens: 0, savings: null, risk: 'high' },
];

const COST_COMPARISON = [
  { label: 'Without routing (GPT-4o only)', cost: 621 },
  { label: 'With BrixOS Hybrid Routing', cost: 187 },
];

const DAILY_SAVINGS = [
  { day: 'Mon', savings: 124 },
  { day: 'Tue', savings: 138 },
  { day: 'Wed', savings: 119 },
  { day: 'Thu', savings: 156 },
  { day: 'Fri', savings: 143 },
  { day: 'Sat', savings: 62 },
  { day: 'Sun', savings: 58 },
];

const MODEL_PIE = MODELS.map(m => ({ name: m.name.split(' ').slice(0, 2).join(' '), value: m.pct, color: m.color }));

const AGENTS = [
  { id: 'dev', name: 'Dev Agent', role: 'Code & Review', color: ACCENT, icon: Code2, status: 'active', requestsToday: 180 },
  { id: 'pm', name: 'PM Agent', role: 'Planning', color: '#E8946F', icon: BarChart3, status: 'active', requestsToday: 134 },
  { id: 'qa', name: 'QA Agent', role: 'Quality', color: '#F59E0B', icon: Terminal, status: 'active', requestsToday: 210 },
  { id: 'devops', name: 'DevOps Agent', role: 'Infrastructure', color: '#EC4899', icon: Cpu, status: 'active', requestsToday: 89 },
  { id: 'support', name: 'Support Agent', role: 'Customer', color: '#06B6D4', icon: MessageSquare, status: 'paused', requestsToday: 310 },
  { id: 'legal', name: 'Legal Reviewer', role: 'Compliance', color: '#8B5CF6', icon: Shield, status: 'active', requestsToday: 42 },
];

function modelById(id: string | null) {
  return id ? MODELS.find(m => m.id === id) : null;
}

function RiskBadge({ risk }: { risk: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    low: { bg: '#dcfce7', text: '#16a34a' },
    medium: { bg: '#fef9c3', text: '#ca8a04' },
    high: { bg: '#fee2e2', text: '#dc2626' },
    critical: { bg: '#fce7f3', text: '#db2777' },
  };
  const s = map[risk] || map.low;
  return (
    <span style={{ background: s.bg, color: s.text, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
      {risk}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'allowed') return <span style={{ color: '#16a34a', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} />Allowed</span>;
  if (status === 'blocked') return <span style={{ color: '#dc2626', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><XCircle size={12} />Blocked</span>;
  return <span style={{ color: '#ca8a04', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} />Flagged</span>;
}

function TabBtn({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: any; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '9px 14px', borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        border: 'none', cursor: 'pointer',
        background: active ? `${ACCENT}15` : 'transparent',
        color: active ? ACCENT : '#6b7280',
        transition: 'all 0.15s',
      }}
    >
      <Icon size={14} />
      {label}
      {count !== undefined && (
        <span style={{ background: active ? ACCENT : '#e5e7eb', color: active ? '#fff' : '#6b7280', fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 99 }}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════
   MAIN COMPONENT
   ═══════════════════ */
export default function AIGatewayPage() {
  const [tab, setTab] = useState<'routing' | 'models' | 'security' | 'rules' | 'analytics'>('routing');
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [agentEnabled, setAgentEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(AGENTS.map(a => [a.id, a.status === 'active']))
  );
  const [expandedRule, setExpandedRule] = useState<string | null>(null);
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);

  const filteredAudit = useMemo(() => {
    return AUDIT_LOG.filter(row => {
      const s = search.toLowerCase();
      const matchSearch = !s || row.agent.toLowerCase().includes(s) || row.action.toLowerCase().includes(s);
      const matchAgent = filterAgent === 'all' || row.agent.toLowerCase().includes(filterAgent.toLowerCase());
      const matchRisk = filterRisk === 'all' || row.risk === filterRisk;
      return matchSearch && matchAgent && matchRisk;
    });
  }, [search, filterAgent, filterRisk]);

  const totalRequests = MODELS.reduce((s, m) => s + m.requests, 0);
  const openSourcePct = Math.round(MODELS.filter(m => m.type === 'open-source').reduce((s, m) => s + m.requests, 0) / totalRequests * 100);
  const moneySaved = 434;
  const blockedCount = AUDIT_LOG.filter(a => a.status === 'blocked').length;

  const toast = (msg: string) => { setShowToast(msg); setTimeout(() => setShowToast(null), 2500); };

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf9', fontFamily: 'inherit' }}>
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'fixed', top: 20, right: 20, background: '#18181b', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 1000, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
          >
            ✓ {showToast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div style={{ borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${ACCENT}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Network size={22} color={ACCENT} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111827', margin: 0 }}>AI Security Gateway</h1>
                <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>Hybrid routing · Multi-model orchestration · Access control</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#dcfce7', padding: '5px 12px', borderRadius: 99, border: '1px solid #bbf7d0' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>LIVE</span>
              </div>

              <button
                onClick={() => { setGatewayEnabled(v => !v); toast(gatewayEnabled ? 'Gateway paused' : 'Gateway enabled'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  background: gatewayEnabled ? `${ACCENT}12` : '#f3f4f6',
                  color: gatewayEnabled ? ACCENT : '#6b7280',
                  border: `1px solid ${gatewayEnabled ? `${ACCENT}30` : '#e5e7eb'}`,
                }}
              >
                {gatewayEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {gatewayEnabled ? 'Gateway ON' : 'Gateway OFF'}
              </button>

              <button
                onClick={() => toast('Rules refreshed')}
                style={{ padding: '7px 12px', borderRadius: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#374151' }}
              >
                <RefreshCw size={13} />
                Refresh
              </button>
            </div>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Total Requests', value: totalRequests.toLocaleString(), sub: 'last 24h', icon: Activity, color: ACCENT },
              { label: 'Open-Source Routed', value: `${openSourcePct}%`, sub: 'handled free', icon: FlaskConical, color: '#10B981' },
              { label: 'Monthly Savings', value: `$${moneySaved}`, sub: 'vs GPT-4o only', icon: TrendingDown, color: '#10B981' },
              { label: 'Blocked Actions', value: blockedCount, sub: 'security violations', icon: Shield, color: '#ef4444' },
              { label: 'Avg Latency', value: '210ms', sub: 'across all models', icon: Zap, color: '#F59E0B' },
            ].map(({ label, value, sub, icon: Icon, color }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Icon size={14} color={color} />
                  <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{value}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', display: 'flex', gap: 4, borderTop: '1px solid #e5e7eb' }}>
          <TabBtn active={tab === 'routing'} onClick={() => setTab('routing')} icon={Network} label="Routing Engine" />
          <TabBtn active={tab === 'models'} onClick={() => setTab('models')} icon={Layers} label="Models" count={MODELS.length} />
          <TabBtn active={tab === 'rules'} onClick={() => setTab('rules')} icon={SlidersHorizontal} label="Rules" count={rules.length} />
          <TabBtn active={tab === 'security'} onClick={() => setTab('security')} icon={Shield} label="Security Audit" count={AUDIT_LOG.length} />
          <TabBtn active={tab === 'analytics'} onClick={() => setTab('analytics')} icon={BarChart3} label="Analytics" />
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 28px' }}>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>

            {/* ── ROUTING ENGINE ── */}
            {tab === 'routing' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  {/* Hybrid routing flow */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 6 }}>Hybrid Routing Flow</h3>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 18 }}>Every AI request passes through BrixOS Gateway — classified by task type, complexity, and sensitivity, then routed to the optimal model.</p>

                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, overflowX: 'auto', paddingBottom: 4 }}>
                      {/* Agents */}
                      <div style={{ flex: '0 0 auto', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '12px 16px', minWidth: 130 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>AI Agents</div>
                        {AGENTS.slice(0, 4).map(a => (
                          <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>{a.name}</span>
                          </div>
                        ))}
                        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>+2 more agents</div>
                      </div>

                      {/* Arrow → */}
                      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                        <ArrowRight size={18} color={ACCENT} />
                        <span style={{ fontSize: 9, color: ACCENT, fontWeight: 600, marginTop: 2 }}>All Requests</span>
                      </div>

                      {/* Gateway box */}
                      <div style={{ flex: '0 0 auto', background: `${ACCENT}08`, border: `2px solid ${ACCENT}40`, borderRadius: 12, padding: '14px 18px', minWidth: 155, textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, background: `${ACCENT}15`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                          <Network size={16} color={ACCENT} />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: ACCENT }}>BrixOS Gateway</div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginTop: 4, lineHeight: 1.6 }}>
                          Task classifier<br />Security policy<br />Cost optimizer
                        </div>
                      </div>

                      {/* Arrow → */}
                      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 12px' }}>
                        <ArrowRight size={18} color={ACCENT} />
                        <span style={{ fontSize: 9, color: ACCENT, fontWeight: 600, marginTop: 2 }}>Routed To</span>
                      </div>

                      {/* Models */}
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                        {MODELS.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px' }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#111827', flex: 1 }}>{m.name}</span>
                            <div style={{ width: 60, height: 5, background: '#e5e7eb', borderRadius: 99 }}>
                              <div style={{ width: `${m.pct}%`, height: '100%', background: m.color, borderRadius: 99 }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, color: m.type === 'open-source' ? '#10B981' : '#6b7280', minWidth: 50 }}>
                              {m.type === 'open-source' ? 'FREE' : m.cost}
                            </span>
                            <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 28 }}>{m.pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Savings callout */}
                    <div style={{ marginTop: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                      <TrendingDown size={18} color="#16a34a" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>62% cost reduction this month</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>
                          62% of requests (simple tasks) handled FREE by Llama & Mistral. Only complex / sensitive work uses paid APIs.
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>$434</div>
                        <div style={{ fontSize: 10, color: '#6b7280' }}>saved this month</div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Agents */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Connected AI Agents</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                      {AGENTS.map(a => {
                        const Icon = a.icon;
                        const on = agentEnabled[a.id];
                        return (
                          <div key={a.id} style={{ background: '#f9fafb', borderRadius: 10, border: `1px solid ${on ? a.color + '30' : '#e5e7eb'}`, padding: '12px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ width: 28, height: 28, background: a.color + '15', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon size={14} color={a.color} />
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{a.name}</div>
                                  <div style={{ fontSize: 10, color: '#6b7280' }}>{a.role}</div>
                                </div>
                              </div>
                              <button
                                onClick={() => { setAgentEnabled(p => ({ ...p, [a.id]: !p[a.id] })); toast(`${a.name} ${on ? 'disabled' : 'enabled'}`); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                              >
                                {on ? <ToggleRight size={20} color={ACCENT} /> : <ToggleLeft size={20} color="#9ca3af" />}
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: 10, color: '#6b7280' }}>{a.requestsToday} req/day</span>
                              <span style={{ fontSize: 10, fontWeight: 600, color: on ? '#16a34a' : '#9ca3af' }}>{on ? 'Active' : 'Paused'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Cost comparison */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Monthly Cost Comparison</h3>
                    <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 14 }}>Same workload, different routing strategy</p>
                    {[
                      { label: 'Without routing\n(GPT-4o only)', cost: 621, fill: '#ef4444' },
                      { label: 'With BrixOS\nHybrid Routing', cost: 187, fill: ACCENT },
                    ].map(c => (
                      <div key={c.label} style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: '#374151', fontWeight: 500, whiteSpace: 'pre-line' as const }}>{c.label}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: c.fill }}>${c.cost}</span>
                        </div>
                        <div style={{ height: 8, background: '#f3f4f6', borderRadius: 99 }}>
                          <div style={{ width: `${(c.cost / 621) * 100}%`, height: '100%', background: c.fill, borderRadius: 99 }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', textAlign: 'center' as const }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#16a34a' }}>70% cheaper</span>
                      <span style={{ fontSize: 11, color: '#6b7280' }}> with hybrid routing</span>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Request Distribution</h3>
                    <div style={{ height: 170 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={MODEL_PIE} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                            {MODEL_PIE.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <ReTooltip formatter={(v: any) => [`${v}%`, 'Requests']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {MODEL_PIE.map(m => (
                        <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#374151', flex: 1 }}>{m.name}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#111827' }}>{m.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active policies */}
                  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Active Policies</h3>
                    {[
                      'PII never leaves perimeter',
                      'Critical tasks → Claude Opus only',
                      'External API calls require approval',
                      'Data export requires MFA',
                    ].map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <CheckCircle2 size={13} color="#16a34a" />
                        <span style={{ fontSize: 11, color: '#374151' }}>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── MODELS ── */}
            {tab === 'models' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FlaskConical size={16} color={ACCENT} />
                  <span style={{ fontSize: 13, color: '#374151' }}>
                    BrixOS routes across <strong>5 models</strong> — open-source runs free on your own infra, paid models only handle complexity &amp; sensitive data.
                  </span>
                </div>
                {MODELS.map(m => {
                  const Icon = m.icon;
                  return (
                    <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <div style={{ width: 44, height: 44, background: m.color + '15', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon size={20} color={m.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>{m.name}</span>
                            <span style={{ fontSize: 11, color: m.type === 'open-source' ? '#16a34a' : '#6b7280', fontWeight: 600 }}>{m.provider}</span>
                            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: m.badgeColor + '20', color: m.badgeColor }}>
                              {m.badge}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 12 }}>
                            {[
                              { label: 'Cost', value: m.type === 'open-source' ? 'Free (self-hosted)' : m.cost + ' tokens' },
                              { label: 'Latency', value: m.latency },
                              { label: 'Quality', value: `${m.quality}/100` },
                              { label: 'Context', value: m.context },
                            ].map(f => (
                              <div key={f.label} style={{ background: '#f9fafb', borderRadius: 8, padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{f.value}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>BEST FOR:</span>
                            {m.strengths.map(s => (
                              <span key={s} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 6, background: m.color + '12', color: m.color }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' as const, flexShrink: 0 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.pct}%</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>of traffic</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 4 }}>{m.requests.toLocaleString()}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>req today</div>
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600 }}>QUALITY SCORE</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: m.color }}>{m.quality}/100</span>
                        </div>
                        <div style={{ height: 5, background: '#f3f4f6', borderRadius: 99 }}>
                          <div style={{ width: `${m.quality}%`, height: '100%', background: m.color, borderRadius: 99 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── RULES ── */}
            {tab === 'rules' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>Routing Rules</h3>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>Rules evaluated top-to-bottom — first match wins.</p>
                  </div>
                  <button
                    onClick={() => toast('Rule builder coming soon')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  >
                    + Add Rule
                  </button>
                </div>

                {rules.map((rule, i) => {
                  const model = modelById(rule.model);
                  const expanded = expandedRule === rule.id;
                  return (
                    <div key={rule.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${rule.enabled ? '#e5e7eb' : '#f3f4f6'}`, overflow: 'hidden', opacity: rule.enabled ? 1 : 0.55 }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                        onClick={() => setExpandedRule(expanded ? null : rule.id)}
                      >
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#6b7280' }}>#{i + 1}</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{rule.name}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'monospace', marginTop: 2 }}>{rule.condition}</div>
                        </div>
                        {model && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: model.color + '12', padding: '4px 10px', borderRadius: 8 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: model.color }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: model.color }}>{model.name.split(' ').slice(0, 2).join(' ')}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {rule.savings && <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>saves {rule.savings}/mo</span>}
                          <span style={{ fontSize: 11, color: '#6b7280' }}>{rule.hits.toLocaleString()} hits</span>
                          <button
                            onClick={e => { e.stopPropagation(); setRules(prev => prev.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r)); toast(`Rule ${rule.enabled ? 'disabled' : 'enabled'}`); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            {rule.enabled ? <ToggleRight size={20} color={ACCENT} /> : <ToggleLeft size={20} color="#9ca3af" />}
                          </button>
                          {expanded ? <ChevronUp size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
                        </div>
                      </div>

                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ padding: '0 18px 16px', borderTop: '1px solid #f3f4f6' }}>
                              <div style={{ paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>CONDITION</div>
                                  <code style={{ fontSize: 12, color: '#374151', fontFamily: 'monospace' }}>{rule.condition}</code>
                                </div>
                                <div style={{ background: '#f9fafb', borderRadius: 8, padding: '10px 14px' }}>
                                  <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, marginBottom: 6 }}>ROUTES TO</div>
                                  {model && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: model.color }} />
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{model.name}</span>
                                      <span style={{ fontSize: 10, color: '#6b7280' }}>{model.provider}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                <button onClick={() => toast('Rule editor coming soon')} style={{ padding: '5px 12px', borderRadius: 6, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151' }}>Edit</button>
                                <button onClick={() => toast('Rule duplicated')} style={{ padding: '5px 12px', borderRadius: 6, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#374151' }}>Duplicate</button>
                                <button onClick={() => { setRules(prev => prev.filter(r => r.id !== rule.id)); toast('Rule deleted'); }} style={{ padding: '5px 12px', borderRadius: 6, background: '#fee2e2', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#dc2626' }}>Delete</button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── SECURITY AUDIT ── */}
            {tab === 'security' && (
              <div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                      value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search actions, agents, targets…"
                      style={{ width: '100%', padding: '8px 12px 8px 32px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, outline: 'none', background: '#fff', boxSizing: 'border-box' as const }}
                    />
                  </div>
                  <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}>
                    <option value="all">All Agents</option>
                    {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12, background: '#fff', color: '#374151', cursor: 'pointer', outline: 'none' }}>
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['Agent', 'Action', 'Routed To', 'Risk', 'Status', 'Savings', 'Time'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAudit.map(row => {
                        const model = modelById(row.routed);
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 14px', fontSize: 12, fontWeight: 600, color: '#111827' }}>{row.agent}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, color: '#374151' }}>{row.action}</td>
                            <td style={{ padding: '10px 14px' }}>
                              {model ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: model.color }} />
                                  <span style={{ fontSize: 11, fontWeight: 600, color: model.color }}>{model.name.split(' ').slice(0, 2).join(' ')}</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, color: '#9ca3af' }}>— blocked —</span>
                              )}
                            </td>
                            <td style={{ padding: '10px 14px' }}><RiskBadge risk={row.risk} /></td>
                            <td style={{ padding: '10px 14px' }}><StatusBadge status={row.status} /></td>
                            <td style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: row.savings ? '#16a34a' : '#9ca3af' }}>{row.savings || '—'}</td>
                            <td style={{ padding: '10px 14px', fontSize: 11, color: '#6b7280' }}>{row.time}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── ANALYTICS ── */}
            {tab === 'analytics' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Daily Cost Savings</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>Money saved by routing to cheaper models vs GPT-4o only</p>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={DAILY_SAVINGS}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                        <ReTooltip formatter={(v: any) => [`$${v}`, 'Saved']} />
                        <Bar dataKey="savings" fill={ACCENT} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Model Usage (24h)</h3>
                  <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 16 }}>Request volume by model over the day</p>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { t: '0h', llama: 120, mistral: 80, haiku: 60, gpt4: 30 },
                        { t: '4h', llama: 90, mistral: 60, haiku: 40, gpt4: 20 },
                        { t: '8h', llama: 380, mistral: 240, haiku: 180, gpt4: 90 },
                        { t: '12h', llama: 520, mistral: 310, haiku: 240, gpt4: 130 },
                        { t: '16h', llama: 460, mistral: 280, haiku: 210, gpt4: 110 },
                        { t: '20h', llama: 280, mistral: 180, haiku: 140, gpt4: 70 },
                        { t: '24h', llama: 150, mistral: 100, haiku: 70, gpt4: 40 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="t" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <ReTooltip />
                        <Area type="monotone" dataKey="llama" stackId="1" stroke="#10B981" fill="#10B98120" name="Llama 3" />
                        <Area type="monotone" dataKey="mistral" stackId="1" stroke="#06B6D4" fill="#06B6D420" name="Mistral" />
                        <Area type="monotone" dataKey="haiku" stackId="1" stroke="#F59E0B" fill="#F59E0B20" name="Claude Haiku" />
                        <Area type="monotone" dataKey="gpt4" stackId="1" stroke={ACCENT} fill={`${ACCENT}20`} name="GPT-4o" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {[
                  { label: 'Total tokens processed', value: '22.4M', sub: 'last 30 days', color: ACCENT },
                  { label: 'Free (open-source) tokens', value: '13.9M', sub: '62% of total', color: '#10B981' },
                  { label: 'Paid API tokens', value: '8.5M', sub: '38% of total', color: '#F59E0B' },
                  { label: 'Requests blocked by policy', value: '23', sub: 'last 30 days', color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 20 }}>
                    <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
