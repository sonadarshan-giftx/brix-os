import { useState, useEffect, useMemo } from 'react';
import { employees } from '@/data/mockData';
import type { Employee } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import type { AppConfig } from '@/store/useStore';
import { Avatar } from '@/components/shared/Avatar';
import { StatusChip } from '@/components/shared/StatusChip';
import { Card } from '@/components/shared/Card';
import { TabsBar } from '@/components/shared/TabsBar';
import { confirmAction, showToast, escapeHtml } from '@/utils/helpers';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Search,
  Grid3x3,
  List,
  ChevronLeft,
  Users,
  Shield,
  BarChart3,
  CreditCard,
  Code2,
  Eye,
  Megaphone,
  LifeBuoy,
  ClipboardCheck,
  Paintbrush,
  Plug,
  Github,
  Gitlab,
  FileText,
  Trello,
  Slack,
  Globe,
  BookOpen,
  FileCode2,
  Siren,
  LayoutGrid,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Plus,
  Lock,
  KeyRound,
  Fingerprint,
  LogOut,
  ExternalLink,
  FolderGit,
  Loader2,
  Webhook,
  Activity,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  XCircle,
  Settings,
} from 'lucide-react';

const CONNECTED_SERVICES = [
  { name: 'Stripe', category: 'Finance', status: 'connected' as const, account: 'acct_stripe_...', connected: 'Jan 10, 2025' },
  { name: 'Twilio', category: 'Communication', status: 'connected' as const, account: 'acct_twilio_...', connected: 'Feb 1, 2025' },
  { name: 'Datadog', category: 'Monitoring', status: 'disconnected' as const, account: '-', connected: '-' },
  { name: 'AWS', category: 'Infrastructure', status: 'connected' as const, account: '123456789', connected: 'Mar 5, 2025' },
  { name: 'Cloudflare', category: 'Security', status: 'connected' as const, account: 'zone_cf_...', connected: 'Jan 20, 2025' },
  { name: 'SendGrid', category: 'Communication', status: 'disconnected' as const, account: '-', connected: '-' },
  { name: 'PagerDuty', category: 'Ops', status: 'connected' as const, account: 'pd_...', connected: 'Feb 15, 2025' },
  { name: 'Figma', category: 'Design', status: 'connected' as const, account: 'figma_...', connected: 'Apr 1, 2025' },
  { name: 'Zapier', category: 'Automation', status: 'disconnected' as const, account: '-', connected: '-' },
  { name: 'Calendly', category: 'Scheduling', status: 'connected' as const, account: 'cal_...', connected: 'Mar 22, 2025' },
];

/* ═══════════════════════════════════════════
   Tier 1: Work MCPs (Integrations)
   ═══════════════════════════════════════════ */
type AppStatus = 'connected' | 'available' | 'connecting' | 'error';

interface McpApp {
  name: string;
  icon: React.ElementType;
  status: AppStatus;
  lastSync: string;
  category: string;
  webhooks?: number;
  health?: 'healthy' | 'degraded' | 'down';
}

const INITIAL_MCP_APPS: McpApp[] = [
  { name: 'GitHub', icon: Github, status: 'connected', lastSync: '2 min ago', category: 'Code', webhooks: 3, health: 'healthy' },
  { name: 'GitLab', icon: Gitlab, status: 'available', lastSync: '-', category: 'Code' },
  { name: 'Jira', icon: Trello, status: 'available', lastSync: '-', category: 'Project' },
  { name: 'Linear', icon: LayoutGrid, status: 'connected', lastSync: '5 min ago', category: 'Project', webhooks: 2, health: 'healthy' },
  { name: 'Notion', icon: BookOpen, status: 'available', lastSync: '-', category: 'Docs' },
  { name: 'Slack', icon: Slack, status: 'connected', lastSync: '1 min ago', category: 'Chat', webhooks: 5, health: 'healthy' },
  { name: 'Sentry', icon: Siren, status: 'available', lastSync: '-', category: 'Monitoring' },
  { name: 'Google Workspace', icon: Globe, status: 'available', lastSync: '-', category: 'Productivity' },
];

/* ═══════════════════════════════════════════
   Tier 2: Admin Apps
   ═══════════════════════════════════════════ */
const ADMIN_APPS = [
  { id: 'workforce', name: 'Workforce', icon: Users, desc: 'Employee directory and hiring', color: '#5b5fc7' },
  { id: 'rules', name: 'Rules', icon: Shield, desc: 'Automation rules and policies', color: '#237b4b' },
  { id: 'reports', name: 'Reports', icon: BarChart3, desc: 'Analytics and dashboards', color: '#b56200' },
  { id: 'billing', name: 'Billing', icon: CreditCard, desc: 'Subscription and invoices', color: '#c4314b' },
  { id: 'security', name: 'Security', icon: Lock, desc: 'SSO, MFA, and access control', color: '#464775' },
  { id: 'code-workspace', name: 'Code Workspace', icon: Code2, desc: 'Repository management', color: '#1f1f1f' },
  { id: 'integrations', name: 'Integrations', icon: Plug, desc: 'Connected services', color: '#616161' },
  { id: 'branding', name: 'Branding', icon: Paintbrush, desc: 'Customize appearance', color: '#ec4899' },
  { id: 'audit', name: 'Audit', icon: ClipboardCheck, desc: 'Compliance and audit log', color: '#8b5cf6' },
  { id: 'communication', name: 'Communication', icon: Megaphone, desc: 'Announcements and templates', color: '#0891b2' },
  { id: 'helpdesk', name: 'Helpdesk', icon: LifeBuoy, desc: 'Support portal config', color: '#059669' },
  { id: 'observability', name: 'Observability', icon: Eye, desc: 'Monitoring and alerts', color: '#dc2626' },
];

/* ── Color palette for charts ── */
const CHART_COLORS = ['#5b5fc7', '#92c353', '#ffaa44', '#c4314b', '#0891b2', '#8b5cf6', '#ec4899', '#616161'];

/* ── Integration Log Type ── */
interface IntegrationLog {
  id: string;
  app: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  timestamp: string;
  details?: string;
}

/* ── API Key Type ── */
interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  scopes: string;
}

/* ── Webhook Type ── */
interface Webhook {
  id: string;
  app: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastDelivery: string;
}

/* ═══════════════════════════════════════════
   AppsPage (main router)
   ═══════════════════════════════════════════ */
export default function AppsPage() {  useEffect(() => { document.title = "Apps" + " - Brixstac"; }, []);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [configuringApp, setConfiguringApp] = useState<string | null>(null);

  if (selectedApp === 'workforce') return <WorkforceApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'rules') return <RulesApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'reports') return <ReportsApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'billing') return <BillingApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'security') return <SecurityApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'code-workspace') return <CodeWorkspaceApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'integrations') return <IntegrationsApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'branding') return <BrandingApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'audit') return <AuditApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'communication') return <CommunicationApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'helpdesk') return <HelpdeskApp onBack={() => setSelectedApp(null)} />;
  if (selectedApp === 'observability') return <ObservabilityApp onBack={() => setSelectedApp(null)} />;

  const filteredAdmin = ADMIN_APPS.filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      {/* ── Header ── */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div className="flex items-center justify-between">
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>{'Apps'}</h1>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div
              className="flex items-center gap-1 rounded"
              style={{ height: 32, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff' }}
            >
              <Search size={14} color="#a0a0a0" aria-hidden="true" />
              <input
                type="text"
                placeholder="Search apps and integrations..."
                aria-label="Search apps and integrations"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none"
                style={{ fontSize: 12, width: 150 }}
              />
            </div>
            {/* View toggle */}
            <div className="flex rounded" style={{ background: '#f0f0f0', padding: 2 }} role="group" aria-label="View mode">
              <button
                onClick={() => setViewMode('grid')}
                className="cursor-pointer rounded"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                style={{
                  padding: '4px 8px',
                  background: viewMode === 'grid' ? '#fff' : 'transparent',
                  border: 'none',
                  boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <Grid3x3 size={14} color={viewMode === 'grid' ? '#242424' : '#616161'} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="cursor-pointer rounded"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                style={{
                  padding: '4px 8px',
                  background: viewMode === 'list' ? '#fff' : 'transparent',
                  border: 'none',
                  boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <List size={14} color={viewMode === 'list' ? '#242424' : '#616161'} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* ── Tier 1: Work MCPs ── */}
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#616161', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.02em' }}>
            Work MCPs
          </h2>
          <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-3' : 'flex flex-col gap-2'}>
            {INITIAL_MCP_APPS.map((app) => (
              <McpCard key={app.name} app={app} compact={viewMode === 'list'} onConfigure={() => setConfiguringApp(app.name)} />
            ))}
          </div>
        </section>

        {/* ── Tier 2: Admin Apps ── */}
        <section>
          <h2 style={{ fontSize: 13, fontWeight: 600, color: '#616161', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.02em' }}>
            Admin Apps
          </h2>
          {filteredAdmin.length === 0 ? (
            <EmptyState icon={Search} message="No apps match your search" subMessage="Try a different search term" />
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-4 gap-3' : 'flex flex-col gap-2'}>
              {filteredAdmin.map((app) => (
                <AdminAppCard
                  key={app.id}
                  app={app}
                  compact={viewMode === 'list'}
                  onClick={() => setSelectedApp(app.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Configure Modal */}
      {configuringApp && (
        <ConfigureModal appName={configuringApp} onClose={() => setConfiguringApp(null)} />
      )}
    </div>
  );
}

/* ── Empty State ── */
function EmptyState({ icon: Icon, message, subMessage }: { icon: React.ElementType; message: string; subMessage: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded" style={{ padding: 48, border: '1px dashed #d1d1d1', background: '#fafafa' }}>
      <Icon size={40} color="#a0a0a0" />
      <p style={{ fontSize: 14, fontWeight: 500, color: '#616161', marginTop: 12 }}>{message}</p>
      <p style={{ fontSize: 12, color: '#767676', marginTop: 4 }}>{subMessage}</p>
    </div>
  );
}

/* ── MCP Card ── */
function McpCard({ app, compact, onConfigure }: { app: McpApp; compact: boolean; onConfigure: () => void }) {
  const [localApp, setLocalApp] = useState(app);
  const [isLoading, setIsLoading] = useState(false);
  const Icon = app.icon;

  const handleConnect = () => {
    setIsLoading(true);
    showToast(`Connecting to ${localApp.name}...`, 'info');
    setTimeout(() => {
      setLocalApp((prev) => ({ ...prev, status: 'connected' as AppStatus, lastSync: 'Just now', health: 'healthy' }));
      setIsLoading(false);
      showToast(`${localApp.name} connected successfully!`, 'success');
    }, 1500);
  };

  const handleDisconnect = () => {
    if (confirmAction(`Disconnect ${localApp.name}? This will stop all sync operations.`)) {
      setIsLoading(true);
      setTimeout(() => {
        setLocalApp((prev) => ({ ...prev, status: 'available' as AppStatus, lastSync: '-', health: undefined }));
        setIsLoading(false);
        showToast(`${localApp.name} disconnected`, 'info');
      }, 500);
    }
  };

  if (compact) {
    return (
      <div
        className="flex items-center gap-3 rounded"
        style={{ padding: '10px 12px', border: '1px solid #d1d1d1', background: '#fff', transition: 'border-color 100ms' }}
      >
        <Icon size={20} color="#616161" />
        <div className="flex-1">
          <div style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{localApp.name}</div>
          <div style={{ fontSize: 11, color: '#767676' }}>{localApp.category}</div>
        </div>
        <StatusDot status={localApp.status} health={localApp.health} />
        <span style={{ fontSize: 11, color: localApp.status === 'connected' ? '#237b4b' : '#616161' }}>
          {localApp.status === 'connected' ? 'Connected' : 'Available'}
        </span>
        {isLoading && <Loader2 size={14} className="animate-spin" color="#5b5fc7" />}
        {localApp.status === 'connected' && !isLoading && (
          <div className="flex gap-1">
            <button onClick={onConfigure} className="cursor-pointer rounded" style={{ padding: '3px 8px', fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }} aria-label={`Configure ${localApp.name}`}>
              Configure
            </button>
            <button onClick={handleDisconnect} className="cursor-pointer rounded" style={{ padding: '3px 8px', fontSize: 11, border: '1px solid transparent', background: 'transparent', color: '#c4314b' }} aria-label={`Disconnect ${localApp.name}`}>
              Disconnect
            </button>
          </div>
        )}
        {localApp.status === 'available' && !isLoading && (
          <button onClick={handleConnect} className="cursor-pointer rounded" style={{ padding: '3px 12px', fontSize: 11, border: 'none', background: '#5b5fc7', color: '#fff' }} aria-label={`Connect ${localApp.name}`}>
            Connect
          </button>
        )}
      </div>
    );
  }
  return (
    <div
      className="flex flex-col items-center rounded"
      style={{
        padding: 20,
        border: '1px solid #d1d1d1',
        background: '#fff',
        transition: 'border-color 100ms',
        textAlign: 'center',
        opacity: isLoading ? 0.7 : 1,
      }}
    >
      <Icon size={28} color="#616161" />
      <div style={{ fontSize: 14, fontWeight: 500, color: '#242424', marginTop: 10 }}>{localApp.name}</div>
      <div className="flex items-center gap-1" style={{ marginTop: 6 }}>
        <StatusDot status={localApp.status} health={localApp.health} />
        <span style={{ fontSize: 11, color: localApp.status === 'connected' ? '#237b4b' : '#a0a0a0' }}>
          {localApp.status === 'connected' ? `Connected · ${localApp.lastSync}` : 'Available'}
        </span>
      </div>
      {isLoading && (
        <div className="flex items-center gap-1" style={{ marginTop: 10 }}>
          <Loader2 size={12} className="animate-spin" color="#5b5fc7" />
          <span style={{ fontSize: 11, color: '#5b5fc7' }}>Connecting...</span>
        </div>
      )}
      <div className="flex gap-2" style={{ marginTop: 10 }}>
        {localApp.status === 'connected' && !isLoading ? (
          <>
            <button onClick={onConfigure} className="cursor-pointer rounded" style={{ padding: '3px 8px', fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }} aria-label={`Configure ${localApp.name}`}>
              Configure
            </button>
            <button onClick={handleDisconnect} className="cursor-pointer rounded" style={{ padding: '3px 8px', fontSize: 11, border: '1px solid transparent', background: 'transparent', color: '#c4314b' }} aria-label={`Disconnect ${localApp.name}`}>
              Disconnect
            </button>
          </>
        ) : !isLoading ? (
          <button onClick={handleConnect} className="cursor-pointer rounded" style={{ padding: '3px 12px', fontSize: 11, border: 'none', background: '#5b5fc7', color: '#fff' }} aria-label={`Connect ${localApp.name}`}>
            Connect
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ── Admin App Card ── */
function AdminAppCard({ app, compact, onClick }: { app: typeof ADMIN_APPS[0]; compact: boolean; onClick: () => void }) {
  const Icon = app.icon;
  if (compact) {
    return (
      <div
        onClick={onClick}
        className="flex cursor-pointer items-center gap-3 rounded hover:border-[#b1b1b1]"
        style={{ padding: '10px 12px', border: '1px solid #d1d1d1', background: '#fff', transition: 'border-color 100ms' }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
        aria-label={`Open ${app.name}`}
      >
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 32, height: 32, background: app.color + '15' }}
        >
          <Icon size={16} color={app.color} />
        </div>
        <div className="flex-1">
          <div style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{app.name}</div>
          <div style={{ fontSize: 11, color: '#616161' }}>{app.desc}</div>
        </div>
        <ExternalLink size={14} color="#a0a0a0" />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer flex-col rounded hover:border-[#b1b1b1]"
      style={{
        padding: 16,
        border: '1px solid #d1d1d1',
        background: '#fff',
        transition: 'border-color 100ms',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      aria-label={`Open ${app.name}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center rounded"
          style={{ width: 40, height: 40, background: app.color + '15' }}
        >
          <Icon size={20} color={app.color} />
        </div>
        <ExternalLink size={14} color="#a0a0a0" />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginTop: 10 }}>{app.name}</div>
      <div style={{ fontSize: 12, color: '#616161', marginTop: 2 }}>{app.desc}</div>
    </div>
  );
}

function StatusDot({ status, health }: { status: AppStatus; health?: 'healthy' | 'degraded' | 'down' }) {
  const dotColor = status === 'connected'
    ? health === 'degraded' ? '#f59e0b' : health === 'down' ? '#c4314b' : '#92c353'
    : '#a0a0a0';
  return (
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: dotColor,
      }}
      role="status"
      aria-label={`Status: ${status}${health ? `, Health: ${health}` : ''}`}
    />
  );
}

/* ═══════════════════════════════════════════
   Configure Modal — Webhooks, API Keys, Logs, Health
   ═══════════════════════════════════════════ */
const EVENT_OPTIONS = ['push', 'pr', 'merge', 'issue', 'comment', 'deploy', 'alert', 'message', 'reaction', 'channel'];

function ConfigureModal({ appName, onClose }: { appName: string; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'config' | 'webhooks' | 'apikeys' | 'logs' | 'health'>('config');
  const appConfig = useStore((s) => s.appConfigs[appName] || {});
  const setAppConfig = useStore((s) => s.setAppConfig);
  const allWebhooks = useStore((s) => s.appWebhooks);
  const allApiKeys = useStore((s) => s.appApiKeys);
  const allLogs = useStore((s) => s.appIntegrationLogs);
  const updateWebhook = useStore((s) => s.updateWebhook);
  const addAppApiKey = useStore((s) => s.addAppApiKey);
  const revokeAppApiKey = useStore((s) => s.revokeAppApiKey);
  const addIntegrationLog = useStore((s) => s.addIntegrationLog);
  const [apiEndpoint, setApiEndpoint] = useState(appConfig.apiEndpoint || `https://api.${appName.toLowerCase()}.example.com/v1`);
  const [authToken, setAuthToken] = useState(appConfig.authToken || '');
  const [webhookUrl, setWebhookUrl] = useState(appConfig.webhookUrl || `https://api.brixstac.io/webhooks/${appName.toLowerCase()}`);
  const [selectedEvents, setSelectedEvents] = useState<string[]>(appConfig.events || ['push', 'pr']);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const appWebhooks = allWebhooks.filter((w) => w.app === appName);
  const appKeys = allApiKeys.filter((k) => k.name.toLowerCase().includes(appName.toLowerCase()) || k.scopes.toLowerCase().includes(appName.toLowerCase()));
  const appLogs = allLogs.filter((l) => l.app === appName);

  const tabs = [
    { id: 'config' as const, label: 'Configuration' },
    { id: 'webhooks' as const, label: `Webhooks (${appWebhooks.length})` },
    { id: 'apikeys' as const, label: `API Keys (${appKeys.length})` },
    { id: 'logs' as const, label: `Logs (${appLogs.length})` },
    { id: 'health' as const, label: 'Health' },
  ];

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setAppConfig(appName, { appName, apiEndpoint, authToken, webhookUrl, events: selectedEvents });
      addIntegrationLog({
        app: appName,
        action: 'Configuration updated',
        status: 'success',
        timestamp: 'Just now',
      });
      setIsSaving(false);
      showToast(`${appName} configuration saved`, 'success');
      onClose();
    }, 500);
  };

  const toggleEvent = (evt: string) => {
    setSelectedEvents((prev) => prev.includes(evt) ? prev.filter((e) => e !== evt) : [...prev, evt]);
  };

  const toggleWebhookStatus = (id: string, currentStatus: 'active' | 'inactive') => {
    updateWebhook(id, { status: currentStatus === 'active' ? 'inactive' : 'active' });
    addIntegrationLog({
      app: appName,
      action: `Webhook ${currentStatus === 'active' ? 'deactivated' : 'activated'}`,
      status: 'success',
      timestamp: 'Just now',
    });
    showToast(`Webhook ${currentStatus === 'active' ? 'deactivated' : 'activated'}`, 'success');
  };

  const handleCopyKey = (id: string) => {
    setCopiedKey(id);
    showToast('API key copied to clipboard', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRevokeKey = (id: string) => {
    if (confirmAction('Revoke this API key? Any applications using it will stop working.')) {
      revokeAppApiKey(id);
      addIntegrationLog({
        app: appName,
        action: 'API key revoked',
        status: 'warning',
        timestamp: 'Just now',
      });
      showToast('success');
    }
  };

  const handleCreateKey = () => {
    const newKey = {
      name: `${appName} API Key`,
      prefix: `ivxt_${appName.toLowerCase().slice(0, 3)}_...`,
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      scopes: 'read',
    };
    addAppApiKey(newKey);
    addIntegrationLog({
      app: appName,
      action: 'New API key created',
      status: 'success',
      timestamp: 'Just now',
    });
    showToast('New API key created', 'success');
  };

  const appHealth: 'healthy' | 'degraded' | 'down' = 'healthy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex max-h-[85vh] w-[640px] flex-col rounded-lg bg-white shadow-xl" style={{ border: '1px solid #e1e1e1' }}>
        {/* Modal Header */}
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid #e1e1e1' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>{appName} Configuration</h2>
            <p style={{ fontSize: 12, color: '#616161', marginTop: 2 }}>Manage connection, webhooks, API keys and health monitoring</p>
          </div>
          <button onClick={onClose} className="cursor-pointer rounded p-2 hover:bg-[#f0f0f0]" style={{ border: 'none', background: 'transparent', minWidth: 44, minHeight: 44 }} aria-label="Close modal">
            <X size={18} color="#616161" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #e1e1e1', padding: '0 20px' }}>
          <div className="flex gap-1" role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                role="tab"
                aria-selected={activeTab === t.id}
                className="cursor-pointer"
                style={{
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: activeTab === t.id ? '2px solid #5b5fc7' : '2px solid transparent',
                  background: 'transparent',
                  color: activeTab === t.id ? '#5b5fc7' : '#616161',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
          {/* ── Configuration Tab ── */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>App</label>
                <div className="flex items-center gap-2 rounded" style={{ padding: '8px 12px', background: '#f8f8f8', border: '1px solid #e1e1e1' }}>
                  <Settings size={16} color="#616161" />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{appName}</span>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>API Endpoint</label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="w-full rounded outline-none"
                  style={{ height: 36, padding: '0 12px', fontSize: 13, border: '1px solid #d1d1d1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Auth Token</label>
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter API token or OAuth credential"
                  className="w-full rounded outline-none"
                  style={{ height: 36, padding: '0 12px', fontSize: 13, border: '1px solid #d1d1d1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Webhook URL</label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full rounded outline-none"
                  style={{ height: 36, padding: '0 12px', fontSize: 13, border: '1px solid #d1d1d1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Event Subscriptions</label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_OPTIONS.map((evt) => (
                    <button
                      key={evt}
                      onClick={() => toggleEvent(evt)}
                      className="cursor-pointer rounded-full"
                      style={{
                        padding: '4px 12px',
                        fontSize: 11,
                        fontWeight: 500,
                        border: selectedEvents.includes(evt) ? '1px solid #5b5fc7' : '1px solid #d1d1d1',
                        background: selectedEvents.includes(evt) ? '#f8f8ff' : '#fff',
                        color: selectedEvents.includes(evt) ? '#5b5fc7' : '#616161',
                      }}
                    >
                      {selectedEvents.includes(evt) && <Check size={10} style={{ display: 'inline', marginRight: 4 }} />}
                      {evt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Webhooks Tab ── */}
          {activeTab === 'webhooks' && (
            <div className="space-y-3">
              {appWebhooks.length === 0 ? (
                <EmptyState icon={Webhook} message="No webhooks configured" subMessage="Save the configuration to create webhooks for this app" />
              ) : (
                appWebhooks.map((wh) => (
                  <Card key={wh.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Webhook size={14} color="#5b5fc7" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{wh.url}</span>
                          <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, fontWeight: 600, background: wh.status === 'active' ? 'rgba(146,195,83,0.15)' : 'rgba(138,138,138,0.15)', color: wh.status === 'active' ? '#237b4b' : '#8a8a8a' }}>
                            {wh.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {wh.events.map((e) => (
                            <span key={e} className="rounded-full" style={{ padding: '1px 6px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{e}</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: '#767676', marginTop: 4 }}>Last delivery: {wh.lastDelivery}</p>
                      </div>
                      <button
                        onClick={() => toggleWebhookStatus(wh.id, wh.status)}
                        className="cursor-pointer rounded px-3 py-1"
                        style={{ fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}
                      >
                        {wh.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── API Keys Tab ── */}
          {activeTab === 'apikeys' && (
            <div className="space-y-3">
              <div className="mb-3 flex justify-end">
                <button
                  onClick={handleCreateKey}
                  className="flex cursor-pointer items-center gap-1 rounded px-3 text-white"
                  style={{ fontSize: 12, height: 32, backgroundColor: '#5b5fc7', border: 'none' }}
                >
                  <Plus size={14} aria-hidden="true" /> New Key
                </button>
              </div>
              {appKeys.length === 0 ? (
                <EmptyState icon={KeyRound} message="No API keys" subMessage="Create a new API key to get started" />
              ) : (
                appKeys.map((key) => (
                  <Card key={key.id}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{key.name}</div>
                        <div className="mt-1 flex items-center gap-3">
                          <span style={{ fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{key.prefix}</span>
                          <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{key.scopes}</span>
                        </div>
                        <p style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>Created {key.created} &middot; Last used {key.lastUsed}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleCopyKey(key.id)} className="cursor-pointer rounded p-1.5" style={{ border: '1px solid #d1d1d1', background: '#fff' }} aria-label="Copy API key">
                          {copiedKey === key.id ? <Check size={14} color="#237b4b" /> : <Copy size={14} color="#616161" />}
                        </button>
                        <button onClick={() => handleRevokeKey(key.id)} className="cursor-pointer rounded p-1.5" style={{ border: '1px solid #c4314b', background: '#fff' }} aria-label="Revoke API key">
                          <Trash2 size={14} color="#c4314b" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── Logs Tab ── */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              {appLogs.length === 0 ? (
                <EmptyState icon={FileText} message="No integration logs" subMessage="Activity will appear here as you use this integration" />
              ) : (
                appLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: log.status === 'error' ? '#fecaca' : log.status === 'warning' ? '#fde68a' : '#e1e1e1', backgroundColor: log.status === 'error' ? '#fef2f2' : log.status === 'warning' ? '#fefce8' : '#fff' }}>
                    <div className="mt-0.5">
                      {log.status === 'success' ? <CheckCircle2 size={14} color="#237b4b" /> : log.status === 'warning' ? <AlertTriangle size={14} color="#f59e0b" /> : <XCircle size={14} color="#c4314b" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>{log.app}</span>
                        <span style={{ fontSize: 11, color: '#767676' }}>{log.timestamp}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#616161', marginTop: 1 }}>{log.action}</p>
                      {log.details && <p style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>{log.details}</p>}
                    </div>
                    <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, fontWeight: 600, background: log.status === 'success' ? 'rgba(146,195,83,0.15)' : log.status === 'warning' ? 'rgba(255,170,68,0.15)' : 'rgba(196,49,75,0.15)', color: log.status === 'success' ? '#237b4b' : log.status === 'warning' ? '#b56200' : '#c4314b' }}>
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Health Tab ── */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Activity size={20} color={appHealth === 'healthy' ? '#237b4b' : appHealth === 'degraded' ? '#f59e0b' : '#c4314b'} />
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{appName} Status</span>
                      <div style={{ fontSize: 12, color: '#616161' }}>Real-time health monitoring</div>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full" style={{ padding: '2px 10px', fontSize: 11, fontWeight: 600, background: appHealth === 'healthy' ? 'rgba(146,195,83,0.15)' : appHealth === 'degraded' ? 'rgba(255,170,68,0.15)' : 'rgba(196,49,75,0.15)', color: appHealth === 'healthy' ? '#237b4b' : appHealth === 'degraded' ? '#b56200' : '#c4314b' }}>
                    <Activity size={10} />
                    {appHealth}
                  </span>
                </div>
                <div className="mt-3 rounded-full" style={{ height: 6, background: '#e1e1e1' }}>
                  <div className="rounded-full" style={{ height: 6, width: appHealth === 'healthy' ? '98%' : appHealth === 'degraded' ? '75%' : '30%', background: appHealth === 'healthy' ? '#92c353' : appHealth === 'degraded' ? '#ffaa44' : '#c4314b', transition: 'width 0.3s ease' }} />
                </div>
              </Card>

              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Uptime (24h)</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#237b4b', marginTop: 4 }}>99.9%</p>
                </Card>
                <Card>
                  <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Avg Latency</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#5b5fc7', marginTop: 4 }}>45ms</p>
                </Card>
                <Card>
                  <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Errors (24h)</p>
                  <p style={{ fontSize: 22, fontWeight: 600, color: '#0891b2', marginTop: 4 }}>0</p>
                </Card>
              </div>

              <Card>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Health Indicators</h3>
                {[
                  { label: 'API Connectivity', status: 'Operational', color: '#237b4b' },
                  { label: 'Webhook Delivery', status: 'Operational', color: '#237b4b' },
                  { label: 'Authentication', status: 'Operational', color: '#237b4b' },
                  { label: 'Rate Limiting', status: 'Healthy', color: '#237b4b' },
                  { label: 'Event Processing', status: appHealth === 'healthy' ? 'Operational' : 'Degraded', color: appHealth === 'healthy' ? '#237b4b' : '#f59e0b' },
                ].map((indicator) => (
                  <div key={indicator.label} className="flex items-center justify-between" style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: 12, color: '#242424' }}>{indicator.label}</span>
                    <span className="flex items-center gap-1 rounded-full" style={{ padding: '1px 8px', fontSize: 10, fontWeight: 600, background: indicator.color + '20', color: indicator.color }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: indicator.color, display: 'inline-block' }} />
                      {indicator.status}
                    </span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab === 'config' && (
          <div className="flex items-center justify-end gap-2" style={{ padding: '12px 20px', borderTop: '1px solid #e1e1e1' }}>
            <button onClick={onClose} className="cursor-pointer rounded px-4 py-2" style={{ fontSize: 12, fontWeight: 500, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex cursor-pointer items-center gap-1 rounded px-4 py-2 text-white"
              style={{ fontSize: 12, fontWeight: 500, background: '#5b5fc7', border: 'none', opacity: isSaving ? 0.7 : 1 }}
            >
              {isSaving && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Workforce App
   ═══════════════════════════════════════════ */
function WorkforceApp({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const tabs = [
    { id: 'all', label: `All (${employees.length})` },
    { id: 'ai', label: `AI (${employees.filter((e) => e.kind === 'ai').length})` },
    { id: 'human', label: `Human (${employees.filter((e) => e.kind === 'human').length})` },
  ];

  const filtered = employees.filter((e) => {
    if (tab === 'ai' && e.kind !== 'ai') return false;
    if (tab === 'human' && e.kind !== 'human') return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (selectedEmp) {
    return <EmployeeProfile emp={selectedEmp} onBack={() => setSelectedEmp(null)} />;
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Workforce" onBack={onBack}>
        <button
          onClick={() => { setIsAdding(true); showToast('info'); }}
          className="flex cursor-pointer items-center gap-1 rounded"
          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, background: '#5b5fc7', color: '#fff', border: 'none' }}
          aria-label="Add new hire"
        >
          <Plus size={14} aria-hidden="true" />
          New Hire
        </button>
      </AppHeader>

      <TabsBar tabs={tabs} activeTab={tab} onTabChange={setTab} />

      <div style={{ padding: '12px 20px' }}>
        <div
          className="flex items-center gap-1 rounded"
          style={{ height: 32, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff', maxWidth: 300 }}
        >
          <Search size={14} color="#a0a0a0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none"
            style={{ fontSize: 12, flex: 1 }}
            aria-label="Search employees"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {filtered.length === 0 ? (
          <EmptyState icon={Search} message="No employees found" subMessage="Try adjusting your search or filters" />
        ) : (
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e1e1e1' }}>
                {['Name', 'Role', 'Type', 'Status', 'Team', 'Actions'].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr
                  key={emp.id}
                  style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                  onClick={() => setSelectedEmp(emp)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedEmp(emp); } }}
                  role="button"
                  aria-label={`View ${emp.name} profile`}
                >
                  <td style={{ padding: '8px 12px' }}>
                    <div className="flex items-center gap-2">
                      <Avatar src={emp.avatar} alt={emp.name} size="sm" isAi={emp.kind === 'ai'} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{emp.name}</div>
                        <div style={{ fontSize: 11, color: '#616161' }}>{emp.title}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#242424' }}>{emp.role}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span
                      className="rounded-full"
                      style={{
                        padding: '1px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        background: emp.kind === 'ai' ? 'rgba(91,95,199,0.15)' : 'rgba(146,195,83,0.15)',
                        color: emp.kind === 'ai' ? '#5b5fc7' : '#237b4b',
                      }}
                    >
                      {emp.kind === 'ai' ? 'AI' : 'Human'}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <StatusChip status={emp.status} />
                  </td>
                  <td style={{ padding: '8px 12px', fontSize: 12, color: '#616161' }}>
                    {emp.teamIds.map((t) => t.replace('team-', '')).join(', ')}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); showToast(`Configure ${emp.name} — available in Pro plan`, 'info'); }} className="cursor-pointer rounded" style={{ padding: '3px 8px', fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }} aria-label={`Configure ${emp.name}`}>
                        Configure
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function EmployeeProfile({ emp, onBack }: { emp: Employee; onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title={emp.name} onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: 20 }}>
        <div className="flex items-start gap-4">
          <Avatar src={emp.avatar} alt={emp.name} size="xl" isAi={emp.kind === 'ai'} />
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#242424' }}>{emp.name}</h2>
            <p style={{ fontSize: 14, color: '#616161' }}>{emp.title}</p>
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <span
                className="rounded-full"
                style={{
                  padding: '2px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: emp.kind === 'ai' ? 'rgba(91,95,199,0.15)' : 'rgba(146,195,83,0.15)',
                  color: emp.kind === 'ai' ? '#5b5fc7' : '#237b4b',
                }}
              >
                {emp.kind === 'ai' ? 'AI Employee' : 'Human'}
              </span>
              <StatusChip status={emp.status} />
              <span style={{ fontSize: 12, color: '#616161' }}>{emp.email}</span>
            </div>
            {emp.modelBinding && (
              <div style={{ marginTop: 12, padding: 10, background: '#f8f8f8', borderRadius: 4, fontSize: 12, color: '#616161' }}>
                <strong>Model:</strong> {emp.modelBinding.provider} {emp.modelBinding.model} · <strong>Version:</strong> {emp.modelBinding.version}
              </div>
            )}
            {emp.tokenBudget && (
              <div style={{ marginTop: 8 }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#616161' }}>Token Budget</span>
                  <span style={{ fontSize: 12, color: '#242424', fontWeight: 500 }}>${emp.tokenBudget.toLocaleString()}/mo</span>
                </div>
                <div className="rounded-full" style={{ height: 6, background: '#e1e1e1' }}>
                  <div className="rounded-full" style={{ height: 6, width: '65%', background: '#5b5fc7' }} />
                </div>
              </div>
            )}
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 12, fontWeight: 600, color: '#616161', textTransform: 'uppercase', marginBottom: 8 }}>Skills</h3>
              <div className="flex flex-wrap gap-1">
                {emp.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full"
                    style={{
                      padding: '2px 10px',
                      fontSize: 11,
                      background: '#f0f0f0',
                      color: '#616161',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
            {emp.toolAllowlist && (
              <div style={{ marginTop: 16 }}>
                <h3 style={{ fontSize: 12, fontWeight: 600, color: '#616161', textTransform: 'uppercase', marginBottom: 8 }}>Tool Access</h3>
                <div className="flex flex-wrap gap-1">
                  {emp.toolAllowlist.map((t) => (
                    <span
                      key={t}
                      className="rounded-full"
                      style={{
                        padding: '2px 10px',
                        fontSize: 11,
                        background: '#e8eaf6',
                        color: '#5b5fc7',
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Rules App
   ═══════════════════════════════════════════ */
const RULES_DATA = [
  { id: 'SEC-PAY-001', name: 'Payment code requires review', category: 'Security', active: true, english: 'When a PR touches /payment/* paths, require approval from Code Owner', trigger: 'PR touches /payment/*', action: 'Require approval from Code Owner', matchCount: 12 },
  { id: 'DEPLOY-PROD-002', name: 'Production deploy needs Lead approval', category: 'Deployment', active: true, english: 'Production deploys require 2 approvals for services with >1000 users', trigger: 'Deploy to production', action: 'Require 2 Lead approvals', matchCount: 5 },
  { id: 'COMM-EXT-001', name: 'External customer comms need review', category: 'Communication', active: true, english: 'External customer communications require leadership review before sending', trigger: 'Send external customer email', action: 'Require leadership review', matchCount: 8 },
  { id: 'BUD-INF-001', name: 'Infra spend >$10K needs CFO approval', category: 'Budget', active: true, english: 'Infrastructure spend over $10K requires CFO approval', trigger: 'Budget request >$10K', action: 'Require CFO approval', matchCount: 2 },
  { id: 'SEC-AUTH-003', name: 'Auth changes need security review', category: 'Security', active: false, english: 'Changes to authentication code require security team review', trigger: 'PR touches /auth/*', action: 'Require security team review', matchCount: 0 },
  { id: 'DEPLOY-STAGE-004', name: 'Auto-approve staging deploys', category: 'Deployment', active: true, english: 'Staging deploys are auto-approved if CI passes', trigger: 'Deploy to staging + CI passing', action: 'Auto-approve', matchCount: 34 },
];

function RulesApp({ onBack }: { onBack: () => void }) {
  const [rules, setRules] = useState(RULES_DATA);
  const [search, setSearch] = useState('');

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const filteredRules = rules.filter((r) =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || r.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Rules" onBack={onBack}>
        <button
          onClick={() => showToast('info')}
          className="flex cursor-pointer items-center gap-1 rounded"
          style={{ padding: '6px 12px', fontSize: 12, fontWeight: 500, background: '#5b5fc7', color: '#fff', border: 'none' }}
          aria-label="Create new rule"
        >
          <Plus size={14} aria-hidden="true" />
          New Rule
        </button>
      </AppHeader>

      <div style={{ padding: '12px 20px' }}>
        <div className="flex items-center gap-1 rounded" style={{ height: 32, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff', maxWidth: 300 }}>
          <Search size={14} color="#a0a0a0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search rules..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none"
            style={{ fontSize: 12, flex: 1 }}
            aria-label="Search rules"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {filteredRules.length === 0 ? (
          <EmptyState icon={Search} message="No rules found" subMessage="Try a different search term" />
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => (
              <Card key={rule.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded"
                      style={{
                        padding: '2px 8px',
                        fontSize: 10,
                        fontWeight: 600,
                        background: rule.active ? 'rgba(146,195,83,0.15)' : 'rgba(138,138,138,0.15)',
                        color: rule.active ? '#237b4b' : '#8a8a8a',
                      }}
                    >
                      {rule.active ? 'Active' : 'Inactive'}
                    </span>
                    <span style={{ fontSize: 11, color: '#767676', fontFamily: 'var(--font-mono)' }}>{rule.id}</span>
                    <span
                      className="rounded-full"
                      style={{
                        padding: '1px 8px',
                        fontSize: 10,
                        fontWeight: 500,
                        background: '#f0f0f0',
                        color: '#616161',
                      }}
                    >
                      {rule.category}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirmAction(`${rule.active ? 'Deactivate' : 'Activate'} rule "${rule.name}"?`)) {
                        toggleRule(rule.id);
                        showToast(`Rule ${rule.active ? 'deactivated' : 'activated'}`, 'success');
                      }
                    }}
                    className="cursor-pointer"
                    style={{ border: 'none', background: 'transparent' }}
                    aria-label={rule.active ? 'Deactivate rule' : 'Activate rule'}
                  >
                    {rule.active ? <ToggleRight size={22} color="#5b5fc7" /> : <ToggleLeft size={22} color="#a0a0a0" />}
                  </button>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: '#242424', marginTop: 8 }}>{rule.name}</h3>
                <p style={{ fontSize: 13, color: '#616161', marginTop: 4, fontStyle: 'italic' }}>"{rule.english}"</p>
                <div className="mt-3 grid grid-cols-2 gap-2 rounded" style={{ padding: 10, background: '#f8f8f8' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#767676', fontWeight: 600, textTransform: 'uppercase' }}>When</div>
                    <div style={{ fontSize: 12, color: '#242424', marginTop: 2 }}>{rule.trigger}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#767676', fontWeight: 600, textTransform: 'uppercase' }}>Then</div>
                    <div style={{ fontSize: 12, color: '#242424', marginTop: 2 }}>{rule.action}</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#767676', marginTop: 8 }}>
                  Matched {rule.matchCount} times today
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Reports App
   ═══════════════════════════════════════════ */
const costByModelData = [
  { name: 'Claude Opus', cost: 1240 },
  { name: 'GPT-4o', cost: 890 },
  { name: 'Claude Sonnet', cost: 620 },
  { name: 'GPT-4o-mini', cost: 340 },
  { name: 'Claude Haiku', cost: 180 },
];

const costByEmployeeData = [
  { name: 'Aria', cost: 1450 },
  { name: 'Sage', cost: 1200 },
  { name: 'Echo', cost: 980 },
  { name: 'Manager', cost: 720 },
  { name: 'Pixel', cost: 480 },
];

const velocityData = [
  { sprint: 'S7', velocity: 34, planned: 38 },
  { sprint: 'S8', velocity: 36, planned: 38 },
  { sprint: 'S9', velocity: 31, planned: 36 },
  { sprint: 'S10', velocity: 40, planned: 38 },
  { sprint: 'S11', velocity: 38, planned: 40 },
  { sprint: 'S12', velocity: 42, planned: 40 },
  { sprint: 'S13', velocity: 35, planned: 38 },
];

function ReportsApp({ onBack }: { onBack: () => void }) {
  const [dateRange, setDateRange] = useState('Last 30 days');

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Reports" onBack={onBack}>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded outline-none"
          style={{ padding: '4px 10px', fontSize: 12, border: '1px solid #d1d1d1', height: 32 }}
          aria-label="Date range"
        >
          <option>Last 7 days</option>
          <option>Last 30 days</option>
          <option>Last 90 days</option>
          <option>This quarter</option>
        </select>
      </AppHeader>

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* KPI Row */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Total AI Cost', value: '$4,830', change: '+12%', color: '#5b5fc7' },
            { label: 'Avg Velocity', value: '36.6', change: '+4%', color: '#237b4b' },
            { label: 'Escape Rate', value: '3.2%', change: '-1.5%', color: '#b56200' },
            { label: 'Deploy Frequency', value: '4.2/day', change: '+8%', color: '#0891b2' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <div style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</div>
              <div className="flex items-baseline gap-2" style={{ marginTop: 6 }}>
                <span style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>{kpi.value}</span>
                <span style={{ fontSize: 11, color: kpi.color, fontWeight: 500 }}>{kpi.change}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Cost by Model</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={costByModelData} dataKey="cost" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {costByModelData.map((_entry, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Cost by Employee</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={costByEmployeeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="cost" fill="#5b5fc7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Velocity Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={velocityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="sprint" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="planned" stroke="#d1d1d1" fill="#f0f0f0" strokeDasharray="4 4" name="Planned" />
              <Area type="monotone" dataKey="velocity" stroke="#5b5fc7" fill="#e8eaf6" name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Billing App
   ═══════════════════════════════════════════ */
const INVOICES = [
  { id: 'INV-2025-04', date: 'Apr 1, 2025', amount: '$299.00', status: 'Paid' },
  { id: 'INV-2025-03', date: 'Mar 1, 2025', amount: '$299.00', status: 'Paid' },
  { id: 'INV-2025-02', date: 'Feb 1, 2025', amount: '$299.00', status: 'Paid' },
  { id: 'INV-2025-01', date: 'Jan 1, 2025', amount: '$299.00', status: 'Paid' },
];

function BillingApp({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Billing" onBack={onBack} />

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* Plan Info */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card>
            <div style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Current Plan</div>
            <div className="flex items-center gap-2" style={{ marginTop: 8 }}>
              <span
                className="rounded"
                style={{ padding: '3px 10px', fontSize: 13, fontWeight: 600, background: '#5b5fc7', color: '#fff' }}
              >
                Professional
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#616161', marginTop: 8 }}>$299/month · Billed monthly</div>
          </Card>
          <Card>
            <div style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>Seats</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#242424', marginTop: 6 }}>9 / 10</div>
            <div className="rounded-full" style={{ height: 6, background: '#e1e1e1', marginTop: 8 }}>
              <div className="rounded-full" style={{ height: 6, width: '90%', background: '#5b5fc7' }} />
            </div>
          </Card>
          <Card>
            <div style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>AI Compute</div>
            <div style={{ fontSize: 22, fontWeight: 600, color: '#242424', marginTop: 6 }}>2,400 / 3,000</div>
            <div className="rounded-full" style={{ height: 6, background: '#e1e1e1', marginTop: 8 }}>
              <div className="rounded-full" style={{ height: 6, width: '80%', background: '#92c353' }} />
            </div>
            <div style={{ fontSize: 11, color: '#616161', marginTop: 4 }}>minutes this month</div>
          </Card>
        </div>

        {/* Usage Breakdown */}
        <Card className="mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Usage Breakdown</h3>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                {['Resource', 'Used', 'Limit', 'Cost'].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { resource: 'AI Compute Minutes', used: '2,400', limit: '3,000', cost: '$180' },
                { resource: 'Storage (GB)', used: '128', limit: '500', cost: '$25' },
                { resource: 'Bandwidth (GB)', used: '450', limit: '1,000', cost: '$45' },
                { resource: 'Integrations', used: '6', limit: '20', cost: '$0' },
              ].map((row) => (
                <tr key={row.resource} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{row.resource}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{row.used}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#616161' }}>{row.limit}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontWeight: 500 }}>{row.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Invoice History */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Invoice History</h3>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                {['Invoice', 'Date', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontFamily: 'var(--font-mono)' }}>{inv.id}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#616161' }}>{inv.date}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontWeight: 500 }}>{inv.amount}</td>
                  <td style={{ padding: '8px' }}>
                    <span className="flex items-center gap-1 rounded-full" style={{ padding: '2px 8px', fontSize: 11, fontWeight: 600, background: 'rgba(146,195,83,0.15)', color: '#237b4b', display: 'inline-flex' }}>
                      <CheckCircle2 size={11} aria-hidden="true" /> {inv.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button onClick={() => showToast('success')} className="cursor-pointer" style={{ border: 'none', background: 'transparent', color: '#5b5fc7', fontSize: 12 }} aria-label={`Download ${inv.id}`}>
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Security App
   ═══════════════════════════════════════════ */
const SESSIONS = [
  { id: 's1', device: 'Chrome · macOS', ip: '192.168.1.42', location: 'San Francisco, CA', status: 'Current', lastActive: 'Now' },
  { id: 's2', device: 'Safari · iOS', ip: '192.168.1.55', location: 'San Francisco, CA', status: 'Active', lastActive: '2h ago' },
  { id: 's3', device: 'Firefox · Windows', ip: '10.0.0.12', location: 'Remote', status: 'Active', lastActive: '1d ago' },
  { id: 's4', device: 'API Token · Node.js', ip: '172.16.0.5', location: 'AWS us-west-2', status: 'Active', lastActive: '5m ago' },
];

const API_TOKENS = [
  { id: 'tok-1', name: 'Production API Key', prefix: 'ivxt_live_...', created: 'Mar 15, 2025', lastUsed: '2m ago', scopes: 'read,write' },
  { id: 'tok-2', name: 'Staging API Key', prefix: 'ivxt_test_...', created: 'Apr 1, 2025', lastUsed: '1h ago', scopes: 'read,write' },
  { id: 'tok-3', name: 'GitHub Integration', prefix: 'ivxt_gh_...', created: 'Jan 10, 2025', lastUsed: '5m ago', scopes: 'read' },
];

function SecurityApp({ onBack }: { onBack: () => void }) {
  const [sessions, setSessions] = useState(SESSIONS);
  const [apiTokens, setApiTokens] = useState<ApiKey[]>(API_TOKENS);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const revokeSession = (id: string) => {
    if (confirmAction('Revoke this session? The user will be logged out immediately.')) {
      setIsRevoking(id);
      setTimeout(() => {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        setIsRevoking(null);
        showToast('success');
      }, 500);
    }
  };

  const revokeToken = (id: string) => {
    if (confirmAction('Revoke this API token? Any applications using it will stop working.')) {
      setIsRevoking(id);
      setTimeout(() => {
        setApiTokens((prev) => prev.filter((t) => t.id !== id));
        setIsRevoking(null);
        showToast('success');
      }, 500);
    }
  };

  const createToken = () => {
    showToast('success');
    const newToken: ApiKey = {
      id: `tok-${Date.now()}`,
      name: 'New API Key',
      prefix: 'ivxt_new_...',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      lastUsed: 'Never',
      scopes: 'read',
    };
    setApiTokens((prev) => [...prev, newToken]);
  };

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Security" onBack={onBack} />

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* SSO Status */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          <Card>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <Lock size={18} color="#237b4b" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>SSO</span>
            </div>
            <span className="rounded-full" style={{ padding: '2px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(146,195,83,0.15)', color: '#237b4b' }}>
              Enabled · Google Workspace
            </span>
            <div style={{ fontSize: 12, color: '#616161', marginTop: 8 }}>Enforced for all members</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <Fingerprint size={18} color="#237b4b" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>MFA Policy</span>
            </div>
            <span className="rounded-full" style={{ padding: '2px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(146,195,83,0.15)', color: '#237b4b' }}>
              Required
            </span>
            <div style={{ fontSize: 12, color: '#616161', marginTop: 8 }}>9/9 members enrolled</div>
          </Card>
          <Card>
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <KeyRound size={18} color="#b56200" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Password Policy</span>
            </div>
            <span className="rounded-full" style={{ padding: '2px 10px', fontSize: 11, fontWeight: 600, background: 'rgba(255,170,68,0.15)', color: '#b56200' }}>
              Strong
            </span>
            <div style={{ fontSize: 12, color: '#616161', marginTop: 8 }}>Min 12 chars, rotated 90d</div>
          </Card>
        </div>

        {/* Active Sessions */}
        <Card className="mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Active Sessions</h3>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                {['Device', 'IP Address', 'Location', 'Status', 'Last Active', ''].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{s.device}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{s.ip}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{s.location}</td>
                  <td style={{ padding: '8px' }}>
                    <span className="rounded-full" style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, background: s.status === 'Current' ? 'rgba(91,95,199,0.15)' : 'rgba(146,195,83,0.15)', color: s.status === 'Current' ? '#5b5fc7' : '#237b4b' }}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{s.lastActive}</td>
                  <td style={{ padding: '8px' }}>
                    {s.status !== 'Current' && (
                      <button
                        onClick={() => revokeSession(s.id)}
                        disabled={isRevoking === s.id}
                        className="cursor-pointer flex items-center gap-1"
                        style={{ border: 'none', background: 'transparent', color: '#c4314b', fontSize: 11, opacity: isRevoking === s.id ? 0.5 : 1 }}
                        aria-label={`Revoke session ${s.device}`}
                      >
                        {isRevoking === s.id ? <Loader2 size={11} className="animate-spin" /> : <LogOut size={11} />}
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <div className="py-4 text-center" style={{ fontSize: 13, color: '#616161' }}>No active sessions</div>
          )}
        </Card>

        {/* API Tokens */}
        <Card>
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>API Tokens</h3>
            <button
              onClick={createToken}
              className="flex cursor-pointer items-center gap-1 rounded"
              style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, border: 'none', background: '#5b5fc7', color: '#fff' }}
              aria-label="Create new API token"
            >
              <Plus size={12} aria-hidden="true" /> New Token
            </button>
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                {['Name', 'Prefix', 'Created', 'Last Used', 'Scopes', ''].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apiTokens.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{t.name}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{t.prefix}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{t.created}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{t.lastUsed}</td>
                  <td style={{ padding: '8px' }}>
                    <span className="rounded-full" style={{ padding: '2px 8px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{t.scopes}</span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <button
                      onClick={() => revokeToken(t.id)}
                      disabled={isRevoking === t.id}
                      className="cursor-pointer"
                      style={{ border: 'none', background: 'transparent', color: '#c4314b', fontSize: 11, opacity: isRevoking === t.id ? 0.5 : 1 }}
                      aria-label={`Revoke token ${t.name}`}
                    >
                      {isRevoking === t.id ? <Loader2 size={11} className="animate-spin" /> : 'Revoke'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {apiTokens.length === 0 && (
            <div className="py-4 text-center" style={{ fontSize: 13, color: '#616161' }}>No API tokens</div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Integrations App (enhanced with webhooks, API keys, logs, health)
   ═══════════════════════════════════════════ */

const INITIAL_INTEGRATION_LOGS: IntegrationLog[] = [
  { id: 'l1', app: 'GitHub', action: 'Push event received', status: 'success', timestamp: '2 min ago' },
  { id: 'l2', app: 'Slack', action: 'Message forwarded', status: 'success', timestamp: '5 min ago' },
  { id: 'l3', app: 'Sentry', action: 'Alert webhook failed', status: 'error', timestamp: '12 min ago', details: 'Connection timeout after 30s' },
  { id: 'l4', app: 'Linear', action: 'Issue created', status: 'success', timestamp: '15 min ago' },
  { id: 'l5', app: 'GitHub', action: 'PR merged', status: 'success', timestamp: '22 min ago' },
  { id: 'l6', app: 'Google Workspace', action: 'Rate limit warning', status: 'warning', timestamp: '1h ago', details: 'Quota 85% consumed' },
  { id: 'l7', app: 'Slack', action: 'Channel sync completed', status: 'success', timestamp: '2h ago' },
  { id: 'l8', app: 'Stripe', action: 'Payment webhook received', status: 'success', timestamp: '3h ago' },
];

const INITIAL_WEBHOOKS: Webhook[] = [
  { id: 'wh1', app: 'GitHub', url: 'https://api.brixstac.io/webhooks/github', events: ['push', 'pr', 'merge'], status: 'active', lastDelivery: '2 min ago' },
  { id: 'wh2', app: 'Slack', url: 'https://api.brixstac.io/webhooks/slack', events: ['message', 'reaction'], status: 'active', lastDelivery: '1 min ago' },
  { id: 'wh3', app: 'Sentry', url: 'https://api.brixstac.io/webhooks/sentry', events: ['alert', 'event'], status: 'inactive', lastDelivery: 'Failed 12 min ago' },
  { id: 'wh4', app: 'Linear', url: 'https://api.brixstac.io/webhooks/linear', events: ['issue', 'cycle'], status: 'active', lastDelivery: '5 min ago' },
];

const INITIAL_API_KEYS: ApiKey[] = [
  { id: 'key-1', name: 'Production API Key', prefix: 'ivxt_live_...', created: 'Jan 15, 2025', lastUsed: '2m ago', scopes: 'read,write' },
  { id: 'key-2', name: 'Staging API Key', prefix: 'ivxt_test_...', created: 'Feb 1, 2025', lastUsed: '1h ago', scopes: 'read,write' },
  { id: 'key-3', name: 'GitHub Integration', prefix: 'ivxt_gh_...', created: 'Mar 10, 2025', lastUsed: '5m ago', scopes: 'read' },
];

function IntegrationsApp({ onBack }: { onBack: () => void }) {
  const [services, setServices] = useState(CONNECTED_SERVICES);
  const [logs, setLogs] = useState<IntegrationLog[]>(INITIAL_INTEGRATION_LOGS);
  const [webhooks, setWebhooks] = useState<Webhook[]>(INITIAL_WEBHOOKS);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(INITIAL_API_KEYS);
  const [activeTab, setActiveTab] = useState<'services' | 'webhooks' | 'apikeys' | 'logs' | 'health'>('services');
  const [search, setSearch] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const toggleConnection = (name: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setServices((prev) => prev.map((s) =>
        s.name === name ? { ...s, status: s.status === 'connected' ? 'disconnected' : 'connected' } : s
      ));
      const svc = services.find((s) => s.name === name);
      if (svc) {
        const action = svc.status === 'connected' ? 'disconnected from' : 'connected to';
        setLogs((prev) => [{
          id: `l-${Date.now()}`,
          app: name,
          action: `${action} integration`,
          status: 'success',
          timestamp: 'Just now',
        }, ...prev]);
      }
      setIsLoading(false);
      showToast(`${name} ${svc?.status === 'connected' ? 'disconnected' : 'connected'}`, 'success');
    }, 600);
  };

  const addCustomIntegration = () => {
    if (!customName.trim() || !customUrl.trim()) {
      showToast('error');
      return;
    }
    const cleanName = escapeHtml(customName.trim());
    const newService = { name: cleanName, category: 'Custom', status: 'connected' as const, account: customUrl.trim(), connected: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) };
    setServices((prev) => [...prev, newService]);
    setLogs((prev) => [{
      id: `l-${Date.now()}`,
      app: cleanName,
      action: 'Custom integration added',
      status: 'success',
      timestamp: 'Just now',
    }, ...prev]);
    setIsAddingCustom(false);
    setCustomName('');
    setCustomUrl('');
    showToast(`${cleanName} integration added`, 'success');
  };

  const toggleWebhook = (id: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, status: w.status === 'active' ? 'inactive' : 'active' } : w));
  };

  const copyApiKey = (id: string) => {
    showToast('API key copied to clipboard', 'success');
  };

  const revokeApiKey = (id: string) => {
    if (confirmAction('Revoke this API key? Any applications using it will stop working.')) {
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      showToast('success');
    }
  };

  const tabs = [
    { id: 'services' as const, label: 'Services' },
    { id: 'webhooks' as const, label: 'Webhooks' },
    { id: 'apikeys' as const, label: 'API Keys' },
    { id: 'logs' as const, label: 'Logs' },
    { id: 'health' as const, label: 'Health' },
  ];

  const filteredServices = services.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = logs.filter((l) =>
    !search || l.app.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Integrations" onBack={onBack}>
        <button
          onClick={() => setIsAddingCustom(true)}
          className="flex cursor-pointer items-center gap-1 rounded px-3 text-white"
          style={{ fontSize: 12, height: 32, backgroundColor: '#5b5fc7', border: 'none' }}
          aria-label="Add new integration"
        >
          <Plug size={14} aria-hidden="true" /> Add New
        </button>
      </AppHeader>

      {/* Tabs */}
      <div style={{ padding: '0 20px', borderBottom: '1px solid #e1e1e1' }}>
        <div className="flex gap-1" role="tablist" aria-label="Integration tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              role="tab"
              aria-selected={activeTab === t.id}
              className="cursor-pointer"
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 500,
                border: 'none',
                borderBottom: activeTab === t.id ? '2px solid #5b5fc7' : '2px solid transparent',
                background: 'transparent',
                color: activeTab === t.id ? '#5b5fc7' : '#616161',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      <div style={{ padding: '12px 20px' }}>
        <div className="flex items-center gap-1 rounded" style={{ height: 32, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff', maxWidth: 300 }}>
          <Search size={14} color="#a0a0a0" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none"
            style={{ fontSize: 12, flex: 1 }}
            aria-label="Search integrations"
          />
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center gap-2" style={{ padding: '4px 20px' }}>
          <Loader2 size={14} className="animate-spin" color="#5b5fc7" />
          <span style={{ fontSize: 12, color: '#5b5fc7' }}>Processing...</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* ── KPI Cards ── */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Connected', value: services.filter((s) => s.status === 'connected').length, color: '#237b4b' },
            { label: 'Disconnected', value: services.filter((s) => s.status === 'disconnected').length, color: '#767676' },
            { label: 'Categories', value: [...new Set(services.map((s) => s.category))].length, color: '#5b5fc7' },
            { label: 'API Calls (24h)', value: '24.5K', color: '#0891b2' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: kpi.color, marginTop: 4 }}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* ── Custom Integration Form ── */}
        {isAddingCustom && (
          <Card className="mb-4">
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Add Custom Integration</h3>
            <div className="space-y-3">
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Integration Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Internal API"
                  className="w-full rounded outline-none"
                  style={{ height: 32, padding: '0 10px', fontSize: 13, border: '1px solid #d1d1d1' }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Webhook URL</label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded outline-none"
                  style={{ height: 32, padding: '0 10px', fontSize: 13, border: '1px solid #d1d1d1' }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={addCustomIntegration} className="cursor-pointer rounded px-4 py-1.5 text-xs font-medium text-white" style={{ background: '#5b5fc7', border: 'none' }}>Add Integration</button>
                <button onClick={() => { setIsAddingCustom(false); setCustomName(''); setCustomUrl(''); }} className="cursor-pointer rounded px-4 py-1.5 text-xs font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </div>
          </Card>
        )}

        {/* ── Tab Content ── */}
        {activeTab === 'services' && (
          <div className="space-y-2">
            {filteredServices.length === 0 ? (
              <EmptyState icon={Search} message="No integrations found" subMessage="Try a different search term or add a custom integration" />
            ) : (
              filteredServices.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between rounded-lg border p-4" style={{ borderColor: '#e1e1e1', backgroundColor: '#fff' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded" style={{ width: 40, height: 40, backgroundColor: svc.status === 'connected' ? '#e8eaf6' : '#f0f0f0' }}>
                      <Plug size={18} color={svc.status === 'connected' ? '#5b5fc7' : '#a0a0a0'} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: '#242424' }}>{svc.name}</p>
                      <p style={{ fontSize: 11, color: '#616161' }}>{svc.category} · {svc.status === 'connected' ? `Connected as ${svc.account}` : 'Not connected'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {svc.status === 'connected' && (
                      <span style={{ fontSize: 11, color: '#616161' }}>Since {svc.connected}</span>
                    )}
                    <button
                      onClick={() => toggleConnection(svc.name)}
                      disabled={isLoading}
                      className="cursor-pointer rounded px-3 py-2" style={{
                        fontSize: 11,
                        border: svc.status === 'connected' ? '1px solid #c4314b' : 'none',
                        backgroundColor: svc.status === 'connected' ? 'transparent' : '#5b5fc7',
                        color: svc.status === 'connected' ? '#c4314b' : '#fff',
                        opacity: isLoading ? 0.5 : 1,
                      }}>
                      {svc.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'webhooks' && (
          <div className="space-y-2">
            {webhooks.length === 0 ? (
              <EmptyState icon={Webhook} message="No webhooks configured" subMessage="Add a custom integration to create webhooks" />
            ) : (
              webhooks.map((wh) => (
                <Card key={wh.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{wh.app}</span>
                        <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, fontWeight: 600, background: wh.status === 'active' ? 'rgba(146,195,83,0.15)' : 'rgba(138,138,138,0.15)', color: wh.status === 'active' ? '#237b4b' : '#8a8a8a' }}>
                          {wh.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{wh.url}</p>
                      <div className="flex gap-1 mt-1">
                        {wh.events.map((e) => (
                          <span key={e} className="rounded-full" style={{ padding: '1px 6px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{e}</span>
                        ))}
                      </div>
                      <p style={{ fontSize: 11, color: '#767676', marginTop: 4 }}>Last delivery: {wh.lastDelivery}</p>
                    </div>
                    <button
                      onClick={() => toggleWebhook(wh.id)}
                      className="cursor-pointer rounded px-3 py-2" style={{ fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>
                      {wh.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'apikeys' && (
          <div className="space-y-2">
            {apiKeys.length === 0 ? (
              <EmptyState icon={KeyRound} message="No API keys" subMessage="Create a new API key to get started" />
            ) : (
              apiKeys.map((key) => (
                <Card key={key.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{key.name}</div>
                      <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{key.prefix}</span>
                        <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, background: '#f0f0f0', color: '#616161' }}>{key.scopes}</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>Created {key.created} · Last used {key.lastUsed}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => copyApiKey(key.id)} className="cursor-pointer rounded p-1.5" style={{ border: '1px solid #d1d1d1', background: '#fff' }} aria-label="Copy API key">
                        <Copy size={14} color="#616161" />
                      </button>
                      <button onClick={() => revokeApiKey(key.id)} className="cursor-pointer rounded p-1.5" style={{ border: '1px solid #c4314b', background: '#fff' }} aria-label="Revoke API key">
                        <Trash2 size={14} color="#c4314b" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <EmptyState icon={FileText} message="No logs found" subMessage="Integration activity will appear here" />
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3" style={{ borderColor: log.status === 'error' ? '#fecaca' : log.status === 'warning' ? '#fde68a' : '#e1e1e1', backgroundColor: log.status === 'error' ? '#fef2f2' : log.status === 'warning' ? '#fefce8' : '#fff' }}>
                  <div className="mt-0.5">
                    {log.status === 'success' ? <CheckCircle2 size={14} color="#237b4b" /> : log.status === 'warning' ? <AlertTriangle size={14} color="#f59e0b" /> : <XCircle size={14} color="#c4314b" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>{log.app}</span>
                      <span style={{ fontSize: 11, color: '#767676' }}>{log.timestamp}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#616161', marginTop: 1 }}>{log.action}</p>
                    {log.details && <p style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>{log.details}</p>}
                  </div>
                  <span className="rounded-full" style={{ padding: '1px 8px', fontSize: 10, fontWeight: 600, background: log.status === 'success' ? 'rgba(146,195,83,0.15)' : log.status === 'warning' ? 'rgba(255,170,68,0.15)' : 'rgba(196,49,75,0.15)', color: log.status === 'success' ? '#237b4b' : log.status === 'warning' ? '#b56200' : '#c4314b' }}>
                    {log.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'health' && (
          <div className="space-y-3">
            {INITIAL_MCP_APPS.filter((a) => a.health).map((app) => (
              <Card key={app.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <app.icon size={20} color="#616161" />
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{app.name}</span>
                      <div style={{ fontSize: 11, color: '#616161' }}>Webhooks: {app.webhooks || 0} · Last sync: {app.lastSync}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full" style={{ padding: '2px 8px', fontSize: 10, fontWeight: 600, background: app.health === 'healthy' ? 'rgba(146,195,83,0.15)' : app.health === 'degraded' ? 'rgba(255,170,68,0.15)' : 'rgba(196,49,75,0.15)', color: app.health === 'healthy' ? '#237b4b' : app.health === 'degraded' ? '#b56200' : '#c4314b' }}>
                      <Activity size={10} />
                      {app.health}
                    </span>
                  </div>
                </div>
                {/* Health bar */}
                <div className="mt-2 rounded-full" style={{ height: 6, background: '#e1e1e1' }}>
                  <div className="rounded-full" style={{ height: 6, width: app.health === 'healthy' ? '98%' : app.health === 'degraded' ? '75%' : '30%', background: app.health === 'healthy' ? '#92c353' : app.health === 'degraded' ? '#ffaa44' : '#c4314b', transition: 'width 0.3s ease' }} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Branding App
   ═══════════════════════════════════════════ */
function BrandingApp({ onBack }: { onBack: () => void }) {
  const [primaryColor, setPrimaryColor] = useState('#5b5fc7');
  const [companyName, setCompanyName] = useState('Acme Software');
  const [logoStyle, setLogoStyle] = useState('modern');

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Branding" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="space-y-5">
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Company Identity</h3>
              <div className="space-y-3">
                <div>
                  <label style={{ fontSize: 12, color: '#616161', display: 'block', marginBottom: 4 }}>Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full rounded border px-3 py-2 outline-none"
                    style={{ fontSize: 13, borderColor: '#d1d1d1' }}
                    aria-label="Company name"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#616161', display: 'block', marginBottom: 4 }}>Logo Style</label>
                  <div className="flex gap-2" role="radiogroup" aria-label="Logo style">
                    {['modern', 'classic', 'minimal'].map((style) => (
                      <button
                        key={style}
                        onClick={() => setLogoStyle(style)}
                        role="radio"
                        aria-checked={logoStyle === style}
                        className="flex-1 cursor-pointer rounded border py-2 capitalize"
                        style={{ fontSize: 12, borderColor: logoStyle === style ? '#5b5fc7' : '#d1d1d1', backgroundColor: logoStyle === style ? '#f8f8ff' : '#fff', color: logoStyle === style ? '#5b5fc7' : '#242424' }}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Primary Color</h3>
              <div className="flex gap-2">
                {['#5b5fc7', '#237b4b', '#c4314b', '#b56200', '#0891b2', '#7c3aed', '#ec4899', '#1f1f1f'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setPrimaryColor(c)}
                    className="cursor-pointer rounded-full border-2"
                    style={{ width: 32, height: 32, backgroundColor: c, borderColor: primaryColor === c ? '#242424' : 'transparent' }}
                    aria-label={`Select color ${c}`}
                    aria-pressed={primaryColor === c}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span style={{ fontSize: 12, color: '#616161' }}>Custom:</span>
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-24 rounded border px-2 py-2 font-mono" style={{ fontSize: 12, borderColor: '#d1d1d1' }} />
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Typography</h3>
              <div className="space-y-2">
                {[
                  { label: 'Headings', value: 'Inter / SemiBold' },
                  { label: 'Body Text', value: 'Inter / Regular' },
                  { label: 'Code / Mono', value: 'JetBrains Mono' },
                ].map((t) => (
                  <div key={t.label} className="flex items-center justify-between rounded p-2" style={{ backgroundColor: '#f8f8f8' }}>
                    <span style={{ fontSize: 12, color: '#242424' }}>{t.label}</span>
                    <span style={{ fontSize: 12, color: '#616161' }}>{t.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Preview */}
          <div>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Live Preview</h3>
              <div className="rounded-lg border p-4" style={{ borderColor: '#e1e1e1' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                  <div className="rounded" style={{ width: 32, height: 32, backgroundColor: primaryColor }} />
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>{companyName}</span>
                </div>
                <div className="space-y-2">
                  <div className="rounded px-3 py-1.5 text-white" style={{ backgroundColor: primaryColor, fontSize: 12, width: 'fit-content' }}>Primary Button</div>
                  <div className="rounded border px-3 py-1.5" style={{ borderColor: primaryColor, color: primaryColor, fontSize: 12, width: 'fit-content' }}>Secondary Button</div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                    <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Audit App
   ═══════════════════════════════════════════ */
const AUDIT_LOGS = [
  { id: 1, actor: 'Alex Chen', action: 'Approved production deploy', target: 'tax-filing-platform', time: '2h ago', severity: 'high' as const },
  { id: 2, actor: 'Echo (AI)', action: 'Auto-scaled infrastructure', target: 'api-gateway', time: '3h ago', severity: 'medium' as const },
  { id: 3, actor: 'Maya', action: 'Created sprint 14', target: 'Tax Filing Platform', time: '5h ago', severity: 'low' as const },
  { id: 4, actor: 'Alex Chen', action: 'Modified security policy', target: 'MFA Required', time: '1d ago', severity: 'high' as const },
  { id: 5, actor: 'Sage (AI)', action: 'Merged pull request #347', target: 'auth-service', time: '1d ago', severity: 'medium' as const },
  { id: 6, actor: 'Raj', action: 'Accessed customer data', target: 'User DB', time: '2d ago', severity: 'high' as const },
  { id: 7, actor: 'Priya', action: 'Created bug report', target: 'TAX-142', time: '2d ago', severity: 'low' as const },
  { id: 8, actor: 'Alex Chen', action: 'Granted admin access', target: 'Maya', time: '3d ago', severity: 'high' as const },
];

function AuditApp({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const filtered = AUDIT_LOGS.filter((l) => {
    const matchesFilter = filter === 'all' || l.severity === filter;
    const matchesSearch = !search || l.actor.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Audit Log" onBack={onBack}>
        <button onClick={() => showToast('success')} className="flex items-center gap-1 rounded border px-3" style={{ fontSize: 12, height: 32, borderColor: '#d1d1d1', background: '#fff', color: '#616161', cursor: 'pointer' }} aria-label="Export CSV">
          <FileText size={14} aria-hidden="true" /> Export CSV
        </button>
      </AppHeader>
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded" style={{ height: 32, border: '1px solid #d1d1d1', padding: '0 8px', background: '#fff' }}>
            <Search size={14} color="#a0a0a0" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search audit logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent outline-none"
              style={{ fontSize: 12, width: 150 }}
              aria-label="Search audit logs"
            />
          </div>
          {[{ id: 'all', label: 'All' }, { id: 'high', label: 'High' }, { id: 'medium', label: 'Medium' }, { id: 'low', label: 'Low' }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="cursor-pointer rounded-full px-3 py-1"
              style={{ fontSize: 12, border: filter === f.id ? '1px solid #5b5fc7' : '1px solid #e1e1e1', backgroundColor: filter === f.id ? '#f8f8ff' : '#fff', color: filter === f.id ? '#5b5fc7' : '#616161' }}
              aria-pressed={filter === f.id}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Card>
          {filtered.length === 0 ? (
            <EmptyState icon={Search} message="No audit logs found" subMessage="Try adjusting your filters" />
          ) : (
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                  {['Actor', 'Action', 'Target', 'Severity', 'Time'].map((h) => (
                    <th key={h} className="text-left" style={{ padding: '8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{log.actor}</td>
                    <td style={{ padding: '8px', fontSize: 13, color: '#242424' }}>{log.action}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{log.target}</td>
                    <td style={{ padding: '8px' }}>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                        backgroundColor: log.severity === 'high' ? '#fee2e2' : log.severity === 'medium' ? '#fef3c7' : '#f0f0f0',
                        color: log.severity === 'high' ? '#c4314b' : log.severity === 'medium' ? '#b56200' : '#616161',
                      }}>{log.severity}</span>
                    </td>
                    <td style={{ padding: '8px', fontSize: 12, color: '#767676' }}>{log.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Communication App
   ═══════════════════════════════════════════ */
const COM_TEMPLATES = [
  { id: 1, name: 'Sprint Kickoff', channel: '#engineering', lastUsed: '3d ago', usage: 12 },
  { id: 2, name: 'Incident Alert', channel: '#security-alerts', lastUsed: '1w ago', usage: 5 },
  { id: 3, name: 'Release Notes', channel: '#general', lastUsed: '2w ago', usage: 8 },
  { id: 4, name: 'Onboarding Welcome', channel: '#general', lastUsed: '1mo ago', usage: 24 },
];

const ANNOUNCEMENTS = [
  { id: 1, title: 'Sprint 14 Kickoff Tomorrow', author: 'Alex Chen', date: 'Apr 27, 2025', pinned: true, reactions: 8 },
  { id: 2, title: 'New Security Policy Effective May 1', author: 'Echo (AI)', date: 'Apr 25, 2025', pinned: true, reactions: 12 },
  { id: 3, title: 'Office Closure — Memorial Day', author: 'Manager (AI)', date: 'Apr 20, 2025', pinned: false, reactions: 3 },
];

function CommunicationApp({ onBack }: { onBack: () => void }) {
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS);

  const addAnnouncement = () => {
    showToast('info');
  };

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Communication" onBack={onBack}>
        <button onClick={addAnnouncement} className="flex items-center gap-1 rounded px-3 text-white" style={{ fontSize: 12, height: 32, backgroundColor: '#5b5fc7', border: 'none', cursor: 'pointer' }} aria-label="New announcement">
          <Megaphone size={14} aria-hidden="true" /> New Announcement
        </button>
      </AppHeader>
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Templates', value: COM_TEMPLATES.length, color: '#5b5fc7' },
            { label: 'Announcements', value: announcements.length, color: '#237b4b' },
            { label: 'Channels', value: 8, color: '#0891b2' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: kpi.color, marginTop: 4 }}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Templates */}
        <Card className="mb-4">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Message Templates</h3>
          <div className="space-y-2">
            {COM_TEMPLATES.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{t.name}</p>
                  <p style={{ fontSize: 11, color: '#616161' }}>Channel: {t.channel} · Used {t.usage} times · Last: {t.lastUsed}</p>
                </div>
                <button onClick={() => showToast(`Using template: ${t.name}`, 'info')} className="cursor-pointer rounded px-3 py-2" style={{ fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Use</button>
              </div>
            ))}
          </div>
        </Card>

        {/* Announcements */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Recent Announcements</h3>
          <div className="space-y-3">
            {announcements.map((a) => (
              <div key={a.id} className="rounded-lg border p-3" style={{ borderColor: a.pinned ? '#5b5fc7' : '#e1e1e1', backgroundColor: a.pinned ? '#f8f8ff' : '#fff' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  {a.pinned && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: '#5b5fc7', color: '#fff' }}>PINNED</span>}
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{a.title}</span>
                </div>
                <p style={{ fontSize: 11, color: '#616161' }}>By {a.author} · {a.date}</p>
                <p style={{ fontSize: 11, color: '#767676', marginTop: 4 }}>{a.reactions} reactions</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Helpdesk App
   ═══════════════════════════════════════════ */
const TICKETS = [
  { id: 'HD-001', subject: 'Cannot access staging environment', requester: 'Raj', priority: 'high' as const, status: 'open' as const, assignee: 'Echo (AI)', time: '2h ago' },
  { id: 'HD-002', subject: 'Slack notification not working', requester: 'Maya', priority: 'medium' as const, status: 'in-progress' as const, assignee: 'Echo (AI)', time: '5h ago' },
  { id: 'HD-003', subject: 'Request for Jira access', requester: 'Priya', priority: 'low' as const, status: 'open' as const, assignee: '-', time: '1d ago' },
  { id: 'HD-004', subject: 'Password reset request', requester: 'External User', priority: 'high' as const, status: 'resolved' as const, assignee: 'Echo (AI)', time: '2d ago' },
];

function HelpdeskApp({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Helpdesk" onBack={onBack}>
        <button onClick={() => showToast('info')} className="flex items-center gap-1 rounded px-3 text-white" style={{ fontSize: 12, height: 32, backgroundColor: '#5b5fc7', border: 'none', cursor: 'pointer' }} aria-label="New ticket">
          <Plus size={14} aria-hidden="true" /> New Ticket
        </button>
      </AppHeader>
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Open', value: TICKETS.filter((t) => t.status === 'open').length, color: '#c4314b' },
            { label: 'In Progress', value: TICKETS.filter((t) => t.status === 'in-progress').length, color: '#b56200' },
            { label: 'Resolved (7d)', value: TICKETS.filter((t) => t.status === 'resolved').length, color: '#237b4b' },
            { label: 'Avg Response', value: '12m', color: '#5b5fc7' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: kpi.color, marginTop: 4 }}>{kpi.value}</p>
            </Card>
          ))}
        </div>
        <Card>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
                {['ID', 'Subject', 'Requester', 'Priority', 'Status', 'Assignee', 'Time'].map((h) => (
                  <th key={h} className="text-left" style={{ padding: '8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TICKETS.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{t.id}</td>
                  <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontWeight: 500 }}>{t.subject}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#242424' }}>{t.requester}</td>
                  <td style={{ padding: '8px' }}>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                      backgroundColor: t.priority === 'high' ? '#fee2e2' : t.priority === 'medium' ? '#fef3c7' : '#f0f0f0',
                      color: t.priority === 'high' ? '#c4314b' : t.priority === 'medium' ? '#b56200' : '#616161',
                    }}>{t.priority}</span>
                  </td>
                  <td style={{ padding: '8px' }}>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                      backgroundColor: t.status === 'open' ? '#fee2e2' : t.status === 'in-progress' ? '#dbeafe' : '#dcfce7',
                      color: t.status === 'open' ? '#c4314b' : t.status === 'in-progress' ? '#5b5fc7' : '#237b4b',
                    }}>{t.status}</span>
                  </td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{t.assignee}</td>
                  <td style={{ padding: '8px', fontSize: 12, color: '#767676' }}>{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Observability App
   ═══════════════════════════════════════════ */
const ALERTS = [
  { id: 'ALERT-001', name: 'API P99 Latency > 500ms', severity: 'critical' as const, service: 'api-gateway', status: 'firing' as const, duration: '15m' },
  { id: 'ALERT-002', name: 'DB Connection Pool > 80%', severity: 'warning' as const, service: 'postgres-primary', status: 'firing' as const, duration: '8m' },
  { id: 'ALERT-003', name: 'Memory Usage > 90%', severity: 'warning' as const, service: 'payment-worker', status: 'resolved' as const, duration: '23m' },
  { id: 'ALERT-004', name: '5xx Error Rate > 1%', severity: 'critical' as const, service: 'auth-service', status: 'resolved' as const, duration: '45m' },
];

function ObservabilityApp({ onBack }: { onBack: () => void }) {
  const [alerts, setAlerts] = useState(ALERTS);

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, status: 'resolved' as const } : a));
    showToast('success');
  };

  const silenceAll = () => {
    if (confirmAction('Silence all firing alerts?')) {
      setAlerts((prev) => prev.map((a) => a.status === 'firing' ? { ...a, status: 'resolved' as const } : a));
      showToast('success');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Observability" onBack={onBack} />
      <div className="flex-1 overflow-y-auto" style={{ padding: '0 20px 20px' }}>
        {/* KPIs */}
        <div className="mb-4 grid grid-cols-4 gap-3">
          {[
            { label: 'Services', value: '12', color: '#5b5fc7' },
            { label: 'Firing Alerts', value: alerts.filter((a) => a.status === 'firing').length, color: '#c4314b' },
            { label: 'Avg Latency (p99)', value: '142ms', color: '#237b4b' },
            { label: 'Error Rate', value: '0.02%', color: '#237b4b' },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <p style={{ fontSize: 11, color: '#616161', textTransform: 'uppercase', fontWeight: 600 }}>{kpi.label}</p>
              <p style={{ fontSize: 22, fontWeight: 600, color: kpi.color, marginTop: 4 }}>{kpi.value}</p>
            </Card>
          ))}
        </div>

        {/* Alerts */}
        <Card className="mb-4">
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Active Alerts</h3>
            <button onClick={silenceAll} className="cursor-pointer rounded px-3 py-2" style={{ fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>
              Silence All
            </button>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between rounded-lg border p-3" style={{
                borderColor: alert.status === 'firing' ? (alert.severity === 'critical' ? '#fecaca' : '#fde68a') : '#e1e1e1',
                backgroundColor: alert.status === 'firing' ? (alert.severity === 'critical' ? '#fef2f2' : '#fefce8') : '#f8f8f8',
              }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full" style={{
                    width: 10, height: 10,
                    backgroundColor: alert.status === 'firing' ? (alert.severity === 'critical' ? '#ef4444' : '#f59e0b') : '#92c353',
                    animation: alert.status === 'firing' ? 'pulse 2s infinite' : 'none',
                  }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{alert.name}</p>
                    <p style={{ fontSize: 11, color: '#616161' }}>{alert.service} · {alert.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                    backgroundColor: alert.severity === 'critical' ? '#fee2e2' : '#fef3c7',
                    color: alert.severity === 'critical' ? '#c4314b' : '#b56200',
                  }}>{alert.severity}</span>
                  {alert.status === 'firing' && (
                    <button onClick={() => acknowledgeAlert(alert.id)} className="cursor-pointer rounded px-2 py-2" style={{ fontSize: 11, border: 'none', background: '#237b4b', color: '#fff' }}>Ack</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Latency Chart */}
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Service Latency (24h)</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { time: '00:00', api: 120, db: 45, auth: 80 },
                { time: '04:00', api: 95, db: 50, auth: 70 },
                { time: '08:00', api: 180, db: 85, auth: 120 },
                { time: '12:00', api: 250, db: 120, auth: 160 },
                { time: '16:00', api: 200, db: 95, auth: 110 },
                { time: '20:00', api: 145, db: 60, auth: 90 },
                { time: '23:59', api: 130, db: 55, auth: 85 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="api" stroke="#5b5fc7" fill="#e8eaf6" name="API Gateway" />
                <Area type="monotone" dataKey="db" stroke="#0891b2" fill="#cffafe" name="Database" />
                <Area type="monotone" dataKey="auth" stroke="#237b4b" fill="#dcfce7" name="Auth Service" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Code Workspace App
   ═══════════════════════════════════════════ */
const FILE_TREE = [
  {
    name: 'src',
    type: 'folder' as const,
    children: [
      {
        name: 'components',
        type: 'folder' as const,
        children: [
          { name: 'AuthForm.tsx', type: 'file' as const },
          { name: 'Button.tsx', type: 'file' as const },
          { name: 'Layout.tsx', type: 'file' as const },
        ],
      },
      {
        name: 'pages',
        type: 'folder' as const,
        children: [
          { name: 'Dashboard.tsx', type: 'file' as const },
          { name: 'Login.tsx', type: 'file' as const },
          { name: 'Settings.tsx', type: 'file' as const },
        ],
      },
      { name: 'App.tsx', type: 'file' as const },
      { name: 'main.tsx', type: 'file' as const },
      { name: 'index.css', type: 'file' as const },
    ],
  },
  { name: 'package.json', type: 'file' as const },
  { name: 'tsconfig.json', type: 'file' as const },
  { name: 'vite.config.ts', type: 'file' as const },
  { name: 'README.md', type: 'file' as const },
];

const SAMPLE_CODE = `import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route } from 'react-router';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { AuthProvider } from './context/AuthContext';

/**
 * Main App component — root of the component tree.
 * Wraps the application in context providers and routing.
 */
export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Initialize analytics and feature flags
    initializeApp().then(() => setReady(true));
  }, []);

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Route path="/" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Layout>
      </Router>
    </AuthProvider>
  );
}`;

function CodeWorkspaceApp({ onBack }: { onBack: () => void }) {
  const [selectedFile, setSelectedFile] = useState('App.tsx');
  const [repos] = useState([
    { name: 'tax-filing-platform', lang: 'TypeScript', lastCommit: '2m ago', branches: 12 },
    { name: 'mobile-app-redesign', lang: 'React Native', lastCommit: '1h ago', branches: 5 },
    { name: 'api-gateway', lang: 'Go', lastCommit: '15m ago', branches: 8 },
    { name: 'design-system', lang: 'TypeScript', lastCommit: '3h ago', branches: 3 },
  ]);
  const [activeRepo, setActiveRepo] = useState('tax-filing-platform');

  return (
    <div className="flex h-full flex-col">
      <AppHeader title="Code Workspace" onBack={onBack} />

      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div
          className="flex flex-shrink-0 flex-col overflow-auto"
          style={{ width: 240, borderRight: '1px solid #e1e1e1', background: '#f8f8f8' }}
        >
          {/* Repo selector */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e1e1e1' }}>
            <select
              value={activeRepo}
              onChange={(e) => setActiveRepo(e.target.value)}
              className="w-full rounded outline-none"
              style={{ padding: '4px 8px', fontSize: 12, border: '1px solid #d1d1d1' }}
              aria-label="Select repository"
            >
              {repos.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Repo stats */}
          <div style={{ padding: '8px 12px', borderBottom: '1px solid #e1e1e1', fontSize: 11, color: '#616161' }}>
            <div className="flex items-center justify-between">
              <span>{repos.find((r) => r.name === activeRepo)?.lang}</span>
              <span>{repos.find((r) => r.name === activeRepo)?.branches} branches</span>
            </div>
            <div style={{ marginTop: 2 }}>Last commit {repos.find((r) => r.name === activeRepo)?.lastCommit}</div>
          </div>

          {/* File tree */}
          <div style={{ padding: '6px 0' }}>
            {FILE_TREE.map((node) => (
              <FileTreeNode key={node.name} node={node} depth={0} selectedFile={selectedFile} onSelect={setSelectedFile} />
            ))}
          </div>
        </div>

        {/* Code viewer */}
        <div className="flex flex-1 flex-col overflow-hidden" style={{ background: '#1f1f1f' }}>
          {/* Tab bar */}
          <div className="flex items-center" style={{ background: '#2d2d2d', borderBottom: '1px solid #3e3e3e' }}>
            <div
              className="flex items-center gap-1"
              style={{
                padding: '6px 12px',
                background: '#1f1f1f',
                borderTop: '2px solid #5b5fc7',
                fontSize: 12,
                color: '#e1e1e1',
              }}
            >
              <FileCode2 size={13} color="#a0a0a0" />
              {selectedFile}
            </div>
          </div>

          {/* Code area */}
          <div className="flex-1 overflow-auto" style={{ padding: 16 }}>
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '20px', color: '#e1e1e1', margin: 0 }}>
              <code>
                {SAMPLE_CODE.split('\n').map((line, i) => (
                  <div key={i} className="flex">
                    <span
                      className="flex-shrink-0 text-right select-none"
                      style={{
                        width: 32,
                        color: '#616161',
                        marginRight: 16,
                        fontSize: 12,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span dangerouslySetInnerHTML={{ __html: highlightLine(line) }} />
                  </div>
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTreeNode({
  node,
  depth,
  selectedFile,
  onSelect,
}: {
  node: typeof FILE_TREE[0];
  depth: number;
  selectedFile: string;
  onSelect: (name: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  if (node.type === 'folder') {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full cursor-pointer items-center gap-1"
          style={{
            padding: `3px 8px 3px ${8 + depth * 12}px`,
            border: 'none',
            background: 'transparent',
            fontSize: 12,
            color: '#242424',
            textAlign: 'left',
          }}
          aria-expanded={expanded}
          aria-label={`${node.name} folder`}
        >
          <ChevronLeft
            size={10}
            color="#616161"
            style={{ transform: expanded ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}
          />
          <FolderGit size={13} color="#5b5fc7" />
          {node.name}
        </button>
        {expanded && node.children?.map((child) => (
          <FileTreeNode key={child.name} node={child} depth={depth + 1} selectedFile={selectedFile} onSelect={onSelect} />
        ))}
      </div>
    );
  }

  const isSelected = selectedFile === node.name;
  return (
    <button
      onClick={() => onSelect(node.name)}
      className="flex w-full cursor-pointer items-center gap-1"
      style={{
        padding: `3px 8px 3px ${8 + depth * 12}px`,
        border: 'none',
        background: isSelected ? '#e8eaf6' : 'transparent',
        fontSize: 12,
        color: isSelected ? '#5b5fc7' : '#242424',
        textAlign: 'left',
      }}
      aria-selected={isSelected}
      aria-label={node.name}
    >
      <FileCode2 size={13} color={isSelected ? '#5b5fc7' : '#a0a0a0'} />
      {node.name}
    </button>
  );
}

/* Simple syntax highlighting */
function highlightLine(line: string): string {
  return line
    .replace(/(\/.*$)/, '<span style="color:#6a9955">$1</span>')
    .replace(/\b(import|export|from|const|function|return|if|useEffect|useState)\b/g, '<span style="color:#569cd6">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span style="color:#569cd6">$1</span>')
    .replace(/('[^']*')/g, '<span style="color:#ce9178">$1</span>')
    .replace(/(&lt;\/?)([A-Za-z][A-Za-z0-9]*)/g, '<span style="color:#4ec9b0">$1$2</span>')
    .replace(/\{([^{}]*)\}/g, '<span style="color:#ffd700">{$1}</span>');
}

/* ═══════════════════════════════════════════
   AppHeader (shared sub-header for apps)
   ═══════════════════════════════════════════ */
function AppHeader({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-between"
      style={{ padding: '12px 20px', borderBottom: '1px solid #e1e1e1' }}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="cursor-pointer rounded p-1 hover:bg-[#f0f0f0]"
          style={{ border: 'none', background: 'transparent' }}
          aria-label="Go back"
        >
          <ChevronLeft size={18} color="#616161" />
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 600, color: '#242424' }}>{title}</h1>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
