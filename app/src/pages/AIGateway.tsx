import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BrainCircuit, Shield, Activity, DollarSign, Clock, AlertTriangle,
  CheckCircle2, XCircle, Search, Filter, ChevronDown, Lock, Unlock,
  Eye, EyeOff, BarChart3, TrendingUp, Zap, Globe, Cpu, Bot,
  Terminal, FileText, Code2, MessageSquare, GitBranch, Settings,
  ToggleLeft, ToggleRight, Pause, Play, RefreshCw, Download,
  ArrowUpRight, ArrowDownRight, Minus, HelpCircle, X,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';

/* ═══════════════════════════════════════════
   AI GATEWAY / NEXUS — Control What AI Can Do
   ═══════════════════════════════════════════ */

/* ── Demo data ── */
const AGENTS = [
  { id: 'dev', name: 'Dev Agent', role: 'Code Review & Generation', color: '#5b5fc7', icon: Code2, status: 'active', tasksToday: 12, tokens: '45.2K', cost: '$2.14', model: 'gpt-4' },
  { id: 'pm', name: 'PM Agent', role: 'Sprint Planning', color: '#7c7ff0', icon: BarChart3, status: 'active', tasksToday: 8, tokens: '38.1K', cost: '$1.82', model: 'gpt-4' },
  { id: 'qa', name: 'QA Agent', role: 'Quality Assurance', color: '#F59E0B', icon: Terminal, status: 'active', tasksToday: 15, tokens: '52.7K', cost: '$2.51', model: 'claude-3' },
  { id: 'devops', name: 'DevOps Agent', role: 'Infrastructure', color: '#EC4899', icon: Cpu, status: 'active', tasksToday: 6, tokens: '28.4K', cost: '$1.35', model: 'gpt-4-turbo' },
  { id: 'support', name: 'Support Agent', role: 'Customer Support', color: '#06B6D4', icon: MessageSquare, status: 'paused', tasksToday: 23, tokens: '67.3K', cost: '$3.21', model: 'claude-3' },
  { id: 'techlead', name: 'Tech Lead', role: 'Architecture Review', color: '#D4A853', icon: Shield, status: 'active', tasksToday: 5, tokens: '15.8K', cost: '$0.75', model: 'gpt-4' },
];

const AUDIT_LOG = [
  { id: 1, agent: 'Dev Agent', action: 'Reviewed PR #342', target: 'auth-service', type: 'code_review', status: 'allowed', time: '2 min ago', tokens: 1240, risk: 'low' },
  { id: 2, agent: 'PM Agent', action: 'Updated sprint backlog', target: 'Sprint 25', type: 'project_mgmt', status: 'allowed', time: '5 min ago', tokens: 890, risk: 'low' },
  { id: 3, agent: 'QA Agent', action: 'Generated 15 test cases', target: 'payment-gateway', type: 'test_gen', status: 'allowed', time: '8 min ago', tokens: 2340, risk: 'low' },
  { id: 4, agent: 'DevOps Agent', action: 'Triggered deployment', target: 'staging', type: 'deploy', status: 'allowed', time: '12 min ago', tokens: 560, risk: 'medium' },
  { id: 5, agent: 'Dev Agent', action: 'Attempted file write', target: '/etc/passwd', type: 'file_access', status: 'blocked', time: '15 min ago', tokens: 0, risk: 'critical' },
  { id: 6, agent: 'Support Agent', action: 'Resolved ticket #4821', target: 'billing-module', type: 'support', status: 'allowed', time: '18 min ago', tokens: 1780, risk: 'low' },
  { id: 7, agent: 'Tech Lead', action: 'Reviewed architecture RFC', target: 'microservices', type: 'review', status: 'allowed', time: '22 min ago', tokens: 2100, risk: 'low' },
  { id: 8, agent: 'DevOps Agent', action: 'Scaled cluster', target: 'k8s-prod', type: 'infrastructure', status: 'allowed', time: '25 min ago', tokens: 340, risk: 'medium' },
  { id: 9, agent: 'Dev Agent', action: 'Accessed external API', target: 'api.github.com', type: 'api_call', status: 'allowed', time: '28 min ago', tokens: 0, risk: 'low' },
  { id: 10, agent: 'QA Agent', action: 'Found vulnerability', target: 'user-service', type: 'security', status: 'allowed', time: '30 min ago', tokens: 1450, risk: 'high' },
  { id: 11, agent: 'PM Agent', action: 'Exported user data', target: 'users.csv', type: 'data_export', status: 'flagged', time: '35 min ago', tokens: 0, risk: 'high' },
  { id: 12, agent: 'Support Agent', action: 'Accessed customer PII', target: 'customer-db', type: 'data_access', status: 'allowed', time: '40 min ago', tokens: 890, risk: 'medium' },
];

const TOKEN_DATA = [
  { time: '00:00', gpt4: 1200, claude: 800, custom: 400 },
  { time: '02:00', gpt4: 800, claude: 600, custom: 200 },
  { time: '04:00', gpt4: 600, claude: 400, custom: 300 },
  { time: '06:00', gpt4: 900, claude: 700, custom: 500 },
  { time: '08:00', gpt4: 3400, claude: 2100, custom: 1200 },
  { time: '10:00', gpt4: 5200, claude: 3800, custom: 2100 },
  { time: '12:00', gpt4: 4800, claude: 3200, custom: 1800 },
  { time: '14:00', gpt4: 6100, claude: 4500, custom: 2400 },
  { time: '16:00', gpt4: 4500, claude: 3100, custom: 1900 },
  { time: '18:00', gpt4: 3200, claude: 2400, custom: 1100 },
  { time: '20:00', gpt4: 1800, claude: 1200, custom: 700 },
  { time: '22:00', gpt4: 1400, claude: 900, custom: 600 },
];

const COST_DATA = [
  { day: 'Mon', cost: 89.20 },
  { day: 'Tue', cost: 112.50 },
  { day: 'Wed', cost: 95.80 },
  { day: 'Thu', cost: 134.60 },
  { day: 'Fri', cost: 108.30 },
  { day: 'Sat', cost: 42.10 },
  { day: 'Sun', cost: 38.70 },
];

const MODEL_USAGE = [
  { name: 'GPT-4', value: 45, color: '#5b5fc7' },
  { name: 'Claude 3', value: 30, color: '#7c7ff0' },
  { name: 'BrixOS Custom', value: 15, color: '#10B981' },
  { name: 'GPT-4 Turbo', value: 10, color: '#06B6D4' },
];

const PERMISSIONS = [
  { key: 'code_read', label: 'Read source code', desc: 'Access and read code repositories', agents: { dev: true, qa: true, techlead: true, pm: false, devops: false, support: false } },
  { key: 'code_write', label: 'Write/modify code', desc: 'Create files, edit code, commit changes', agents: { dev: true, qa: false, techlead: false, pm: false, devops: false, support: false } },
  { key: 'deploy', label: 'Trigger deployments', desc: 'Deploy to staging or production', agents: { dev: false, qa: false, techlead: true, pm: false, devops: true, support: false } },
  { key: 'data_export', label: 'Export user data', desc: 'Download or export customer data', agents: { dev: false, qa: false, techlead: false, pm: false, devops: false, support: false } },
  { key: 'pii_access', label: 'Access PII', desc: 'Read personally identifiable information', agents: { dev: false, qa: false, techlead: false, pm: false, devops: false, support: true } },
  { key: 'external_api', label: 'Call external APIs', desc: 'Make requests to third-party services', agents: { dev: true, qa: true, techlead: true, pm: true, devops: true, support: false } },
  { key: 'infrastructure', label: 'Modify infrastructure', desc: 'Scale, restart, or change cloud resources', agents: { dev: false, qa: false, techlead: true, pm: false, devops: true, support: false } },
  { key: 'security_scan', label: 'Run security scans', desc: 'Execute vulnerability and penetration tests', agents: { dev: false, qa: true, techlead: true, pm: false, devops: true, support: false } },
  { key: 'auto_fix', label: 'Auto-fix bugs', desc: 'Automatically apply bug fixes without approval', agents: { dev: true, qa: false, techlead: false, pm: false, devops: false, support: false } },
  { key: 'approve_pr', label: 'Approve pull requests', desc: 'Merge code changes without human review', agents: { dev: false, qa: false, techlead: true, pm: false, devops: false, support: false } },
];

/* ── Components ── */
function TabButton({ active, onClick, icon: Icon, label, count }: { active: boolean; onClick: () => void; icon: any; label: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-[#5b5fc7]/10 text-[#5b5fc7]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon size={16} />
      {label}
      {count !== undefined && (
        <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? 'bg-[#5b5fc7]/20 text-[#5b5fc7]' : 'bg-gray-100 text-gray-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ icon: Icon, label, value, change, changeType, iconBg }: { icon: any; label: string; value: string; change: string; changeType: 'up' | 'down' | 'neutral'; iconBg: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg }}>
          <Icon size={18} className="text-[#5b5fc7]" />
        </div>
        <div className={`flex items-center gap-0.5 text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-red-500' : 'text-gray-400'}`}>
          {changeType === 'up' ? <ArrowUpRight size={12} /> : changeType === 'down' ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {change}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    allowed: { bg: '#e6f4ea', text: '#237b4b', label: 'Allowed' },
    blocked: { bg: '#fce8e6', text: '#c5221f', label: 'Blocked' },
    flagged: { bg: '#fef3e8', text: '#b06000', label: 'Flagged' },
    active: { bg: '#e6f4ea', text: '#237b4b', label: 'Active' },
    paused: { bg: '#f1f3f4', text: '#5f6368', label: 'Paused' },
  };
  const s = map[status] || { bg: '#f1f3f4', text: '#5f6368', label: status };
  return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.text }}>{s.label}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = { low: '#e6f4ea', medium: '#fef3e8', high: '#fce8e6', critical: '#fce8e6' };
  const text: Record<string, string> = { low: '#237b4b', medium: '#b06000', high: '#c5221f', critical: '#c5221f' };
  return <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: colors[risk], color: text[risk] }}>{risk}</span>;
}

/* ═══════════════════════════════════════════ MAIN ═══ */
export default function AIGatewayPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'overview' | 'agents' | 'permissions' | 'audit' | 'costs'>('overview');
  const [search, setSearch] = useState('');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [agentStates, setAgentStates] = useState<Record<string, boolean>>(() => {
    const s: Record<string, boolean> = {};
    AGENTS.forEach(a => { s[a.id] = a.status === 'active'; });
    return s;
  });
  const [permStates, setPermStates] = useState<Record<string, Record<string, boolean>>>(() => {
    const p: Record<string, Record<string, boolean>> = {};
    PERMISSIONS.forEach(per => { p[per.key] = { ...per.agents }; });
    return p;
  });
  const [showBlockedToast, setShowBlockedToast] = useState(false);

  const toggleAgent = (id: string) => {
    setAgentStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const togglePerm = (permKey: string, agentId: string) => {
    setPermStates(prev => ({
      ...prev,
      [permKey]: { ...prev[permKey], [agentId]: !prev[permKey]?.[agentId] },
    }));
  };

  const filteredAudit = useMemo(() => {
    return AUDIT_LOG.filter(row => {
      const matchesSearch = search === '' || row.agent.toLowerCase().includes(search.toLowerCase()) || row.action.toLowerCase().includes(search.toLowerCase()) || row.target.toLowerCase().includes(search.toLowerCase());
      const matchesAgent = filterAgent === 'all' || row.agent.toLowerCase().includes(filterAgent.toLowerCase());
      const matchesRisk = filterRisk === 'all' || row.risk === filterRisk;
      return matchesSearch && matchesAgent && matchesRisk;
    });
  }, [search, filterAgent, filterRisk]);

  const blockedCount = AUDIT_LOG.filter(a => a.status === 'blocked').length;
  const flaggedCount = AUDIT_LOG.filter(a => a.status === 'flagged').length;

  return (
    <div className="min-h-screen bg-[#fafaf9]">
      {/* Header */}
      <div className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#5b5fc7]/10 flex items-center justify-center">
                <BrainCircuit size={20} className="text-[#5b5fc7]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Gateway</h1>
                <p className="text-xs text-gray-400">Control, monitor, and audit all AI agent activity</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/admin')} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                <Settings size={15} /> Settings
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto">
            <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={Activity} label="Overview" />
            <TabButton active={tab === 'agents'} onClick={() => setTab('agents')} icon={Bot} label="Agents" count={AGENTS.length} />
            <TabButton active={tab === 'permissions'} onClick={() => setTab('permissions')} icon={Lock} label="Permissions" />
            <TabButton active={tab === 'audit'} onClick={() => setTab('audit')} icon={Eye} label="Audit Log" count={blockedCount + flaggedCount > 0 ? blockedCount + flaggedCount : undefined} />
            <TabButton active={tab === 'costs'} onClick={() => setTab('costs')} icon={DollarSign} label="Costs" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
        <AnimatePresence mode="wait">
          {/* ═════════════════════════ OVERVIEW ═══════════════════ */}
          {tab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Bot} label="Active agents" value={String(AGENTS.filter(a => agentStates[a.id]).length)} change="+2 today" changeType="up" iconBg="#e8eaf6" />
                <StatCard icon={Activity} label="Actions today" value="98" change="+12%" changeType="up" iconBg="#e6f4ea" />
                <StatCard icon={DollarSign} label="Cost today" value="$11.78" change="-3%" changeType="down" iconBg="#fef3e8" />
                <StatCard icon={Shield} label="Threats blocked" value={String(blockedCount)} change={blockedCount > 0 ? 'Action needed' : 'All clear'} changeType={blockedCount > 0 ? 'up' : 'neutral'} iconBg="#fce8e6" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Token usage chart */}
                <div className="lg:col-span-2 rounded-xl bg-white border border-gray-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-900">Token Usage (24h)</h3>
                    <span className="text-xs text-gray-400">247.5K total tokens</span>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={TOKEN_DATA}>
                      <defs>
                        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#5b5fc7" stopOpacity={0.2} /><stop offset="95%" stopColor="#5b5fc7" stopOpacity={0} /></linearGradient>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c7ff0" stopOpacity={0.2} /><stop offset="95%" stopColor="#7c7ff0" stopOpacity={0} /></linearGradient>
                        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                      <Area type="monotone" dataKey="gpt4" stackId="1" stroke="#5b5fc7" fill="url(#g1)" strokeWidth={2} name="GPT-4" />
                      <Area type="monotone" dataKey="claude" stackId="1" stroke="#7c7ff0" fill="url(#g2)" strokeWidth={2} name="Claude 3" />
                      <Area type="monotone" dataKey="custom" stackId="1" stroke="#10B981" fill="url(#g3)" strokeWidth={2} name="BrixOS Custom" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Model distribution */}
                <div className="rounded-xl bg-white border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Model Distribution</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={MODEL_USAGE} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                        {MODEL_USAGE.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {MODEL_USAGE.map(m => (
                      <div key={m.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: m.color }} /><span className="text-gray-600">{m.name}</span></div>
                        <span className="font-semibold text-gray-900">{m.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent flagged actions */}
              {(blockedCount > 0 || flaggedCount > 0) && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-5 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h3 className="text-sm font-semibold text-red-700">Attention Required</h3>
                  </div>
                  <div className="space-y-2">
                    {AUDIT_LOG.filter(a => a.status === 'blocked' || a.status === 'flagged').map(row => (
                      <div key={row.id} className="flex items-center justify-between rounded-lg bg-white/60 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${row.status === 'blocked' ? 'bg-red-500' : 'bg-amber-500'}`} />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{row.agent}</span>
                            <span className="text-sm text-gray-500"> — {row.action}</span>
                            <span className="text-xs text-gray-400 ml-2">on {row.target}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <RiskBadge risk={row.risk} />
                          <StatusBadge status={row.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active agents summary */}
              <div className="rounded-xl bg-white border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Agent Activity</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {AGENTS.map(agent => (
                    <div key={agent.id} className="text-center p-4 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setTab('agents')}>
                      <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: agent.color }}>
                        {agent.name[0]}
                      </div>
                      <div className="text-xs font-medium text-gray-900">{agent.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{agent.tasksToday} tasks</div>
                      <div className={`inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium ${agentStates[agent.id] ? 'text-emerald-600' : 'text-gray-400'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${agentStates[agent.id] ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                        {agentStates[agent.id] ? 'Active' : 'Paused'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════ AGENTS ═════════════════════ */}
          {tab === 'agents' && (
            <motion.div key="agents" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="grid gap-4">
                {AGENTS.map((agent, i) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-xl bg-white border border-gray-100 p-6 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${agent.color}15` }}>
                          <agent.icon size={22} style={{ color: agent.color }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-semibold text-gray-900">{agent.name}</h3>
                            <StatusBadge status={agentStates[agent.id] ? 'active' : 'paused'} />
                          </div>
                          <p className="text-xs text-gray-400">{agent.role} · Using {agent.model}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAgent(agent.id)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                        style={{
                          backgroundColor: agentStates[agent.id] ? '#fce8e6' : '#e6f4ea',
                          color: agentStates[agent.id] ? '#c5221f' : '#237b4b',
                        }}
                      >
                        {agentStates[agent.id] ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-50">
                      <div>
                        <div className="text-xs text-gray-400">Tasks today</div>
                        <div className="text-lg font-semibold text-gray-900">{agent.tasksToday}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Tokens used</div>
                        <div className="text-lg font-semibold text-gray-900">{agent.tokens}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Est. cost</div>
                        <div className="text-lg font-semibold text-gray-900">{agent.cost}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Model</div>
                        <div className="text-sm font-medium text-gray-900 mt-1">{agent.model}</div>
                      </div>
                    </div>

                    {/* Mini audit for this agent */}
                    <div className="mt-4 space-y-2">
                      {AUDIT_LOG.filter(a => a.agent === agent.name).slice(0, 3).map(row => (
                        <div key={row.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={row.status} />
                            <span className="text-xs text-gray-600">{row.action}</span>
                            <span className="text-[10px] text-gray-400">on {row.target}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <RiskBadge risk={row.risk} />
                            <span className="text-[10px] text-gray-400">{row.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════ PERMISSIONS ════════════════ */}
          {tab === 'permissions' && (
            <motion.div key="permissions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900">Agent Permissions Matrix</h3>
                  <p className="text-xs text-gray-400 mt-1">Toggle permissions for each AI agent. Changes take effect immediately.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Permission</th>
                        {AGENTS.map(a => (
                          <th key={a.id} className="text-center px-3 py-3 min-w-[80px]">
                            <div className="flex flex-col items-center gap-1">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: a.color }}>
                                {a.name[0]}
                              </div>
                              <span className="text-[10px] text-gray-500">{a.name.split(' ')[0]}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERMISSIONS.map((perm, pi) => (
                        <tr key={perm.key} className={`border-b border-gray-50 ${pi % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{perm.label}</div>
                            <div className="text-xs text-gray-400">{perm.desc}</div>
                          </td>
                          {AGENTS.map(a => {
                            const isOn = permStates[perm.key]?.[a.id] ?? false;
                            return (
                              <td key={a.id} className="text-center px-3 py-4">
                                <button
                                  onClick={() => togglePerm(perm.key, a.id)}
                                  className="mx-auto"
                                >
                                  {isOn ? (
                                    <ToggleRight size={24} style={{ color: a.color }} />
                                  ) : (
                                    <ToggleLeft size={24} className="text-gray-200" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Guardrails */}
              <div className="mt-6 rounded-xl bg-white border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Safety Guardrails</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Max tokens per request', value: '4,096', desc: 'Prevents runaway token consumption' },
                    { label: 'Auto-pause on anomaly', value: 'Enabled', desc: 'Pauses agent if usage spikes 5x' },
                    { label: 'Require approval for', value: 'Deploys, Data export', desc: 'High-risk actions need human sign-off' },
                    { label: 'PII redaction', value: 'Enabled', desc: 'Automatically masks sensitive data in logs' },
                    { label: 'Rate limit', value: '100 req/min', desc: 'Per-agent request throttling' },
                    { label: 'Daily budget cap', value: '$50/agent', desc: 'Auto-pause when budget exceeded' },
                  ].map(g => (
                    <div key={g.label} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{g.label}</div>
                        <div className="text-xs text-gray-400">{g.desc}</div>
                      </div>
                      <span className="text-xs font-semibold text-[#5b5fc7] bg-[#5b5fc7]/5 rounded-full px-2.5 py-1">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════ AUDIT LOG ══════════════════ */}
          {tab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {/* Filters */}
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-4">
                <div className="flex-1 relative max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search actions, targets, agents..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5b5fc7]/30 focus:border-[#5b5fc7]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5b5fc7]/30">
                    <option value="all">All agents</option>
                    {AGENTS.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                  <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#5b5fc7]/30">
                    <option value="all">All risks</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                  <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              <div className="rounded-xl bg-white border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risk</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tokens</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map((row, i) => (
                      <motion.tr
                        key={row.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${row.status === 'blocked' ? 'bg-red-50/30' : row.status === 'flagged' ? 'bg-amber-50/30' : ''}`}
                      >
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: AGENTS.find(a => a.name === row.agent)?.color || '#5b5fc7' }}>
                              {row.agent[0]}
                            </div>
                            <span className="text-sm text-gray-900">{row.agent}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{row.action}</td>
                        <td className="px-4 py-3 text-xs text-gray-400 font-mono">{row.target}</td>
                        <td className="px-4 py-3 text-center"><StatusBadge status={row.status} /></td>
                        <td className="px-4 py-3 text-center"><RiskBadge risk={row.risk} /></td>
                        <td className="px-4 py-3 text-right text-sm text-gray-600">{row.tokens.toLocaleString()}</td>
                        <td className="px-6 py-3 text-right text-xs text-gray-400">{row.time}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {filteredAudit.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <EyeOff size={24} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No audit entries match your filters</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ═════════════════════════ COSTS ══════════════════════ */}
          {tab === 'costs' && (
            <motion.div key="costs" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard icon={DollarSign} label="Today" value="$11.78" change="-3%" changeType="down" iconBg="#fef3e8" />
                <StatCard icon={TrendingUp} label="This week" value="$621.20" change="+8%" changeType="up" iconBg="#e6f4ea" />
                <StatCard icon={Clock} label="This month" value="$2,847.50" change="+12%" changeType="up" iconBg="#e8eaf6" />
                <StatCard icon={Zap} label="Projected" value="$3,420" change="On track" changeType="neutral" iconBg="#f1f3f4" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="rounded-xl bg-white border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Daily Cost (7 days)</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={COST_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}`} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']} />
                      <Bar dataKey="cost" fill="#5b5fc7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="rounded-xl bg-white border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Cost by Agent</h3>
                  <div className="space-y-4">
                    {AGENTS.map(agent => (
                      <div key={agent.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: agent.color }}>
                              {agent.name[0]}
                            </div>
                            <span className="text-sm text-gray-700">{agent.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{agent.cost}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100">
                          <motion.div
                            className="h-2 rounded-full"
                            style={{ backgroundColor: agent.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(parseFloat(agent.cost.slice(1)) / 3.21) * 100}%` }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Budget settings */}
              <div className="rounded-xl bg-white border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Budget Controls</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Daily budget', value: '$50.00', used: '23.6%', status: 'normal' },
                    { label: 'Weekly budget', value: '$750.00', used: '82.8%', status: 'warning' },
                    { label: 'Monthly budget', value: '$3,500.00', used: '81.4%', status: 'warning' },
                  ].map(b => (
                    <div key={b.label} className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs text-gray-400">{b.label}</div>
                      <div className="text-lg font-semibold text-gray-900 mt-1">{b.value}</div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-gray-400">Used</span>
                          <span className={`text-[10px] font-medium ${b.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'}`}>{b.used}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200">
                          <div className={`h-1.5 rounded-full ${b.status === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: b.used }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
