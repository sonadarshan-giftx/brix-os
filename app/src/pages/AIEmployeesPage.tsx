import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Plus, Search, Filter, Users, Zap, Clock, DollarSign,
  BarChart2, ChevronRight, ChevronDown, X, Check, Settings,
  MessageSquare, Pause, Power, Shield, Code, FileText, Mail,
  Phone, GitPullRequest, Bug, Ticket, GitCommit, Play,
  Star, Cpu, Database, Globe, Sliders, AlertTriangle,
  CheckCircle, ArrowRight, MoreHorizontal, Edit3, Copy,
  Download, TrendingUp, Activity, Eye, RefreshCw, Info,
  Terminal, PieChart, Target, Award, ChevronLeft,
  Sparkles, Layers, Package, Wifi, Hash, List,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type EmployeeStatus = 'online' | 'working' | 'in-meeting' | 'paused' | 'offline';
type EmployeeType = 'human' | 'ai';
type ModelProvider = 'GPT-4o' | 'Claude 3.5' | 'Gemini 1.5' | 'Claude 3 Opus' | 'GPT-4 Turbo';

interface Capability {
  id: string;
  label: string;
  icon: typeof Code;
  enabled: boolean;
  category: 'code' | 'communication' | 'management' | 'access';
}

interface AIEmployee {
  id: string;
  name: string;
  role: string;
  type: EmployeeType;
  status: EmployeeStatus;
  statusMessage: string;
  model: ModelProvider;
  avatarColor: string;
  avatarGradient: string;
  skills: string[];
  projects: string[];
  todayActivity: string;
  hiredOn: string;
  personality: string;
  capabilities: string[];
  metrics: {
    tasksThisWeek: number;
    prsReviewed: number;
    bugsFound: number;
    avgResponseMin: number;
    accuracyPct: number;
    costMonth: number;
  };
  activityFeed: ActivityItem[];
  permissions: string[];
}

interface HumanEmployee {
  id: string;
  name: string;
  role: string;
  type: EmployeeType;
  status: EmployeeStatus;
  avatarColor: string;
}

type RosterEmployee = AIEmployee | HumanEmployee;

interface ActivityItem {
  id: string;
  action: string;
  detail: string;
  time: string;
  icon: typeof GitPullRequest;
  color: string;
}

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

// ─── Mock Data ────────────────────────────────────────────────────────────────

const AI_EMPLOYEES: AIEmployee[] = [
  {
    id: 'aria',
    name: 'Aria',
    role: 'Sr. Developer',
    type: 'ai',
    status: 'working',
    statusMessage: 'Reviewing PR #342',
    model: 'Claude 3.5',
    avatarColor: '#7c3aed',
    avatarGradient: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
    skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
    projects: ['Brix Core', 'Auth Service'],
    todayActivity: 'Reviewed 3 PRs, wrote 8 tests, fixed 2 bugs',
    hiredOn: 'Jan 10, 2025',
    personality: 'Technical',
    capabilities: ['Code review', 'Write code', 'Run tests', 'Create documentation'],
    metrics: { tasksThisWeek: 47, prsReviewed: 12, bugsFound: 3, avgResponseMin: 4.2, accuracyPct: 94, costMonth: 2340 },
    activityFeed: [
      { id: 'a1', action: 'Reviewed PR #342', detail: 'feat(auth): add OAuth2 callback handler — 3 comments left', time: '12 min ago', icon: GitPullRequest, color: '#3b82f6' },
      { id: 'a2', action: 'Wrote 8 unit tests', detail: 'auth-service/src/oauth.test.ts — 100% coverage', time: '1 hour ago', icon: Terminal, color: '#10b981' },
      { id: 'a3', action: 'Fixed bug TICK-456', detail: 'Null pointer on empty assignee in tickets-service', time: '2 hours ago', icon: Bug, color: '#ef4444' },
      { id: 'a4', action: 'Updated docs', detail: 'API Reference: added rate limit headers section', time: '3 hours ago', icon: FileText, color: '#f59e0b' },
      { id: 'a5', action: 'Reviewed PR #338', detail: 'refactor(projects): extract permission middleware — approved', time: '5 hours ago', icon: GitPullRequest, color: '#3b82f6' },
    ],
    permissions: ['Read/write GitHub repos', 'Create Jira tickets', 'Read Slack channels', 'Access staging docs'],
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Backend Dev',
    type: 'ai',
    status: 'online',
    statusMessage: 'Idle — ready for tasks',
    model: 'GPT-4o',
    avatarColor: '#0891b2',
    avatarGradient: 'linear-gradient(135deg, #0891b2, #0e7490)',
    skills: ['Python', 'Go', 'Postgres', 'Kafka', 'Redis'],
    projects: ['Data Pipeline', 'Notifications'],
    todayActivity: 'Optimized 2 SQL queries, deployed to staging',
    hiredOn: 'Feb 3, 2025',
    personality: 'Formal',
    capabilities: ['Write code', 'Deploy to staging', 'Run tests', 'Database queries'],
    metrics: { tasksThisWeek: 31, prsReviewed: 8, bugsFound: 1, avgResponseMin: 6.1, accuracyPct: 91, costMonth: 1870 },
    activityFeed: [
      { id: 'b1', action: 'Deployed to staging', detail: 'notifications-service v1.4.2 — all health checks passed', time: '35 min ago', icon: Play, color: '#10b981' },
      { id: 'b2', action: 'Optimized query', detail: 'Reduced p95 latency from 240ms → 38ms on /tickets index', time: '2 hours ago', icon: Database, color: '#3b82f6' },
      { id: 'b3', action: 'Created PR #341', detail: 'fix(kafka): add dead-letter queue for ai-service consumer', time: '4 hours ago', icon: GitPullRequest, color: '#8b5cf6' },
    ],
    permissions: ['Write GitHub (backend repos)', 'Deploy to staging', 'Read Postgres schemas', 'Create Jira tickets'],
  },
  {
    id: 'pixel',
    name: 'Pixel',
    role: 'Designer',
    type: 'ai',
    status: 'working',
    statusMessage: 'Generating UI variants',
    model: 'GPT-4 Turbo',
    avatarColor: '#db2777',
    avatarGradient: 'linear-gradient(135deg, #db2777, #9d174d)',
    skills: ['Figma', 'UI/UX', 'Accessibility', 'Design Systems'],
    projects: ['Brix Core', 'Mobile App'],
    todayActivity: 'Created 4 component variants, updated design tokens',
    hiredOn: 'Mar 15, 2025',
    personality: 'Creative',
    capabilities: ['Create documentation', 'Create Jira tickets', 'Access external APIs'],
    metrics: { tasksThisWeek: 22, prsReviewed: 4, bugsFound: 0, avgResponseMin: 8.7, accuracyPct: 88, costMonth: 1240 },
    activityFeed: [
      { id: 'c1', action: 'Exported component variants', detail: '4 button states × 3 sizes — uploaded to Figma', time: '20 min ago', icon: Layers, color: '#db2777' },
      { id: 'c2', action: 'Updated design tokens', detail: 'Refreshed spacing scale and color palette', time: '3 hours ago', icon: Sliders, color: '#8b5cf6' },
    ],
    permissions: ['Read Figma files', 'Write Figma comments', 'Create Jira tickets', 'Read design system docs'],
  },
  {
    id: 'echo',
    name: 'Echo',
    role: 'DevOps',
    type: 'ai',
    status: 'in-meeting',
    statusMessage: 'In incident review call',
    model: 'Claude 3 Opus',
    avatarColor: '#d97706',
    avatarGradient: 'linear-gradient(135deg, #d97706, #b45309)',
    skills: ['Kubernetes', 'Terraform', 'ArgoCD', 'Prometheus', 'AWS'],
    projects: ['Infrastructure', 'CI/CD'],
    todayActivity: 'Scaled k8s cluster, patched 3 CVEs',
    hiredOn: 'Jan 22, 2025',
    personality: 'Technical',
    capabilities: ['Deploy to staging', 'Run tests', 'Access external APIs'],
    metrics: { tasksThisWeek: 19, prsReviewed: 5, bugsFound: 2, avgResponseMin: 3.8, accuracyPct: 97, costMonth: 3120 },
    activityFeed: [
      { id: 'd1', action: 'Patched CVE-2025-0134', detail: 'Updated base images in all 12 services', time: '1 hour ago', icon: Shield, color: '#10b981' },
      { id: 'd2', action: 'Scaled pods', detail: 'auth-service: 3 → 6 replicas due to traffic spike', time: '2 hours ago', icon: TrendingUp, color: '#f59e0b' },
    ],
    permissions: ['Full Kubernetes access (non-prod)', 'Read production metrics', 'Create incidents', 'AWS EC2/ECS access'],
  },
  {
    id: 'manager',
    name: 'Manager',
    role: 'Product Manager',
    type: 'ai',
    status: 'online',
    statusMessage: 'Triaging backlog',
    model: 'GPT-4o',
    avatarColor: '#059669',
    avatarGradient: 'linear-gradient(135deg, #059669, #047857)',
    skills: ['Roadmapping', 'Sprint Planning', 'Stakeholder Comms', 'Analytics'],
    projects: ['Brix Core', 'Mobile App', 'Data Pipeline'],
    todayActivity: 'Wrote 6 tickets, updated sprint board, sent 3 stakeholder updates',
    hiredOn: 'Feb 14, 2025',
    personality: 'Formal',
    capabilities: ['Create tickets', 'Update tickets', 'Send messages', 'Create documentation'],
    metrics: { tasksThisWeek: 38, prsReviewed: 0, bugsFound: 0, avgResponseMin: 2.1, accuracyPct: 89, costMonth: 1680 },
    activityFeed: [
      { id: 'e1', action: 'Created 6 Jira tickets', detail: 'Sprint 47 planning — all tagged and estimated', time: '45 min ago', icon: Ticket, color: '#3b82f6' },
      { id: 'e2', action: 'Sent stakeholder update', detail: 'Weekly progress email to 8 recipients', time: '2 hours ago', icon: Mail, color: '#10b981' },
      { id: 'e3', action: 'Updated sprint board', detail: 'Moved 4 tickets to Done, 3 to In Review', time: '3 hours ago', icon: CheckCircle, color: '#f59e0b' },
    ],
    permissions: ['Create/update Jira tickets', 'Send Slack messages', 'Read/write project docs', 'Send emails (CC approval)'],
  },
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'Data Analyst',
    type: 'ai',
    status: 'online',
    statusMessage: 'Running cohort analysis',
    model: 'Claude 3.5',
    avatarColor: '#7c3aed',
    avatarGradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
    skills: ['SQL', 'Python', 'dbt', 'Metabase', 'Statistics'],
    projects: ['Analytics', 'Growth'],
    todayActivity: 'Published 2 dashboards, ran 5 queries',
    hiredOn: 'Apr 1, 2025',
    personality: 'Technical',
    capabilities: ['Database queries', 'Create documentation', 'Access external APIs'],
    metrics: { tasksThisWeek: 24, prsReviewed: 2, bugsFound: 1, avgResponseMin: 5.4, accuracyPct: 92, costMonth: 980 },
    activityFeed: [
      { id: 'f1', action: 'Published dashboard', detail: 'User retention cohort — 30/60/90 day curves', time: '30 min ago', icon: BarChart2, color: '#8b5cf6' },
      { id: 'f2', action: 'Ran ad-hoc query', detail: 'Conversion funnel for trial → paid last 30 days', time: '2 hours ago', icon: Database, color: '#3b82f6' },
    ],
    permissions: ['Read Postgres (analytics schema)', 'Write Metabase dashboards', 'Read S3 data lake', 'Create Jira tickets'],
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'Support Lead',
    type: 'ai',
    status: 'working',
    statusMessage: 'Handling 4 active tickets',
    model: 'Gemini 1.5',
    avatarColor: '#0891b2',
    avatarGradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    skills: ['Customer Support', 'Technical Writing', 'Triage', 'Escalation'],
    projects: ['Support', 'Onboarding'],
    todayActivity: 'Resolved 14 tickets, escalated 2, sent 22 responses',
    hiredOn: 'Mar 5, 2025',
    personality: 'Casual',
    capabilities: ['Send messages', 'Create tickets', 'Update tickets', 'Send emails'],
    metrics: { tasksThisWeek: 89, prsReviewed: 0, bugsFound: 0, avgResponseMin: 1.3, accuracyPct: 96, costMonth: 760 },
    activityFeed: [
      { id: 'g1', action: 'Resolved 3 support tickets', detail: 'TICK-789, TICK-790, TICK-791 — all resolved without escalation', time: '15 min ago', icon: CheckCircle, color: '#10b981' },
      { id: 'g2', action: 'Escalated TICK-792', detail: 'Billing dispute — routed to finance team', time: '45 min ago', icon: AlertTriangle, color: '#f59e0b' },
      { id: 'g3', action: 'Sent 22 responses', detail: 'Average CSAT predicted: 4.7/5', time: '1 hour ago', icon: Mail, color: '#3b82f6' },
    ],
    permissions: ['Read/respond to support inbox', 'Create/update tickets', 'Send emails', 'Read user data (masked PII)'],
  },
];

const HUMAN_EMPLOYEES: HumanEmployee[] = [
  { id: 'h1', name: 'Sonadarshan', role: 'Founder & CTO', type: 'human', status: 'online', avatarColor: '#D97757' },
  { id: 'h2', name: 'Priya K', role: 'Head of Product', type: 'human', status: 'online', avatarColor: '#3b82f6' },
  { id: 'h3', name: 'Ravi M', role: 'Senior Engineer', type: 'human', status: 'working', avatarColor: '#10b981' },
  { id: 'h4', name: 'Ananya S', role: 'Designer', type: 'human', status: 'online', avatarColor: '#8b5cf6' },
  { id: 'h5', name: 'Karthik V', role: 'Backend Engineer', type: 'human', status: 'in-meeting', avatarColor: '#f59e0b' },
];

const WIZARD_ROLES = [
  { id: 'sr-dev', title: 'Sr. Developer', icon: Code, desc: 'Full-stack code review, writing, testing' },
  { id: 'backend', title: 'Backend Dev', icon: Terminal, desc: 'APIs, databases, microservices' },
  { id: 'designer', title: 'Designer', icon: Layers, desc: 'UI/UX, component generation, design systems' },
  { id: 'devops', title: 'DevOps', icon: Package, desc: 'CI/CD, Kubernetes, infrastructure' },
  { id: 'pm', title: 'Product Manager', icon: Target, desc: 'Tickets, roadmaps, stakeholder updates' },
  { id: 'analyst', title: 'Data Analyst', icon: BarChart2, desc: 'Queries, dashboards, reports' },
  { id: 'support', title: 'Support', icon: MessageSquare, desc: 'Customer tickets, responses, escalations' },
  { id: 'custom', title: 'Custom', icon: Sliders, desc: 'Define your own role and capabilities' },
];

const ALL_CAPABILITIES: Capability[] = [
  { id: 'code-review', label: 'Code review', icon: GitPullRequest, enabled: true, category: 'code' },
  { id: 'write-code', label: 'Write code', icon: Code, enabled: true, category: 'code' },
  { id: 'run-tests', label: 'Run tests', icon: Terminal, enabled: false, category: 'code' },
  { id: 'create-tickets', label: 'Create tickets', icon: Ticket, enabled: true, category: 'management' },
  { id: 'update-tickets', label: 'Update tickets', icon: Edit3, enabled: true, category: 'management' },
  { id: 'create-docs', label: 'Create documentation', icon: FileText, enabled: false, category: 'management' },
  { id: 'send-messages', label: 'Send messages', icon: MessageSquare, enabled: false, category: 'communication' },
  { id: 'join-calls', label: 'Join calls', icon: Phone, enabled: false, category: 'communication' },
  { id: 'read-emails', label: 'Read emails', icon: Mail, enabled: false, category: 'communication' },
  { id: 'send-emails', label: 'Send emails', icon: Mail, enabled: false, category: 'communication' },
  { id: 'deploy-staging', label: 'Deploy to staging', icon: Play, enabled: false, category: 'access' },
  { id: 'access-apis', label: 'Access external APIs', icon: Globe, enabled: false, category: 'access' },
];

const MODEL_OPTIONS: ModelProvider[] = ['Claude 3.5', 'Claude 3 Opus', 'GPT-4o', 'GPT-4 Turbo', 'Gemini 1.5'];

const NAME_SUGGESTIONS = ['Aria', 'Sage', 'Nova', 'Atlas', 'Echo', 'Zara', 'Orion', 'Luna', 'Cypher', 'Flux'];

// ─── Utility functions ────────────────────────────────────────────────────────

function getStatusDot(status: EmployeeStatus) {
  const config: Record<EmployeeStatus, { color: string; pulse: boolean }> = {
    online: { color: '#22c55e', pulse: true },
    working: { color: '#3b82f6', pulse: true },
    'in-meeting': { color: '#f59e0b', pulse: false },
    paused: { color: '#9ca3af', pulse: false },
    offline: { color: '#374151', pulse: false },
  };
  return config[status];
}

function getStatusLabel(status: EmployeeStatus) {
  const labels: Record<EmployeeStatus, string> = {
    online: 'Online', working: 'Working', 'in-meeting': 'In Meeting', paused: 'Paused', offline: 'Offline',
  };
  return labels[status];
}

function isAIEmployee(e: RosterEmployee): e is AIEmployee {
  return e.type === 'ai';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AIAvatar({ employee, size = 48 }: { employee: AIEmployee; size?: number }) {
  const fontSize = size * 0.35;
  return (
    <div className="relative flex-shrink-0">
      <div
        className="rounded-xl flex items-center justify-center text-white font-bold"
        style={{ width: size, height: size, background: employee.avatarGradient, fontSize }}
      >
        {employee.name.slice(0, 2).toUpperCase()}
      </div>
      <div
        className="absolute -bottom-1 -right-1 rounded-full border-2 border-white flex items-center justify-center"
        style={{ width: size * 0.32, height: size * 0.32, background: '#7c3aed' }}
      >
        <Bot size={size * 0.18} color="white" />
      </div>
    </div>
  );
}

function HumanAvatar({ employee, size = 40 }: { employee: HumanEmployee; size?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
      style={{ width: size, height: size, background: employee.avatarColor, fontSize: size * 0.38 }}
    >
      {employee.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function StatusBadge({ status, message }: { status: EmployeeStatus; message?: string }) {
  const dot = getStatusDot(status);
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative flex-shrink-0" style={{ width: 8, height: 8 }}>
        <div className="rounded-full w-2 h-2" style={{ background: dot.color }} />
        {dot.pulse && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: dot.color }}
            animate={{ scale: [1, 2], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>
      <span className="text-xs text-gray-500">{message || getStatusLabel(status)}</span>
    </div>
  );
}

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-gray-100">
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold" style={{ color: color || '#111827' }}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Employee Card ────────────────────────────────────────────────────────────

function EmployeeCard({ employee, onClick }: { employee: AIEmployee; onClick: () => void }) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(124,58,237,0.12)' }}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      className="bg-white rounded-2xl p-5 cursor-pointer border-2 transition-colors"
      style={{ borderColor: 'rgba(124,58,237,0.15)' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <AIAvatar employee={employee} size={48} />
          <div>
            <h3 className="font-semibold text-gray-900">{employee.name}</h3>
            <p className="text-sm text-gray-500">{employee.role}</p>
            <StatusBadge status={employee.status} message={employee.statusMessage} />
          </div>
        </div>
        <div className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-2 py-0.5 font-medium">
          {employee.model}
        </div>
      </div>

      <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-3 leading-relaxed">
        {employee.todayActivity}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {employee.skills.slice(0, 4).map(skill => (
          <span key={skill} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{skill}</span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {employee.projects.map(p => (
          <span key={p} className="text-xs bg-[#D97757]/10 text-[#D97757] rounded-full px-2 py-0.5 font-medium">{p}</span>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-sm font-bold text-gray-900">{employee.metrics.tasksThisWeek}</p>
          <p className="text-xs text-gray-400">tasks/wk</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-sm font-bold text-gray-900">{employee.metrics.accuracyPct}%</p>
          <p className="text-xs text-gray-400">accuracy</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-sm font-bold text-gray-900">₹{employee.metrics.costMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-400">/month</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={e => { e.stopPropagation(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
        >
          <Settings size={13} /> Configure
        </button>
        <button
          onClick={e => { e.stopPropagation(); }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-medium bg-[#D97757]/10 text-[#D97757] hover:bg-[#D97757]/20 transition-colors"
        >
          <MessageSquare size={13} /> Chat
        </button>
      </div>
    </motion.div>
  );
}

// ─── Employee Profile Slide-in ────────────────────────────────────────────────

function EmployeeProfile({ employee, onClose }: { employee: AIEmployee; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'activity' | 'tasks' | 'skills' | 'permissions'>('activity');

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'skills', label: 'Skills' },
    { id: 'permissions', label: 'Permissions' },
  ] as const;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed right-0 top-0 bottom-0 w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
            <ChevenRight size={18} className="rotate-180" />
          </button>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
              <Pause size={13} /> Pause
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
              <Power size={13} /> Deactivate
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <AIAvatar employee={employee} size={64} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
            <p className="text-gray-500">{employee.role}</p>
            <StatusBadge status={employee.status} message={employee.statusMessage} />
            <p className="text-xs text-gray-400 mt-1">Hired {employee.hiredOn} · Powered by {employee.model}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{employee.metrics.tasksThisWeek}</p>
          <p className="text-xs text-gray-400">Tasks this week</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{employee.metrics.prsReviewed}</p>
          <p className="text-xs text-gray-400">PRs reviewed</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{employee.metrics.accuracyPct}%</p>
          <p className="text-xs text-gray-400">Accuracy</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{employee.metrics.bugsFound}</p>
          <p className="text-xs text-gray-400">Bugs found</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">{employee.metrics.avgResponseMin}m</p>
          <p className="text-xs text-gray-400">Avg response</p>
        </div>
        <div className="text-center">
          <p className="text-xl font-bold text-[#D97757]">₹{employee.metrics.costMonth.toLocaleString()}</p>
          <p className="text-xs text-gray-400">Cost/month</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#D97757] text-[#D97757]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'activity' && (
          <div className="space-y-3">
            {employee.activityFeed.map(item => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color + '20' }}>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.action}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-2">
            {['Review PR #343: add pagination to /users endpoint', 'Write integration tests for OAuth flow', 'Investigate latency spike in projects-service', 'Update API docs for v2 endpoints'].map((task, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-5 h-5 rounded border-2 border-purple-300 flex-shrink-0" />
                <span className="text-sm text-gray-700">{task}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'skills' && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Core Skills</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {employee.skills.map(s => (
                <span key={s} className="text-sm bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-3 py-1">{s}</span>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Trained On</p>
            <div className="space-y-2">
              {['Your GitHub repositories (main, develop branches)', 'Confluence docs: Engineering space', 'Jira ticket history (last 90 days)', 'Slack: #engineering, #backend, #arch-decisions'].map(item => (
                <div key={item} className="flex items-center gap-2 p-2 text-sm text-gray-600">
                  <Database size={13} className="text-gray-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'permissions' && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Granted Permissions</p>
            <div className="space-y-2 mb-5">
              {employee.permissions.map(p => (
                <div key={p} className="flex items-center gap-2 p-3 bg-green-50 rounded-xl text-sm text-gray-700">
                  <Check size={14} className="text-green-500 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Blocked Actions</p>
            <div className="space-y-2">
              {['Delete data or databases', 'Access production database directly', 'Financial transactions', 'Access PII without masking'].map(p => (
                <div key={p} className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-sm text-gray-700">
                  <X size={14} className="text-red-400 flex-shrink-0" />
                  {p}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-50 text-purple-600 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
          <Settings size={15} /> Full Configuration
        </button>
      </div>
    </motion.div>
  );
}

// Fix the typo in the profile component — use ArrowRight rotated
function ChevonRight({ size, className }: { size: number; className?: string }) {
  return <ChevronRight size={size} className={className} />;
}

// ─── Onboarding Wizard ────────────────────────────────────────────────────────

function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<WizardStep>(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelProvider>('Claude 3.5');
  const [personality, setPersonality] = useState('Technical');
  const [workingHours, setWorkingHours] = useState('Always on');
  const [capabilities, setCapabilities] = useState(ALL_CAPABILITIES);
  const [maxTokens, setMaxTokens] = useState(100000);
  const [approvalRequired, setApprovalRequired] = useState({
    commits: true, deploys: true, emails: true, pii: true,
  });

  const toggleCapability = (id: string) => {
    setCapabilities(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const stepTitles: Record<WizardStep, string> = {
    1: 'Choose Role', 2: 'Configure Persona', 3: 'Set Capabilities',
    4: 'Connect Tools', 5: 'Set Guardrails', 6: 'Review & Activate',
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Wizard header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Bot size={16} className="text-purple-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Hire AI Employee</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-purple-500' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Step {step} of {totalSteps}: <strong className="text-gray-700">{stepTitles[step]}</strong></span>
            <span>{Math.round(progress)}% complete</span>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Role */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-gray-500 mb-4">What role should this AI employee play on your team?</p>
                <div className="grid grid-cols-2 gap-3">
                  {WIZARD_ROLES.map(role => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        selectedRole === role.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${selectedRole === role.id ? 'bg-purple-500' : 'bg-gray-100'}`}>
                        <role.icon size={16} className={selectedRole === role.id ? 'text-white' : 'text-gray-500'} />
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${selectedRole === role.id ? 'text-purple-700' : 'text-gray-800'}`}>{role.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Persona */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Name</label>
                  <div className="flex gap-2">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Aria"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                    />
                    <button
                      onClick={() => setName(NAME_SUGGESTIONS[Math.floor(Math.random() * NAME_SUGGESTIONS.length)])}
                      className="px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors flex items-center gap-1"
                    >
                      <Sparkles size={13} /> Suggest
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {NAME_SUGGESTIONS.map(n => (
                      <button key={n} onClick={() => setName(n)} className="text-xs text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 hover:border-purple-300 hover:text-purple-600 transition-colors">{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">AI Model</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MODEL_OPTIONS.map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedModel(m)}
                        className={`p-2.5 rounded-xl border text-sm text-left transition-all ${selectedModel === m ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                      >
                        <Cpu size={13} className="inline mr-1.5" />{m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Personality</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Formal', 'Casual', 'Technical', 'Creative'].map(p => (
                      <button
                        key={p}
                        onClick={() => setPersonality(p)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${personality === p ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Working Hours</label>
                  <div className="flex gap-2 flex-wrap">
                    {['Always on', 'Business hours', 'Custom schedule'].map(h => (
                      <button
                        key={h}
                        onClick={() => setWorkingHours(h)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${workingHours === h ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Capabilities */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm text-gray-500 mb-4">Toggle the capabilities this AI employee should have:</p>
                {(['code', 'management', 'communication', 'access'] as const).map(cat => (
                  <div key={cat} className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{cat}</p>
                    <div className="space-y-2">
                      {capabilities.filter(c => c.category === cat).map(cap => (
                        <div key={cap.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-2.5">
                            <cap.icon size={15} className="text-gray-400" />
                            <span className="text-sm text-gray-700">{cap.label}</span>
                          </div>
                          <button
                            onClick={() => toggleCapability(cap.id)}
                            className={`w-10 h-5.5 rounded-full relative transition-colors flex-shrink-0 ${cap.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}
                            style={{ width: 40, height: 22 }}
                          >
                            <motion.div
                              className="w-4 h-4 bg-white rounded-full absolute top-[3px]"
                              animate={{ left: cap.enabled ? 20 : 3 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 4: Connect Tools */}
            {step === 4 && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-sm text-gray-500 mb-4">Connect your tools to give this AI employee access:</p>
                {[
                  { name: 'GitHub', desc: 'Repository access, PRs, code review', icon: GitCommit, connected: true },
                  { name: 'Jira / Projects', desc: 'Create and update tickets, sprints', icon: Ticket, connected: true },
                  { name: 'Slack', desc: 'Channel access, messaging, notifications', icon: MessageSquare, connected: false },
                  { name: 'Email Inbox', desc: 'Read and respond to emails', icon: Mail, connected: false },
                  { name: 'Documentation', desc: 'Confluence / Docs space access', icon: FileText, connected: true },
                ].map(tool => (
                  <div key={tool.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tool.connected ? 'bg-green-100' : 'bg-gray-200'}`}>
                        <tool.icon size={16} className={tool.connected ? 'text-green-600' : 'text-gray-400'} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{tool.name}</p>
                        <p className="text-xs text-gray-400">{tool.desc}</p>
                      </div>
                    </div>
                    <button className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${tool.connected ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-purple-50 text-purple-600 border border-purple-200 hover:bg-purple-100'}`}>
                      {tool.connected ? <><Check size={11} className="inline mr-1" />Connected</> : 'Connect'}
                    </button>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 5: Guardrails */}
            {step === 5 && (
              <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Max tokens per day</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10000}
                      max={1000000}
                      step={10000}
                      value={maxTokens}
                      onChange={e => setMaxTokens(parseInt(e.target.value))}
                      className="flex-1 accent-purple-500"
                    />
                    <span className="text-sm font-mono text-gray-700 w-24 text-right">{(maxTokens / 1000).toFixed(0)}K tokens</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Require approval for:</p>
                  {Object.entries(approvalRequired).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-700 capitalize">{key === 'pii' ? 'PII access' : key}</span>
                      <button
                        onClick={() => setApprovalRequired(prev => ({ ...prev, [key]: !val }))}
                        className={`w-10 rounded-full relative transition-colors flex-shrink-0`}
                        style={{ width: 40, height: 22, background: val ? '#7c3aed' : '#d1d5db' }}
                      >
                        <motion.div
                          className="w-4 h-4 bg-white rounded-full absolute top-[3px]"
                          animate={{ left: val ? 20 : 3 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Blocked actions (always)</p>
                  {['Delete data or databases', 'Access production database directly', 'Financial transactions', 'Access PII without masking'].map(b => (
                    <div key={b} className="flex items-center gap-2.5 py-2 text-sm text-gray-600 border-b border-gray-100 last:border-0">
                      <div className="w-5 h-5 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                        <X size={11} className="text-red-500" />
                      </div>
                      {b}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 6: Review */}
            {step === 6 && (
              <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl mb-5">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                  >
                    {name ? name.slice(0, 2).toUpperCase() : 'AI'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{name || 'AI Employee'}</h3>
                    <p className="text-sm text-gray-500">{WIZARD_ROLES.find(r => r.id === selectedRole)?.title || 'Role not selected'}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Cpu size={12} className="text-purple-500" />
                      <span className="text-xs text-purple-600">{selectedModel}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: 'Role', value: WIZARD_ROLES.find(r => r.id === selectedRole)?.title || '—' },
                    { label: 'Personality', value: personality },
                    { label: 'Working hours', value: workingHours },
                    { label: 'Capabilities enabled', value: `${capabilities.filter(c => c.enabled).length} of ${capabilities.length}` },
                    { label: 'Max tokens/day', value: `${(maxTokens / 1000).toFixed(0)}K` },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium text-gray-900">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-xl flex gap-2">
                  <Info size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    This AI employee will be active immediately after activation. You can pause, reconfigure, or deactivate it at any time from the team roster.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100">
          <button
            onClick={() => step > 1 && setStep(s => (s - 1) as WizardStep)}
            disabled={step === 1}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-600 rounded-xl hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={() => {
              if (step < 6) setStep(s => (s + 1) as WizardStep);
              else onClose();
            }}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
          >
            {step === 6 ? (
              <><Zap size={15} /> Activate Employee</>
            ) : (
              <>Next <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────

function AnalyticsPanel() {
  const totalTasks = AI_EMPLOYEES.reduce((sum, e) => sum + e.metrics.tasksThisWeek, 0);
  const totalCost = AI_EMPLOYEES.reduce((sum, e) => sum + e.metrics.costMonth, 0);
  const mostActive = AI_EMPLOYEES.reduce((prev, curr) => prev.metrics.tasksThisWeek > curr.metrics.tasksThisWeek ? prev : curr);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">AI Workforce Analytics</h3>
        <span className="text-xs text-gray-400 flex items-center gap-1"><RefreshCw size={11} /> Live</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <MetricCard label="AI Employees" value={AI_EMPLOYEES.length} sub="7 active" color="#7c3aed" />
        <MetricCard label="Tasks Today" value={156} sub="across all AIs" color="#10b981" />
        <MetricCard label="Time Saved" value="~48h" sub="estimated today" color="#3b82f6" />
        <MetricCard label="Cost Today" value="₹840" sub={`₹${totalCost.toLocaleString()}/month total`} color="#D97757" />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Star size={14} className="text-yellow-500" />
        <span className="text-sm text-gray-600">Most active today: <strong className="text-gray-900">{mostActive.name}</strong> ({mostActive.metrics.tasksThisWeek} tasks this week)</span>
      </div>

      <div className="space-y-2">
        {AI_EMPLOYEES.sort((a, b) => b.metrics.tasksThisWeek - a.metrics.tasksThisWeek).map(emp => (
          <div key={emp.id} className="flex items-center gap-3">
            <AIAvatar employee={emp} size={24} />
            <span className="text-sm text-gray-600 w-24 flex-shrink-0">{emp.name}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(emp.metrics.tasksThisWeek / totalTasks) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="h-2 rounded-full"
                style={{ background: emp.avatarGradient }}
              />
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">{emp.metrics.tasksThisWeek}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Team Roster ──────────────────────────────────────────────────────────────

function TeamRoster({ filter }: { filter: 'all' | 'humans' | 'ai' }) {
  const allEmployees: RosterEmployee[] = [
    ...(filter !== 'ai' ? HUMAN_EMPLOYEES : []),
    ...(filter !== 'humans' ? AI_EMPLOYEES : []),
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">Team Roster ({allEmployees.length})</h3>
      </div>
      <div className="divide-y divide-gray-50">
        {allEmployees.map(emp => {
          const dot = getStatusDot(emp.status);
          return (
            <div key={emp.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="relative flex-shrink-0">
                {emp.type === 'ai' ? (
                  <AIAvatar employee={emp as AIEmployee} size={36} />
                ) : (
                  <HumanAvatar employee={emp as HumanEmployee} size={36} />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white" style={{ background: dot.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">{emp.name}</p>
                  {emp.type === 'ai' && (
                    <span className="text-xs bg-purple-50 text-purple-600 border border-purple-100 rounded-full px-1.5 py-0.5 flex-shrink-0">AI</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{emp.role}</p>
              </div>
              <div className="text-xs text-gray-400 hidden md:block">{getStatusLabel(emp.status)}</div>
              {emp.type === 'ai' && (
                <div className="text-xs text-purple-400 hidden lg:block">{(emp as AIEmployee).model}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AIEmployeesPage() {
  const [view, setView] = useState<'grid' | 'roster' | 'analytics'>('grid');
  const [rosterFilter, setRosterFilter] = useState<'all' | 'humans' | 'ai'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<AIEmployee | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');

  const filteredEmployees = AI_EMPLOYEES.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenProfile = useCallback((emp: AIEmployee) => {
    setSelectedEmployee(emp);
  }, []);

  const onlineCount = AI_EMPLOYEES.filter(e => e.status === 'online' || e.status === 'working').length;
  const totalTasksToday = 156;

  return (
    <div className="min-h-screen bg-[#f5f5f3] p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Bot size={22} className="text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900">AI Employees</h1>
              <span className="text-xs bg-purple-100 text-purple-600 border border-purple-200 rounded-full px-2 py-0.5 font-medium">
                {onlineCount} online
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              AI agents working as full team members. {totalTasksToday} tasks completed today · ~48 human-hours saved.
            </p>
          </div>

          <button
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-medium hover:bg-purple-600 transition-colors shadow-sm"
          >
            <Plus size={16} /> Hire AI Employee
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, skill..."
            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-purple-300 transition-colors"
          />
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
          {(['all', 'online', 'working', 'in-meeting'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'all' ? 'all' : s as EmployeeStatus)}
              className={`px-3 py-2 text-sm capitalize transition-colors ${statusFilter === s ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {s === 'all' ? 'All' : s.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden ml-auto">
          {([['grid', 'Grid', Users], ['roster', 'Roster', List], ['analytics', 'Analytics', BarChart2]] as const).map(([v, label, Icon]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${view === v ? 'bg-purple-50 text-purple-600 font-medium' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Import banner */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
            <Download size={16} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800">Import existing AI agents</p>
            <p className="text-xs text-gray-500">Coming soon: Import from LangChain, CrewAI, AutoGen configs</p>
          </div>
        </div>
        <button className="text-xs text-purple-600 font-medium bg-white border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex-shrink-0">
          Notify me
        </button>
      </div>

      {/* Main content */}
      <AnimatePresence mode="wait">
        {view === 'grid' && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-20">
                <Bot size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No AI employees match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEmployees.map((emp, i) => (
                  <motion.div
                    key={emp.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <EmployeeCard employee={emp} onClick={() => handleOpenProfile(emp)} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {view === 'roster' && (
          <motion.div key="roster" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm text-gray-500">Show:</span>
              {(['all', 'humans', 'ai'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setRosterFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${rosterFilter === f ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                >
                  {f === 'all' ? 'All' : f === 'humans' ? 'Humans only' : 'AI only'}
                </button>
              ))}
            </div>
            <TeamRoster filter={rosterFilter} />
          </motion.div>
        )}

        {view === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AnalyticsPanel />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AI_EMPLOYEES.map(emp => (
                <div key={emp.id} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <AIAvatar employee={emp} size={40} />
                    <div>
                      <p className="font-semibold text-gray-900">{emp.name}</p>
                      <p className="text-xs text-gray-400">{emp.role} · {emp.model}</p>
                    </div>
                    <StatusBadge status={emp.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-900">{emp.metrics.tasksThisWeek}</p>
                      <p className="text-xs text-gray-400">tasks/wk</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-gray-900">{emp.metrics.accuracyPct}%</p>
                      <p className="text-xs text-gray-400">accuracy</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-[#D97757]">₹{emp.metrics.costMonth.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">cost/mo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee profile slide-in */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40"
              onClick={() => setSelectedEmployee(null)}
            />
            <EmployeeProfile employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
          </>
        )}
      </AnimatePresence>

      {/* Onboarding wizard */}
      <AnimatePresence>
        {showWizard && <OnboardingWizard onClose={() => setShowWizard(false)} />}
      </AnimatePresence>
    </div>
  );
}
