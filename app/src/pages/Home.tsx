import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import {
  FolderKanban, MessageSquare, Users, CheckCircle2,
  GitPullRequest, Rocket, AlertCircle, Clock,
  Zap, ArrowRight, TrendingUp, Bot, GitCommit,
  Activity, BarChart3, ChevronRight, Sparkles,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { projects, employees, activities, allTickets, companyGoals } from '@/data/mockData';
import { ROUTES } from '@/const';

const BRAND = '#5b5fc7';
const BRAND2 = '#7c3aed';

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  commit: GitCommit, 'pr-merged': GitPullRequest, 'file-uploaded': Sparkles,
  'ticket-completed': CheckCircle2, 'deploy-shipped': Rocket, mention: MessageSquare,
  'status-change': Activity, 'risk-flagged': AlertCircle, 'review-submitted': CheckCircle2,
  'goal-updated': TrendingUp, 'sprint-completed': CheckCircle2, 'approval-needed': Clock,
  'meeting-started': Users, comment: MessageSquare,
};
const ACTIVITY_COLORS: Record<string, string> = {
  commit: '#7c3aed', 'pr-merged': '#16a34a', 'deploy-shipped': '#2563eb',
  'ticket-completed': '#16a34a', 'risk-flagged': '#dc2626', 'approval-needed': '#d97706',
  'sprint-completed': '#16a34a', 'meeting-started': BRAND, default: '#71717a',
};

function rel(ts: string) {
  const m = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function healthColor(h: string) {
  return h === 'green' ? '#16a34a' : h === 'amber' ? '#d97706' : '#dc2626';
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] } }),
};

export default function Home() {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const workspace = useStore((s) => s.workspace);

  const stats = useMemo(() => ({
    activeProjects: projects.filter(p => p.status === 'active').length,
    inProgress: allTickets.filter(t => t.status === 'in-progress').length,
    done: allTickets.filter(t => t.status === 'done').length,
    inReview: allTickets.filter(t => t.status === 'review').length,
    humans: employees.filter(e => e.kind === 'human').length,
    aiAgents: employees.filter(e => e.kind === 'ai').length,
  }), []);

  const topProjects = useMemo(() => projects.filter(p => p.status === 'active').slice(0, 3), []);
  const recentActivity = useMemo(() => activities.slice(0, 10), []);
  const aiEmployees = useMemo(() => employees.filter(e => e.kind === 'ai').slice(0, 5), []);
  const topGoal = companyGoals[0];

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }, []);

  const displayName = currentUser?.name?.split(' ')[0] || 'there';

  return (
    <div style={{
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      background: 'var(--surface-base, #f7f7f8)',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* ── Hero Header ── */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #3d4080 100%)`,
        padding: '28px 36px 32px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG glow */}
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 200, width: 200, height: 200, borderRadius: '50%', background: 'rgba(91,95,199,0.2)', filter: 'blur(40px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {greeting}, {displayName} 👋
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
              {workspace?.name || 'BrixOS'} workspace · {stats.activeProjects} active projects
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <HeaderBtn onClick={() => navigate(ROUTES.chat)} secondary>
              <MessageSquare size={14} /> Open Chat
            </HeaderBtn>
            <HeaderBtn onClick={() => navigate(ROUTES.projects)}>
              <FolderKanban size={14} /> View Projects
            </HeaderBtn>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 24, position: 'relative' }}>
          {[
            { label: 'Active Projects',  value: stats.activeProjects, change: '+2 this month', color: '#818cf8' },
            { label: 'In Progress',      value: stats.inProgress,     change: `${stats.inReview} in review`, color: '#a78bfa' },
            { label: 'Completed',        value: stats.done,           change: 'this sprint', color: '#34d399' },
            { label: 'Team Members',     value: stats.humans,         change: `+${stats.aiAgents} AI agents`, color: '#fbbf24' },
            { label: 'Velocity',         value: '94%',                change: '↑ 8% vs last sprint', color: '#60a5fa' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12, padding: '14px 16px',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: '0 0 3px' }}>{s.label}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{s.change}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ padding: '24px 36px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Active Projects */}
            <SectionCard
              icon={<FolderKanban size={15} color={BRAND} />}
              title="Active Projects"
              action={{ label: 'View all', onClick: () => navigate(ROUTES.projects) }}
              delay={0}
            >
              {topProjects.map((proj, idx) => {
                const done = allTickets.filter(t => t.projectId === proj.id && t.status === 'done').length;
                const total = allTickets.filter(t => t.projectId === proj.id).length;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                const hc = healthColor(proj.health);
                return (
                  <div
                    key={proj.id}
                    onClick={() => navigate(ROUTES.projects)}
                    style={{
                      padding: '14px 0',
                      borderBottom: idx < topProjects.length - 1 ? '1px solid var(--surface-border, #e4e4e7)' : 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: hc, boxShadow: `0 0 6px ${hc}80`, flexShrink: 0 }} />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary, #18181b)' }}>{proj.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary, #52525b)' }}>{pct}%</span>
                        <StatusPill color={hc}>{proj.health.toUpperCase()}</StatusPill>
                        <ChevronRight size={14} color="var(--text-tertiary, #a1a1aa)" />
                      </div>
                    </div>
                    <div style={{ width: '100%', height: 5, background: 'var(--surface-active, #e4e4e7)', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: `linear-gradient(90deg, ${hc}80, ${hc})`, borderRadius: 999, transition: 'width 1s ease' }} />
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 16 }}>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary, #a1a1aa)' }}>{done}/{total} tickets done</span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary, #a1a1aa)' }}>{proj.memberIds.length} members</span>
                    </div>
                  </div>
                );
              })}
            </SectionCard>

            {/* Activity Feed */}
            <SectionCard
              icon={<Activity size={15} color={BRAND} />}
              title="Recent Activity"
              delay={0.05}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {recentActivity.map((act, idx) => {
                  const Icon = ACTIVITY_ICONS[act.type] || Activity;
                  const color = ACTIVITY_COLORS[act.type] || ACTIVITY_COLORS.default;
                  return (
                    <div key={act.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '10px 0',
                      borderBottom: idx < recentActivity.length - 1 ? '1px solid var(--surface-divider, #f0f0f0)' : 'none',
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        background: `${color}12`,
                        border: `1px solid ${color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginTop: 1,
                      }}>
                        <Icon size={13} color={color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary, #18181b)', lineHeight: 1.4 }}>{act.message}</p>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary, #a1a1aa)' }}>{rel(act.timestamp)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>

          {/* ── Right column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* OKR Goal */}
            {topGoal && (
              <SectionCard
                icon={<TrendingUp size={15} color={BRAND} />}
                title="Top Company Goal"
                delay={0.08}
              >
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #18181b)', margin: '0 0 10px', lineHeight: 1.4 }}>
                  {topGoal.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1, height: 7, background: 'var(--surface-active, #e4e4e7)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{
                      width: `${topGoal.progress}%`, height: '100%',
                      background: `linear-gradient(90deg, ${BRAND}80, ${BRAND})`,
                      borderRadius: 999, transition: 'width 1.2s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: BRAND, flexShrink: 0 }}>{topGoal.progress}%</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {topGoal.keyResults.slice(0, 3).map(kr => (
                    <div key={kr.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: healthColor(kr.status),
                        boxShadow: `0 0 4px ${healthColor(kr.status)}60`,
                      }} />
                      <span style={{ fontSize: 12, color: 'var(--text-secondary, #52525b)', flex: 1, minWidth: 0 }}>{kr.text}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* AI Agents */}
            <SectionCard
              icon={<Bot size={15} color={BRAND2} />}
              title="AI Employees"
              badge="All Active"
              badgeColor={BRAND2}
              delay={0.12}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {aiEmployees.map(emp => (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                      background: `linear-gradient(135deg, #7c3aed, #5b5fc7)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, color: '#fff',
                    }}>
                      {emp.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #18181b)' }}>{emp.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary, #a1a1aa)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.title}</p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: '#f0fdf4', borderRadius: 999,
                      padding: '2px 8px',
                    }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a' }}>Active</span>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/ai-employees')}
                style={{
                  marginTop: 10, width: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '9px', borderRadius: 9,
                  border: '1px solid var(--surface-border, #e4e4e7)',
                  background: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #52525b)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover, #f4f4f5)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <Zap size={12} color={BRAND2} />
                Manage AI Employees
                <ArrowRight size={12} />
              </button>
            </SectionCard>

            {/* Quick Actions */}
            <motion.div
              custom={0.16}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{
                background: `linear-gradient(135deg, ${BRAND}12, ${BRAND2}08)`,
                border: `1px solid ${BRAND}20`,
                borderRadius: 14, padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Zap size={14} color={BRAND} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #18181b)' }}>Quick Actions</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { label: 'New Project', icon: FolderKanban, route: ROUTES.projects },
                  { label: 'Send Message', icon: MessageSquare, route: ROUTES.chat },
                  { label: 'View Analytics', icon: BarChart3, route: '/analytics' },
                  { label: 'Manage Team', icon: Users, route: ROUTES.teams },
                ].map(({ label, icon: Icon, route }) => (
                  <button
                    key={label}
                    onClick={() => navigate(route)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '9px 12px', borderRadius: 9,
                      border: '1px solid var(--surface-border, #e4e4e7)',
                      background: 'var(--surface-raised, #fff)',
                      cursor: 'pointer', transition: 'all 0.1s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-raised, #fff)'; e.currentTarget.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon size={13} color={BRAND} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #18181b)' }}>{label}</span>
                    </div>
                    <ArrowRight size={12} color="var(--text-tertiary, #a1a1aa)" />
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

const BRAND_DARK = '#3a3d6b';

/* ── Sub-components ── */

function SectionCard({
  icon, title, action, badge, badgeColor, delay = 0, children,
}: {
  icon: React.ReactNode; title: string;
  action?: { label: string; onClick: () => void };
  badge?: string; badgeColor?: string;
  delay?: number; children: React.ReactNode;
}) {
  return (
    <motion.div
      custom={delay}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      style={{
        background: 'var(--surface-raised, #fff)',
        border: '1px solid var(--surface-border, #e4e4e7)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px 12px',
        borderBottom: '1px solid var(--surface-border, #e4e4e7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary, #18181b)' }}>{title}</span>
          {badge && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              background: `${badgeColor || BRAND}15`, color: badgeColor || BRAND,
            }}>{badge}</span>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 12, fontWeight: 600, color: BRAND,
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            {action.label} <ArrowRight size={12} />
          </button>
        )}
      </div>
      <div style={{ padding: '4px 18px 16px' }}>{children}</div>
    </motion.div>
  );
}

function StatusPill({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 999,
      background: `${color}14`, color, letterSpacing: '0.04em',
    }}>
      {children}
    </span>
  );
}

function HeaderBtn({ children, onClick, secondary }: { children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
        fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
        ...(secondary
          ? { background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }
          : { background: '#fff', color: BRAND, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }
        ),
      }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.88'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}
