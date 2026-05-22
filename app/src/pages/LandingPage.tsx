import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, useInView } from 'framer-motion';
import {
  MessageSquare, Shield, BookOpen, FlaskConical, Rocket, Bot,
  BrainCircuit, Headphones, Kanban, Code2, BarChart3, Globe,
  Zap, ArrowRight, CheckCircle2, Check, X,
  ChevronRight, GitBranch, Users, Building2,
  TrendingUp, Lock, Cloud, Star, DollarSign,
  Mail, Phone, MapPin, Activity,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
   ═══════════════════════════════════════════════════════════ */
const ORANGE  = '#D97757';
const ORANGE2 = '#C4623E';
const BG      = '#FAF9F6';
const BG2     = '#F2EFE9';
const CARD    = '#FFFFFF';
const TEXT    = '#1A1209';
const MUTED   = 'rgba(26,18,9,0.42)';
const BORDER  = 'rgba(26,18,9,0.09)';
const GREEN   = '#1D8A4E';
const MONO    = "'JetBrains Mono','Fira Code',monospace";

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.08, ease: [0.22,1,0.36,1] } }),
};

const FadeUp = ({ children, i = 0, className = '', style = {} }: { children: React.ReactNode; i?: number; className?: string; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  return (
    <motion.div ref={ref} variants={fadeUp} initial="hidden" animate={inView ? 'visible' : 'hidden'} custom={i} className={className} style={style}>
      {children}
    </motion.div>
  );
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${ORANGE}18`, border: `1px solid ${ORANGE}44`, borderRadius: 999, padding: '5px 14px', marginBottom: 20 }}>
    <Zap size={12} color={ORANGE} />
    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</span>
  </div>
);

const SectionHeading = ({ children, sub }: { children: React.ReactNode; sub?: string }) => (
  <div style={{ marginBottom: 16 }}>
    <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: TEXT, lineHeight: 1.15, letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>{children}</h2>
    {sub && <p style={{ marginTop: 12, fontSize: 18, color: MUTED, maxWidth: 600, lineHeight: 1.6 }}>{sub}</p>}
  </div>
);

/* Floating background letters */
const LETTERS = ['B','R','I','X','O','S','A','I'];
const FloatLetters = ({ count = 6 }: { count?: number }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none', zIndex: 0 }}>
    {Array.from({ length: count }).map((_, i) => (
      <motion.span
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.035, 0], y: [0, -30] }}
        transition={{ duration: 8 + i * 1.5, delay: i * 1.2, repeat: Infinity, repeatType: 'loop' }}
        style={{
          position: 'absolute',
          left: `${10 + (i * 15) % 80}%`,
          top: `${5 + (i * 23) % 90}%`,
          fontSize: 'clamp(60px,8vw,120px)',
          fontWeight: 900,
          color: TEXT,
          fontFamily: "'Inter',sans-serif",
          opacity: 0.025,
          lineHeight: 1,
        }}
      >
        {LETTERS[i % LETTERS.length]}
      </motion.span>
    ))}
  </div>
);

/* Pill badge */
const Badge = ({ color = GREEN, children }: { color?: string; children: React.ReactNode }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${color}18`, color, border: `1px solid ${color}44`, borderRadius: 999, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: MONO }}>
    {children}
  </span>
);

const CheckRow = ({ text, tick = true }: { text: string; tick?: boolean }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
    <CheckCircle2 size={16} color={tick ? GREEN : ORANGE} style={{ marginTop: 2, flexShrink: 0 }} />
    <span style={{ fontSize: 15, color: MUTED, lineHeight: 1.5 }}>{text}</span>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TERMINAL COMPONENT
   ═══════════════════════════════════════════════════════════ */
const TERMINAL_LINES = [
  { delay: 0,    text: '$ brix agent deploy --env staging',  color: '#7DD3FC' },
  { delay: 0.8,  text: '→ Dev Agent: picking up task #BX-142', color: '#86EFAC' },
  { delay: 1.6,  text: '→ Writing code... 47 lines committed', color: '#86EFAC' },
  { delay: 2.4,  text: '→ QA Agent: running test suite…',     color: '#FDE68A' },
  { delay: 3.2,  text: '  ✓ 148/148 tests passing',           color: '#86EFAC' },
  { delay: 4.0,  text: '→ DevOps Agent: deploying to staging', color: '#FDE68A' },
  { delay: 4.8,  text: '  ✓ Deploy complete — v2.3.1 live',   color: '#86EFAC' },
  { delay: 5.6,  text: '→ Support Agent: updating release notes', color: '#FDE68A' },
  { delay: 6.4,  text: '$ _',                                 color: '#D97757' },
];

const TerminalLine = ({ line, started }: { line: typeof TERMINAL_LINES[0]; started: boolean }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!started) return;
    const t = setTimeout(() => setVisible(true), line.delay * 1000);
    return () => clearTimeout(t);
  }, [started, line.delay]);
  if (!visible) return null;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} style={{ fontFamily: MONO, fontSize: 13, color: line.color, lineHeight: 1.7 }}>
      {line.text}
    </motion.div>
  );
};

const TerminalMockup = () => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  return (
    <div ref={ref} style={{ background: '#0D1117', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.45)', maxWidth: 520, width: '100%' }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#161B22' }}>
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F56' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#FFBD2E' }} />
        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27C93F' }} />
        <span style={{ marginLeft: 8, fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>brix-os — terminal</span>
      </div>
      <div style={{ padding: '20px 24px', minHeight: 220 }}>
        {TERMINAL_LINES.map((l, i) => <TerminalLine key={i} line={l} started={inView} />)}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODULES DATA
   ═══════════════════════════════════════════════════════════ */
interface Module {
  icon: React.ElementType;
  title: string;
  category: string;
  replaces: string;
  features: string;
  color: string;
  isNew?: boolean;
}

const MODULES: Module[] = [
  { icon: MessageSquare, title: 'Brix Connect',  category: 'Collaboration',  replaces: 'Teams + Zoom + Outlook',    features: 'Chat · Calls · Email · Calendar',              color: '#3D7E6E' },
  { icon: Code2,         title: 'Brix Code',     category: 'Development',    replaces: 'GitHub + IDE',              features: 'Git · In-platform IDE · Code Review',          color: '#6B5EA8' },
  { icon: Kanban,        title: 'Brix Manage',   category: 'Project Mgmt',   replaces: 'Jira + Linear',             features: 'Sprints · Roadmaps · AI Standups',             color: ORANGE    },
  { icon: FlaskConical,  title: 'Brix Test',     category: 'QA & Testing',   replaces: 'TestRail + Xray',           features: 'Test cases · Runs · AI Test Gen',              color: '#B07030' },
  { icon: Rocket,        title: 'Brix Deploy',   category: 'DevOps',         replaces: 'Jenkins + ArgoCD',          features: 'CI/CD · Infra · One-click Deploy',             color: '#C44F4F' },
  { icon: BookOpen,      title: 'Brix Docs',     category: 'Documentation',  replaces: 'Confluence + Notion',       features: 'Wiki · API Docs · AI Summaries',               color: '#2D7FA8' },
  { icon: BarChart3,     title: 'Brix Insights', category: 'Analytics',      replaces: 'Tableau + Looker',          features: 'Velocity · Code Quality · Reports',            color: '#5A8A3E' },
  { icon: Shield,        title: 'Brix Shield',   category: 'Security',       replaces: 'Zscaler + Okta',            features: 'Zero Trust · SSO · Audit Logs',                color: '#A84040' },
  { icon: Headphones,    title: 'Brix Support',  category: 'Support',        replaces: 'Zendesk + Freshdesk',       features: 'Ticketing · AI Resolution · SLA',              color: '#6B5EA8' },
  { icon: BrainCircuit,  title: 'Brix Gateway',  category: 'AI Gateway',     replaces: 'OpenAI API layer',          features: 'LLM Routing · Cost Ctrl · Privacy',            color: ORANGE, isNew: true },
];

/* ═══════════════════════════════════════════════════════════
   GATEWAY FEATURES
   ═══════════════════════════════════════════════════════════ */
const GATEWAY_FEATURES = [
  { icon: Lock,      title: 'Data Privacy & Masking',   desc: 'PII stripped before any LLM call. Enterprise data never leaves your control.' },
  { icon: DollarSign,title: 'Cost Governance',           desc: 'Budget caps per team/module. Smart caching reduces API calls by 40%.' },
  { icon: Globe,     title: 'Smart LLM Routing',         desc: 'Route to GPT-4, Claude, Gemini, or local models by task type & cost.' },
  { icon: Activity,  title: 'Usage Analytics',           desc: 'Real-time dashboards for token usage, model performance, spend per team.' },
  { icon: Shield,    title: 'Compliance & Audit Logs',   desc: 'Every AI call logged, auditable. SOC2-ready from day one.' },
  { icon: Zap,       title: 'Supported LLMs',            desc: 'GPT-4 / GPT-4o, Claude 3.5+, Gemini Pro, Llama 3 (Local), Mistral, Custom Models' },
];

/* ═══════════════════════════════════════════════════════════
   AI AGENTS DATA
   ═══════════════════════════════════════════════════════════ */
const AI_AGENTS = [
  {
    name: 'Dev Agent', role: 'Jr/Sr/Lead', icon: Code2,
    tasks: [
      'Picks up sprint tasks, writes code, commits to Git',
      'Opens PRs, responds to review comments & re-commits',
      'Messages team with blockers, schedules clarification calls',
    ],
  },
  {
    name: 'QA Agent', role: 'QA Engineer', icon: FlaskConical,
    tasks: [
      'Runs full test suites per defined acceptance criteria',
      'Files defect tickets with steps, assigns to Dev Agent',
      'Signs off on coverage report before merge is allowed',
    ],
  },
  {
    name: 'DevOps Agent', role: 'DevOps Eng', icon: Rocket,
    tasks: [
      'Manages pipeline gates, deploy approvals, rollbacks',
      'Monitors infra health, pages team channel on anomalies',
      'Provisions environments on demand for QA testing',
    ],
  },
  {
    name: 'Support Agent', role: 'Support Eng', icon: Headphones,
    tasks: [
      'Resolves Tier-1 tickets referencing knowledge base',
      'Escalates with full context transcript to human agent',
      'Generates weekly support quality report in team channel',
    ],
  },
];

const AGENT_BEHAVIORS = [
  { title: 'Reply in chat', desc: '@Dev Agent fix this bug → Agent responds in seconds, creates a branch, commits a fix, posts the PR link in the same thread.' },
  { title: 'Attend standups', desc: 'AI agents join video standups as participants, take notes, update sprint tasks in real time — no separate briefing needed.' },
  { title: 'Call meetings', desc: 'If QA Agent is blocked by an ambiguous requirement, it schedules a meeting with the PM and Tech Lead — just like a human would.' },
  { title: 'Have memory', desc: 'Agents retain sprint history, architecture decisions, past bugs, and team preferences — context never resets between sessions.' },
];

/* ═══════════════════════════════════════════════════════════
   HOW IT WORKS (9 STEPS)
   ═══════════════════════════════════════════════════════════ */
const FLOW_STEPS = [
  { num: '01', title: 'Plan',      who: 'PM + PM Agent',          icon: Kanban    },
  { num: '02', title: 'Design',    who: 'Tech Lead',               icon: GitBranch },
  { num: '03', title: 'Code',      who: 'Dev + Dev Agent',         icon: Code2     },
  { num: '04', title: 'PR Review', who: 'Lead + AI',               icon: CheckCircle2 },
  { num: '05', title: 'CI Build',  who: 'DevOps Agent',            icon: Rocket    },
  { num: '06', title: 'QA Test',   who: 'QA Lead + Agent',         icon: FlaskConical },
  { num: '07', title: 'Staging',   who: 'DevOps Agent',            icon: Cloud     },
  { num: '08', title: 'Release',   who: 'Tech Lead',               icon: Zap       },
  { num: '09', title: 'Monitor',   who: 'Support Agent',           icon: Activity  },
];

/* ═══════════════════════════════════════════════════════════
   COMPETITIVE TABLE DATA
   ═══════════════════════════════════════════════════════════ */
type CellVal = 'full' | 'partial' | 'none' | string;

interface CompRow {
  feature: string;
  ms365: CellVal;
  atlassian: CellVal;
  notion: CellVal;
  brix: CellVal;
}

const COMP_ROWS: CompRow[] = [
  { feature: 'Unified Platform',         ms365: 'Partial',      atlassian: 'DevOps only', notion: 'Partial',  brix: 'Full Suite'    },
  { feature: 'Native AI Agents',         ms365: 'Copilot addon',atlassian: '❌ None',     notion: '❌ None',  brix: 'Core Design'   },
  { feature: 'Human+AI Collaboration',   ms365: '❌ None',      atlassian: '❌ None',     notion: '❌ None',  brix: 'Built-in'      },
  { feature: 'AI Gateway Built-in',      ms365: '❌ No',        atlassian: '❌ No',       notion: '❌ No',    brix: 'Native'        },
  { feature: 'CI/CD + Pipeline',         ms365: '❌ None',      atlassian: 'Partial',     notion: '❌ None',  brix: 'Native'        },
  { feature: 'India INR Pricing',        ms365: '❌ USD only',  atlassian: '❌ USD only', notion: '❌ USD only', brix: '₹ Native'   },
  { feature: 'LLM Cost Governance',      ms365: '❌ No',        atlassian: '❌ No',       notion: '❌ No',    brix: 'Native'        },
  { feature: 'SOC2 Compliance',          ms365: '✅',           atlassian: '✅',          notion: 'Partial',  brix: 'Built-in'      },
];

/* ═══════════════════════════════════════════════════════════
   PRICING DATA
   ═══════════════════════════════════════════════════════════ */
const PLANS = [
  {
    name: 'Starter', price: '₹499', period: '/user/month', users: 'Up to 50 users',
    popular: false, color: '#3D7E6E',
    features: ['Chat, Calls & Calendar', 'Email & AI Inbox', 'Project Management', 'CI/CD Pipeline basics', '2 AI Agents', 'Brix Gateway (Basic)'],
  },
  {
    name: 'Growth', price: '₹799', period: '/user/month', users: '50–500 users',
    popular: true, color: ORANGE,
    features: ['All Starter modules', 'Full Code + Pipeline', 'Test Management', 'DevOps Agent', '10 AI Agents', 'Brix Gateway (Full)'],
  },
  {
    name: 'Enterprise', price: '₹1,200', period: '/user/month', users: '500+ users',
    popular: false, color: '#6B5EA8',
    features: ['All modules + custom', 'Unlimited AI Agents', 'Dedicated infrastructure', 'SOC2 + Compliance', 'White-label option', 'Brix Gateway (Advanced)'],
  },
];

/* ═══════════════════════════════════════════════════════════
   TEAM DATA
   ═══════════════════════════════════════════════════════════ */
const TEAM = [
  {
    name: 'Sonadarshan N G', role: 'Founder & CEO', years: '7 Years', domain: 'Engineering',
    past: ['Extreme Networks', 'Juniper Networks', 'Zscaler', 'Ivanti', 'Netskope'],
    bullets: [
      '7 years at network security & enterprise SaaS leaders globally',
      'Deep Zero Trust, cloud security & enterprise architecture expertise',
      'Built products used by Fortune 500 enterprises at Zscaler / Netskope',
      'Resigned from ₹3.5L/month position — 100% focused on Brix OS',
    ],
  },
  {
    name: 'Sandesha H G', role: 'Co-Founder & CTO', years: '7 Years', domain: 'Tech & Management',
    past: ['Synmedia', 'Motive', 'Omind', 'Visa'],
    bullets: [
      'Dual expertise: technical depth AND product management leadership',
      'Fintech scale experience at Visa — compliance, security, high reliability',
      'Resigned full-time to build Brix OS from day one',
      'Technical + management track — bridges engineering & business needs',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   MIGRATION STEPS
   ═══════════════════════════════════════════════════════════ */
const MIGRATION_STEPS = [
  {
    phase: 'Week 1-2', title: 'Discovery & Audit', color: '#3D7E6E',
    items: ['Map all tools (GitHub, Jira, Slack, Confluence)', 'Audit data volume/users/integrations', 'Assign dedicated Brix OS migration engineer', 'Zero cost to customer'],
  },
  {
    phase: 'Week 3-4', title: 'Parallel Setup', color: ORANGE,
    items: ['Deploy on customer\'s preferred cloud (AWS/GCP/Azure)', 'SSO provisioning one click', 'Historical data migrated (repos, tickets, docs, wiki)', 'Existing tools continue to work — zero disruption'],
  },
  {
    phase: 'Month 2', title: 'Training & Transition', color: '#6B5EA8',
    items: ['Department-by-department onboarding', 'AI agents configured for customer\'s specific workflow & tech stack', 'Brix Gateway configured with customer\'s LLM API keys', 'Slack/Teams message history exported'],
  },
  {
    phase: 'Month 3', title: 'Full Cutover', color: '#B07030',
    items: ['Teams fully migrated', '30-day post-cutover hypercare support', 'Metrics dashboard comparing productivity gains vs before migration'],
  },
];

/* ═══════════════════════════════════════════════════════════
   ROADMAP
   ═══════════════════════════════════════════════════════════ */
const ROADMAP = [
  { quarter: 'Q4 2025', title: 'Ideation',    desc: 'Market research, architecture & tech stack chosen', done: true  },
  { quarter: 'Q1 2026', title: 'Core Build',  desc: '10 modules built, AI agent framework operational',   done: true  },
  { quarter: 'Q2 2026', title: 'MVP Complete',desc: 'End-to-end demo with live AI agent collaboration',   current: true },
  { quarter: 'Q3 2026', title: 'Beta Launch', desc: '3 enterprise customers, closed beta, free trial',    done: false },
  { quarter: 'Q4 2026', title: 'GA + SOC2',   desc: 'Public GA, SOC2 Type II, pan-India sales launch',   done: false },
];

/* ═══════════════════════════════════════════════════════════
   USE OF FUNDS
   ═══════════════════════════════════════════════════════════ */
const FUNDS = [
  { label: 'Engineering Team',   pct: 38, amount: '₹4.56 Cr', color: ORANGE    },
  { label: 'Cloud Infrastructure',pct: 15, amount: '₹1.8 Cr',  color: '#3D7E6E' },
  { label: 'SOC2 Certification', pct: 12, amount: '₹1.44 Cr', color: '#6B5EA8' },
  { label: 'Sales & Marketing',  pct: 12, amount: '₹1.44 Cr', color: '#B07030' },
  { label: 'Customer Success',   pct:  7, amount: '₹0.84 Cr', color: '#2D7FA8' },
  { label: 'Product & Design',   pct:  6, amount: '₹0.72 Cr', color: '#A84040' },
  { label: 'Legal & Finance',    pct:  5, amount: '₹0.6 Cr',  color: '#5A8A3E' },
  { label: 'Contingency',        pct:  5, amount: '₹0.6 Cr',  color: MUTED     },
];

/* ═══════════════════════════════════════════════════════════
   CELL RENDERER
   ═══════════════════════════════════════════════════════════ */
const CellIcon = ({ val, isBrix }: { val: CellVal; isBrix: boolean }) => {
  const isCheck = val === '✅' || (isBrix && !val.startsWith('❌'));
  const isCross = val.startsWith('❌');
  if (isCross) return <span style={{ color: '#C44F4F', fontSize: 13, fontWeight: 600 }}>{val}</span>;
  if (val === '✅' || (isBrix && isCheck))
    return <span style={{ color: isBrix ? GREEN : '#888', fontSize: 13, fontWeight: 600 }}>{isBrix ? `✅ ${val}` : val}</span>;
  return <span style={{ color: isBrix ? ORANGE : MUTED, fontSize: 13, fontWeight: isBrix ? 700 : 400 }}>{val}</span>;
};

/* ═══════════════════════════════════════════════════════════
   SHARED BUTTON STYLES (declared before component to avoid temporal dead zone)
   ═══════════════════════════════════════════════════════════ */
const btnPrimary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '13px 24px',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 15,
  background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`,
  color: '#fff',
  fontFamily: "'Inter',sans-serif",
  transition: 'opacity 0.2s, transform 0.2s',
  textDecoration: 'none',
};

const btnSecondary: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '13px 24px',
  borderRadius: 10,
  border: `1px solid ${BORDER}`,
  cursor: 'pointer',
  fontWeight: 700,
  fontSize: 15,
  background: CARD,
  color: TEXT,
  fontFamily: "'Inter',sans-serif",
  transition: 'background 0.2s, transform 0.2s',
  textDecoration: 'none',
};

const navBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: `1px solid transparent`,
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
  background: 'transparent',
  fontFamily: "'Inter',sans-serif",
  transition: 'all 0.2s',
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Scroll fix ── */
  useEffect(() => {
    const body = document.body;
    const html = document.documentElement;
    const pb = body.style.overflow;
    const ph = html.style.overflow;
    body.style.setProperty('overflow', 'auto', 'important');
    html.style.setProperty('overflow', 'auto', 'important');
    return () => { body.style.overflow = pb; html.style.overflow = ph; };
  }, []);

  /* ── Font loading ── */
  useEffect(() => {
    const id = 'brixos-fonts';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ── Nav scroll state ── */
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = () => setScrolled(container.scrollTop > 60);
    container.addEventListener('scroll', handler);
    return () => container.removeEventListener('scroll', handler);
  }, []);

  const s: React.CSSProperties = { fontFamily: "'Inter',sans-serif", color: TEXT };

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 10, background: BG }}
    >

      {/* ════════════════════════════ NAV ════════════════════════════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(250,249,246,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${BORDER}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        padding: '0 clamp(16px,5vw,80px)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => scrollTo('hero')}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 14, fontFamily: MONO }}>B</span>
            </div>
            <span style={{ fontWeight: 800, fontSize: 18, color: TEXT, letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>Brix OS</span>
          </div>
          {/* Nav links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => scrollTo('demo')} style={{ ...navBtnStyle, background: `${ORANGE}18`, color: ORANGE, border: `1px solid ${ORANGE}44` }}>
              Request Demo
            </button>
            <button onClick={() => navigate('/login')} style={{ ...navBtnStyle, color: MUTED }}>
              Sign In
            </button>
            <button onClick={() => navigate('/signup')} style={{ ...navBtnStyle, background: `linear-gradient(135deg, ${ORANGE}, ${ORANGE2})`, color: '#fff', border: 'none' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════ HERO ════════════════════════════ */}
      <section id="hero" style={{ ...s, position: 'relative', padding: 'clamp(60px,8vw,120px) clamp(16px,5vw,80px)', overflow: 'hidden' }}>
        <FloatLetters count={8} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp i={0}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              <Badge color={GREEN}>DPIIT Recognised Startup</Badge>
              <Badge color={ORANGE}>MVP Demo Ready</Badge>
              <Badge color="#6B5EA8">Bengaluru, India</Badge>
            </div>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 48, alignItems: 'center' }}>
            <div>
              <FadeUp i={1}>
                <h1 style={{ fontSize: 'clamp(36px,5.5vw,72px)', fontWeight: 900, color: TEXT, lineHeight: 1.08, letterSpacing: '-0.03em', fontFamily: "'Inter',sans-serif", marginBottom: 24 }}>
                  One Platform.<br />
                  <span style={{ color: ORANGE }}>Ten Tools.</span><br />
                  AI Agents<br />
                  That Actually Ship.
                </h1>
              </FadeUp>
              <FadeUp i={2}>
                <p style={{ fontSize: 19, color: MUTED, lineHeight: 1.65, marginBottom: 32, maxWidth: 500 }}>
                  Brix OS replaces your entire SaaS stack — Jira, GitHub, Confluence, Slack, Zoom, Zendesk and more — with a single unified platform where human engineers and AI agents collaborate in real time.
                </p>
              </FadeUp>
              <FadeUp i={3}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button onClick={() => scrollTo('demo')} style={{ ...btnPrimary }}>
                    Request Demo <ArrowRight size={16} style={{ marginLeft: 6 }} />
                  </button>
                  <button onClick={() => scrollTo('solution')} style={{ ...btnSecondary }}>
                    See All Modules <ChevronRight size={16} style={{ marginLeft: 4 }} />
                  </button>
                </div>
              </FadeUp>

              {/* Hero stats */}
              <FadeUp i={4}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16, marginTop: 40 }}>
                  {[
                    { val: '10', label: 'Modules Built' },
                    { val: '4',  label: 'AI Agent Roles Live' },
                    { val: '3',  label: 'Enterprise Discussions' },
                    { val: 'MVP',label: 'Demo Ready' },
                  ].map((s, i) => (
                    <div key={i} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: ORANGE, fontFamily: MONO, lineHeight: 1 }}>{s.val}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </FadeUp>
            </div>

            <FadeUp i={2} style={{ display: 'flex', justifyContent: 'center' }}>
              <TerminalMockup />
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ PROBLEM ════════════════════════════ */}
      <section id="problem" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>The Problem</SectionLabel>
            <SectionHeading sub="Two compounding problems killing engineering productivity in every enterprise.">
              Why Enterprises Are Bleeding Money & Talent
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 28, marginTop: 40 }}>
            {/* Problem 1 */}
            <FadeUp i={1}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, height: '100%' }}>
                <div style={{ display: 'inline-flex', padding: 12, borderRadius: 12, background: `${ORANGE}18`, marginBottom: 20 }}>
                  <DollarSign size={24} color={ORANGE} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>Enterprise Tool Sprawl</h3>
                <p style={{ color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>Enterprises pay <strong style={{ color: ORANGE }}>₹10,835+/engineer/month</strong> across fragmented tools. Only 31% of time is coding — 69% is lost to tool chaos.</p>

                {/* Time breakdown bar */}
                <div style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Where Engineers Spend Their Day</p>
                  {[
                    { label: 'Coding', hours: '2.5h', pct: 31, color: GREEN      },
                    { label: 'Tool Switching', hours: '2.1h', pct: 26, color: ORANGE    },
                    { label: 'Meetings', hours: '1.8h', pct: 22, color: '#B07030' },
                    { label: 'Recovery', hours: '1.6h', pct: 20, color: '#C44F4F' },
                  ].map((b, i) => (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: MUTED }}>{b.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: b.color }}>{b.hours}</span>
                      </div>
                      <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${b.pct}%`, background: b.color, borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 10, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Tool Cost Breakdown</p>
                {[
                  { tool: 'Microsoft 365 E3', cost: '₹3,276' },
                  { tool: 'Jira + Confluence',  cost: '₹2,343' },
                  { tool: 'GitHub Enterprise',  cost: '₹1,911' },
                  { tool: 'Zscaler Business',   cost: '₹1,638' },
                  { tool: 'Zoom Enterprise',    cost: '₹1,667' },
                ].map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 13, color: MUTED }}>{t.tool}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: ORANGE }}>{t.cost}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: `2px solid ${ORANGE}44`, marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>Total / Engineer / Month</span>
                  <span style={{ fontSize: 16, fontWeight: 900, fontFamily: MONO, color: ORANGE }}>₹10,835+</span>
                </div>
              </div>
            </FadeUp>

            {/* Problem 2 */}
            <FadeUp i={2}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, height: '100%' }}>
                <div style={{ display: 'inline-flex', padding: 12, borderRadius: 12, background: `${ORANGE}18`, marginBottom: 20 }}>
                  <Bot size={24} color={ORANGE} />
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 8, fontFamily: "'Inter',sans-serif" }}>AI Agents Alone Can't Ship Products</h3>
                <p style={{ color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>Cursor, Codex generate code snippets, not products. Real enterprise needs: humans + process + controlled AI.</p>

                {/* Table */}
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: BG2 }}>
                    <div style={{ padding: '10px 14px', borderRight: `1px solid ${BORDER}`, fontSize: 12, fontWeight: 800, fontFamily: MONO, color: ORANGE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Today</div>
                    <div style={{ padding: '10px 14px', fontSize: 12, fontWeight: 800, fontFamily: MONO, color: GREEN, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Enterprise Reality</div>
                  </div>
                  {[
                    ['Generate code snippets',      'Reviewed, tested, deployed code'],
                    ['Work in isolation',            'Collaborate with PM, QA, DevOps'],
                    ['No sprint context',            'Sprint history & architecture memory'],
                    ['Uncontrolled API spend',       'Smart routing, cost governance'],
                    ['Data sent to cloud APIs',      'Enterprise data stays private'],
                    ['Ignores compliance',           'SOC2, audit trails, access controls'],
                  ].map(([a, b], i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: `1px solid ${BORDER}` }}>
                      <div style={{ padding: '10px 14px', borderRight: `1px solid ${BORDER}`, fontSize: 13, color: MUTED, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <X size={12} color="#C44F4F" style={{ flexShrink: 0 }} /> {a}
                      </div>
                      <div style={{ padding: '10px 14px', fontSize: 13, color: TEXT, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                        <Check size={12} color={GREEN} style={{ flexShrink: 0 }} /> {b}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ SOLUTION: 10 MODULES ════════════════════════════ */}
      <section id="solution" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={6} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>The Solution</SectionLabel>
            <SectionHeading sub="10 deeply integrated modules replace your entire SaaS stack. One subscription, one login, one platform.">
              Everything Your Engineering Org Needs
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20, marginTop: 40 }}>
            {MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <FadeUp key={mod.title} i={i % 5}>
                  <div style={{ background: CARD, border: `1px solid ${mod.isNew ? ORANGE + '66' : BORDER}`, borderRadius: 16, padding: 24, height: '100%', position: 'relative', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${BORDER}`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}>
                    {mod.isNew && (
                      <div style={{ position: 'absolute', top: 16, right: 16, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, color: '#fff', fontSize: 10, fontWeight: 800, fontFamily: MONO, padding: '3px 8px', borderRadius: 999, letterSpacing: '0.06em' }}>★ NEW</div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${mod.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={22} color={mod.color} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{mod.title}</div>
                        <div style={{ fontSize: 12, color: MUTED }}>{mod.category}</div>
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Replaces: </span>
                      <span style={{ fontSize: 12, color: ORANGE, fontWeight: 700 }}>{mod.replaces}</span>
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, fontFamily: MONO }}>{mod.features}</div>
                  </div>
                </FadeUp>
              );
            })}
          </div>

          {/* Savings callout */}
          <FadeUp i={3}>
            <div style={{ marginTop: 40, background: `linear-gradient(135deg,${ORANGE}18,${ORANGE}08)`, border: `1px solid ${ORANGE}44`, borderRadius: 20, padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 24, fontWeight: 800, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
                Replace <span style={{ color: ORANGE }}>₹10,835/user/month</span> in tools with <span style={{ color: GREEN }}>₹799/user/month</span>
              </p>
              <p style={{ color: MUTED, marginTop: 8, fontSize: 16 }}>Save <strong style={{ color: ORANGE }}>89%</strong> on software costs — without losing any capability.</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ BRIX GATEWAY ════════════════════════════ */}
      <section id="gateway" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Brix Gateway ★ New</SectionLabel>
            <SectionHeading sub="The enterprise AI gateway that keeps your data private, your costs controlled, and your compliance intact.">
              Your AI Command Center
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20, marginTop: 40 }}>
            {GATEWAY_FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <FadeUp key={f.title} i={i % 3}>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${ORANGE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={ORANGE} />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{f.title}</span>
                    </div>
                    <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </FadeUp>
              );
            })}
          </div>

          {/* LLM grid */}
          <FadeUp i={2}>
            <div style={{ marginTop: 40, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32 }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: TEXT, marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>Supported LLMs — Route by task type & cost</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['GPT-4', 'GPT-4o', 'Claude 3.5+', 'Gemini Pro', 'Llama 3 (Local)', 'Mistral', 'Custom Models'].map(llm => (
                  <span key={llm} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 600, fontFamily: MONO, color: TEXT }}>{llm}</span>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ AI AGENTS ════════════════════════════ */}
      <section id="agents" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={6} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>AI Agents</SectionLabel>
            <SectionHeading sub="Not chatbots. Real AI team members with roles, responsibilities, and sprint context — working alongside your engineers.">
              4 AI Agent Roles, Live Today
            </SectionHeading>
          </FadeUp>

          {/* Agent cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20, marginTop: 40 }}>
            {AI_AGENTS.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <FadeUp key={agent.name} i={i % 4}>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, background: `${ORANGE}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={24} color={ORANGE} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{agent.name}</div>
                        <Badge color={ORANGE}>{agent.role}</Badge>
                      </div>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {agent.tasks.map((t, j) => (
                        <li key={j} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: j < agent.tasks.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                          <ChevronRight size={14} color={ORANGE} style={{ marginTop: 3, flexShrink: 0 }} />
                          <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{t}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeUp>
              );
            })}
          </div>

          {/* Behaviors */}
          <FadeUp i={2}>
            <div style={{ marginTop: 40 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>What Makes Brix Agents Different</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
                {AGENT_BEHAVIORS.map((b, i) => (
                  <FadeUp key={b.title} i={i % 4}>
                    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: ORANGE, marginBottom: 8, fontFamily: MONO }}>→ {b.title}</div>
                      <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>{b.desc}</p>
                    </div>
                  </FadeUp>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ HOW IT WORKS ════════════════════════════ */}
      <section id="how" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Engineering Flow</SectionLabel>
            <SectionHeading sub="Every step of the engineering lifecycle — from planning to monitoring — unified in one platform, with AI agents at every stage.">
              9-Step End-to-End Engineering Flow
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginTop: 40 }}>
            {FLOW_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isAI = step.who.includes('Agent');
              return (
                <FadeUp key={step.num} i={i % 5}>
                  <div style={{ background: CARD, border: `1px solid ${isAI ? ORANGE + '66' : BORDER}`, borderRadius: 14, padding: 20, textAlign: 'center' }}>
                    <div style={{ fontFamily: MONO, fontSize: 12, color: ORANGE, fontWeight: 700, marginBottom: 10 }}>{step.num}</div>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: isAI ? `${ORANGE}18` : BG2, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={22} color={isAI ? ORANGE : MUTED} />
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: TEXT, marginBottom: 6, fontFamily: "'Inter',sans-serif" }}>{step.title}</div>
                    <div style={{ fontSize: 12, color: isAI ? ORANGE : MUTED, fontWeight: isAI ? 700 : 400, fontFamily: MONO }}>{step.who}</div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ MARKET ════════════════════════════ */}
      <section id="market" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Market Opportunity</SectionLabel>
            <SectionHeading sub="India-first. Underserved by global tools. Perfect timing.">
              A Massive, Underserved Market
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 28, marginTop: 40 }}>
            {/* SAM / SOM */}
            <FadeUp i={1}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: TEXT, marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>Market Size</p>
                {[
                  { label: 'SAM', val: '$120B', desc: 'Serviceable Addressable Market' },
                  { label: 'SOM', val: '$8B',   desc: 'Serviceable Obtainable Market' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <div>
                      <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: ORANGE, textTransform: 'uppercase' }}>{m.label}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{m.desc}</div>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 900, fontFamily: MONO, color: TEXT }}>{m.val}</div>
                  </div>
                ))}
                <div style={{ marginTop: 20 }}>
                  {[
                    '25,000+ Tech companies in India',
                    '3.5M+ Software developers',
                    '$50B India SaaS market by 2030',
                    '40%+ AI adoption YoY',
                    '₹10,835 avg monthly tool spend per engineer',
                  ].map(item => <CheckRow key={item} text={item} />)}
                </div>
              </div>
            </FadeUp>

            {/* Why Now */}
            <FadeUp i={2}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: TEXT, marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>Why Now?</p>
                {[
                  { title: 'AI agents proven', body: 'Need integration not bolt-on. The infrastructure is ready.' },
                  { title: 'CIOs mandated', body: 'Cut SaaS sprawl 40%+. Budget pressure is forcing consolidation.' },
                  { title: 'India\'s $50B SaaS market', body: 'Reaching scale by 2030. Local-first pricing wins deals.' },
                  { title: 'Window is open now', body: 'No platform unifies all tools + AI agents. First mover advantage.' },
                ].map((item, i) => (
                  <div key={i} style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: ORANGE, marginBottom: 4, fontFamily: "'Inter',sans-serif" }}>{item.title}</div>
                    <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0 }}>{item.body}</p>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ COMPETITIVE ════════════════════════════ */}
      <section id="competitive" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={4} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Competitive Analysis</SectionLabel>
            <SectionHeading sub="No one else does this. Not Microsoft. Not Atlassian. Not Notion.">
              Brix OS vs The Competition
            </SectionHeading>
          </FadeUp>

          <FadeUp i={1} style={{ marginTop: 40, overflowX: 'auto' }}>
            <div style={{ minWidth: 700, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr', background: BG2, borderBottom: `1px solid ${BORDER}` }}>
                <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 700, color: MUTED, fontFamily: MONO }}>Feature</div>
                {['Microsoft 365', 'Atlassian Suite', 'Notion + Slack', 'Brix OS'].map((h, i) => (
                  <div key={h} style={{ padding: '14px 14px', fontSize: 13, fontWeight: 800, color: i === 3 ? ORANGE : MUTED, textAlign: 'center', fontFamily: i === 3 ? MONO : undefined, borderLeft: `1px solid ${BORDER}` }}>
                    {i === 3 ? '⭐ ' : ''}{h}
                  </div>
                ))}
              </div>
              {COMP_ROWS.map((row, i) => (
                <div key={row.feature} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.2fr', borderTop: `1px solid ${BORDER}`, background: i % 2 === 0 ? CARD : `${BG2}88` }}>
                  <div style={{ padding: '12px 20px', fontSize: 14, fontWeight: 600, color: TEXT }}>{row.feature}</div>
                  {[row.ms365, row.atlassian, row.notion, row.brix].map((val, j) => (
                    <div key={j} style={{ padding: '12px 14px', textAlign: 'center', borderLeft: `1px solid ${BORDER}`, background: j === 3 ? `${ORANGE}08` : undefined }}>
                      <CellIcon val={val} isBrix={j === 3} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ TRACTION ════════════════════════════ */}
      <section id="traction" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Traction & Roadmap</SectionLabel>
            <SectionHeading sub="Real progress, real pipeline, real momentum.">
              Where We Are Today
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 28, marginTop: 40 }}>
            {/* Traction */}
            <FadeUp i={1}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: TEXT, marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>Real Traction</p>
                {[
                  { val: '10',   label: 'Modules Built' },
                  { val: '4',    label: 'AI Agent Roles Live' },
                  { val: '3',    label: 'Enterprise Discussions Underway' },
                  { val: '₹5.76 Cr', label: 'Combined ARR Potential' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontSize: 15, color: MUTED }}>{item.label}</span>
                    <span style={{ fontSize: 22, fontWeight: 900, fontFamily: MONO, color: ORANGE }}>{item.val}</span>
                  </div>
                ))}
                <div style={{ marginTop: 20, background: BG2, borderRadius: 12, padding: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: TEXT, marginBottom: 10, fontFamily: "'Inter',sans-serif" }}>Enterprise Pipeline</p>
                  {[
                    { label: 'Customer A (~3,000 employees)', arr: '₹4.32 Cr/yr' },
                    { label: 'Customer B (~500 employees)',   arr: '₹72L/yr' },
                    { label: 'Customer C (~500 employees)',   arr: '₹72L/yr' },
                  ].map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                      <span style={{ fontSize: 13, color: MUTED }}>{c.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: GREEN }}>{c.arr}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Roadmap */}
            <FadeUp i={2}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32 }}>
                <p style={{ fontWeight: 800, fontSize: 18, color: TEXT, marginBottom: 24, fontFamily: "'Inter',sans-serif" }}>Roadmap</p>
                {ROADMAP.map((r, i) => (
                  <div key={r.quarter} style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: r.done ? GREEN : r.current ? ORANGE : BORDER, border: `2px solid ${r.done ? GREEN : r.current ? ORANGE : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {r.done ? <Check size={14} color="#fff" /> : r.current ? <Star size={12} color="#fff" fill="#fff" /> : null}
                      </div>
                      {i < ROADMAP.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: r.done ? `${GREEN}44` : BORDER, marginTop: 4 }} />}
                    </div>
                    <div style={{ paddingBottom: i < ROADMAP.length - 1 ? 8 : 0 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: r.done ? GREEN : r.current ? ORANGE : MUTED }}>{r.quarter}</span>
                        {r.current && <Badge color={ORANGE}>Current</Badge>}
                        {r.done && <Badge color={GREEN}>✓ Done</Badge>}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{r.title}</div>
                      <div style={{ fontSize: 13, color: MUTED, marginTop: 2 }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ VALUE PROPOSITION ════════════════════════════ */}
      <section id="value" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Value Proposition</SectionLabel>
            <SectionHeading sub="Clear ROI at every company stage.">
              Savings by Segment
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 20, marginTop: 40 }}>
            {[
              { segment: 'Solo Founder', current: '₹150–250/mo', brix: '₹499/month', benefit: '3× faster shipping', icon: Users, color: '#3D7E6E' },
              { segment: 'Small Teams', current: '₹3,500–5,000/person', brix: '₹799/month', benefit: '₹2,700+ saved/engineer/mo', icon: Building2, color: ORANGE },
              { segment: 'Enterprise', current: '₹10,835/user', brix: '₹1,200/user/month', benefit: '₹1 Cr+ saved / 100 engineers / mo', icon: TrendingUp, color: '#6B5EA8' },
            ].map((seg, i) => {
              const Icon = seg.icon;
              return (
                <FadeUp key={seg.segment} i={i}>
                  <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 28, height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${seg.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={seg.color} />
                      </div>
                      <span style={{ fontWeight: 800, fontSize: 18, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{seg.segment}</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Current Cost</div>
                      <div style={{ fontSize: 20, fontWeight: 900, fontFamily: MONO, color: '#C44F4F', marginTop: 4 }}>{seg.current}</div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>With Brix OS</div>
                      <div style={{ fontSize: 20, fontWeight: 900, fontFamily: MONO, color: GREEN, marginTop: 4 }}>{seg.brix}</div>
                    </div>
                    <div style={{ background: `${seg.color}12`, border: `1px solid ${seg.color}44`, borderRadius: 8, padding: '10px 14px', fontWeight: 700, fontSize: 14, color: seg.color, fontFamily: "'Inter',sans-serif" }}>
                      {seg.benefit}
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ PRICING ════════════════════════════ */}
      <section id="pricing" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Pricing</SectionLabel>
            <SectionHeading sub="Native INR pricing. No dollar surprises. Save 89% vs current enterprise spend.">
              Simple, Transparent Pricing
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, marginTop: 40 }}>
            {PLANS.map((plan, i) => (
              <FadeUp key={plan.name} i={i}>
                <div style={{
                  background: plan.popular ? `linear-gradient(135deg,${ORANGE}12,${ORANGE2}06)` : CARD,
                  border: `${plan.popular ? 2 : 1}px solid ${plan.popular ? ORANGE : BORDER}`,
                  borderRadius: 20, padding: 32, position: 'relative', height: '100%',
                }}>
                  {plan.popular && (
                    <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, color: '#fff', fontSize: 12, fontWeight: 800, padding: '5px 16px', borderRadius: 999, fontFamily: MONO, whiteSpace: 'nowrap' }}>
                      ★ MOST POPULAR
                    </div>
                  )}
                  <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 700, color: plan.color, fontFamily: MONO, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 40, fontWeight: 900, fontFamily: MONO, color: TEXT }}>{plan.price}</span>
                    <span style={{ fontSize: 14, color: MUTED }}>{plan.period}</span>
                  </div>
                  <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>{plan.users}</div>
                  <div style={{ marginBottom: 28 }}>
                    {plan.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <Check size={15} color={plan.popular ? ORANGE : GREEN} style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: TEXT }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => scrollTo('demo')} style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, background: plan.popular ? `linear-gradient(135deg,${ORANGE},${ORANGE2})` : BG2, color: plan.popular ? '#fff' : TEXT, transition: 'opacity 0.2s' }}>
                    Get Started
                  </button>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Free trial */}
          <FadeUp i={3}>
            <div style={{ marginTop: 40, background: `${GREEN}10`, border: `1px solid ${GREEN}44`, borderRadius: 20, padding: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 12, fontFamily: "'Inter',sans-serif" }}>3-Month Free Trial — No Credit Card Required</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
                {['Month 1: Onboarding + Migration', 'Month 2: Full Access + Training', 'Month 3: Evaluate ROI'].map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: TEXT }}>
                    <CheckCircle2 size={16} color={GREEN} /> {m}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 14, color: MUTED }}>Billing starts Month 4. Cancel anytime.</p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ MIGRATION ════════════════════════════ */}
      <section id="migration" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={4} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>Migration</SectionLabel>
            <SectionHeading sub="Zero disruption. A dedicated Brix OS migration engineer guides your entire journey. Free.">
              Switch in 3 Months, Risk-Free
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20, marginTop: 40 }}>
            {MIGRATION_STEPS.map((step, i) => (
              <FadeUp key={step.title} i={i}>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 24, height: '100%', borderTop: `3px solid ${step.color}` }}>
                  <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: step.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{step.phase}</div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: TEXT, marginBottom: 16, fontFamily: "'Inter',sans-serif" }}>{step.title}</div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {step.items.map((item, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <Check size={14} color={step.color} style={{ marginTop: 3, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════ TEAM ════════════════════════════ */}
      <section id="team" style={{ ...s, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <FadeUp>
            <SectionLabel>The Team</SectionLabel>
            <SectionHeading sub="Both founders resigned from high-paying jobs. Combined salary foregone: ₹7L+/month. 100% skin in the game.">
              Built by Enterprise Insiders
            </SectionHeading>
          </FadeUp>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 28, marginTop: 40 }}>
            {TEAM.map((member, i) => (
              <FadeUp key={member.name} i={i}>
                <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20, padding: 32, height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: `linear-gradient(135deg,${ORANGE}30,${ORANGE2}20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: ORANGE, fontFamily: MONO }}>{member.name[0]}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: TEXT, fontFamily: "'Inter',sans-serif" }}>{member.name}</div>
                      <div style={{ fontSize: 14, color: ORANGE, fontWeight: 700 }}>{member.role}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <Badge color={GREEN}>{member.years}</Badge>
                        <Badge color={MUTED}>{member.domain}</Badge>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO, marginBottom: 8 }}>Past Companies</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {member.past.map(co => (
                        <span key={co} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: TEXT }}>{co}</span>
                      ))}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {member.bullets.map((b, j) => (
                      <li key={j} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <CheckCircle2 size={15} color={GREEN} style={{ marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeUp>
            ))}
          </div>

          <FadeUp i={2}>
            <div style={{ marginTop: 28, background: `${ORANGE}10`, border: `1px solid ${ORANGE}44`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 18, fontWeight: 800, color: TEXT, fontFamily: "'Inter',sans-serif" }}>
                Both founders fully resigned. Combined salary foregone: <span style={{ color: ORANGE }}>₹7L+/month.</span> Skin in the game — 100% committed.
              </p>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ DEMO / INVESTOR CTA ════════════════════════════ */}
      <section id="demo" style={{ ...s, background: BG2, padding: 'clamp(60px,8vw,100px) clamp(16px,5vw,80px)', position: 'relative', overflow: 'hidden' }}>
        <FloatLetters count={5} />
        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <FadeUp>
            <SectionLabel>Request Demo</SectionLabel>
            <h2 style={{ fontSize: 'clamp(32px,5vw,60px)', fontWeight: 900, color: TEXT, lineHeight: 1.1, letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif", marginBottom: 16 }}>
              See Brix OS Live.<br />
              <span style={{ color: ORANGE }}>Watch AI Agents Ship.</span>
            </h2>
            <p style={{ fontSize: 18, color: MUTED, lineHeight: 1.65, marginBottom: 40, maxWidth: 600, margin: '0 auto 40px' }}>
              Book a 45-minute live demo with the founders. See 10 modules, 4 AI agents, and a real end-to-end sprint — from planning to deployment.
            </p>
          </FadeUp>

          <FadeUp i={1}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center', marginBottom: 40 }}>
              <a href="mailto:sonadarshan@growthinfocus.com?subject=Brix OS Demo Request" style={{ ...btnPrimary, textDecoration: 'none' }}>
                <Mail size={16} style={{ marginRight: 8 }} /> sonadarshan@growthinfocus.com
              </a>
              <a href="tel:+919900887473" style={{ ...btnSecondary, textDecoration: 'none' }}>
                <Phone size={16} style={{ marginRight: 8 }} /> +91 99008 87473
              </a>
            </div>
          </FadeUp>

          {/* Investor raise */}
          <FadeUp i={2}>
            <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 24, padding: 36, textAlign: 'left', marginTop: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <SectionLabel>Investor CTA</SectionLabel>
                <Badge color={ORANGE}>₹12 Crore Seed Round</Badge>
                <Badge color={GREEN}>8% Equity</Badge>
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 20, fontFamily: "'Inter',sans-serif" }}>Raising ₹12 Crore Seed Round</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Raise',             val: '₹12 Crore'      },
                  { label: 'Pre-money',          val: '₹138 Cr (~$16.5M)' },
                  { label: 'Post-money',         val: '₹150 Cr (~$18M)' },
                  { label: 'Equity offered',     val: '8%'             },
                ].map(item => (
                  <div key={item.label} style={{ background: BG2, borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO, marginBottom: 4 }}>{item.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, fontFamily: MONO, color: TEXT }}>{item.val}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontWeight: 700, fontSize: 15, color: TEXT, marginBottom: 14, fontFamily: "'Inter',sans-serif" }}>Use of Funds</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 8 }}>
                {FUNDS.map(f => (
                  <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: MUTED, flex: 1 }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: TEXT }}>{f.pct}%</span>
                    <span style={{ fontSize: 12, color: MUTED, fontFamily: MONO }}>{f.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ════════════════════════════ FOOTER ════════════════════════════ */}
      <footer style={{ ...s, background: TEXT, color: '#fff', padding: 'clamp(40px,6vw,80px) clamp(16px,5vw,80px) 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 40, marginBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${ORANGE},${ORANGE2})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontWeight: 900, fontSize: 16, fontFamily: MONO }}>B</span>
                </div>
                <span style={{ fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em', fontFamily: "'Inter',sans-serif" }}>Brix OS</span>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 12 }}>One platform. Ten tools. AI agents that actually ship.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ background: `${ORANGE}22`, border: `1px solid ${ORANGE}44`, borderRadius: 6, padding: '3px 8px', fontSize: 11, color: ORANGE, fontFamily: MONO, fontWeight: 700 }}>DPIIT Recognised</span>
              </div>
            </div>

            {/* Company */}
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Company</p>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>Growth Infocus Tech Private Limited</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>DPIIT Recognised Startup</p>
            </div>

            {/* Contact */}
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Contact</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <a href="mailto:sonadarshan@growthinfocus.com" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>
                  <Mail size={14} color={ORANGE} /> sonadarshan@growthinfocus.com
                </a>
                <a href="tel:+919900887473" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: 14 }}>
                  <Phone size={14} color={ORANGE} /> +91 99008 87473
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  <MapPin size={14} color={ORANGE} /> Bengaluru, India
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: MONO }}>Quick Links</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Solution', id: 'solution' },
                  { label: 'AI Agents', id: 'agents' },
                  { label: 'Pricing', id: 'pricing' },
                  { label: 'Team', id: 'team' },
                  { label: 'Request Demo', id: 'demo' },
                ].map(link => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 14, textAlign: 'left', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = ORANGE)}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}>
                    {link.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              © 2025 Growth Infocus Tech Private Limited. All rights reserved.
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: MONO }}>
              Bengaluru, India
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

