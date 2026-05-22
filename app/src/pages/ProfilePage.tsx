import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { useStore } from '@/store/useStore';
import { employees, getEmployeeById } from '@/data/mockData';
import { Avatar } from '@/components/shared/Avatar';
import { Card } from '@/components/shared/Card';
import { StatusChip } from '@/components/shared/StatusChip';
import { TabsBar } from '@/components/shared/TabsBar';
import {
  Check,
  ChevronRight,
  Edit3,
  MessageSquare,
  Phone,
  Cpu,
  Globe,
  Clock,
  Shield,
  GitBranch,
  Terminal,
  Database,
  FileText,
  Box,
  Lock,
  Unlock,
  Wifi,
  Code2,
  Layers,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Star,
  Calendar,
  Settings,
  Bell,
  Monitor,
  Key,
  Copy,
  CheckCircle2,
} from 'lucide-react';

/* ═══════════════════════════════════════════════
   Profile Page — Employee Profile View
   ═══════════════════════════════════════════════ */
const profileTabs = [
  { id: 'mission', label: 'Mission' },
  { id: 'goals', label: 'Goals' },
  { id: 'activity', label: 'Activity' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'profile', label: 'Profile' },
  { id: 'performance', label: 'Performance' },
  { id: 'skills', label: 'Skills' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'settings', label: 'Settings' },
];

export default function ProfilePage() {
  const currentUser = useStore((s) => s.currentUser);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState(currentUser?.bio || '');
  const [searchParams] = useSearchParams();
  const empId = searchParams.get('id') || 'emp-aria';
  const employee = getEmployeeById(empId) || employees[4]; // default to Aria

  const [activeTab, setActiveTab] = useState('profile');
  const isAi = employee.kind === 'ai';

  return (
    <div className="flex h-full flex-col">
      {/* ── Profile Header ── */}
      <ProfileHeader employee={employee} isAi={isAi} />

      {/* ── Tabs ── */}
      <TabsBar tabs={profileTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        {activeTab === 'profile' && <ProfileTab employee={employee} isAi={isAi} />}
        {activeTab === 'performance' && <PerformanceTab employee={employee} isAi={isAi} />}
        {activeTab === 'skills' && <SkillsTab employee={employee} isAi={isAi} />}
        {activeTab === 'settings' && <SettingsTab employee={employee} isAi={isAi} />}
        {activeTab === 'mission' && <MissionTab employee={employee} />}
        {activeTab === 'goals' && <GoalsTab employee={employee} />}
        {activeTab === 'schedule' && <ScheduleTab employee={employee} isAi={isAi} />}
        {activeTab === 'activity' && <ActivityTab employee={employee} />}
        {activeTab === 'tasks' && <TasksTab employee={employee} />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Profile Header
   ═══════════════════════════════════════════════ */
function ProfileHeader({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  const manager = employee.managerId ? getEmployeeById(employee.managerId) : null;

  return (
    <div
      className="flex flex-col items-center"
      style={{
        padding: 20,
        backgroundColor: '#f5f5f3',
        borderBottom: '1px solid #e1e1e1',
      }}
    >
      <Avatar
        src={employee.avatar}
        alt={employee.name}
        size="xl"
        isAi={isAi}
        status={employee.status}
      />

      <div className="flex items-center gap-2 mt-3">
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#242424' }}>
          {employee.name}
        </h2>
        {isAi && (
          <span
            className="rounded px-1.5 font-bold text-white"
            style={{
              fontSize: 10,
              backgroundColor: '#5b5fc7',
              height: 16,
              lineHeight: '16px',
            }}
          >
            AI
          </span>
        )}
      </div>

      <p style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
        {employee.title} · {employee.level}
      </p>

      <div className="flex items-center gap-2 mt-2">
        <StatusChip status={employee.status} />
        {isAi && employee.modelBinding && (
          <span
            className="rounded-full px-2 font-semibold"
            style={{
              fontSize: 11,
              height: 20,
              lineHeight: '20px',
              backgroundColor: 'rgba(91, 95, 199, 0.15)',
              color: '#5b5fc7',
            }}
          >
            {employee.modelBinding.model}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={()=>alert('Edit profile: Open profile editor')}
          className="flex items-center gap-1.5 rounded px-3 font-medium cursor-pointer"
          style={{
            height: 28,
            fontSize: 12,
            backgroundColor: '#5b5fc7',
            color: '#ffffff',
            border: 'none',
          }}
        >
          <Edit3 size={12} />
          Edit
        </button>
        <button
          onClick={()=>{window.location.hash = '/chat'}}
          className="flex items-center gap-1.5 rounded px-3 font-medium cursor-pointer"
          style={{
            height: 28,
            fontSize: 12,
            backgroundColor: 'transparent',
            color: '#242424',
            border: '1px solid #d1d1d1',
          }}
        >
          <MessageSquare size={12} />
          Message
        </button>
        <button
          className="flex items-center gap-1.5 rounded px-3 font-medium cursor-pointer"
          style={{
            height: 28,
            fontSize: 12,
            backgroundColor: 'transparent',
            color: '#242424',
            border: '1px solid #d1d1d1',
          }}
        >
          <Phone size={12} />
          Call
        </button>
      </div>

      {/* AI-specific uptime / Human-specific manager */}
      {isAi ? (
        <div className="flex items-center gap-4 mt-2" style={{ fontSize: 11, color: '#616161' }}>
          <span className="flex items-center gap-1">
            <Wifi size={11} color="#92c353" />
            Active now
          </span>
          <span>Uptime 99.7%</span>
        </div>
      ) : (
        manager && (
          <div className="flex items-center gap-4 mt-2" style={{ fontSize: 11, color: '#616161' }}>
            <span>Reports to {manager.name}</span>
          </div>
        )
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Profile Tab
   ═══════════════════════════════════════════════ */
function ProfileTab({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  return isAi ? <AiProfileTab employee={employee} /> : <HumanProfileTab employee={employee} />;
}

/* ── AI Profile Tab ── */
function AiProfileTab({ employee }: { employee: typeof employees[0] }) {
  const [copiedHandle, setCopiedHandle] = useState(false);

  return (
    <div className="space-y-4">
      {/* Identity Card */}
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          Identity
        </h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr', fontSize: 13 }}>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Display Name</label>
            <span style={{ color: '#242424' }}>{employee.name}</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Email</label>
            <span style={{ color: '#242424' }}>{employee.email}</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>DM Handle</label>
            <div className="flex items-center gap-1">
              <span style={{ color: '#242424' }}>@{employee.name.toLowerCase()}</span>
              <button
                onClick={() => { setCopiedHandle(true); setTimeout(() => setCopiedHandle(false), 1500); }}
                className="cursor-pointer"
                style={{ color: '#767676', padding: 2 }}
              >
                {copiedHandle ? <CheckCircle2 size={12} color="#237b4b" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Voice ID</label>
            <span style={{ color: '#242424' }}>{employee.name} — ElevenLabs</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Timezone</label>
            <span style={{ color: '#242424' }}>UTC (24/7)</span>
          </div>
        </div>
      </Card>

      {/* Model Binding */}
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          Model Binding
        </h3>
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 rounded p-3" style={{ backgroundColor: '#e8eaf6' }}>
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={14} color="#5b5fc7" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#5b5fc7' }}>PRIMARY</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Claude Opus 4.7</div>
            <div style={{ fontSize: 11, color: '#616161' }}>Anthropic · Full capability</div>
          </div>
          <ChevronRight size={16} color="#a0a0a0" />
          <div className="flex-1 rounded p-3" style={{ backgroundColor: '#f0f0f0' }}>
            <div className="flex items-center gap-2 mb-1">
              <Shield size={14} color="#616161" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#616161' }}>FALLBACK</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Qwen 2.5 72b</div>
            <div style={{ fontSize: 11, color: '#616161' }}>On timeout · Reduced capability</div>
          </div>
          <ChevronRight size={16} color="#a0a0a0" />
          <div className="flex-1 rounded p-3" style={{ backgroundColor: '#f5f5f3' }}>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare size={14} color="#a0a0a0" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#767676' }}>CHAT</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Claude Sonnet</div>
            <div style={{ fontSize: 11, color: '#616161' }}>Conversational mode</div>
          </div>
        </div>
      </Card>

      {/* Tool Allowlist */}
      <ToolAllowlistCard />

      {/* MCP Server Bindings */}
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          MCP Server Bindings
        </h3>
        <div className="space-y-2">
          {[
            { name: 'GitHub', mode: 'write', icon: GitBranch },
            { name: 'Linear', mode: 'read', icon: TrendingUp },
            { name: 'Slack', mode: 'read', icon: MessageSquare },
          ].map((mcp) => {
            const Icon = mcp.icon;
            return (
              <div
                key={mcp.name}
                className="flex items-center justify-between rounded p-3"
                style={{ backgroundColor: '#f5f5f3' }}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} color="#5b5fc7" />
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{mcp.name}</span>
                </div>
                <span
                  className="rounded-full px-2 font-semibold"
                  style={{
                    fontSize: 10,
                    height: 18,
                    lineHeight: '18px',
                    backgroundColor: mcp.mode === 'write' ? 'rgba(196, 49, 75, 0.15)' : 'rgba(146, 195, 83, 0.15)',
                    color: mcp.mode === 'write' ? '#c4314b' : '#237b4b',
                  }}
                >
                  {mcp.mode.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Config Cascade */}
      <ConfigCascadeCard />
    </div>
  );
}

/* ── Human Profile Tab ── */
function HumanProfileTab({ employee }: { employee: typeof employees[0] }) {
  const manager = employee.managerId ? getEmployeeById(employee.managerId) : null;
  const directReports = employees.filter((e) => e.managerId === employee.id);

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Employee Card</h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr', fontSize: 13 }}>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Full Name</label>
            <span style={{ color: '#242424' }}>{employee.name}</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Role</label>
            <span style={{ color: '#242424' }}>{employee.title}</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Department</label>
            <span style={{ color: '#242424' }}>Engineering</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Joined</label>
            <span style={{ color: '#242424' }}>January 10, 2024</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Email</label>
            <span style={{ color: '#242424' }}>{employee.email}</span>
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#767676', fontWeight: 600, display: 'block' }}>Timezone</label>
            <span style={{ color: '#242424' }}>Bangalore, IST (UTC+5:30)</span>
          </div>
        </div>
      </Card>

      {manager && (
        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Manager</h3>
          <div className="flex items-center gap-3">
            <Avatar src={manager.avatar} alt={manager.name} size="sm" isAi={manager.kind === 'ai'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{manager.name}</div>
              <div style={{ fontSize: 11, color: '#616161' }}>{manager.title}</div>
            </div>
          </div>
        </Card>
      )}

      {directReports.length > 0 && (
        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
            Direct Reports ({directReports.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {directReports.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-full px-2 py-1"
                style={{ backgroundColor: '#f5f5f3' }}
              >
                <Avatar src={r.avatar} alt={r.name} size="xs" isAi={r.kind === 'ai'} />
                <span style={{ fontSize: 12, color: '#242424' }}>{r.name}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Contact</h3>
        <div className="space-y-2" style={{ fontSize: 13 }}>
          <div className="flex items-center gap-2">
            <MessageSquare size={14} color="#616161" />
            <span style={{ color: '#242424' }}>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={14} color="#616161" />
            <span style={{ color: '#242424' }}>@{employee.name.toLowerCase()}</span>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>About</h3>
        <p style={{ fontSize: 13, color: '#616161' }}>
          Engineering leader passionate about building high-performing teams. 8 years in software development.
        </p>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Tool Allowlist Card (AI only)
   ═══════════════════════════════════════════════ */
function ToolAllowlistCard() {
  const [tools, setTools] = useState([
    { id: 'github', name: 'GitHub', category: 'git', icon: GitBranch, enabled: true, desc: 'Repository access' },
    { id: 'vscode', name: 'VS Code', category: 'write', icon: Code2, enabled: true, desc: 'Code editing' },
    { id: 'docker', name: 'Docker', category: 'deploy', icon: Box, enabled: true, desc: 'Container management' },
    { id: 'aws', name: 'AWS Console', category: 'deploy', icon: Globe, enabled: false, desc: 'Cloud infrastructure' },
    { id: 'linear', name: 'Linear', category: 'read', icon: TrendingUp, enabled: true, desc: 'Issue tracking' },
    { id: 'datadog', name: 'Datadog', category: 'read', icon: Monitor, enabled: true, desc: 'Monitoring & logs' },
    { id: 'postgres', name: 'PostgreSQL', category: 'read', icon: Database, enabled: true, desc: 'Database access' },
    { id: 'docs', name: 'Documentation', category: 'write', icon: FileText, enabled: true, desc: 'Doc editing' },
    { id: 'terminal', name: 'Terminal', category: 'write', icon: Terminal, enabled: true, desc: 'Shell access' },
    { id: 'secrets', name: 'Secrets', category: 'read', icon: Lock, enabled: false, desc: 'Secret reading (restricted)' },
    { id: 'deploy-prod', name: 'Deploy Prod', category: 'deploy', icon: Globe, enabled: false, desc: 'Production deploy' },
    { id: 'slack', name: 'Slack', category: 'MCP', icon: MessageSquare, enabled: true, desc: 'Messaging' },
    { id: 'notion', name: 'Notion', category: 'MCP', icon: FileText, enabled: true, desc: 'Wiki access' },
    { id: 'calendar', name: 'Calendar', category: 'MCP', icon: Calendar, enabled: true, desc: 'Schedule access' },
    { id: 'sheets', name: 'Sheets', category: 'MCP', icon: FileText, enabled: false, desc: 'Spreadsheet access' },
  ]);

  const categories = ['read', 'write', 'git', 'deploy', 'MCP'];

  function toggleTool(id: string) {
    setTools(tools.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  }

  return (
    <Card padding="lg">
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
        Tool Allowlist
      </h3>
      <div className="space-y-4">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat);
          return (
            <div key={cat}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#616161',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  marginBottom: 6,
                }}
              >
                {cat}
              </h4>
              <div className="space-y-1">
                {catTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between rounded p-2"
                      style={{ backgroundColor: '#f5f5f3' }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={14} color={tool.enabled ? '#5b5fc7' : '#a0a0a0'} />
                        <div>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: tool.enabled ? '#242424' : '#a0a0a0',
                            }}
                          >
                            {tool.name}
                          </span>
                          <span style={{ fontSize: 11, color: '#767676', marginLeft: 6 }}>{tool.desc}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTool(tool.id)}
                        className="cursor-pointer"
                        style={{
                          width: 32,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: tool.enabled ? '#5b5fc7' : '#d1d1d1',
                          border: 'none',
                          position: 'relative',
                          transition: 'background-color 150ms',
                        }}
                      >
                        <div
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: '#ffffff',
                            position: 'absolute',
                            top: 2,
                            left: tool.enabled ? 16 : 2,
                            transition: 'left 150ms',
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   Config Cascade Card (AI only)
   ═══════════════════════════════════════════════ */
function ConfigCascadeCard() {
  const layers = [
    {
      id: 1,
      name: 'System Base',
      desc: 'Default Developer template',
      settings: 24,
      override: false,
    },
    {
      id: 2,
      name: 'Tenant Role Template',
      desc: "Acme's Developer config",
      settings: 18,
      override: false,
    },
    {
      id: 3,
      name: 'Level Modifiers',
      desc: 'Senior: Claude Opus, $2000 budget',
      settings: 6,
      override: true,
    },
    {
      id: 4,
      name: 'Bound Skill Packs',
      desc: 'Postgres, FastAPI, React, Tax Domain',
      settings: 12,
      override: true,
    },
    {
      id: 5,
      name: 'Per-Employee Overrides',
      desc: 'None yet',
      settings: 0,
      override: false,
    },
  ];

  return (
    <Card padding="lg">
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
        Config Cascade
      </h3>
      <p style={{ fontSize: 12, color: '#616161', marginBottom: 12 }}>
        Settings are composed from multiple layers. Lower layers override higher ones.
      </p>

      <div className="space-y-2">
        {layers.map((layer, idx) => (
          <div
            key={layer.id}
            className="relative rounded p-3"
            style={{
              backgroundColor: layer.override ? '#e8eaf6' : '#f5f5f3',
              borderLeft: layer.override ? '3px solid #5b5fc7' : '3px solid transparent',
              marginLeft: idx * 12,
            }}
          >
            {layer.override && (
              <div
                className="absolute rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: '#5b5fc7',
                  top: 8,
                  right: 8,
                }}
              />
            )}
            <div className="flex items-center justify-between">
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{layer.name}</span>
                <span style={{ fontSize: 11, color: '#616161', marginLeft: 8 }}>{layer.settings} settings</span>
              </div>
            </div>
            <p style={{ fontSize: 11, color: '#616161', marginTop: 2 }}>{layer.desc}</p>
          </div>
        ))}
      </div>

      {/* Resolved summary */}
      <div
        className="mt-4 rounded p-3"
        style={{ backgroundColor: '#e8eaf6', border: '1px solid #5b5fc7' }}
      >
        <h4 style={{ fontSize: 12, fontWeight: 600, color: '#5b5fc7', marginBottom: 6 }}>
          RESOLVED CONFIGURATION
        </h4>
        <div className="grid gap-1" style={{ gridTemplateColumns: '1fr 1fr', fontSize: 11 }}>
          <div><span style={{ color: '#616161' }}>Model:</span> <span style={{ color: '#242424', fontWeight: 600 }}>Claude Opus 4.7</span></div>
          <div><span style={{ color: '#616161' }}>Budget:</span> <span style={{ color: '#242424', fontWeight: 600 }}>$2,000/mo</span></div>
          <div><span style={{ color: '#616161' }}>Tools:</span> <span style={{ color: '#242424', fontWeight: 600 }}>12 enabled</span></div>
          <div><span style={{ color: '#616161' }}>Skills:</span> <span style={{ color: '#242424', fontWeight: 600 }}>4 packs bound</span></div>
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════
   Performance Tab
   ═══════════════════════════════════════════════ */
function PerformanceTab({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  if (isAi) {
    return <AiPerformanceTab />;
  }
  return <HumanPerformanceTab employee={employee} />;
}

function AiPerformanceTab() {
  // Weekly ticket data
  const weeklyTickets = [
    { week: 'W1', tickets: 5 },
    { week: 'W2', tickets: 7 },
    { week: 'W3', tickets: 4 },
    { week: 'W4', tickets: 8 },
    { week: 'W5', tickets: 6 },
    { week: 'W6', tickets: 9 },
    { week: 'W7', tickets: 5 },
    { week: 'W8', tickets: 3 },
  ];

  const costData = [
    { category: 'LLM Tokens', amount: 1240, color: '#5b5fc7' },
    { category: 'Infrastructure', amount: 420, color: '#92c353' },
    { category: 'Other', amount: 187, color: '#ffaa44' },
  ];

  const recentWork = [
    { ticket: 'TAX-152', title: 'Implement SSN validation service', status: 'done', date: 'Apr 30', points: 5 },
    { ticket: 'TAX-149', title: 'Add audit logging for payment events', status: 'done', date: 'Apr 29', points: 3 },
    { ticket: 'TAX-147', title: 'Refactor PDF parser for multi-state', status: 'done', date: 'Apr 28', points: 5 },
    { ticket: 'TAX-144', title: 'IRS API integration final review', status: 'in-progress', date: '—', points: 8 },
    { ticket: 'TAX-140', title: 'Update tax calculation engine', status: 'done', date: 'Apr 25', points: 5 },
  ];

  return (
    <div className="space-y-4">
      {/* Metrics */}
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Tickets Shipped</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>47</div>
        </Card>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Cycle Time</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>12h</div>
          <div style={{ fontSize: 11, color: '#616161' }}>median</div>
        </Card>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Escape Rate</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>3%</div>
        </Card>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Cost This Month</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>$1,847</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card padding="lg">
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
            Tickets Shipped (8 weeks)
          </h4>
          <div className="flex items-end gap-2" style={{ height: 120 }}>
            {weeklyTickets.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(w.tickets / 10) * 100}px`,
                    backgroundColor: '#5b5fc7',
                    minHeight: 4,
                  }}
                />
                <span style={{ fontSize: 10, color: '#616161' }}>{w.week}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
            Cost Breakdown
          </h4>
          <div className="space-y-3">
            {costData.map((c) => (
              <div key={c.category}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: '#242424' }}>{c.category}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>${c.amount}</span>
                </div>
                <div className="w-full rounded-full" style={{ height: 8, backgroundColor: '#f0f0f0' }}>
                  <div
                    className="rounded-full"
                    style={{
                      height: 8,
                      width: `${(c.amount / 1240) * 100}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent work */}
      <Card padding="lg">
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          Recent Work
        </h4>
        <table className="w-full" style={{ fontSize: 12 }}>
          <thead>
            <tr style={{ color: '#616161', fontSize: 11, fontWeight: 600, textAlign: 'left' }}>
              <th style={{ paddingBottom: 8 }}>Ticket</th>
              <th style={{ paddingBottom: 8 }}>Status</th>
              <th style={{ paddingBottom: 8 }}>Shipped</th>
              <th style={{ paddingBottom: 8 }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {recentWork.map((rw) => (
              <tr key={rw.ticket} style={{ borderTop: '1px solid #f0f0f0' }}>
                <td style={{ padding: '6px 0' }}>
                  <span style={{ fontWeight: 600, color: '#5b5fc7' }}>{rw.ticket}</span>
                  <span style={{ color: '#616161', marginLeft: 6 }}>{rw.title}</span>
                </td>
                <td style={{ padding: '6px 0' }}>
                  <StatusChip
                    status={rw.status === 'done' ? 'online' : 'ai-active'}
                    label={rw.status === 'done' ? 'Done' : 'In Progress'}
                  />
                </td>
                <td style={{ padding: '6px 0', color: '#616161' }}>{rw.date}</td>
                <td style={{ padding: '6px 0' }}>{rw.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function HumanPerformanceTab({ employee }: { employee: typeof employees[0] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Team Velocity</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>42 pts</div>
        </Card>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Throughput</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>+12%</div>
        </Card>
        <Card padding="md" className="text-center">
          <div style={{ fontSize: 11, color: '#616161', fontWeight: 600 }}>Code Reviews</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#242424', marginTop: 4 }}>23</div>
        </Card>
      </div>

      <Card padding="lg">
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Review History</h4>
        <div className="space-y-3">
          <div className="rounded p-3" style={{ backgroundColor: '#f5f5f3' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Q1 2025</span>
              <StatusChip status="online" label="Exceeds Expectations" />
            </div>
            <p style={{ fontSize: 12, color: '#616161', marginTop: 4 }}>
              Strong leadership on the tax platform. Excellent team velocity and mentoring.
            </p>
          </div>
          <div className="rounded p-3" style={{ backgroundColor: '#f5f5f3' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>Q4 2024</span>
              <StatusChip status="ai-active" label="Meets Expectations" />
            </div>
            <p style={{ fontSize: 12, color: '#616161', marginTop: 4 }}>
              Solid delivery. Opportunity to improve cross-team communication.
            </p>
          </div>
        </div>
      </Card>

      <Card padding="lg">
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>360 Feedback</h4>
        <div className="flex flex-wrap gap-2">
          {['Strong leader', 'Great mentor', 'Clear communicator', 'Technical depth'].map((theme) => (
            <span
              key={theme}
              className="rounded-full px-3 py-1"
              style={{ fontSize: 12, backgroundColor: '#e8eaf6', color: '#5b5fc7', fontWeight: 500 }}
            >
              {theme}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Skills Tab
   ═══════════════════════════════════════════════ */
function SkillsTab({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  if (isAi) {
    const skillPacks = [
      { name: 'PostgreSQL', version: 'v2.1', bound: '2025-03-15', source: 'hired with' as const },
      { name: 'FastAPI', version: 'v1.8', bound: '2025-03-15', source: 'hired with' as const },
      { name: 'pgvector', version: 'v1.2', bound: '2025-03-20', source: 'upskilled' as const },
      { name: 'React', version: 'v3.0', bound: '2025-03-15', source: 'hired with' as const },
      { name: 'Tax Domain Knowledge', version: 'v1.5', bound: '2025-03-25', source: 'upskilled' as const },
    ];

    return (
      <div className="space-y-4">
        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
            Bound Skill Packs
          </h3>
          <div className="space-y-2">
            {skillPacks.map((sp) => (
              <div
                key={sp.name}
                className="flex items-center justify-between rounded p-3"
                style={{ backgroundColor: '#f5f5f3' }}
              >
                <div className="flex items-center gap-3">
                  <Layers size={16} color="#5b5fc7" />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>{sp.name}</div>
                    <div style={{ fontSize: 11, color: '#616161' }}>
                      {sp.version} · Bound {sp.bound}
                    </div>
                  </div>
                </div>
                <StatusChip
                  status={sp.source === 'hired with' ? 'online' : 'ai-active'}
                  label={sp.source}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
            Pending Upskills
          </h3>
          <div
            className="rounded p-3 flex items-center justify-between"
            style={{ backgroundColor: 'rgba(255, 170, 68, 0.08)', border: '1px solid rgba(255, 170, 68, 0.3)' }}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} color="#b56200" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>
                  Advanced Tax Validation
                </div>
                <div style={{ fontSize: 11, color: '#616161' }}>
                  Proposed by Maya · Awaiting review
                </div>
              </div>
            </div>
            <button
              className="rounded px-3 font-medium cursor-pointer"
              style={{
                height: 28,
                fontSize: 12,
                backgroundColor: '#5b5fc7',
                color: '#ffffff',
                border: 'none',
              }}
            >
              Review
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // Human skills
  const humanSkills = [
    { name: 'React', level: 3 },
    { name: 'Leadership', level: 5 },
    { name: 'Communication', level: 5 },
    { name: 'Architecture', level: 4 },
    { name: 'Mentoring', level: 5 },
  ];

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Skills</h3>
        <div className="space-y-3">
          {humanSkills.map((skill) => (
            <div key={skill.name} className="flex items-center gap-3">
              <span style={{ fontSize: 13, color: '#242424', width: 120 }}>{skill.name}</span>
              <div className="flex gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={16}
                    color={i < skill.level ? '#ffaa44' : '#d1d1d1'}
                    fill={i < skill.level ? '#ffaa44' : 'none'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Settings Tab
   ═══════════════════════════════════════════════ */
function SettingsTab({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  if (isAi) {
    return (
      <div className="space-y-4">
        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Model Selection</h3>
          <div className="mb-3">
            <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
              Primary Model
            </label>
            <select
              className="w-full rounded"
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                border: '1px solid #d1d1d1',
                color: '#242424',
              }}
            >
              <option>Claude Opus 4.7</option>
              <option>Claude Sonnet 4</option>
              <option>GPT-4o</option>
              <option>Qwen 2.5 72b</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#616161', display: 'block', marginBottom: 4 }}>
              Response Style
            </label>
            <div className="flex gap-2">
              {['Concise', 'Balanced', 'Detailed'].map((style) => (
                <button
                  key={style}
                  className="flex-1 rounded py-2 cursor-pointer"
                  style={{
                    fontSize: 12,
                    border: style === 'Balanced' ? '1px solid #5b5fc7' : '1px solid #d1d1d1',
                    backgroundColor: style === 'Balanced' ? '#e8eaf6' : '#ffffff',
                    color: style === 'Balanced' ? '#5b5fc7' : '#242424',
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Autonomy Thresholds</h3>
          <div className="space-y-4">
            {[
              { label: 'Auto-approve PRs under', value: 50, unit: 'lines' },
              { label: 'Auto-approve budget under', value: 500, unit: 'USD' },
              { label: 'Confidence threshold', value: 85, unit: '%' },
            ].map((slider) => (
              <div key={slider.label}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ fontSize: 12, color: '#242424' }}>{slider.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#5b5fc7' }}>
                    {slider.value} {slider.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={slider.unit === '%' ? 100 : slider.unit === 'USD' ? 2000 : 200}
                  value={slider.value}
                  readOnly
                  className="w-full"
                  style={{ accentColor: '#5b5fc7' }}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Budget</h3>
          <div className="flex items-center gap-2">
            <DollarSign size={16} color="#5b5fc7" />
            <input
              type="number"
              value={2000}
              readOnly
              className="rounded"
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 13,
                border: '1px solid #d1d1d1',
                color: '#242424',
                width: 120,
              }}
            />
            <span style={{ fontSize: 12, color: '#616161' }}>/ month</span>
          </div>
        </Card>
      </div>
    );
  }

  // Human settings
  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Notification Preferences</h3>
        <div className="space-y-2">
          {['Mentions & DMs', 'PR Reviews', 'Sprint Updates', 'Approval Requests'].map((notif) => (
            <div key={notif} className="flex items-center justify-between py-1">
              <span style={{ fontSize: 13, color: '#242424' }}>{notif}</span>
              <button
                className="cursor-pointer"
                style={{
                  width: 32,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: '#5b5fc7',
                  border: 'none',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: 2,
                    left: 16,
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Calendar Sync</h3>
        <div className="flex items-center gap-3">
          <Calendar size={16} color="#5b5fc7" />
          <span style={{ fontSize: 13, color: '#242424' }}>Google Calendar</span>
          <StatusChip status="online" label="Connected" />
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Security</h3>
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <Shield size={16} color="#5b5fc7" />
            <span style={{ fontSize: 13, color: '#242424' }}>Two-Factor Authentication</span>
          </div>
          <StatusChip status="online" label="Enabled" />
        </div>
      </Card>

      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>API Tokens</h3>
        <div className="flex items-center gap-2">
          <Key size={16} color="#616161" />
          <span style={{ fontSize: 12, color: '#616161', fontFamily: 'monospace' }}>
            ivxt_••••••••••••••••
          </span>
          <button
            className="cursor-pointer rounded px-2"
            style={{ fontSize: 11, border: '1px solid #d1d1d1', color: '#616161' }}
          >
            Regenerate
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Placeholder Tabs (Mission, Goals, Activity, Tasks, Schedule)
   ═══════════════════════════════════════════════ */
function MissionTab({ employee }: { employee: typeof employees[0] }) {
  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 8 }}>Mission</h3>
        <p style={{ fontSize: 14, color: '#616161' }}>
          &ldquo;Build reliable, scalable software that empowers the team to ship faster and with confidence.&rdquo;
        </p>
      </Card>
      <Card padding="lg">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Current Focus</h3>
        <div className="space-y-2">
          {['TAX-152: SSN validation service', 'TAX-149: Audit logging', 'TAX-144: IRS API integration'].map((task) => (
            <div key={task} className="flex items-center gap-2">
              <Check size={14} color="#5b5fc7" />
              <span style={{ fontSize: 13, color: '#242424' }}>{task}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function GoalsTab({ employee }: { employee: typeof employees[0] }) {
  const goals = [
    { text: 'Complete payment gateway integration', pct: 80, status: 'on track' },
    { text: 'Review 20 PRs this sprint', pct: 75, status: 'on track' },
    { text: 'Write architecture doc for auth service', pct: 30, status: 'at risk' },
  ];

  return (
    <div className="space-y-3">
      {goals.map((g, i) => (
        <Card key={i} padding="md">
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontSize: 13, color: '#242424' }}>{g.text}</span>
            <StatusChip status={g.status === 'on track' ? 'online' : 'away'} label={g.status} />
          </div>
          <div className="w-full rounded-full" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
            <div
              className="rounded-full"
              style={{
                height: 6,
                width: `${g.pct}%`,
                backgroundColor: g.status === 'on track' ? '#92c353' : '#ffaa44',
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: '#616161', marginTop: 4 }}>{g.pct}% complete</div>
        </Card>
      ))}
    </div>
  );
}

function ActivityTab({ employee }: { employee: typeof employees[0] }) {
  const activities = [
    { type: 'commit', text: `Pushed commit to feat/auth-oauth`, time: '2h ago' },
    { type: 'review', text: 'Approved PR #347 — IRS API integration', time: '4h ago' },
    { type: 'ticket', text: 'Completed TAX-152: SSN validation service', time: '6h ago' },
    { type: 'comment', text: 'Commented on TAX-144', time: '8h ago' },
  ];

  return (
    <div className="space-y-2">
      {activities.map((a, i) => (
        <Card key={i} padding="md" className="flex items-start gap-3">
          <div
            className="flex items-center justify-center rounded-full flex-shrink-0"
            style={{ width: 28, height: 28, backgroundColor: '#e8eaf6' }}
          >
            <GitBranch size={12} color="#5b5fc7" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#242424' }}>{a.text}</div>
            <div style={{ fontSize: 11, color: '#767676' }}>{a.time}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function TasksTab({ employee }: { employee: typeof employees[0] }) {
  const tasks = [
    { id: 'TAX-152', title: 'SSN validation service', status: 'done' as const },
    { id: 'TAX-149', title: 'Audit logging for payment events', status: 'done' as const },
    { id: 'TAX-147', title: 'Refactor PDF parser', status: 'done' as const },
    { id: 'TAX-144', title: 'IRS API integration', status: 'in-progress' as const },
    { id: 'TAX-155', title: 'Multi-state tax rules engine', status: 'todo' as const },
  ];

  const statusOrder = { 'in-progress': 0, todo: 1, done: 2 };
  const sorted = [...tasks].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return (
    <div className="space-y-2">
      {sorted.map((t) => (
        <Card key={t.id} padding="md" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded flex-shrink-0"
              style={{
                width: 20,
                height: 20,
                backgroundColor: t.status === 'done' ? '#237b4b' : t.status === 'in-progress' ? '#5b5fc7' : '#d1d1d1',
              }}
            >
              {t.status === 'done' && <Check size={12} color="#ffffff" />}
              {t.status === 'in-progress' && <Clock size={12} color="#ffffff" />}
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#5b5fc7' }}>{t.id}</span>
              <span style={{ fontSize: 13, color: '#242424', marginLeft: 6 }}>{t.title}</span>
            </div>
          </div>
          <StatusChip
            status={t.status === 'done' ? 'online' : t.status === 'in-progress' ? 'ai-active' : 'offline'}
            label={t.status}
          />
        </Card>
      ))}
    </div>
  );
}

function ScheduleTab({ employee, isAi }: { employee: typeof employees[0]; isAi: boolean }) {
  return (
    <Card padding="lg">
      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Schedule</h3>
      {isAi ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} color="#5b5fc7" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Working Hours: 24/7</span>
          </div>
          <p style={{ fontSize: 13, color: '#616161' }}>
            AI employees are always available. Processing tasks across all time zones.
          </p>
        </div>
      ) : (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} color="#5b5fc7" />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>9 AM – 6 PM IST</span>
          </div>
          <p style={{ fontSize: 13, color: '#616161' }}>
            Working hours in {employee.name}&apos;s local timezone.
          </p>
        </div>
      )}
    </Card>
  );
}
