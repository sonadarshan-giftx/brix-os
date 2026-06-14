import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  projects as mockProjects,
  employees,
  allTickets,
  allSprints,
  activities,
  getEmployeeById,
  getHealthColor,
  getHealthLabel,
} from '@/data/mockData';
import type {
  Project,
  Ticket,
  ProjectHealth,
  Sprint,
  ProjectKeyResult,
  ProjectRisk,
  Activity,
} from '@/data/mockData';
import { Card } from '@/components/shared/Card';
import { TabsBar } from '@/components/shared/TabsBar';
import { Avatar } from '@/components/shared/Avatar';
import { StatusChip } from '@/components/shared/StatusChip';
import { DriftStrip } from '@/components/shared/DriftStrip';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import {
  FolderPlus,
  ArrowLeft,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Bug,
  FileText,
  Image,
  FileCode,
  Table as TableIcon,
  Calendar,
  X,
  Sparkles,
  Plus,
  GitCommit,
  GitPullRequest,
  Rocket,
  GripVertical,
  Trash2,
  ChevronDown,
  Search,
  Zap,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Activity as ActivityIcon,
  Clock,
  ChevronRight,
  Pencil,
  Archive,
  File,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useStore } from '@/store/useStore';
import { confirmAction, showToast } from '@/utils/helpers';

/* ─────────────────────── CSS animations ─────────────────────── */
const progressBarStyle = `
  @keyframes progressGrow {
    from { width: 0%; }
  }
  .progress-bar-animated {
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .hover-lift {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .hover-lift:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }
  .btn-hover {
    transition: opacity 0.15s ease, background-color 0.15s ease, transform 0.1s ease;
  }
  .btn-hover:hover {
    opacity: 0.9;
  }
  .btn-hover:active {
    transform: scale(0.98);
  }
  .table-row-hover {
    transition: background-color 0.12s ease;
  }
  .kbd:focus-visible {
    outline: 2px solid #5b5fc7;
    outline-offset: 2px;
  }
`;

/* ─────────────────────── helpers ─────────────────────── */
const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/* ─── Project Card: status color to semantic name ─── */
const healthToStatus = (h: ProjectHealth): 'online' | 'away' | 'busy' =>
  h === 'green' ? 'online' : h === 'amber' ? 'away' : 'busy';

const priorityColor = (p: string) =>
  p === 'critical' ? '#c4314b' : p === 'high' ? '#ffaa44' : '#92c353';

const statusColor = (s: string) =>
  s === 'done'
    ? '#92c353'
    : s === 'in-progress'
      ? '#5b5fc7'
      : s === 'review'
        ? '#ffaa44'
        : '#d1d1d1';

/** Compute elapsed / total weeks for a project based on its dates */
function computeTimeline(project: Project): { elapsed: number; total: number } {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetEndDate).getTime();
  const now = new Date('2025-05-01').getTime();
  const totalMs = end - start;
  const elapsedMs = Math.max(0, Math.min(now - start, totalMs));
  const totalWeeks = Math.round((totalMs / (1000 * 60 * 60 * 24 * 7)) * 10) / 10;
  const elapsedWeeks = Math.round((elapsedMs / (1000 * 60 * 60 * 24 * 7)) * 10) / 10;
  return { elapsed: elapsedWeeks, total: totalWeeks };
}

/* ═══════════════════ ERROR BOUNDARY WRAPPER ═══════════════════ */
function TabErrorBoundary({ children, tabName }: { children: React.ReactNode; tabName: string }) {
  const [hasError, setHasError] = useState(false);
  useEffect(() => { setHasError(false); }, [tabName]);
  if (hasError) {
    return (
      <EmptyState
        icon={<AlertTriangle size={32} color="#c4314b" />}
        title="Something went wrong"
        message={`Failed to load the ${tabName} tab. Try switching tabs and coming back.`}
        action={{ label: 'Retry', onClick: () => setHasError(false) }}
      />
    );
  }
  return <>{children}</>;
}

/* ═══════════════════ TOOLTIP WRAPPER ═══════════════════ */
function InfoTooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="group relative inline-flex" aria-label={text}>
      {children}
      <span
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-full rounded px-2 py-1 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
        style={{ bottom: 6, backgroundColor: '#242424', color: '#fff', whiteSpace: 'nowrap', zIndex: 50 }}
        role="tooltip"
      >
        {text}
      </span>
    </div>
  );
}

/* Inline icon wrapper to avoid naming conflict */
function GitPullRequestIcon({ size, color }: { size: number; color: string }) {
  return <GitPullRequest size={size} color={color} />;
}

/* ═══════════════════ PROJECTS PAGE ═══════════════════ */
export default function ProjectsPage() {
  useEffect(() => { document.title = "Projects" + " - BrixOS"; }, []);
  const selectedProjectId = useStore((s) => s.selectedProjectId);
  const selectProject = useStore((s) => s.selectProject);

  return (
    <div className="flex h-full flex-col">
      <style>{progressBarStyle}</style>
      {selectedProjectId ? (
        <ProjectDetail
          projectId={selectedProjectId}
          onBack={() => selectProject('')}
        />
      ) : (
        <ProjectsList onSelectProject={selectProject} />
      )}
    </div>
  );
}

/* ═══════════════════ KPI STRIP (Projects List) ═══════════════════ */

function ProjectsKPIStrip({ userRole }: { userRole: string }) {
  const kpis = userRole === 'Owner'
    ? [
        { label: 'Active Projects', value: String(mockProjects.filter(p => p.status === 'active').length), sub: 'on track', icon: <Target size={16} color="#5b5fc7" /> },
        { label: 'Team Members', value: String(employees.length), sub: `${employees.filter(e => e.kind === 'ai').length} AI agents`, icon: <Users size={16} color="#5b5fc7" /> },
        { label: 'Sprint Velocity', value: '42', sub: '+12% vs last', icon: <Zap size={16} color="#5b5fc7" /> },
        { label: 'Budget Burn', value: '68%', sub: 'on track', icon: <DollarSign size={16} color="#5b5fc7" /> },
      ]
    : userRole === 'Manager'
    ? [
        { label: 'Team Velocity', value: '38', sub: 'pts this sprint', icon: <Zap size={16} color="#5b5fc7" /> },
        { label: 'Squad Members', value: '6', sub: '3 AI agents', icon: <Users size={16} color="#5b5fc7" /> },
        { label: 'Open Risks', value: '2', sub: '1 needs attention', icon: <AlertTriangle size={16} color="#c4314b" /> },
        { label: 'Sprint Complete', value: '72%', sub: '3 days left', icon: <TrendingUp size={16} color="#237b4b" /> },
      ]
    : [
        { label: 'My Tasks', value: '5', sub: '2 in progress', icon: <CheckCircle2 size={16} color="#5b5fc7" /> },
        { label: 'My Points', value: '13', sub: '3 pts this sprint', icon: <Zap size={16} color="#5b5fc7" /> },
        { label: 'My PRs', value: '2', sub: '1 awaiting review', icon: <GitPullRequestIcon size={16} color="#f59e0b" /> },
        { label: 'Sprint Progress', value: '68%', sub: 'on track', icon: <TrendingUp size={16} color="#237b4b" /> },
      ];

  return (
    <>
      {kpis.map((kpi) => (
        <Card key={kpi.label} padding="md" className="flex flex-1 items-center gap-2.5 hover-lift">
          <div className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, backgroundColor: '#e8eaf6' }}>
            {kpi.icon}
          </div>
          <div>
            <div style={{ fontSize: 10, color: '#616161', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{kpi.label}</div>
            <div className="flex items-baseline gap-1.5">
              <span style={{ fontSize: 18, fontWeight: 700, color: '#242424' }}>{kpi.value}</span>
              <span style={{ fontSize: 10, color: '#616161' }}>{kpi.sub}</span>
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

/* ═══════════════════ PROJECTS LIST ═══════════════════ */
function ProjectsList({
  onSelectProject,
}: {
  onSelectProject: (id: string) => void;
}) {
  const userRole = useStore((s) => s.currentUser.role);
  const openCreateProject = useStore((s) => s.openCreateProject);
  const [isLoading, setIsLoading] = useState(true);
  const projects = mockProjects;
  const projectSearch = useStore((s) => s.projectSearchQuery);
  const setProjectSearch = useStore((s) => s.setProjectSearchQuery);

  // Simulate brief loading state
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.tickets.some((t) => t.labels.some((l) => l.toLowerCase().includes(q)))
    );
  }, [projectSearch, projects]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        <LoadingState count={6} />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
      {/* Header */}
      <motion.div
        {...fadeInUp}
        transition={{ duration: 0.25 }}
        className="mb-4 flex items-center justify-between"
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#242424',
              letterSpacing: '-0.01em',
            }}
          >
            Projects
          </h1>
          <p style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
            {filteredProjects.length} active project{filteredProjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} color="#a0a0a0" className="absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects..."
              aria-label="Search projects"
              value={projectSearch}
              onChange={(e) => setProjectSearch(e.target.value)}
              className="rounded border px-3 py-1.5 text-xs outline-none kbd"
              style={{ borderColor: '#d1d1d1', width: 200, paddingLeft: 28 }}
            />
          </div>
          <button
            onClick={openCreateProject}
            className="btn-hover flex items-center gap-2 rounded px-4 font-medium text-white"
            style={{
              height: 32,
              fontSize: 13,
              backgroundColor: '#5b5fc7',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Create new project"
          >
            <FolderPlus size={14} />
            New Project
          </button>
        </div>
      </motion.div>

      {/* Role-aware KPI Strip */}
      <div className="mb-5 flex gap-3">
        <ProjectsKPIStrip userRole={userRole} />
      </div>

      {/* Empty state for no matching projects */}
      {filteredProjects.length === 0 && (
        <EmptyState
          icon={<Search size={32} color="#a0a0a0" />}
          title="No projects found"
          message={`$"No projects match" "${projectSearch}". Try a different search term.`}
          action={{ label: 'Clear Search', onClick: () => setProjectSearch('') }}
        />
      )}

      {/* Project cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.06 }}
          >
            <ProjectListCard
              project={project as Project}
              onClick={() => onSelectProject(String(project.id))}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Individual Project Card (list view) ─── */
const ProjectListCard = memo(function ProjectListCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  const { progress, budgetPct, memberAvatars, sprintCount, timeline, bugCount, taskDone, taskTotal } = useMemo(() => {
    const nonBugTickets = project.tickets.filter((t) => t.type !== 'bug');
    const taskDone = nonBugTickets.filter((t) => t.status === 'done').length;
    const taskTotal = nonBugTickets.length;
    const progress = Math.round((taskDone / Math.max(taskTotal, 1)) * 100);
    const budgetPct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
    const memberAvatars = project.memberIds.slice(0, 4).map((id) => getEmployeeById(id));
    const sprintCount = project.sprints.length;
    const timeline = computeTimeline(project);
    const bugCount = project.tickets.filter((t) => t.type === 'bug').length;
    return { progress, budgetPct, memberAvatars, sprintCount, timeline, bugCount, taskDone, taskTotal };
  }, [project]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Open ${project.name} project details`}
      onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      onClick={onClick}
      className="hover-lift kbd cursor-pointer"
      style={{ outline: 'none' }}
    >
    <Card hoverable>
      <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
        <div className="flex items-center gap-2">
          <span
            className="rounded px-1.5 py-0.5 font-semibold"
            style={{ fontSize: 11, backgroundColor: '#f0f0f0', color: '#616161' }}
          >
            {project.key}
          </span>
          <StatusChip
            status={healthToStatus(project.health)}
            label={getHealthLabel(project.health)}
          />
        </div>
        <ChevronRight size={16} color="#a0a0a0" />
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>
        {project.name}
      </h3>
      <p
        style={{
          fontSize: 12,
          color: '#616161',
          lineHeight: '18px',
          marginBottom: 12,
          minHeight: 36,
        }}
      >
        {project.description}
      </p>

      {/* Progress bar */}
      <div className="mb-1 flex items-center justify-between">
        <span style={{ fontSize: 11, color: '#616161' }}>Progress</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#242424' }}>{progress}%</span>
      </div>
      <div
        className="mb-3 w-full overflow-hidden rounded-full"
        style={{ height: 6, backgroundColor: '#f0f0f0' }}
      >
        <div
          className="progress-bar-animated h-full rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: getHealthColor(project.health),
          }}
        />
      </div>

      {/* Stats row */}
      <div className="mb-3 flex items-center gap-4">
        <span style={{ fontSize: 11, color: '#616161' }}>
          {taskDone}/{taskTotal} tasks
        </span>
        <span style={{ fontSize: 11, color: '#616161' }}>
          {bugCount} bug{bugCount !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: '#616161' }}>
          {sprintCount} sprint{sprintCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Budget burn mini bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between">
          <span style={{ fontSize: 11, color: '#616161' }}>Budget</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#242424' }}>
            ${(project.budgetSpent / 1000).toFixed(1)}K/${(project.budgetTotal / 1000).toFixed(0)}K
          </span>
        </div>
        <div
          className="w-full overflow-hidden rounded-full"
          style={{ height: 4, backgroundColor: '#f0f0f0' }}
        >
          <div
            className="progress-bar-animated h-full rounded-full"
            style={{
              width: `${budgetPct}%`,
              backgroundColor: budgetPct > 90 ? '#c4314b' : budgetPct > 75 ? '#ffaa44' : '#92c353',
            }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-3 flex items-center gap-1">
        <Clock size={11} color="#a0a0a0" />
        <span style={{ fontSize: 11, color: '#616161' }}>
          {timeline.elapsed}/{timeline.total} weeks elapsed
        </span>
      </div>

      {/* Member avatars */}
      <div className="flex -space-x-2">
        {memberAvatars.map(
          (emp) =>
            emp && (
              <InfoTooltip key={emp.id} text={emp.name}>
                <Avatar
                  src={emp.avatar}
                  alt={emp.name}
                  size="xs"
                  isAi={emp.kind === 'ai'}
                />
              </InfoTooltip>
            )
        )}
      </div>
    </Card>
    </div>
  );
});


/* ═══════════════════ PROJECT DETAIL ═══════════════════ */
const baseProjectTabs = [
  { id: 'mission', label: 'Overview' },
  { id: 'goals', label: 'Goals & OKRs' },
  { id: 'planning', label: 'Planning' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'bugs', label: 'Bugs' },
  { id: 'activity', label: 'Activity' },
  { id: 'members', label: 'Team' },
  { id: 'sprints', label: 'Sprints' },
  { id: 'files', label: 'Files' },
  { id: 'budget', label: 'Budget' },
  { id: 'risks', label: 'Risks' },
  { id: 'roadmap', label: 'Roadmap' },
];

const engineeringTabs = [
  { id: 'qa', label: 'QA' },
  { id: 'devops', label: 'DevOps' },
];

function ProjectDetail({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState('mission');
  const [isLoading, setIsLoading] = useState(true);
  const openCreateTask = useStore((s) => s.openCreateTask);
  const project = mockProjects.find((p) => p.id === projectId);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(t);
  }, [projectId]);

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<AlertTriangle size={32} color="#c4314b" />}
          title="Project not found"
          message="The project you're looking for doesn't exist."
          action={{ label: 'Go Back', onClick: onBack }}
        />
      </div>
    );
  }

  const isEngineering = project.key === 'TAX' || project.key === 'API' || project.key === 'MOB';
  const projectTabs = isEngineering
    ? [...baseProjectTabs, ...engineeringTabs]
    : baseProjectTabs;

  const memberAvatars = project.memberIds.slice(0, 5).map((id) => getEmployeeById(id));

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <div style={{ padding: '12px 20px 8px' }}>
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded" style={{ width: 24, height: 24, backgroundColor: '#f0f0f0', animation: 'pulse 1.5s infinite' }} />
            <div className="rounded" style={{ width: 120, height: 12, backgroundColor: '#f0f0f0', animation: 'pulse 1.5s infinite' }} />
          </div>
        </div>
        <LoadingState count={8} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Project Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <div className="mb-2 flex items-center gap-2">
          <InfoTooltip text="Back to projects">
            <button
              onClick={onBack}
              className="btn-hover flex cursor-pointer items-center gap-1 rounded p-1 kbd"
              style={{ background: 'none', border: 'none', color: '#616161' }}
              aria-label="Back to projects list"
            >
              <ArrowLeft size={16} />
            </button>
          </InfoTooltip>
          <span style={{ fontSize: 11, color: '#616161' }}>
            Acme Software &gt; Projects
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: '#242424',
                letterSpacing: '-0.01em',
              }}
            >
              {project.name}
            </h1>
            <span
              className="rounded px-1.5 py-0.5 font-semibold"
              style={{ fontSize: 11, backgroundColor: '#f0f0f0', color: '#616161' }}
            >
              {project.key}
            </span>
            {isEngineering && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{ backgroundColor: '#dbeafe', color: '#3b82f6' }}
              >
                Engineering
              </span>
            )}
            <StatusChip
              status={healthToStatus(project.health)}
              label={getHealthLabel(project.health)}
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Edit / Archive / Delete actions */}
            <InfoTooltip text="Edit project">
              <button
                onClick={() => { showToast("Edit project feature is available in the Pro plan", 'info'); }}
                className="btn-hover flex items-center gap-1 rounded px-2 py-2" style={{ background: 'none', border: '1px solid #d1d1d1', color: '#616161', cursor: 'pointer', fontSize: 11 }}
              >
                <Pencil size={12} /> Edit
              </button>
            </InfoTooltip>
            <InfoTooltip text="Archive project">
              <button
                onClick={() => {
                  if (confirmAction("Archive this project? It will be moved to archived state.")) {
                    showToast('Project archived', 'success');
                  }
                }}
                className="btn-hover flex items-center gap-1 rounded px-2 py-2" style={{ background: 'none', border: '1px solid #d1d1d1', color: '#616161', cursor: 'pointer', fontSize: 11 }}
              >
                <Archive size={12} /> Archive
              </button>
            </InfoTooltip>
            <InfoTooltip text="Delete project">
              <button
                onClick={() => {
                  if (confirmAction("Permanently delete this project? This cannot be undone.")) {
                    showToast('Project deleted', 'error');
                    setTimeout(() => onBack(), 500);
                  }
                }}
                className="btn-hover flex items-center gap-1 rounded px-2 py-2" style={{ background: 'none', border: '1px solid #c4314b', color: '#c4314b', cursor: 'pointer', fontSize: 11 }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </InfoTooltip>

            <button
              onClick={() => openCreateTask(project.id)}
              className="btn-hover flex items-center gap-1 rounded px-3 font-medium text-white"
              style={{
                height: 28,
                fontSize: 12,
                backgroundColor: '#5b5fc7',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Create new task"
            >
              <Plus size={12} />
              New Task
            </button>
            <div className="flex -space-x-2">
              {memberAvatars.map(
                (emp) =>
                  emp && (
                    <InfoTooltip key={emp.id} text={emp.name}>
                      <Avatar
                        src={emp.avatar}
                        alt={emp.name}
                        size="xs"
                        isAi={emp.kind === 'ai'}
                      />
                    </InfoTooltip>
                  )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsBar
        tabs={projectTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        <TabErrorBoundary tabName={activeTab}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'mission' && <MissionTab project={project} />}
              {activeTab === 'goals' && <GoalsTab project={project} />}
              {activeTab === 'planning' && <PlanningTab project={project} />}
              {activeTab === 'tasks' && <TasksTab project={project} />}
              {activeTab === 'bugs' && <BugsTab project={project} />}
              {activeTab === 'activity' && <ActivityTab project={project} />}
              {activeTab === 'members' && <MembersTab project={project} />}
              {activeTab === 'sprints' && <SprintsTab project={project} />}
              {activeTab === 'files' && <FilesTab />}
              {activeTab === 'budget' && <BudgetTab project={project} />}
              {activeTab === 'risks' && <RisksTab project={project} />}
              {activeTab === 'roadmap' && <RoadmapTab project={project} />}
              {activeTab === 'qa' && <QATab project={project} />}
              {activeTab === 'devops' && <DevOpsTab project={project} />}
            </motion.div>
          </AnimatePresence>
        </TabErrorBoundary>
      </div>
    </div>
  );
}

/* ═══════════════════ TAB: MISSION ═══════════════════ */
function MissionTab({ project }: { project: Project }) {
  const { progress, budgetPct, timeline, burndownData, recentActivities, velocityData, sprint, doneCount, totalCount } = useMemo(() => {
    const nonBugTickets = project.tickets.filter((t) => t.type !== 'bug');
    const doneCount = nonBugTickets.filter((t) => t.status === 'done').length;
    const totalCount = nonBugTickets.length;
    const progress = Math.round((doneCount / Math.max(totalCount, 1)) * 100);
    const budgetPct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
    const timeline = computeTimeline(project);
    const sprint = project.sprints.find((s) => s.status === 'active');
    const burndownData = sprint?.burndown ?? [];
    const recentActivities = activities
      .filter((a) => a.projectId === project.id)
      .slice(0, 5);
    const velocityData = project.sprints.map((s) => ({
      name: s.name,
      velocity: s.velocity,
    }));
    return { progress, budgetPct, timeline, burndownData, recentActivities, velocityData, sprint, doneCount, totalCount };
  }, [project]);

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {/* Mission Statement */}
      <Card>
        <div className="flex items-start gap-3">
          <Target size={18} color="#5b5fc7" className="mt-0.5 flex-shrink-0" />
          <p
            className="italic"
            style={{ fontSize: 14, color: '#242424', lineHeight: '22px' }}
          >
            {project.description}
          </p>
        </div>
      </Card>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Health</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: getHealthColor(project.health) }}>
            {progress}%
          </p>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Progress</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#242424' }}>
            {doneCount}/{totalCount}
          </p>
          <div
            className="mx-auto mt-1 w-full overflow-hidden rounded-full"
            style={{ height: 6, backgroundColor: '#f0f0f0' }}
          >
            <div
              className="progress-bar-animated h-full rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: getHealthColor(project.health),
              }}
            />
          </div>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Budget</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#242424' }}>
            ${(project.budgetSpent / 1000).toFixed(1)}K
          </p>
          <p style={{ fontSize: 11, color: '#616161' }}>
            of ${(project.budgetTotal / 1000).toFixed(0)}K
          </p>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Timeline</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#242424' }}>
            {timeline.elapsed}/{timeline.total}
          </p>
          <p style={{ fontSize: 11, color: '#616161' }}>weeks elapsed</p>
        </Card>
      </div>

      {/* Burndown Chart */}
      <Card>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>
            Sprint Burndown
          </h3>
          {sprint && (
            <span style={{ fontSize: 11, color: '#616161' }}>
              {sprint.name} — {sprint.goal}
            </span>
          )}
        </div>
        {burndownData.length > 0 ? (
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#616161' }} />
                <YAxis tick={{ fontSize: 11, fill: '#616161' }} />
                <RechartsTooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #d1d1d1',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ideal"
                  stroke="#dbeafe"
                  fill="#dbeafe"
                  strokeWidth={2}
                  name="Ideal"
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#5b5fc7"
                  fill="rgba(91,95,199,0.1)"
                  strokeWidth={2}
                  name="Actual"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState icon={<ActivityIcon size={24} color="#a0a0a0" />} title="No burndown data" message="No active sprint data available." />
        )}
      </Card>

      {/* Velocity Trend */}
      {velocityData.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 16 }}>
            Velocity Trend
          </h3>
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#616161' }} />
                <YAxis tick={{ fontSize: 11, fill: '#616161' }} />
                <RechartsTooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 6,
                    border: '1px solid #d1d1d1',
                  }}
                />
                <Bar dataKey="velocity" fill="#5b5fc7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Budget Burn */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          Budget Burn
        </h3>
        <div className="mb-2 flex items-center justify-between">
          <span style={{ fontSize: 13, color: '#242424' }}>
            ${(project.budgetSpent / 1000).toFixed(1)}K spent of ${(project.budgetTotal / 1000).toFixed(0)}K
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color:
                budgetPct > 90 ? '#c4314b' : budgetPct > 75 ? '#b56200' : '#237b4b',
            }}
          >
            {budgetPct}%
          </span>
        </div>
        <div
          className="w-full overflow-hidden rounded-full"
          style={{ height: 12, backgroundColor: '#f0f0f0' }}
        >
          <div
            className="progress-bar-animated h-full rounded-full"
            style={{
              width: `${budgetPct}%`,
              backgroundColor:
                budgetPct > 90 ? '#c4314b' : budgetPct > 75 ? '#ffaa44' : '#92c353',
            }}
          />
        </div>
      </Card>

      {/* Drift Narrative */}
      <Card>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Sparkles size={14} color="#5b5fc7" />
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
            AI Narrative
          </h3>
        </div>
        <p style={{ fontSize: 13, color: '#616161', lineHeight: '20px' }}>
          {progress >= 70
            ? `Project is on track with ${progress}% completion. Velocity is consistent at ${sprint?.velocity ?? 0} pts/sprint. Key risk: watch budget burn rate as we approach final sprints.`
            : `Project at ${progress}% — behind optimal trajectory. Aria flagged 2 blockers this week. Consider scope reduction or additional AI capacity.`}
        </p>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          Recent Activity
        </h3>
        <div className="space-y-3">
          {recentActivities.length > 0 ? (
            recentActivities.map((act) => {
              const actor = getEmployeeById(act.actorId);
              return (
                <div key={act.id} className="flex items-center gap-3">
                  {actor && (
                    <Avatar
                      src={actor.avatar}
                      alt={actor.name}
                      size="sm"
                      isAi={actor.kind === 'ai'}
                    />
                  )}
                  <div className="flex-1">
                    <p style={{ fontSize: 13, color: '#242424' }}>
                      <span style={{ fontWeight: 600 }}>{actor?.name}</span>{' '}
                      {act.message.replace(/^\w+\s/, '')}
                    </p>
                    <p style={{ fontSize: 11, color: '#767676' }}>
                      {new Date(act.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState icon={<ActivityIcon size={24} color="#a0a0a0" />} title="No recent activity" message="Check back later for updates." />
          )}
        </div>
      </Card>
    </div>
  );
}


/* ═══════════════════ TAB: GOALS ═══════════════════ */
const GoalsTab = memo(function GoalsTab({ project }: { project: Project }) {  const krProgress = useMemo(() =>
    project.keyResults.length > 0
      ? Math.round(project.keyResults.reduce((sum, kr) => sum + Math.round((kr.current / Math.max(kr.target, 1)) * 100), 0) / project.keyResults.length)
      : 0,
    [project.keyResults]
  );

  return (
    <div className="mx-auto max-w-[800px] space-y-5">
      {/* Company Goal Link */}
      <Card>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Target size={14} color="#5b5fc7" />
          <span style={{ fontSize: 13, color: '#616161' }}>{'Linked to company goal'}</span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>
          Ship Tax Filing Platform v2
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="w-full overflow-hidden rounded-full"
            style={{ height: 8, backgroundColor: '#f0f0f0', maxWidth: 200 }}
          >
            <div
              className="progress-bar-animated h-full rounded-full"
              style={{
                width: `${krProgress}%`,
                backgroundColor: '#92c353',
              }}
            />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#237b4b' }}>{krProgress}%</span>
        </div>
      </Card>

      {/* Key Results */}
      {project.keyResults.length > 0 ? project.keyResults.map((kr: ProjectKeyResult) => {
        const pct = Math.round((kr.current / Math.max(kr.target, 1)) * 100);
        const color = pct >= 90 ? '#237b4b' : pct >= 60 ? '#b56200' : '#c4314b';
        return (
          <Card key={kr.id}>
            <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: '#242424' }}>
                {kr.text}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{pct}%</span>
            </div>
            <div
              className="w-full overflow-hidden rounded-full"
              style={{ height: 8, backgroundColor: '#f0f0f0' }}
            >
              <div
                className="progress-bar-animated h-full rounded-full"
                style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span style={{ fontSize: 11, color: '#767676' }}>
                {kr.current} / {kr.target} {kr.unit}
              </span>
            </div>
            <DriftStrip
              planPercent={75}
              actualPercent={pct}
              driftText={
                pct >= 90
                  ? "On track — no action needed"
                  : pct >= 60
                    ? "Behind by a small margin — monitor closely"
                    : "Significantly behind — intervention recommended"
              }
              size="sm"
            />
          </Card>
        );
      }) : (
        <EmptyState icon={<Target size={24} color="#a0a0a0" />} title="No key results yet" message="Add key results to track project objectives." />
      )}
    </div>
  );
});

/* ═══════════════════ TAB: PLANNING ═══════════════════ */

const planningTabs = [
  { id: 'owner', label: 'Owner' },
  { id: 'manager', label: 'Manager' },
  { id: 'member', label: 'Member' },
];

function PlanningTab({ project }: { project: Project }) {  const [activeTab, setActiveTab] = useState('owner');
  const userRole = useStore((s) => s.currentUser.role);

  // Auto-select appropriate tab based on role
  const effectiveTab = userRole === 'Member' && activeTab === 'owner' ? 'member'
    : userRole === 'Member' && activeTab === 'manager' ? 'member'
    : activeTab;

  // Compute timeline milestones from project dates
  const start = new Date(project.startDate);
  const end = new Date(project.targetEndDate);
  const durationMs = end.getTime() - start.getTime();
  const midDate = new Date(start.getTime() + durationMs * 0.5);
  const freezeDate = new Date(end.getTime() - durationMs * 0.15);

  const milestones = [
    { name: 'Project Kickoff', date: project.startDate, status: 'completed' as const },
    { name: 'Mid-Point Review', date: midDate.toISOString().split('T')[0], status: 'completed' as const },
    { name: 'Feature Freeze', date: freezeDate.toISOString().split('T')[0], status: 'in-progress' as const },
    { name: 'Ship Milestone', date: project.targetEndDate, status: 'pending' as const },
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {/* AI Planning badge */}
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 13, color: '#616161' }}>Think before you build — <strong>{project.name}</strong></p>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: '#e8eaf6', color: '#5b5fc7' }}>
          <Sparkles size={10} className="mr-1 inline" /> {'AI Planning Active'}
        </span>
      </div>

      {/* Role tabs */}
      <div className="flex gap-1 rounded p-1" style={{ backgroundColor: '#f0f0f0', width: 'fit-content' }} role="tablist" aria-label="Planning role view">
        {planningTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            role="tab"
            aria-selected={effectiveTab === t.id}
            tabIndex={effectiveTab === t.id ? 0 : -1}
            className="cursor-pointer rounded px-3 py-1 text-xs font-medium kbd btn-hover"
            style={{ backgroundColor: effectiveTab === t.id ? '#fff' : 'transparent', color: effectiveTab === t.id ? '#242424' : '#616161', border: 'none', boxShadow: effectiveTab === t.id ? '0 1px 2px rgba(0,0,0,0.08)' : 'none' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {effectiveTab === 'owner' && (
          <motion.div key="owner" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <PlanningOwnerTab project={project} milestones={milestones} />
          </motion.div>
        )}
        {effectiveTab === 'manager' && (
          <motion.div key="manager" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <PlanningManagerTab />
          </motion.div>
        )}
        {effectiveTab === 'member' && (
          <motion.div key="member" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
            <PlanningMemberTab />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Planning: Owner View ── */
function PlanningOwnerTab({ project, milestones }: { project: Project; milestones: { name: string; date: string; status: 'completed' | 'in-progress' | 'pending' }[] }) {  const [description, setDescription] = useState(project.description);
  const [planGenerated, setPlanGenerated] = useState(true);
  const [committed, setCommitted] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <label style={{ fontSize: 14, fontWeight: 600, color: '#242424', display: 'block', marginBottom: 8 }}>What do you want to build?</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none rounded border p-3 outline-none focus:border-[#5b5fc7] kbd"
          style={{ fontSize: 14, color: '#242424', borderColor: '#d1d1d1', minHeight: 80, lineHeight: '20px' }} />
        <div className="mt-3 flex justify-end">
          <button onClick={() => setPlanGenerated(true)} className="btn-hover flex items-center gap-2 rounded px-4 font-medium text-white kbd"
            style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', border: 'none', cursor: 'pointer' }}
            aria-label="Generate Plan">
            <Sparkles size={14} /> "Generate Plan"
          </button>
        </div>
      </Card>

      <AnimatePresence>
        {planGenerated && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Goal */}
            <Card>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Target size={16} color="#5b5fc7" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>{'Goal'}</h3>
              </div>
              <p style={{ fontSize: 14, color: '#242424' }}>{project.description}</p>
            </Card>

            {/* Key Results */}
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>{'Key Results'}</h3>
              <div className="space-y-3">
                {project.keyResults.length > 0 ? project.keyResults.map((kr) => {
                  const pct = Math.round((kr.current / Math.max(kr.target, 1)) * 100);
                  return (
                    <div key={kr.id} className="flex items-center justify-between rounded-md p-3" style={{ backgroundColor: '#f5f5f5' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{kr.text}</p>
                        <p style={{ fontSize: 11, color: '#616161' }}>Target: {kr.target} {kr.unit}</p>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: pct >= 75 ? '#237b4b' : '#5b5fc7' }}>{kr.current}/{kr.target} ({pct}%)</span>
                    </div>
                  );
                }) : (
                  <p style={{ fontSize: 13, color: '#616161' }}>{'No key results defined'}</p>
                )}
              </div>
            </Card>

            {/* Required Capabilities */}
            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>{'Required Capabilities'}</h3>
              <div className="space-y-2">
                {[
                  { name: 'Core Feature Development', status: 'completed' },
                  { name: 'Integration & API Layer', status: 'in-progress' },
                  { name: 'QA & Testing', status: 'pending' },
                  { name: 'Documentation', status: 'pending' },
                ].map((cap, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-md p-3" style={{ backgroundColor: '#f5f5f5' }}>
                    <span style={{ fontSize: 13, color: '#242424' }}>{cap.name}</span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: cap.status === 'completed' ? '#dcfce7' : '#dbeafe', color: cap.status === 'completed' ? '#237b4b' : '#5b5fc7' }}>{cap.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 rounded p-2" style={{ backgroundColor: '#e8eaf6' }}>
                <Sparkles size={14} color="#5b5fc7" />
                <span style={{ fontSize: 12, color: '#9E4A28' }}>{'AI suggested approach based on project scope'}</span>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <Calendar size={16} color="#5b5fc7" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>{'Timeline'}</h3>
              </div>
              <div className="space-y-3">
                {milestones.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className="rounded-full border-2 border-white flex-shrink-0"
                      style={{ width: 12, height: 12, marginTop: 4, backgroundColor: m.status === 'completed' ? '#92c353' : m.status === 'in-progress' ? '#ffaa44' : '#d1d1d1' }}
                      aria-label={`${m.name}: ${m.status}`}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{m.name}</p>
                      <p style={{ fontSize: 11, color: '#616161' }}>{m.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Budget Estimate */}
            <Card>
              <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                <DollarSign size={16} color="#5b5fc7" />
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>{'Budget'}</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Spent', value: `$${(project.budgetSpent / 1000).toFixed(1)}K`, color: '#5b5fc7' },
                  { label: 'Total', value: `$${(project.budgetTotal / 1000).toFixed(0)}K`, color: '#616161' },
                  { label: 'Remaining', value: `$${((project.budgetTotal - project.budgetSpent) / 1000).toFixed(1)}K`, color: '#237b4b' },
                ].map((b) => (
                  <div key={b.label} className="rounded-md p-3 text-center" style={{ backgroundColor: '#f5f5f5' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: b.color }}>{b.value}</p>
                    <p style={{ fontSize: 11, color: '#616161' }}>{b.label}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Commit */}
            <button onClick={() => setCommitted(true)} disabled={committed}
              className="btn-hover flex w-full items-center justify-center gap-2 rounded-md font-medium text-white kbd"
              style={{ height: 44, fontSize: 15, backgroundColor: committed ? '#237b4b' : '#5b5fc7', border: 'none', cursor: committed ? 'default' : 'pointer', opacity: committed ? 0.85 : 1 }}
              aria-label={committed ? 'Plan already committed' : 'Commit plan'}>
              <CheckCircle2 size={18} /> {committed ? 'Plan Committed' : 'Commit Plan'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Planning: Manager View ── */
function PlanningManagerTab() {  const [selectedProject, setSelectedProject] = useState(mockProjects[0]?.id ?? '');
  const project = mockProjects.find((p) => p.id === selectedProject);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const capacityData = [
    { name: 'Maya', capacity: 8.5, assigned: 7 }, { name: 'Raj', capacity: 6, assigned: 5.5 },
    { name: 'Priya', capacity: 5, assigned: 3 }, { name: 'Aria', capacity: 8, assigned: 8 },
    { name: 'Sage', capacity: 7, assigned: 4 }, { name: 'Echo', capacity: 4, assigned: 2 },
  ];
  const totalCapacity = capacityData.reduce((s, m) => s + m.capacity, 0);
  const totalAssigned = capacityData.reduce((s, m) => s + m.assigned, 0);
  const pctUsed = Math.round((totalAssigned / totalCapacity) * 100);

  const backlogTickets = allTickets.filter((t) => t.projectId === selectedProject && t.status === 'todo' && !t.sprintId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <select value={selectedProject} onChange={(e) => { setSelectedProject(e.target.value); setSelectedTickets(new Set()); }}
          className="rounded border px-3 py-1 outline-none kbd" style={{ fontSize: 13, borderColor: '#d1d1d1', height: 32 }}>
          {mockProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <span className="rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: '#dcfce7', color: '#237b4b' }}>Velocity: {project?.sprints.find((s) => s.status === 'active')?.velocity ?? 0} pts</span>
      </div>

      {/* Capacity */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>{'Team Capacity'}</h3>
        <div className="space-y-2">
          {capacityData.map((m) => {
            const pct = (m.assigned / m.capacity) * 100;
            const emp = employees.find((e) => e.name === m.name);
            return (
              <div key={m.name}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {emp && <Avatar src={emp.avatar} alt={emp.name} size="xs" isAi={emp.kind === 'ai'} />}
                    <span style={{ fontSize: 12, color: '#242424' }}>{m.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#616161' }}>{m.assigned}/{m.capacity} pts</span>
                </div>
                <div className="w-full overflow-hidden rounded-full" style={{ height: 6, backgroundColor: '#f0f0f0' }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: pct > 100 ? '#c4314b' : pct > 80 ? '#ffaa44' : '#92c353' }}
                    initial={{ width: 0 }} animate={{ width: `${Math.min(pct, 100)}%` }} transition={{ duration: 0.5 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded-md p-2" style={{ backgroundColor: '#f5f5f5' }}>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Total: {totalAssigned.toFixed(1)}/{totalCapacity} pts ({pctUsed}%)</span>
        </div>
      </Card>

      {/* Backlog */}
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{'Backlog ({{count}} tickets)'.replace('{{count}}', String(backlogTickets.length))}</h3>
        <button onClick={() => setSelectedTickets(new Set(backlogTickets.slice(0, 4).map((t) => t.id)))}>
          <span className="btn-hover flex items-center gap-1 rounded px-2 py-2 text-xs font-medium kbd" style={{backgroundColor: '#e8eaf6', color: '#5b5fc7', border: 'none', cursor: 'pointer'}}>
            <Sparkles size={10} /> AI Suggest
          </span>
        </button>
      </div>
      {backlogTickets.length > 0 ? (
        <div className="space-y-1.5">
          {backlogTickets.map((ticket) => (
            <div key={ticket.id} onClick={() => setSelectedTickets((prev) => { const n = new Set(prev); n.has(ticket.id) ? n.delete(ticket.id) : n.add(ticket.id); return n; })}
              className="flex cursor-pointer items-center gap-2 rounded border p-2 kbd table-row-hover" style={{ borderColor: selectedTickets.has(ticket.id) ? '#5b5fc7' : '#d1d1d1', backgroundColor: selectedTickets.has(ticket.id) ? '#e8eaf6' : '#fff' }}>
              <div className="flex-shrink-0 rounded-sm border" style={{ width: 14, height: 14, backgroundColor: selectedTickets.has(ticket.id) ? '#5b5fc7' : 'transparent', borderColor: selectedTickets.has(ticket.id) ? '#5b5fc7' : '#d1d1d1' }}>
                {selectedTickets.has(ticket.id) && <CheckCircle2 size={12} color="#fff" />}
              </div>
              <span className="flex-1 text-xs" style={{ color: '#242424' }}>{ticket.key}: {ticket.title}</span>
              <span className="rounded px-1 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: '#f0f0f0', color: '#616161' }}>{ticket.estimate} pts</span>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={<CheckCircle2 size={24} color="#a0a0a0" />} title="Backlog is empty" message="All tickets are assigned to sprints." />
      )}

      <button disabled={selectedTickets.size === 0} className="btn-hover flex w-full items-center justify-center gap-2 rounded-md font-medium text-white kbd"
        style={{ height: 36, fontSize: 13, backgroundColor: selectedTickets.size > 0 ? '#5b5fc7' : '#d1d1d1', border: 'none', cursor: selectedTickets.size > 0 ? 'pointer' : 'default' }}
        aria-label={'Commit Sprint'}>
        <CheckCircle2 size={14} /> {'Commit Sprint'}
      </button>
    </div>
  );
}

/* ── Planning: Member View ── */
function PlanningMemberTab() {  const [selectedTicketId, setSelectedTicketId] = useState(allTickets.find((t) => t.assigneeId === 'emp-raj')?.id ?? '');
  const [approach, setApproach] = useState('Extract Wizard generics first, scaffold form steps, wire endpoint');
  const [subtasks, setSubtasks] = useState([
    { id: 'st1', text: 'Set up Wizard generic types', estimate: '30m', done: true },
    { id: 'st2', text: 'Scaffold multi-step form layout', estimate: '1h', done: true },
    { id: 'st3', text: 'Wire API endpoint for form submission', estimate: '45m', done: false },
    { id: 'st4', text: 'Add validation schema per step', estimate: '1h', done: false },
    { id: 'st5', text: 'Write component tests', estimate: '30m', done: false },
  ]);
  const [newSubtask, setNewSubtask] = useState('');

  const myTickets = allTickets.filter((t) => t.assigneeId === 'emp-raj' || t.assigneeId === 'emp-aria');
  const selectedTicket = allTickets.find((t) => t.id === selectedTicketId);

  return (
    <div className="space-y-4">
      <div>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#242424', display: 'block', marginBottom: 6 }}>{'My Ticket'}</label>
        <select value={selectedTicketId} onChange={(e) => setSelectedTicketId(e.target.value)}
          className="w-full rounded border px-3 py-2 outline-none kbd" style={{ fontSize: 13, borderColor: '#d1d1d1' }}>
          {myTickets.map((t) => <option key={t.id} value={t.id}>{t.key}: {t.title} ({t.estimate} pts)</option>)}
        </select>
      </div>

      {selectedTicket && (
        <>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 12, color: '#616161' }}>{selectedTicket.key}</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#242424' }}>{selectedTicket.title}</p>
              </div>
              <span className="rounded px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: '#e8eaf6', color: '#5b5fc7' }}>{selectedTicket.estimate} pts</span>
            </div>
          </Card>

          <Card>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#242424', display: 'block', marginBottom: 6 }}>{'Approach'}</label>
            <textarea value={approach} onChange={(e) => setApproach(e.target.value)}
              className="w-full resize-none rounded border p-2.5 outline-none focus:border-[#5b5fc7] kbd"
              style={{ fontSize: 12, color: '#242424', borderColor: '#d1d1d1', minHeight: 50, lineHeight: '18px' }} />
          </Card>

          <Card>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: '#242424', marginBottom: 8 }}>{'Subtasks' + ` (${subtasks.filter((s) => s.done).length}/${subtasks.length})`}</h3>
            <div className="space-y-1.5">
              {subtasks.map((st) => (
                <div key={st.id} className="flex items-center gap-2 rounded p-2" style={{ backgroundColor: st.done ? '#f0f0f0' : '#fff' }}>
                  <GripVertical size={12} color="#a0a0a0" />
                  <div onClick={() => setSubtasks((prev) => prev.map((s) => s.id === st.id ? { ...s, done: !s.done } : s))}
                    className="flex-shrink-0 cursor-pointer rounded-sm border" style={{ width: 14, height: 14, backgroundColor: st.done ? '#5b5fc7' : 'transparent', borderColor: st.done ? '#5b5fc7' : '#d1d1d1' }}>
                    {st.done && <CheckCircle2 size={12} color="#fff" />}
                  </div>
                  <span className="flex-1 text-xs" style={{ color: st.done ? '#8a8a8a' : '#242424', textDecoration: st.done ? 'line-through' : 'none' }}>{st.text}</span>
                  <span className="text-[10px]" style={{ color: '#767676' }}>{st.estimate}</span>
                  <InfoTooltip text="Delete subtask">
                    <button onClick={() => setSubtasks((prev) => prev.filter((s) => s.id !== st.id))} style={{ border: 'none', background: 'none', cursor: 'pointer' }} aria-label="Delete subtask"><Trash2 size={10} color="#a0a0a0" /></button>
                  </InfoTooltip>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input type="text" placeholder="Add subtask..." value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)}
                className="flex-1 rounded border px-2 py-1 text-xs outline-none kbd" style={{ borderColor: '#d1d1d1' }}
                onKeyDown={(e) => { if (e.key === 'Enter' && newSubtask.trim()) { setSubtasks((p) => [...p, { id: `st-${Date.now()}`, text: newSubtask, estimate: '30m', done: false }]); setNewSubtask(''); } }} />
              <button onClick={() => { if (newSubtask.trim()) { setSubtasks((p) => [...p, { id: `st-${Date.now()}`, text: newSubtask, estimate: '30m', done: false }]); setNewSubtask(''); }}}
                className="btn-hover rounded px-2 py-1 text-xs font-medium kbd" style={{ backgroundColor: '#5b5fc7', color: '#fff', border: 'none', cursor: 'pointer' }}>+</button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}


/* ═══════════════════ TAB: ACTIVITY ═══════════════════ */

const ACTIVITY_ICON_MAP: Record<string, { icon: typeof GitCommit; color: string }> = {
  commit: { icon: GitCommit, color: '#616161' },
  'pr-merged': { icon: GitPullRequest, color: '#5b5fc7' },
  'deploy-shipped': { icon: Rocket, color: '#237b4b' },
  'ticket-completed': { icon: CheckCircle2, color: '#92c353' },
  mention: { icon: MessageSquare, color: '#ffaa44' },
  comment: { icon: MessageSquare, color: '#ffaa44' },
  'status-change': { icon: ActivityIcon, color: '#616161' },
};

const ActivityIconComponent = memo(function ActivityIconComponent({ type }: { type: Activity['type'] }) {
  const config = ACTIVITY_ICON_MAP[type];
  if (!config) return <ActivityIcon size={14} color="#616161" />;
  const Icon = config.icon;
  return <Icon size={14} color={config.color} />;
});

function ActivityTab({ project }: { project: Project }) {  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const projectActivities = useMemo(() =>
    activities.filter((a) => a.projectId === project.id),
    [project.id]
  );
  const filters = ['all', 'commits', 'tasks', 'comments', 'deployments'];

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'all') return projectActivities;
    return projectActivities.filter((a) => {
      if (filter === 'commits') return a.type === 'commit';
      if (filter === 'tasks') return a.type === 'ticket-completed' || a.type === 'status-change';
      if (filter === 'comments') return a.type === 'comment' || a.type === 'mention';
      if (filter === 'deployments') return a.type === 'deploy-shipped';
      return true;
    });
  }, [filter, projectActivities]);

  if (isLoading) return <LoadingState count={4} />;

  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      {/* Filter Pills */}
      <div className="flex gap-2" role="tablist" aria-label="Activity filter">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            role="tab"
            aria-selected={filter === f}
            tabIndex={filter === f ? 0 : -1}
            className="btn-hover cursor-pointer rounded-full px-3 py-1 font-medium capitalize kbd"
            style={{
              fontSize: 12,
              backgroundColor: filter === f ? '#5b5fc7' : '#f0f0f0',
              color: filter === f ? '#ffffff' : '#616161',
              border: 'none',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((act, i) => {
            const actor = getEmployeeById(act.actorId);
            return (
              <motion.div
                key={act.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="hover-lift">
                  <div className="flex items-center gap-3">
                    {actor && (
                      <Avatar
                        src={actor.avatar}
                        alt={actor.name}
                        size="sm"
                        isAi={actor.kind === 'ai'}
                      />
                    )}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#f5f5f5' }}>
                      <ActivityIconComponent type={act.type} />
                    </div>
                    <div className="flex-1">
                      <p style={{ fontSize: 13, color: '#242424' }}>
                        <span style={{ fontWeight: 600 }}>{actor?.name}</span>{' '}
                        {act.message.replace(/^\w+\s/, '')}
                      </p>
                      <p style={{ fontSize: 11, color: '#767676' }}>
                        {new Date(act.timestamp).toLocaleDateString()} · {act.targetName}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })
        ) : (
          <EmptyState
            icon={<ActivityIcon size={24} color="#a0a0a0" />}
            title="No activity yet"
              description={activityFilter === 'all' ? 'Activity will appear here as the team works.' : "No activity matching the selected filter"}
          />
        )}
      </div>
    </div>
  );
}

/* ═══════════════════ TAB: TASKS ═══════════════════ */
function TasksTab({ project }: { project: Project }) {  const [sortBy, setSortBy] = useState('key');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const taskCount = project.tickets.filter((t) => t.type !== 'bug').length;

  const sorted = useMemo(() => {
    return [...project.tickets]
      .sort((a, b) => {
        if (sortBy === 'key') return a.key.localeCompare(b.key);
        if (sortBy === 'priority') {
          const order = { critical: 0, high: 1, medium: 2, low: 3 };
          return (order[a.priority as keyof typeof order] ?? 99) - (order[b.priority as keyof typeof order] ?? 99);
        }
        if (sortBy === 'status') {
          const order = { 'in-progress': 0, review: 1, todo: 2, done: 3 };
          return (order[a.status as keyof typeof order] ?? 99) - (order[b.status as keyof typeof order] ?? 99);
        }
        return 0;
      });
  }, [project.tickets, sortBy]);

  return (
    <div className="relative flex gap-4">
      <div className="min-w-0 flex-1 space-y-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 12, color: '#616161' }}>{'Sort by:'}</span>
          {['key', 'priority', 'status'].map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className="btn-hover cursor-pointer rounded px-2 py-0.5 capitalize kbd"
              style={{
                fontSize: 12,
                backgroundColor: sortBy === s ? '#e8eaf6' : 'transparent',
                color: sortBy === s ? '#5b5fc7' : '#616161',
                border: 'none',
                fontWeight: sortBy === s ? 600 : 400,
              }}
              aria-label={`Sort by ${s}`}
              aria-pressed={sortBy === s}
            >
              {s}
            </button>
          ))}
          <span className="ml-auto" style={{ fontSize: 11, color: '#767676' }}>
            {taskCount} task{taskCount !== 1 ? 's' : ''} ({sorted.length - taskCount} bugs)
          </span>
        </div>

        {/* Empty state */}
        {sorted.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={24} color="#a0a0a0" />}
            title="No tickets found"
            message="All clear — no tickets in this project."
          />
        ) : (
          /* Table */
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" style={{ fontSize: 13 }} role="grid">
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e1e1e1' }}>
                    {['Key', 'Title', 'Type', 'Status', 'Priority', 'Assignee', 'Est.', 'Labels'].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 py-2 text-left font-semibold"
                          style={{ fontSize: 11, color: '#616161', whiteSpace: 'nowrap' }}
                          scope="col"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((ticket) => {
                    const assignee = ticket.assigneeId
                      ? getEmployeeById(ticket.assigneeId)
                      : null;
                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        className="cursor-pointer table-row-hover kbd"
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor:
                            selectedTicket?.id === ticket.id ? '#e8eaf6' : 'transparent',
                        }}
                        role="row"
                        tabIndex={0}
                        aria-selected={selectedTicket?.id === ticket.id}
                        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTicket(ticket); } }}
                        onMouseEnter={(e) => {
                          if (selectedTicket?.id !== ticket.id)
                            e.currentTarget.style.backgroundColor = '#f5f5f5';
                        }}
                        onMouseLeave={(e) => {
                          if (selectedTicket?.id !== ticket.id)
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <td className="px-3 py-2 font-medium" style={{ color: '#5b5fc7', whiteSpace: 'nowrap' }} role="gridcell">
                          {ticket.key}
                        </td>
                        <td className="px-3 py-2" style={{ color: '#242424', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} role="gridcell">
                          {ticket.title}
                        </td>
                        <td className="px-3 py-2" role="gridcell">
                          <span
                            className="rounded px-1.5 py-0.5 font-semibold capitalize"
                            style={{ fontSize: 10, backgroundColor: '#f0f0f0', color: '#616161' }}
                          >
                            {ticket.type}
                          </span>
                        </td>
                        <td className="px-3 py-2" role="gridcell">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="rounded-full"
                              style={{
                                width: 8,
                                height: 8,
                                backgroundColor: statusColor(ticket.status),
                              }}
                              aria-hidden="true"
                            />
                            <span style={{ color: '#616161' }}>{ticket.status}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2" role="gridcell">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="rounded-full"
                              style={{
                                width: 8,
                                height: 8,
                                backgroundColor: priorityColor(ticket.priority),
                              }}
                              aria-hidden="true"
                            />
                            <span style={{ color: '#616161' }}>{ticket.priority}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2" role="gridcell">
                          {assignee && (
                            <InfoTooltip text={assignee.name}>
                              <Avatar
                                src={assignee.avatar}
                                alt={assignee.name}
                                size="xs"
                                isAi={assignee.kind === 'ai'}
                              />
                            </InfoTooltip>
                          )}
                        </td>
                        <td className="px-3 py-2" style={{ color: '#616161', textAlign: 'center' }} role="gridcell">
                          {ticket.estimate}
                        </td>
                        <td className="px-3 py-2" role="gridcell">
                          <div className="flex gap-1">
                            {ticket.labels.slice(0, 2).map((l) => (
                              <span
                                key={l}
                                className="rounded px-1.5 py-0.5"
                                style={{ fontSize: 10, backgroundColor: '#e8eaf6', color: '#5b5fc7' }}
                              >
                                {l}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Right Rail: Ticket Detail */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0"
            style={{
              width: 280,
              borderLeft: '1px solid #e1e1e1',
              paddingLeft: 16,
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: '#616161' }}>{'Task Detail'}</span>
              <InfoTooltip text="Close detail panel">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="btn-hover cursor-pointer rounded p-1 kbd"
                  style={{ background: 'none', border: 'none' }}
                  aria-label="Close task detail"
                >
                  <X size={14} color="#616161" />
                </button>
              </InfoTooltip>
            </div>
            <TicketDetailPanel ticket={selectedTicket} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const TicketDetailPanel = memo(function TicketDetailPanel({ ticket }: { ticket: Ticket }) {
  const { assignee, reporter } = useMemo(() => ({
    assignee: ticket.assigneeId ? getEmployeeById(ticket.assigneeId) : null,
    reporter: getEmployeeById(ticket.reporterId),
  }), [ticket.assigneeId, ticket.reporterId]);

  return (
    <div className="space-y-4">
      <div>
        <span
          className="rounded px-1.5 py-0.5 font-semibold"
          style={{ fontSize: 11, backgroundColor: '#f0f0f0', color: '#616161' }}
        >
          {ticket.key}
        </span>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginTop: 8 }}>
          {ticket.title}
        </h3>
      </div>

      <div style={{ borderTop: '1px solid #e1e1e1', paddingTop: 12 }}>
        <div className="mb-3 flex items-center gap-2">
          <span style={{ fontSize: 11, color: '#616161', width: 60 }}>{'Assignee'}</span>
          {assignee && (
            <div className="flex items-center gap-1.5">
              <Avatar src={assignee.avatar} alt={assignee.name} size="xs" isAi={assignee.kind === 'ai'} />
              <span style={{ fontSize: 13, color: '#242424' }}>{assignee.name}</span>
            </div>
          )}
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span style={{ fontSize: 11, color: '#616161', width: 60 }}>{'Reporter'}</span>
          {reporter && (
            <div className="flex items-center gap-1.5">
              <Avatar src={reporter.avatar} alt={reporter.name} size="xs" isAi={reporter.kind === 'ai'} />
              <span style={{ fontSize: 13, color: '#242424' }}>{reporter.name}</span>
            </div>
          )}
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span style={{ fontSize: 11, color: '#616161', width: 60 }}>{'Status'}</span>
          <StatusChip status={ticket.status === 'in-progress' ? 'ai-active' : healthToStatus('green')} label={ticket.status} />
        </div>
        <div className="mb-3 flex items-center gap-2">
          <span style={{ fontSize: 11, color: '#616161', width: 60 }}>{'Priority'}</span>
          <div className="flex items-center gap-1.5">
            <div
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: priorityColor(ticket.priority),
              }}
            />
            <span style={{ fontSize: 13, color: '#242424' }}>{ticket.priority}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 11, color: '#616161', width: 60 }}>{'Estimate'}</span>
          <span style={{ fontSize: 13, color: '#242424' }}>{ticket.estimate} {'story points'}</span>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e1e1e1', paddingTop: 12 }}>
        <span style={{ fontSize: 11, color: '#616161', display: 'block', marginBottom: 6 }}>{'Labels'}</span>
        <div className="flex flex-wrap gap-1">
          {ticket.labels.map((l) => (
            <span
              key={l}
              className="rounded px-2 py-0.5 font-semibold"
              style={{ fontSize: 11, backgroundColor: '#e8eaf6', color: '#5b5fc7' }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════ TAB: BUGS ═══════════════════ */
function BugsTab({ project }: { project: Project }) {  const bugs = project.tickets.filter((t) => t.type === 'bug');
  const critical = bugs.filter((b) => b.priority === 'critical').length;
  const open = bugs.filter((b) => b.status !== 'done').length;
  const openCreateBug = useStore((s) => s.openCreateBug);

  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      <div className="flex items-center justify-between">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{'Bug Tracker'}</h3>
        <button onClick={() => openCreateBug(project.id)} className="btn-hover flex items-center gap-1 rounded px-3 py-2.5 text-xs font-medium text-white kbd" style={{backgroundColor: '#c4314b', border: 'none', cursor: 'pointer'}}>
          <Bug size={12} /> {'Report Bug'}
        </button>
      </div>
      {/* Summary */}
      <div className="flex gap-4">
        <Card className="flex-1 text-center">
          <p style={{ fontSize: 24, fontWeight: 600, color: '#242424' }}>{open}</p>
            <p style={{ fontSize: 11, color: '#616161' }}>{'Open bug'}{open !== 1 ? 's' : ''}</p>
        </Card>
        <Card className="flex-1 text-center">
          <p style={{ fontSize: 24, fontWeight: 600, color: '#c4314b' }}>{critical}</p>
          <p style={{ fontSize: 11, color: '#616161' }}>{'Critical'}</p>
        </Card>
        <Card className="flex-1 text-center">
          <p style={{ fontSize: 24, fontWeight: 600, color: '#237b4b' }}>
            {bugs.filter((b) => b.status === 'done').length}
          </p>
          <p style={{ fontSize: 11, color: '#616161' }}>{'Resolved'}</p>
        </Card>
      </div>

      {bugs.length === 0 ? (
        <EmptyState icon={<CheckCircle2 size={24} color="#92c353" />} title="No bugs found" message="Bug-free zone! Keep up the good work." />
      ) : (
        /* Bug Table */
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e1e1e1' }}>
                  {['Key', 'Title', 'Severity', 'Status', 'Assignee'].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-2 text-left font-semibold"
                      style={{ fontSize: 11, color: '#616161' }}
                      scope="col"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bugs.map((bug) => {
                  const assignee = bug.assigneeId
                    ? getEmployeeById(bug.assigneeId)
                    : null;
                  return (
                    <tr
                      key={bug.id}
                      className="table-row-hover"
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                    >
                      <td className="px-3 py-2 font-medium" style={{ color: '#5b5fc7' }}>
                        {bug.key}
                      </td>
                      <td className="px-3 py-2" style={{ color: '#242424', maxWidth: 300 }}>
                        {bug.title}
                      </td>
                      <td className="px-3 py-2">
                        <StatusChip
                          status={
                            bug.priority === 'critical'
                              ? 'busy'
                              : bug.priority === 'high'
                                ? 'away'
                                : 'online'
                          }
                          label={bug.priority}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="rounded-full"
                            style={{
                              width: 8,
                              height: 8,
                              backgroundColor: statusColor(bug.status),
                            }}
                          />
                          <span style={{ color: '#616161' }}>{bug.status}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        {assignee && (
                          <InfoTooltip text={assignee.name}>
                            <Avatar
                              src={assignee.avatar}
                              alt={assignee.name}
                              size="xs"
                              isAi={assignee.kind === 'ai'}
                            />
                          </InfoTooltip>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}


/* ═══════════════════ TAB: FILES ═══════════════════ */
function FilesTab() {
  const files = [
    { name: 'Product Requirements.pdf', size: '2.4 MB', type: 'pdf', date: 'Apr 28, 2025', authorId: 'emp-alex' },
    { name: 'Architecture Diagram.png', size: '1.8 MB', type: 'image', date: 'Apr 25, 2025', authorId: 'emp-sage' },
    { name: 'API Specification.md', size: '48 KB', type: 'code', date: 'Apr 30, 2025', authorId: 'emp-aria' },
    { name: 'Design System.fig', size: '12 MB', type: 'design', date: 'Apr 20, 2025', authorId: 'emp-pixel' },
    { name: 'Sprint 12 Retrospective.md', size: '8 KB', type: 'doc', date: 'May 1, 2025', authorId: 'emp-maya' },
    { name: 'Load Test Results.xlsx', size: '156 KB', type: 'sheet', date: 'Apr 29, 2025', authorId: 'emp-echo' },
  ];

  const fileIconConfig = useMemo(() => ({
    pdf: { Icon: FileText, color: '#c4314b' },
    image: { Icon: Image, color: '#5b5fc7' },
    code: { Icon: FileCode, color: '#237b4b' },
    design: { Icon: Sparkles, color: '#ffaa44' },
    sheet: { Icon: TableIcon, color: '#237b4b' },
  } as Record<string, { Icon: typeof FileText; color: string }>), []);

  const FileIconComponent = memo(function FileIconComponent({ type }: { type: string }) {
    const config = fileIconConfig[type] || { Icon: File, color: '#616161' };
    const Icon = config.Icon;
    return <Icon size={16} color={config.color} />;
  });

  return (
    <div className="mx-auto max-w-[800px]">
      <Card padding="none" className="overflow-hidden">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e1e1e1' }}>
              {['Name', 'Size', 'Modified', 'Uploaded by'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-semibold" style={{ fontSize: 11, color: '#616161' }} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {files.map((f, i) => {
              const author = getEmployeeById(f.authorId);
              return (
                <tr key={i} className="table-row-hover" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileIconComponent type={f.type} />
                      <span style={{ color: '#242424' }}>{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3" style={{ color: '#616161' }}>{f.size}</td>
                  <td className="px-4 py-3" style={{ color: '#616161' }}>{f.date}</td>
                  <td className="px-4 py-3">
                    {author && (
                      <InfoTooltip text={author.name}>
                        <Avatar src={author.avatar} alt={author.name} size="xs" isAi={author.kind === 'ai'} />
                      </InfoTooltip>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ═══════════════════ TAB: MEMBERS ═══════════════════ */
function MembersTab({ project }: { project: Project }) {
  return (
    <div className="mx-auto max-w-[800px]">
      {project.memberIds.length === 0 ? (
        <EmptyState icon={<Users size={24} color="#a0a0a0" />} title="No team members" message="Add members to this project to see them here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {project.memberIds.map((id) => {
            const emp = getEmployeeById(id);
            if (!emp) return null;
            const assignedTickets = allTickets.filter(
              (t) => t.assigneeId === id && t.projectId === project.id
            );
            const completed = assignedTickets.filter((t) => t.status === 'done').length;
            const workloadPct = assignedTickets.length > 0 ? Math.round((completed / assignedTickets.length) * 100) : 0;

            return (
              <Card key={id} className="hover-lift">
                <div className="flex items-start gap-3">
                  <Avatar src={emp.avatar} alt={emp.name} size="lg" isAi={emp.kind === 'ai'} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
                        {emp.name}
                      </h4>
                      {emp.kind === 'ai' && (
                        <span
                          className="rounded px-1 py-0.5 font-bold text-white"
                          style={{ fontSize: 9, backgroundColor: '#5b5fc7' }}
                        >
                          AI
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#616161' }}>{emp.title}</p>
                    <div className="mt-2 flex items-center gap-1">
                      {emp.modelBinding && (
                        <span style={{ fontSize: 10, color: '#767676' }}>
                          {emp.modelBinding.provider} · {emp.modelBinding.model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3" style={{ borderTop: '1px solid #e1e1e1', paddingTop: 8 }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: '#616161' }}>Workload</span>
                    <span style={{ fontSize: 11, color: '#242424' }}>
                      {completed}/{assignedTickets.length} task{assignedTickets.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div
                    className="w-full overflow-hidden rounded-full"
                    style={{ height: 6, backgroundColor: '#f0f0f0' }}
                  >
                    <div
                      className="progress-bar-animated h-full rounded-full"
                      style={{
                        width: `${workloadPct}%`,
                        backgroundColor: '#5b5fc7',
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ TAB: SPRINTS ═══════════════════ */
function SprintsTab({ project }: { project: Project }) {
  const [expandedSprint, setExpandedSprint] = useState<string | null>(
    project.sprints.find((s) => s.status === 'active')?.id ?? null
  );

  if (project.sprints.length === 0) {
    return (
      <EmptyState
        icon={<Calendar size={24} color="#a0a0a0" />}
        title="No sprints yet"
        message="Create a sprint to start tracking work."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[800px] space-y-4">
      {project.sprints.map((sprint) => (
        <Card key={sprint.id} className="hover-lift">
          <div
            className="flex cursor-pointer items-center justify-between kbd"
            onClick={() =>
              setExpandedSprint(expandedSprint === sprint.id ? null : sprint.id)
            }
            tabIndex={0}
            role="button"
            aria-expanded={expandedSprint === sprint.id}
            onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedSprint(expandedSprint === sprint.id ? null : sprint.id); } }}
          >
            <div className="flex items-center gap-3">
              <div
                className="rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor:
                    sprint.status === 'active'
                      ? '#5b5fc7'
                      : sprint.status === 'completed'
                        ? '#92c353'
                        : '#d1d1d1',
                }}
                aria-label={`Sprint ${sprint.status}`}
              />
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
                  {sprint.name}
                </h4>
                <p style={{ fontSize: 11, color: '#616161' }}>
                  {sprint.startDate} — {sprint.endDate}
                </p>
              </div>
              {sprint.status === 'active' && (
                <StatusChip status="ai-active" label="Active" />
              )}
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 12, color: '#616161' }}>
                {sprint.velocity} pts
              </span>
              <ChevronRight
                size={14}
                color="#a0a0a0"
                style={{
                  transform: expandedSprint === sprint.id ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms',
                }}
                aria-hidden="true"
              />
            </div>
          </div>

          <AnimatePresence>
            {expandedSprint === sprint.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div style={{ paddingTop: 16 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#616161',
                      marginBottom: 8,
                      fontStyle: 'italic',
                    }}
                  >
                    Goal: {sprint.goal}
                  </p>
                  {sprint.burndown.length > 0 ? (
                    <div style={{ height: 160 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sprint.burndown}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#616161' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#616161' }} />
                          <RechartsTooltip
                            contentStyle={{
                              fontSize: 11,
                              borderRadius: 6,
                              border: '1px solid #d1d1d1',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="ideal"
                            stroke="#dbeafe"
                            fill="#dbeafe"
                            strokeWidth={2}
                            name="Ideal"
                          />
                          <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#5b5fc7"
                            fill="rgba(91,95,199,0.1)"
                            strokeWidth={2}
                            name="Actual"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyState icon={<ActivityIcon size={16} color="#a0a0a0" />} title="No burndown data" message="Start the sprint to see burndown data." />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      ))}
    </div>
  );
}


/* ═══════════════════ TAB: BUDGET ═══════════════════ */
function BudgetTab({ project }: { project: Project }) {
  // Budget breakdown with precise math to ensure line items sum to displayed total
  const engineeringSpent = Math.round(project.budgetSpent * 0.52);
  const designSpent = Math.round(project.budgetSpent * 0.27);
  const infraSpent = Math.round(project.budgetSpent * 0.15);
  const qaSpent = project.budgetSpent - engineeringSpent - designSpent - infraSpent; // Exact remainder
  const categories = [
    { name: 'Engineering', budget: Math.round(project.budgetTotal * 0.5), spent: engineeringSpent },
    { name: 'Design', budget: Math.round(project.budgetTotal * 0.2), spent: designSpent },
    { name: 'Infrastructure', budget: Math.round(project.budgetTotal * 0.2), spent: infraSpent },
    { name: 'QA', budget: Math.round(project.budgetTotal * 0.1), spent: qaSpent },
  ];
  // Verify: categories sum to budgetTotal
  const totalBudgeted = categories.reduce((s, c) => s + c.budget, 0);
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  // Display total must equal the sum of displayed line-item values (to avoid rounding mismatch)
  const displayTotalK = categories.reduce((sum, c) => sum + Math.round(c.spent / 100) / 10, 0);

  return (
    <div className="mx-auto max-w-[800px] space-y-5">
      {/* Summary */}
      <Card className="text-center">
        <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Budget Utilization</p>
        <p style={{ fontSize: 32, fontWeight: 600, color: '#242424' }}>
          ${displayTotalK.toFixed(1)}K
          <span style={{ fontSize: 16, color: '#616161' }}>
            {' '}
            / ${(totalBudgeted / 1000).toFixed(0)}K
          </span>
        </p>
        <div className="mx-auto mt-2 w-full max-w-[300px] overflow-hidden rounded-full" style={{ height: 12, backgroundColor: '#f0f0f0' }}>
          <div
            className="progress-bar-animated h-full rounded-full"
            style={{
              width: `${Math.round((totalSpent / Math.max(totalBudgeted, 1)) * 100)}%`,
              backgroundColor: '#5b5fc7',
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: '#616161', marginTop: 4 }}>
          {categories.map((c, i) => `${c.name}: $${(c.spent / 1000).toFixed(1)}K${i < categories.length - 1 ? ' + ' : ''}`)}
          = ${displayTotalK.toFixed(1)}K
        </p>
      </Card>

      {/* Breakdown Table */}
      <Card padding="none" className="overflow-hidden">
        <table className="w-full" style={{ fontSize: 13 }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e1e1e1' }}>
              {['Category', 'Budgeted', 'Spent', 'Remaining', 'Used'].map((h) => (
                <th key={h} className="px-4 py-2 text-left font-semibold" style={{ fontSize: 11, color: '#616161' }} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => {
              const pct = Math.round((cat.spent / Math.max(cat.budget, 1)) * 100);
              const remaining = cat.budget - cat.spent;
              return (
                <tr key={cat.name} className="table-row-hover" style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td className="px-4 py-3 font-medium" style={{ color: '#242424' }}>{cat.name}</td>
                  <td className="px-4 py-3" style={{ color: '#616161' }}>
                    ${(cat.budget / 1000).toFixed(1)}K
                  </td>
                  <td className="px-4 py-3" style={{ color: '#616161' }}>
                    ${(cat.spent / 1000).toFixed(1)}K
                  </td>
                  <td className="px-4 py-3" style={{ color: '#616161' }}>
                    ${(remaining / 1000).toFixed(1)}K
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-full overflow-hidden rounded-full" style={{ height: 6, maxWidth: 80, backgroundColor: '#f0f0f0' }}>
                        <div
                          className="progress-bar-animated h-full rounded-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: pct > 90 ? '#c4314b' : pct > 75 ? '#ffaa44' : '#92c353',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 11, color: '#616161' }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* AI Insight */}
      <Card>
        <div className="flex items-center gap-2">
          <Sparkles size={14} color="#5b5fc7" />
          <span style={{ fontSize: 13, color: '#9E4A28' }}>
            At current spend rate, you&apos;ll finish{' '}
            <strong>{totalSpent < totalBudgeted * 0.9 ? '8% under budget' : 'on budget'}</strong> — reallocate Design surplus to
            Engineering buffer.
          </span>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════ TAB: RISKS ═══════════════════ */
function RisksTab({ project }: { project: Project }) {
  const severityColor = (s: string) =>
    s === 'critical' || s === 'high'
      ? '#c4314b'
      : s === 'medium'
        ? '#ffaa44'
        : '#92c353';

  if (project.risks.length === 0) {
    return (
      <div className="mx-auto max-w-[800px]">
        <EmptyState
          icon={<CheckCircle2 size={24} color="#92c353" />}
          title="No active risks"
          message="Smooth sailing! No risks have been identified."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[800px] space-y-3">
      {project.risks.map((risk: ProjectRisk) => {
        const owner = getEmployeeById(risk.ownerId);
        return (
          <Card key={risk.id} className="hover-lift">
            <div className="flex items-start justify-between" style={{ marginBottom: 8 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
                {risk.title}
              </h4>
              <StatusChip
                status={risk.severity === 'high' ? 'busy' : risk.severity === 'medium' ? 'away' : 'online'}
                label={risk.severity}
              />
            </div>
            <p style={{ fontSize: 12, color: '#616161', lineHeight: '18px', marginBottom: 8 }}>
              <strong>Mitigation:</strong> {risk.mitigation}
            </p>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 11, color: '#767676' }}>Owner:</span>
              {owner && (
                <div className="flex items-center gap-1.5">
                  <Avatar src={owner.avatar} alt={owner.name} size="xs" isAi={owner.kind === 'ai'} />
                  <span style={{ fontSize: 12, color: '#242424' }}>{owner.name}</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ═══════════════════ TAB: ROADMAP ═══════════════════ */
function RoadmapTab({ project }: { project: Project }) {
  const swimlanes = ['Backend', 'Frontend', 'Design', 'QA'];
  const timelineMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Mock Gantt data — unique per project
  const ganttItemsByProject: Record<string, { lane: string; name: string; start: number; width: number; color: string }[]> = {
    'proj-tax': [
      { lane: 'Backend', name: 'API Design', start: 0, width: 2, color: '#5b5fc7' },
      { lane: 'Backend', name: 'IRS Integration', start: 2, width: 3, color: '#5b5fc7' },
      { lane: 'Frontend', name: 'Wireframes', start: 0, width: 2, color: '#92c353' },
      { lane: 'Frontend', name: 'Form Wizard', start: 2, width: 3, color: '#92c353' },
      { lane: 'Design', name: 'Design System', start: 0, width: 2, color: '#ffaa44' },
      { lane: 'Design', name: 'UI Polish', start: 4, width: 2, color: '#ffaa44' },
      { lane: 'QA', name: 'Test Planning', start: 1, width: 2, color: '#c4314b' },
      { lane: 'QA', name: 'UAT', start: 4, width: 2, color: '#c4314b' },
    ],
    'proj-mob': [
      { lane: 'Backend', name: 'API Support', start: 1, width: 2, color: '#5b5fc7' },
      { lane: 'Frontend', name: 'Navigation', start: 0, width: 3, color: '#92c353' },
      { lane: 'Frontend', name: 'Dark Mode', start: 2, width: 2, color: '#92c353' },
      { lane: 'Design', name: 'Design Tokens', start: 0, width: 2, color: '#ffaa44' },
      { lane: 'Design', name: 'Accessibility', start: 2, width: 3, color: '#ffaa44' },
      { lane: 'QA', name: 'A11y Audit', start: 1, width: 3, color: '#c4314b' },
      { lane: 'QA', name: 'Cross-browser', start: 3, width: 2, color: '#c4314b' },
    ],
    'proj-api': [
      { lane: 'Backend', name: 'GraphQL Schema', start: 0, width: 2, color: '#5b5fc7' },
      { lane: 'Backend', name: 'Migration', start: 2, width: 3, color: '#5b5fc7' },
      { lane: 'Backend', name: 'Rate Limiting', start: 1, width: 2, color: '#5b5fc7' },
      { lane: 'Frontend', name: 'Client Update', start: 3, width: 2, color: '#92c353' },
      { lane: 'Design', name: 'API Docs', start: 2, width: 2, color: '#ffaa44' },
      { lane: 'QA', name: 'Load Testing', start: 2, width: 3, color: '#c4314b' },
      { lane: 'QA', name: 'Contract Tests', start: 1, width: 2, color: '#c4314b' },
    ],
  };

  const ganttItems = ganttItemsByProject[project.id] ?? ganttItemsByProject['proj-tax'];

  const milestones = [
    { label: 'MVP', position: 33 },
    { label: 'Beta', position: 60 },
    { label: 'GA', position: 90 },
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-4">
      <Card>
        {/* Month header */}
        <div className="mb-4 flex" style={{ paddingLeft: 100 }}>
          {timelineMonths.map((m) => (
            <div
              key={m}
              className="flex-1 text-center"
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#616161',
                borderLeft: '1px solid #e1e1e1',
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Swimlanes */}
        <div className="space-y-3">
          {swimlanes.map((lane) => (
            <div key={lane} className="flex items-center">
              <div
                className="flex-shrink-0 font-semibold"
                style={{ width: 100, fontSize: 12, color: '#242424' }}
              >
                {lane}
              </div>
              <div className="relative flex-1" style={{ height: 32 }}>
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {timelineMonths.map((_, i) => (
                    <div
                      key={i}
                      className="flex-1"
                      style={{ borderLeft: '1px solid #f0f0f0' }}
                    />
                  ))}
                </div>
                {/* Bars */}
                {ganttItems
                  .filter((g) => g.lane === lane)
                  .map((g, i) => (
                    <div
                      key={i}
                      className="absolute rounded"
                      style={{
                        left: `${(g.start / 6) * 100}%`,
                        width: `${(g.width / 6) * 100}%`,
                        top: 4,
                        bottom: 4,
                        backgroundColor: g.color,
                        opacity: 0.85,
                        fontSize: 10,
                        color: '#ffffff',
                        padding: '2px 6px',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={g.name}
                    >
                      {g.name}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div className="relative mt-4" style={{ paddingLeft: 100, height: 24 }}>
          {milestones.map((m) => (
            <div
              key={m.label}
              className="absolute top-0"
              style={{ left: `${100 + m.position * 0.01 * (100 - 15)}px` }}
            >
              <div
                className="flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold"
                style={{ fontSize: 10, backgroundColor: '#e8eaf6', color: '#5b5fc7' }}
              >
                <Sparkles size={8} />
                {m.label}
              </div>
            </div>
          ))}
          {/* Today marker */}
          <div
            className="absolute top-0"
            style={{ left: `${100 + 55}%`, height: '100%', borderLeft: '2px dashed #c4314b' }}
          >
            <span
              className="absolute -top-1 rounded px-1 font-semibold"
              style={{ fontSize: 9, backgroundColor: '#c4314b', color: '#fff' }}
            >
              TODAY
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}


/* ═══════════════════ TAB: QA ═══════════════════ */
function QATab({ project }: { project: Project }) {
  // Test suites with project-specific data
  const testSuitesByProject: Record<string, { name: string; total: number; passed: number; failed: number; skipped: number; status: 'passing' | 'flaky' }[]> = {
    'proj-tax': [
      { name: 'Unit Tests', total: 142, passed: 138, failed: 2, skipped: 2, status: 'passing' },
      { name: 'Integration Tests', total: 48, passed: 42, failed: 4, skipped: 2, status: 'flaky' },
      { name: 'E2E Tests', total: 24, passed: 18, failed: 4, skipped: 2, status: 'flaky' },
      { name: 'Accessibility', total: 16, passed: 16, failed: 0, skipped: 0, status: 'passing' },
      { name: 'Performance', total: 8, passed: 6, failed: 1, skipped: 1, status: 'flaky' },
      { name: 'Security Scan', total: 12, passed: 12, failed: 0, skipped: 0, status: 'passing' },
    ],
    'proj-mob': [
      { name: 'Unit Tests', total: 86, passed: 82, failed: 2, skipped: 2, status: 'passing' },
      { name: 'Visual Regression', total: 32, passed: 28, failed: 2, skipped: 2, status: 'flaky' },
      { name: 'E2E Tests', total: 18, passed: 14, failed: 3, skipped: 1, status: 'flaky' },
      { name: 'Accessibility', total: 24, passed: 20, failed: 4, skipped: 0, status: 'flaky' },
      { name: 'Performance', total: 6, passed: 5, failed: 0, skipped: 1, status: 'passing' },
      { name: 'Security Scan', total: 8, passed: 8, failed: 0, skipped: 0, status: 'passing' },
    ],
    'proj-api': [
      { name: 'Unit Tests', total: 124, passed: 120, failed: 2, skipped: 2, status: 'passing' },
      { name: 'Contract Tests', total: 36, passed: 34, failed: 1, skipped: 1, status: 'passing' },
      { name: 'Load Tests', total: 12, passed: 9, failed: 2, skipped: 1, status: 'flaky' },
      { name: 'Security Scan', total: 10, passed: 10, failed: 0, skipped: 0, status: 'passing' },
      { name: 'Performance', total: 8, passed: 6, failed: 1, skipped: 1, status: 'flaky' },
      { name: 'Schema Tests', total: 20, passed: 20, failed: 0, skipped: 0, status: 'passing' },
    ],
  };

  const testSuites = testSuitesByProject[project.id] ?? testSuitesByProject['proj-tax'];

  // Calculate overall pass rate from test suites (aggregate of passed/total across all suites)
  const totalTestsAll = testSuites.reduce((s, suite) => s + suite.total, 0);
  const totalPassedAll = testSuites.reduce((s, suite) => s + suite.passed, 0);
  const passRate = totalTestsAll > 0 ? Math.round((totalPassedAll / totalTestsAll) * 100) : 0;

  // Calculate test cases from test-related tickets
  const testTickets = project.tickets.filter((t) =>
    t.labels?.some((l) => l.toLowerCase().includes('test') || l.toLowerCase().includes('qa'))
  );
  const doneTests = testTickets.filter((t) => t.status === 'done').length;
  const totalTestTickets = testTickets.length || 1;

  const regressions = [
    { id: 'REG-001', name: 'Sprint 13 Full Regression', status: 'completed' as const, date: '2025-04-20', coverage: '94%', blocker: 'None' },
    { id: 'REG-002', name: 'Payment Flow Regression', status: 'in-progress' as const, date: '2025-04-28', coverage: '78%', blocker: 'API latency issue' },
    { id: 'REG-003', name: 'Auth Flow Regression', status: 'scheduled' as const, date: '2025-04-30', coverage: '-', blocker: '-' },
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {/* QA KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Test Pass Rate</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: passRate >= 80 ? '#237b4b' : '#b56200' }}>{passRate}%</p>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Test Cases</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#242424' }}>{totalTestsAll}</p>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Coverage</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#5b5fc7' }}>87%</p>
        </Card>
        <Card className="text-center">
          <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Open Bugs</p>
          <p style={{ fontSize: 28, fontWeight: 600, color: '#c4314b' }}>{project.tickets.filter((t) => t.type === 'bug' && t.status !== 'done').length}</p>
        </Card>
      </div>

      {/* Test Suites */}
      <Card>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Test Suites</h3>
          <button onClick={() => showToast('success', 'Run all test suites')} className="btn-hover flex items-center gap-1 rounded px-3 text-white kbd" style={{ fontSize: 12, height: 28, backgroundColor: '#5b5fc7', border: 'none', cursor: 'pointer' }} aria-label="Run all test suites">
            <Zap size={12} /> Run All
          </button>
        </div>
        <div className="space-y-3">
          {testSuites.map((suite) => {
            const suitePassPct = Math.round((suite.passed / suite.total) * 100);
            return (
              <div key={suite.name} className="flex items-center gap-4 rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#242424' }}>{suite.name}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                      backgroundColor: suite.status === 'passing' ? '#dcfce7' : '#fef3c7',
                      color: suite.status === 'passing' ? '#237b4b' : '#b56200',
                    }}>
                      {suite.status === 'passing' ? 'Passing' : 'Flaky'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4">
                    <span style={{ fontSize: 12, color: '#237b4b' }}>{suite.passed} passed</span>
                    {suite.failed > 0 && <span style={{ fontSize: 12, color: '#c4314b' }}>{suite.failed} failed</span>}
                    {suite.skipped > 0 && <span style={{ fontSize: 12, color: '#b56200' }}>{suite.skipped} skipped</span>}
                    <span style={{ fontSize: 12, color: '#616161' }}>of {suite.total}</span>
                  </div>
                </div>
                <div className="w-24">
                  <div className="w-full overflow-hidden rounded-full" style={{ height: 8, backgroundColor: '#e1e1e1' }}>
                    <div className="progress-bar-animated h-full rounded-full" style={{ width: `${suitePassPct}%`, backgroundColor: suite.status === 'passing' ? '#92c353' : '#ffaa44' }} />
                  </div>
                  <p className="mt-1 text-right" style={{ fontSize: 11, fontWeight: 600, color: '#242424' }}>{suitePassPct}%</p>
                </div>
                <button onClick={() => showToast(`Running ${suite.name}...`, 'info')} className="btn-hover cursor-pointer rounded px-2 py-2 kbd" style={{fontSize: 11, border: '1px solid #d1d1d1', background: '#fff', color: '#616161'}}>
                  Run
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Regression Cycles */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 16 }}>Regression Cycles</h3>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
              {['ID', 'Name', 'Status', 'Date', 'Coverage', 'Blockers', ''].map((h) => (
                <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {regressions.map((reg) => (
              <tr key={reg.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{reg.id}</td>
                <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontWeight: 500 }}>{reg.name}</td>
                <td style={{ padding: '8px' }}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                    backgroundColor: reg.status === 'completed' ? '#dcfce7' : reg.status === 'in-progress' ? '#dbeafe' : '#f0f0f0',
                    color: reg.status === 'completed' ? '#237b4b' : reg.status === 'in-progress' ? '#5b5fc7' : '#616161',
                  }}>
                    {reg.status}
                  </span>
                </td>
                <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{reg.date}</td>
                <td style={{ padding: '8px', fontSize: 12, color: '#242424', fontWeight: 500 }}>{reg.coverage}</td>
                <td style={{ padding: '8px', fontSize: 12, color: reg.blocker !== '-' ? '#c4314b' : '#616161' }}>{reg.blocker}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => showToast('info', '')} className="btn-hover cursor-pointer kbd" style={{ fontSize: 11, color: '#5b5fc7', border: 'none', background: 'transparent' }} aria-label={`View ${reg.name}`}>View →</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Bug Trend */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Bug Trend</h3>
        <div style={{ height: 180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[
              { week: 'W1', found: 8, fixed: 5 },
              { week: 'W2', found: 12, fixed: 10 },
              { week: 'W3', found: 6, fixed: 8 },
              { week: 'W4', found: 4, fixed: 6 },
              { week: 'W5', found: 9, fixed: 7 },
              { week: 'W6', found: 3, fixed: 5 },
              { week: 'W7', found: 2, fixed: 3 },
              { week: 'W8', found: 1, fixed: 2 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <RechartsTooltip />
              <Legend />
              <Area type="monotone" dataKey="found" stroke="#c4314b" fill="#fee2e2" name="Found" />
              <Area type="monotone" dataKey="fixed" stroke="#237b4b" fill="#dcfce7" name="Fixed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════ TAB: DEVOPS ═══════════════════ */
function DevOpsTab({ project }: { project: Project }) {
  const [activeEnv, setActiveEnv] = useState('staging');

  // Per-project deployment data
  const deploymentsByProject: Record<string, { id: string; env: string; version: string; status: 'active' | 'rolled-back'; time: string; commit: string; deployer: string }[]> = {
    'proj-tax': [
      { id: 'dep-001', env: 'production', version: 'v2.4.1', status: 'active', time: '2h ago', commit: 'a3f7d2e', deployer: 'Echo' },
      { id: 'dep-002', env: 'staging', version: 'v2.4.2-rc', status: 'active', time: '15m ago', commit: 'b8e1c4f', deployer: 'Echo' },
      { id: 'dep-003', env: 'production', version: 'v2.4.0', status: 'rolled-back', time: '1d ago', commit: 'c9d2e1a', deployer: 'Sage' },
    ],
    'proj-mob': [
      { id: 'dep-mob-1', env: 'production', version: 'v3.1.0', status: 'active', time: '5h ago', commit: 'f4a2b1c', deployer: 'Echo' },
      { id: 'dep-mob-2', env: 'staging', version: 'v3.1.1-rc', status: 'active', time: '30m ago', commit: 'e5d3f2a', deployer: 'Raj' },
    ],
    'proj-api': [
      { id: 'dep-api-1', env: 'production', version: 'v4.2.0', status: 'active', time: '8h ago', commit: 'g1h2i3j', deployer: 'Echo' },
      { id: 'dep-api-2', env: 'staging', version: 'v4.2.1-rc', status: 'active', time: '45m ago', commit: 'k4l5m6n', deployer: 'Sage' },
      { id: 'dep-api-3', env: 'production', version: 'v4.1.9', status: 'rolled-back', time: '2d ago', commit: 'o7p8q9r', deployer: 'Echo' },
    ],
  };

  const environmentsByProject: Record<string, { id: string; name: string; url: string; status: 'healthy' | 'degraded'; uptime: string; latency: string; errors: string }[]> = {
    'proj-tax': [
      { id: 'production', name: 'Production', url: 'https://tax.acme.com', status: 'healthy', uptime: '99.97%', latency: '142ms', errors: '0.02%' },
      { id: 'staging', name: 'Staging', url: 'https://tax-staging.acme.com', status: 'healthy', uptime: '99.5%', latency: '189ms', errors: '0.1%' },
      { id: 'development', name: 'Development', url: 'https://tax-dev.acme.com', status: 'degraded', uptime: '95.2%', latency: '450ms', errors: '2.3%' },
    ],
    'proj-mob': [
      { id: 'production', name: 'Production', url: 'https://app.acme.com', status: 'healthy', uptime: '99.91%', latency: '98ms', errors: '0.05%' },
      { id: 'staging', name: 'Staging', url: 'https://app-staging.acme.com', status: 'healthy', uptime: '99.2%', latency: '156ms', errors: '0.3%' },
      { id: 'development', name: 'Development', url: 'https://app-dev.acme.com', status: 'healthy', uptime: '98.5%', latency: '210ms', errors: '0.8%' },
    ],
    'proj-api': [
      { id: 'production', name: 'Production', url: 'https://api.acme.com', status: 'healthy', uptime: '99.99%', latency: '45ms', errors: '0.01%' },
      { id: 'staging', name: 'Staging', url: 'https://api-staging.acme.com', status: 'healthy', uptime: '99.8%', latency: '78ms', errors: '0.05%' },
      { id: 'development', name: 'Development', url: 'https://api-dev.acme.com', status: 'degraded', uptime: '94.1%', latency: '320ms', errors: '1.8%' },
    ],
  };

  const deployments = deploymentsByProject[project.id] ?? deploymentsByProject['proj-tax'];
  const environments = environmentsByProject[project.id] ?? environmentsByProject['proj-tax'];

  const pipelines = [
    { id: 'pipe-1', name: 'CI / Build & Test', status: 'passed' as const, branch: 'main', duration: '4m 32s', stages: [{ name: 'Lint', status: 'passed' }, { name: 'Test', status: 'passed' }, { name: 'Build', status: 'passed' }] },
    { id: 'pipe-2', name: 'CD / Deploy to Staging', status: 'passed' as const, branch: 'main', duration: '2m 18s', stages: [{ name: 'Build', status: 'passed' }, { name: 'Push', status: 'passed' }, { name: 'Verify', status: 'passed' }] },
    { id: 'pipe-3', name: 'CD / Deploy to Production', status: 'pending' as const, branch: 'release/v2.5', duration: '-', stages: [{ name: 'Approval', status: 'pending' }, { name: 'Deploy', status: 'pending' }, { name: 'Verify', status: 'pending' }] },
  ];

  return (
    <div className="mx-auto max-w-[900px] space-y-5">
      {/* Environment selector */}
      <div className="flex gap-2" role="tablist" aria-label="Environment selector">
        {environments.map((env) => (
          <button
            key={env.id}
            onClick={() => setActiveEnv(env.id)}
            role="tab"
            aria-selected={activeEnv === env.id}
            tabIndex={activeEnv === env.id ? 0 : -1}
            className="btn-hover flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 kbd"
            style={{
              borderColor: activeEnv === env.id ? '#5b5fc7' : '#e1e1e1',
              backgroundColor: activeEnv === env.id ? '#f8f8ff' : '#fff',
            }}
          >
            <div className="rounded-full" style={{ width: 8, height: 8, backgroundColor: env.status === 'healthy' ? '#92c353' : '#ffaa44' }} aria-hidden="true" />
            <span style={{ fontSize: 13, fontWeight: activeEnv === env.id ? 600 : 400, color: '#242424' }}>{env.name}</span>
          </button>
        ))}
      </div>

      {/* Environment Health */}
      <div className="grid grid-cols-4 gap-3">
        {environments.filter((e) => e.id === activeEnv).map((env) => (
          <>
            <Card className="text-center">
              <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Uptime</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: env.uptime.startsWith('99') ? '#237b4b' : '#b56200' }}>{env.uptime}</p>
            </Card>
            <Card className="text-center">
              <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Latency (p99)</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: parseInt(env.latency) < 200 ? '#237b4b' : '#b56200' }}>{env.latency}</p>
            </Card>
            <Card className="text-center">
              <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Error Rate</p>
              <p style={{ fontSize: 24, fontWeight: 600, color: parseFloat(env.errors) < 0.1 ? '#237b4b' : '#c4314b' }}>{env.errors}</p>
            </Card>
            <Card className="text-center">
              <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>Status</p>
              <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{
                backgroundColor: env.status === 'healthy' ? '#dcfce7' : '#fef3c7',
                color: env.status === 'healthy' ? '#237b4b' : '#b56200',
              }}>
                {env.status}
              </span>
            </Card>
          </>
        ))}
      </div>

      {/* Deployments */}
      <Card>
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Deployments</h3>
          <button onClick={() => showToast('success', 'Run all test suites')} className="btn-hover flex items-center gap-1 rounded px-3 text-white kbd" style={{ fontSize: 12, height: 28, backgroundColor: '#5b5fc7', border: 'none', cursor: 'pointer' }} aria-label="Deploy to environment">
            <Rocket size={12} /> Deploy
          </button>
        </div>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e1e1e1' }}>
              {['Version', 'Environment', 'Status', 'Commit', 'Deployer', 'Time', ''].map((h) => (
                <th key={h} className="text-left" style={{ padding: '6px 8px', fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase' }} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deployments.map((dep) => (
              <tr key={dep.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '8px', fontSize: 13, color: '#242424', fontWeight: 500 }}>{dep.version}</td>
                <td style={{ padding: '8px' }}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                    backgroundColor: dep.env === 'production' ? '#fee2e2' : '#dbeafe',
                    color: dep.env === 'production' ? '#c4314b' : '#3b82f6',
                  }}>
                    {dep.env}
                  </span>
                </td>
                <td style={{ padding: '8px' }}>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                    backgroundColor: dep.status === 'active' ? '#dcfce7' : '#fee2e2',
                    color: dep.status === 'active' ? '#237b4b' : '#c4314b',
                  }}>
                    {dep.status}
                  </span>
                </td>
                <td style={{ padding: '8px', fontSize: 12, color: '#616161', fontFamily: 'var(--font-mono)' }}>{dep.commit}</td>
                <td style={{ padding: '8px', fontSize: 12, color: '#242424' }}>{dep.deployer}</td>
                <td style={{ padding: '8px', fontSize: 12, color: '#616161' }}>{dep.time}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => showToast('info', '')} className="btn-hover cursor-pointer kbd" style={{ fontSize: 11, color: '#5b5fc7', border: 'none', background: 'transparent' }} aria-label={`View logs for ${dep.version}`}>Logs</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* CI/CD Pipelines */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 16 }}>CI/CD Pipelines</h3>
        <div className="space-y-4">
          {pipelines.map((pipe) => (
            <div key={pipe.id} className="rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#242424' }}>{pipe.name}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{
                    backgroundColor: pipe.status === 'passed' ? '#dcfce7' : '#fef3c7',
                    color: pipe.status === 'passed' ? '#237b4b' : '#b56200',
                  }}>
                    {pipe.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#616161', fontFamily: 'var(--font-mono)' }}>{pipe.branch}</span>
                </div>
                <span style={{ fontSize: 11, color: '#767676' }}>{pipe.duration}</span>
              </div>
              <div className="flex gap-2">
                {pipe.stages.map((stage, idx) => (
                  <div key={stage.name} className="flex flex-1 items-center gap-2">
                    <div className="rounded-full" style={{ width: 10, height: 10, backgroundColor: stage.status === 'passed' ? '#92c353' : stage.status === 'failed' ? '#ef4444' : '#d1d1d1' }} aria-label={stage.status} />
                    <span style={{ fontSize: 11, color: '#616161' }}>{stage.name}</span>
                    {idx < pipe.stages.length - 1 && <div className="flex-1" style={{ height: 2, backgroundColor: '#e1e1e1' }} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Infrastructure */}
      <Card>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Infrastructure</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'CPU Usage', value: '34%', color: '#237b4b' },
            { label: 'Memory', value: '62%', color: '#b56200' },
            { label: 'Disk I/O', value: '18%', color: '#237b4b' },
            { label: 'Network In', value: '45 Mbps', color: '#5b5fc7' },
            { label: 'Network Out', value: '120 Mbps', color: '#5b5fc7' },
            { label: 'DB Connections', value: '23/100', color: '#237b4b' },
          ].map((metric) => (
            <div key={metric.label} className="rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
              <p style={{ fontSize: 11, color: '#616161', marginBottom: 4 }}>{metric.label}</p>
              <p style={{ fontSize: 18, fontWeight: 600, color: metric.color }}>{metric.value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
