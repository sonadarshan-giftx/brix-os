import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  MessageSquare,
  Users,
  CheckCircle2,
  GitPullRequest,
  Rocket,
  AlertCircle,
  Clock,
  Zap,
  ArrowRight,
  TrendingUp,
  Bot,
  GitCommit,
  Star,
  Activity,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import {
  projects,
  employees,
  activities,
  allTickets,
  companyGoals,
} from '@/data/mockData';
import { ROUTES } from '@/const';

const BRAND = '#5b5fc7';
const BRAND_LIGHT = '#ededfc';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  commit: GitCommit,
  'pr-merged': GitPullRequest,
  'file-uploaded': Star,
  'ticket-completed': CheckCircle2,
  'deploy-shipped': Rocket,
  mention: MessageSquare,
  'status-change': Activity,
  'risk-flagged': AlertCircle,
  'review-submitted': CheckCircle2,
  'goal-updated': TrendingUp,
  'sprint-completed': CheckCircle2,
  'approval-needed': Clock,
  'meeting-started': Users,
  comment: MessageSquare,
};

const ACTIVITY_COLORS: Record<string, string> = {
  commit: '#7c3aed',
  'pr-merged': '#16a34a',
  'deploy-shipped': '#2563eb',
  'ticket-completed': '#16a34a',
  'risk-flagged': '#dc2626',
  'approval-needed': '#d97706',
  'sprint-completed': '#16a34a',
  'meeting-started': BRAND,
  default: '#6b7280',
};

function getActivityColor(type: string) {
  return ACTIVITY_COLORS[type] || ACTIVITY_COLORS.default;
}

function formatRelativeTime(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function getHealthColor(h: string) {
  if (h === 'green') return '#16a34a';
  if (h === 'amber') return '#d97706';
  return '#dc2626';
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = BRAND,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      style={{
        background: 'var(--surface-raised)',
        border: '1px solid var(--surface-border)',
        borderRadius: 14,
        padding: '20px 22px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {sub && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>{sub}</div>
      )}
    </motion.div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useStore(s => s.currentUser);
  const workspace = useStore(s => s.workspace);

  const stats = useMemo(() => {
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const inProgressTickets = allTickets.filter(t => t.status === 'in-progress').length;
    const doneTickets = allTickets.filter(t => t.status === 'done').length;
    const humanMembers = employees.filter(e => e.kind === 'human').length;
    const aiMembers = employees.filter(e => e.kind === 'ai').length;
    const reviewTickets = allTickets.filter(t => t.status === 'review').length;
    return { activeProjects, inProgressTickets, doneTickets, humanMembers, aiMembers, reviewTickets };
  }, []);

  const recentActivities = useMemo(() => activities.slice(0, 8), []);
  const topProjects = useMemo(() => projects.filter(p => p.status === 'active').slice(0, 3), []);
  const topGoal = useMemo(() => companyGoals[0], []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const displayName = currentUser?.name || workspace?.name || 'there';

  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      background: 'var(--surface-base)',
      padding: '32px 36px',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{
                margin: 0, fontSize: 26, fontWeight: 800,
                color: 'var(--text-primary)', letterSpacing: '-0.02em',
              }}>
                {greeting}, {displayName} 👋
              </h1>
              <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-secondary)' }}>
                Here's what's happening across your workspace today.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate(ROUTES.chat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 9,
                  border: '1px solid var(--surface-border)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <MessageSquare size={14} />
                Open Chat
              </button>
              <button
                onClick={() => navigate(ROUTES.projects)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '9px 16px', borderRadius: 9,
                  border: 'none',
                  background: BRAND,
                  color: '#fff',
                  fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FolderKanban size={14} />
                View Projects
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          <StatCard
            icon={FolderKanban} label="Active Projects"
            value={stats.activeProjects} sub="Currently running"
            color={BRAND} onClick={() => navigate(ROUTES.projects)}
          />
          <StatCard
            icon={Activity} label="In Progress"
            value={stats.inProgressTickets} sub="Tickets being worked on"
            color="#7c3aed" onClick={() => navigate(ROUTES.projects)}
          />
          <StatCard
            icon={GitPullRequest} label="In Review"
            value={stats.reviewTickets} sub="Awaiting code review"
            color="#2563eb"
          />
          <StatCard
            icon={CheckCircle2} label="Completed"
            value={stats.doneTickets} sub="Tickets done this sprint"
            color="#16a34a"
          />
          <StatCard
            icon={Users} label="Team Members"
            value={`${stats.humanMembers} + ${stats.aiMembers} AI`}
            sub="Humans & AI employees"
            color="#d97706" onClick={() => navigate(ROUTES.teams)}
          />
        </div>

        {/* ── Main 2-col layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

          {/* ── Left: Activity + Projects ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Active projects */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--surface-border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '18px 20px 14px',
                borderBottom: '1px solid var(--surface-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderKanban size={16} color={BRAND} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Active Projects</span>
                </div>
                <button
                  onClick={() => navigate(ROUTES.projects)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12, fontWeight: 600, color: BRAND,
                    background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  View all <ArrowRight size={12} />
                </button>
              </div>
              {topProjects.map((proj, idx) => {
                const done = allTickets.filter(t => t.projectId === proj.id && t.status === 'done').length;
                const total = allTickets.filter(t => t.projectId === proj.id).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div
                    key={proj.id}
                    onClick={() => navigate(ROUTES.projects)}
                    style={{
                      padding: '14px 20px',
                      borderBottom: idx < topProjects.length - 1 ? '1px solid var(--surface-border)' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: getHealthColor(proj.health), flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{proj.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{pct}%</span>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                          background: getHealthColor(proj.health) + '18',
                          color: getHealthColor(proj.health),
                        }}>
                          {proj.health.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'var(--surface-border)', borderRadius: 2 }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 2, background: getHealthColor(proj.health), transition: 'width 0.8s ease' }} />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                      {done} of {total} tickets done · {proj.memberIds.length} members
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Activity feed */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--surface-border)',
                borderRadius: 14,
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '18px 20px 14px',
                borderBottom: '1px solid var(--surface-border)',
              }}>
                <Activity size={16} color={BRAND} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</span>
              </div>
              <div>
                {recentActivities.map((act, idx) => {
                  const Icon = ACTIVITY_ICONS[act.type] || Activity;
                  const color = getActivityColor(act.type);
                  return (
                    <div
                      key={act.id}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 20px',
                        borderBottom: idx < recentActivities.length - 1 ? '1px solid var(--surface-border)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: `${color}15`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 1,
                      }}>
                        <Icon size={13} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          {act.message}
                        </p>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {formatRelativeTime(act.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* ── Right: Goal + AI Employees ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Top OKR */}
            {topGoal && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  background: 'var(--surface-raised)',
                  border: '1px solid var(--surface-border)',
                  borderRadius: 14,
                  padding: '18px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <TrendingUp size={15} color={BRAND} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Top Company Goal</span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {topGoal.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface-border)', borderRadius: 3 }}>
                    <div style={{
                      width: `${topGoal.progress}%`, height: '100%',
                      borderRadius: 3, background: BRAND,
                      transition: 'width 1s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: BRAND, flexShrink: 0 }}>{topGoal.progress}%</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topGoal.keyResults.slice(0, 3).map(kr => (
                    <div key={kr.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: getHealthColor(kr.status),
                      }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}>{kr.text}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        {kr.current}{kr.unit === 'percent' ? '%' : ''}/{kr.target}{kr.unit === 'percent' ? '%' : ''} {kr.unit !== 'percent' ? kr.unit : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* AI Employees */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              style={{
                background: 'var(--surface-raised)',
                border: '1px solid var(--surface-border)',
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Bot size={15} color="#7c3aed" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>AI Employees</span>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 999,
                  background: '#7c3aed18', color: '#7c3aed',
                }}>Active</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {employees.filter(e => e.kind === 'ai').slice(0, 5).map(emp => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: '#7c3aed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: '#fff',
                    }}>
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.title}</div>
                    </div>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: emp.status === 'online' ? '#22c55e' : emp.status === 'busy' ? '#ef4444' : '#f59e0b',
                      flexShrink: 0,
                    }} />
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/ai-employees')}
                style={{
                  marginTop: 14, width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px 0', borderRadius: 8,
                  border: '1px solid var(--surface-border)',
                  background: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Zap size={12} />
                Manage AI Employees
              </button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                background: `linear-gradient(135deg, ${BRAND}18 0%, #7c3aed18 100%)`,
                border: `1px solid ${BRAND}30`,
                borderRadius: 14,
                padding: '18px 20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Zap size={15} color={BRAND} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Quick Actions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'New Project', icon: FolderKanban, route: ROUTES.projects },
                  { label: 'Send Message', icon: MessageSquare, route: ROUTES.chat },
                  { label: 'View Team', icon: Users, route: ROUTES.teams },
                ].map(({ label, icon: Icon, route }) => (
                  <button
                    key={label}
                    onClick={() => navigate(route)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 9,
                      border: '1px solid var(--surface-border)',
                      background: 'var(--surface-raised)',
                      color: 'var(--text-primary)',
                      fontSize: 13, fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-raised)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={14} color={BRAND} />
                      {label}
                    </div>
                    <ArrowRight size={13} color="var(--text-tertiary)" />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
