import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  teams,
  employees,
  allTickets,
  activities,
  getEmployeeById,
  getEmployeesByTeam,
  formatRelativeTime,
  type Employee,
  type Team,
} from '@/data/mockData';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/shared/Card';
import { TabsBar } from '@/components/shared/TabsBar';
import { Avatar } from '@/components/shared/Avatar';
import { StatusChip } from '@/components/shared/StatusChip';
import {
  Users,
  Video,
  Plus,
  MessageSquare,
  FolderOpen,
  Settings,
  Target,
  ListTodo,
  Bug,
  FileText,
  Zap,
  ChevronLeft,
  Hash,
  Pin,
  Reply,
  ThumbsUp,
  Smile,
  Paperclip,
  Send,
  Bold,
  Italic,
  Link2,
  List,
  CheckSquare,
  TrendingUp,
  BarChart3,
  GitCommit,
  GitPullRequest,
  Rocket,
  Clock,
  MoreHorizontal,
  X,
  Lock,
  Globe,
  Calendar,
  CheckCircle2,
  Search,
  Edit3,
  Trash2,
  Pencil,
  Crown,
  Palette,
  Code,
} from 'lucide-react';

const teamTabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'channels', label: 'Channels' },
  { id: 'members', label: 'Members' },
  { id: 'posts', label: 'Posts' },
  { id: 'standups', label: 'Standups' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'performance', label: 'Performance' },
  { id: 'settings', label: 'Settings' },
];

const easing: [number, number, number, number] = [0.16, 1, 0.3, 1];

// ── Team Posts Data ─────────────────────────────────────────

interface TeamPost {
  id: string;
  channelId: string;
  authorId: string;
  title: string;
  body: string;
  timestamp: string;
  pinned?: boolean;
  reactions: { emoji: string; count: number }[];
  replyCount: number;
  replies?: { authorId: string; body: string; timestamp: string }[];
}

interface TeamChannel {
  id: string;
  name: string;
  type: string;
  memberCount?: number;
  private?: boolean;
}

const teamPosts: TeamPost[] = [
  {
    id: 'post-1',
    channelId: 'ch-eng-general',
    authorId: 'emp-maya',
    title: 'Welcome Aria to the team!',
    body: "Everyone please welcome Aria, our new Senior Developer (AI). She'll be leading the payment gateway integration and code review process.\n\nAria is running Claude 4.0 with full-stack capabilities. Feel free to tag her on any backend or frontend tasks!",
    timestamp: '2025-04-28T09:00:00Z',
    pinned: true,
    reactions: [{ emoji: '👋', count: 5 }, { emoji: '🎉', count: 3 }],
    replyCount: 3,
    replies: [
      { authorId: 'emp-aria', body: "Thanks everyone! Excited to be here. I've already started reviewing the Tax Filing codebase — looking great so far. My first PR should be up today.", timestamp: '2025-04-28T09:15:00Z' },
      { authorId: 'emp-raj', body: 'Welcome Aria! Looking forward to collaborating on the frontend components.', timestamp: '2025-04-28T09:30:00Z' },
      { authorId: 'emp-echo', body: "I'll set up your CI/CD pipeline access. Welcome to the team!", timestamp: '2025-04-28T10:00:00Z' },
    ],
  },
  {
    id: 'post-2',
    channelId: 'ch-eng-standups',
    authorId: 'emp-manager',
    title: 'Sprint 14 Standup — Apr 30',
    body: "**Yesterday:**\n- Aria: Completed payment gateway integration (TAX-148)\n- Sage: Fixed memory leak in PDF parser (TAX-146)\n- Raj: Built navigation drawer component (MOB-91)\n- Echo: Set up CI/CD pipeline for API project\n\n**Today:**\n- Aria: IRS API integration edge cases\n- Sage: Database migration for multi-tenancy\n- Raj: Dark mode toggle\n- Echo: Load testing suite\n\n**Blockers:** Raj needs design review from Pixel for dark mode colors.",
    timestamp: '2025-04-30T09:30:00Z',
    reactions: [{ emoji: '✅', count: 4 }],
    replyCount: 2,
    replies: [
      { authorId: 'emp-raj', body: 'Design review scheduled with Pixel at 2pm. Will update after.', timestamp: '2025-04-30T09:45:00Z' },
      { authorId: 'emp-aria', body: 'IRS staging credentials are working. Starting on rejected filing edge cases now.', timestamp: '2025-04-30T10:00:00Z' },
    ],
  },
  {
    id: 'post-3',
    channelId: 'ch-eng-general',
    authorId: 'emp-sage',
    title: 'RFC: New authentication flow with refresh tokens',
    body: "I've drafted a proposal for improving our auth system with short-lived access tokens and Redis-backed refresh token rotation.\n\nKey points:\n- Access tokens: 15min expiry\n- Refresh tokens: 7 day rotation\n- Redis SET NX for concurrency\n- Graceful fallback to session cookies\n\nPlease review and comment by Friday.",
    timestamp: '2025-04-29T14:00:00Z',
    reactions: [{ emoji: '👍', count: 3 }, { emoji: '📖', count: 2 }],
    replyCount: 2,
    replies: [
      { authorId: 'emp-raj', body: 'Love the Redis lock approach. Can you share the code snippet for the mobile auth flow adaptation?', timestamp: '2025-04-29T14:30:00Z' },
      { authorId: 'emp-sage', body: 'Pushed to `auth-patterns` branch — check `src/auth/token-refresh.ts`', timestamp: '2025-04-29T15:00:00Z' },
    ],
  },
  {
    id: 'post-4',
    channelId: 'ch-eng-frontend',
    authorId: 'emp-pixel',
    title: 'Figma: Design system v2 — Navigation component',
    body: "New navigation drawer component is ready for review. Includes responsive behavior, dark mode variants, and full keyboard accessibility.\n\nContrast ratios all pass WCAG AA (7.2:1 for primary actions). Focus ring uses 2px brand-primary with 2px offset.\n\nLink: [Figma — Navigation Component v2](https://figma.com)",
    timestamp: '2025-04-28T11:00:00Z',
    reactions: [{ emoji: '🎨', count: 3 }],
    replyCount: 1,
    replies: [
      { authorId: 'emp-raj', body: 'Implementation starting today. Will match the design spec pixel-perfect.', timestamp: '2025-04-28T14:00:00Z' },
    ],
  },
  {
    id: 'post-5',
    channelId: 'ch-eng-backend',
    authorId: 'emp-aria',
    title: 'Payment gateway integration — complete ✅',
    body: "Payment gateway integration for the Tax Filing Platform is now complete.\n\n**What was done:**\n- Stripe API migration: 100%\n- Webhook handling: all scenarios covered\n- International card support: 15 countries\n- Test coverage: 94%\n\nPR #356 is ready for review. @Raj @Sage — could you take a look?\n\nNext: IRS API integration (starting tomorrow).",
    timestamp: '2025-04-27T16:00:00Z',
    reactions: [{ emoji: '🚀', count: 5 }, { emoji: '👏', count: 3 }],
    replyCount: 2,
    replies: [
      { authorId: 'emp-sage', body: 'Reviewed the backend code — excellent error handling patterns. Approved.', timestamp: '2025-04-27T17:00:00Z' },
      { authorId: 'emp-maya', body: 'Fantastic work Aria. This was our highest priority item — glad to see it land ahead of schedule.', timestamp: '2025-04-27T18:00:00Z' },
    ],
  },
  {
    id: 'post-6',
    channelId: 'ch-eng-frontend',
    authorId: 'emp-raj',
    title: 'Mobile Safari layout fix — need QA help',
    body: "I've been debugging the responsive layout issue on mobile Safari (TAX-149). The flex container is collapsing on iPhone 14 Pro screens.\n\nI've tried:\n- `min-height: 100dvh` on the container\n- `-webkit-fill-available` fallback\n- Removing nested flex containers\n\nNothing seems to work consistently. @Priya could you help reproduce this on BrowserStack?",
    timestamp: '2025-04-26T13:00:00Z',
    reactions: [{ emoji: '🔍', count: 2 }],
    replyCount: 1,
    replies: [
      { authorId: 'emp-priya', body: "Reproduced on iPhone 14 Pro (iOS 17.4) and iPhone 15 (iOS 17.5). It's the nested flex with `overflow: scroll` that's causing it. Adding `flex-shrink: 0` to the child fixes it.", timestamp: '2025-04-26T14:00:00Z' },
    ],
  },
  {
    id: 'post-7',
    channelId: 'ch-eng-devops',
    authorId: 'emp-echo',
    title: 'CI/CD Pipeline migration complete',
    body: "All 3 projects are now on the new GitHub Actions pipeline.\n\n**Performance improvements:**\n- Build time: 8min → 3min (62% faster)\n- Test parallelization: 4x\n- Docker layer caching enabled\n- Automated rollback on error rate >0.1%\n\nOld CircleCI config is deprecated. Please update your branch protection rules.",
    timestamp: '2025-04-25T10:00:00Z',
    reactions: [{ emoji: '⚡', count: 4 }],
    replyCount: 0,
  },
  {
    id: 'post-8',
    channelId: 'ch-eng-general',
    authorId: 'emp-maya',
    title: 'Sprint 15 planning — this Friday',
    body: "Sprint 15 planning is scheduled for Friday at 10am. Please have your backlog items groomed and estimated by Thursday EOD.\n\n**Focus areas for Sprint 15:**\n- IRS API integration completion\n- Dark mode implementation\n- SOC2 audit preparation\n\nCapacity: 45 story points (team velocity trending up).",
    timestamp: '2025-04-24T09:00:00Z',
    pinned: true,
    reactions: [{ emoji: '📅', count: 4 }],
    replyCount: 1,
    replies: [
      { authorId: 'emp-aria', body: "I have 8 SP of IRS API work ready for estimation. Added to the backlog.", timestamp: '2025-04-24T10:00:00Z' },
    ],
  },
  {
    id: 'post-9',
    channelId: 'ch-eng-backend',
    authorId: 'emp-echo',
    title: 'Staging environment — scheduled maintenance',
    body: "Staging will be down for maintenance on Saturday 2-4 AM PT.\n\n**Changes:**\n- PostgreSQL 15 → 16 upgrade\n- Redis cluster reconfiguration\n- New load balancer rules\n\nNo impact on production. Please don't deploy to staging during this window.",
    timestamp: '2025-04-23T09:00:00Z',
    reactions: [{ emoji: '🔧', count: 2 }],
    replyCount: 0,
  },
  {
    id: 'post-10',
    channelId: 'ch-eng-frontend',
    authorId: 'emp-aria',
    title: 'Code review: TypeScript strict mode migration',
    body: "I've enabled `strict: true` in the frontend tsconfig and fixed all 47 type errors. The changes are in branch `feat/strict-ts`.\n\n**Key changes:**\n- All API responses now have Zod schemas\n- Component props properly typed\n- No more `any` types\n\nThis will prevent a whole class of runtime bugs. Please review when you have a chance.",
    timestamp: '2025-04-22T11:00:00Z',
    reactions: [{ emoji: '💪', count: 3 }],
    replyCount: 1,
    replies: [
      { authorId: 'emp-raj', body: 'This is huge! TS strict mode has been on our wishlist for months. Reviewing now.', timestamp: '2025-04-22T12:00:00Z' },
    ],
  },
];

// ── Team Files Data ─────────────────────────────────────────

const teamFiles = [
  { id: 'f1', name: 'API Documentation.pdf', size: '2.4 MB', type: 'pdf', sharedBy: 'emp-sage', date: '2025-04-20' },
  { id: 'f2', name: 'Design System v2.fig', size: '18.7 MB', type: 'figma', sharedBy: 'emp-pixel', date: '2025-04-25' },
  { id: 'f3', name: 'Runbook: Deployment.md', size: '12 KB', type: 'doc', sharedBy: 'emp-echo', date: '2025-04-18' },
  { id: 'f4', name: 'Architecture Diagram.png', size: '3.1 MB', type: 'image', sharedBy: 'emp-aria', date: '2025-04-22' },
  { id: 'f5', name: 'Test Coverage Report.html', size: '156 KB', type: 'doc', sharedBy: 'emp-priya', date: '2025-04-28' },
  { id: 'f6', name: 'Sprint 15 Planning.xlsx', size: '45 KB', type: 'sheet', sharedBy: 'emp-maya', date: '2025-04-24' },
];

// ── Unique Team Data ────────────────────────────────────────

const TEAM_MISSIONS: Record<string, string> = {
  'team-eng': 'Build reliable, scalable software that powers Acme\'s products. Ship with quality, move fast with safety, and mentor each other to grow.',
  'team-design': 'Create beautiful, accessible, and intuitive user experiences that delight our customers and set the bar for design excellence.',
  'team-qa': 'Ensure every release meets the highest quality standards. Automate testing, catch bugs early, and build confidence in every deployment.',
  'team-leadership': 'Set the vision, align the organization, and enable every team to do their best work.',
};

const TEAM_VELOCITY: Record<string, number> = {
  'team-eng': 34,
  'team-design': 22,
  'team-qa': 28,
  'team-leadership': 18,
};

const TEAM_COMPLETION: Record<string, { done: number; total: number }> = {
  'team-eng': { done: 47, total: 62 },
  'team-design': { done: 31, total: 40 },
  'team-qa': { done: 55, total: 60 },
  'team-leadership': { done: 20, total: 30 },
};

const TEAM_BURNDOWN: Record<string, Array<{ ideal: number; actual: number }>> = {
  'team-eng': [
    { ideal: 100, actual: 100 }, { ideal: 92, actual: 95 }, { ideal: 84, actual: 88 },
    { ideal: 76, actual: 80 }, { ideal: 68, actual: 72 }, { ideal: 60, actual: 63 },
    { ideal: 52, actual: 55 }, { ideal: 44, actual: 48 }, { ideal: 36, actual: 40 },
    { ideal: 28, actual: 30 },
  ],
  'team-design': [
    { ideal: 100, actual: 100 }, { ideal: 90, actual: 93 }, { ideal: 80, actual: 85 },
    { ideal: 70, actual: 75 }, { ideal: 60, actual: 68 }, { ideal: 50, actual: 55 },
    { ideal: 40, actual: 42 }, { ideal: 30, actual: 35 }, { ideal: 20, actual: 22 },
    { ideal: 10, actual: 15 },
  ],
  'team-qa': [
    { ideal: 100, actual: 100 }, { ideal: 90, actual: 96 }, { ideal: 80, actual: 92 },
    { ideal: 70, actual: 88 }, { ideal: 60, actual: 80 }, { ideal: 50, actual: 72 },
    { ideal: 40, actual: 64 }, { ideal: 30, actual: 56 }, { ideal: 20, actual: 48 },
    { ideal: 10, actual: 40 },
  ],
  'team-leadership': [
    { ideal: 100, actual: 100 }, { ideal: 88, actual: 92 }, { ideal: 76, actual: 82 },
    { ideal: 64, actual: 72 }, { ideal: 52, actual: 60 }, { ideal: 40, actual: 50 },
    { ideal: 28, actual: 40 }, { ideal: 16, actual: 30 }, { ideal: 8, actual: 18 },
    { ideal: 0, actual: 10 },
  ],
};

// ── Toast helper (module-level) ────────────────────────────

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const existing = document.getElementById('teams-toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'teams-toast';
  toast.style.cssText = 'position:fixed;top:16px;right:16px;z-index:9999;padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;color:#fff;animation:toastSlideIn 0.3s ease;';
  toast.style.backgroundColor = type === 'success' ? '#237b4b' : type === 'error' ? '#c4314b' : '#5b5fc7';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function confirmAction(message: string): boolean {
  return window.confirm(message);
}

// ═══════════════════════════════════════════════════════════
// MAIN TEAMS PAGE
// ═══════════════════════════════════════════════════════════

export default function TeamsPage() {  useEffect(() => { document.title = "Teams" + " - Brixstac"; }, []);
  const selectedTeamId = useStore((s) => s.selectedTeamId);
  const selectTeam = useStore((s) => s.selectTeam);

  if (!selectedTeamId) {
    return <TeamsListView onSelectTeam={(id) => selectTeam(id || '')} />;
  }

  const team = teams.find((t) => t.id === selectedTeamId);
  if (!team) {
    return <TeamsListView onSelectTeam={(id) => selectTeam(id || '')} />;
  }

  return <TeamScopeView team={team} onBack={() => selectTeam('')} />;
}

// ═══════════════════════════════════════════════════════════
// Teams List View
// ═══════════════════════════════════════════════════════════

function TeamsListView({ onSelectTeam }: { onSelectTeam: (id: string) => void }) {
  const navigate = useNavigate();
  const [meetNowOpen, setMeetNowOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [editTeamOpen, setEditTeamOpen] = useState(false);
  const [editTeamId, setEditTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamColor, setNewTeamColor] = useState('#5b5fc7');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [teamList, setTeamList] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem('brixstac-teams');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return teams;
  });

  // Save team list to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('brixstac-teams', JSON.stringify(teamList));
    } catch { /* ignore */ }
  }, [teamList]);

  const handleMeetNow = () => {
    setMeetNowOpen(false);
    navigate('/calls');
  };

  const handleCreateTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast('Team name must be at least 2 characters', 'error');
      return;
    }
    if (teamList.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
      showToast('A team with this name already exists', 'error');
      return;
    }
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: trimmed,
      color: newTeamColor,
      memberIds: [],
      channels: [{ id: `ch-${Date.now()}`, name: 'general', type: 'text' }],
      icon: 'code',
    };
    setTeamList([...teamList, newTeam]);
    setNewTeamName('');
    setNewTeamColor('#5b5fc7');
    setCreateTeamOpen(false);
    showToast(`Team "${trimmed}" created`, 'success');
  };

  const handleEditTeam = (teamId: string) => {
    const team = teamList.find(t => t.id === teamId);
    if (!team) return;
    setEditTeamId(teamId);
    setEditTeamName(team.name);
    setEditTeamOpen(true);
  };

  const handleSaveEdit = () => {
    const trimmed = editTeamName.trim();
    if (!trimmed || trimmed.length < 2) {
      showToast('Team name must be at least 2 characters', 'error');
      return;
    }
    setTeamList(prev => prev.map(t => t.id === editTeamId ? { ...t, name: trimmed } : t));
    setEditTeamOpen(false);
    setEditTeamId(null);
    setEditTeamName('');
    showToast('success');
  };

  const handleDeleteTeam = (teamId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const team = teamList.find(t => t.id === teamId);
    if (!confirmAction(`Delete "${team?.name || 'this team'}"? This action cannot be undone.`)) return;
    setTeamList(prev => prev.filter(t => t.id !== teamId));
    showToast('success');
  };

  // Filter and search teams
  const filteredTeams = useMemo(() => {
    let result = teamList;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q));
    }
    return result;
  }, [teamList, searchQuery]);

  // Compute team data WITHOUT using hooks inside map
  const teamData = useMemo(() => {
    return filteredTeams.map((team) => {
      const teamEmployees = getEmployeesByTeam(team.id);
      const ticketCount = allTickets.filter((t) =>
        team.memberIds?.includes(t.assigneeId || '')
      ).length;
      return { team, members: teamEmployees, ticketCount };
    });
  }, [filteredTeams]);

  return (
    <div className="flex h-full flex-col" role="main" aria-label="Teams page">
      {/* Header */}
      <div style={{ padding: '16px 20px 8px' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424', letterSpacing: '-0.01em' }}>
              Teams
            </h1>
            <p style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
              {teamList.length} teams · {employees.length} members
            </p>
          </div>
          <button
            onClick={() => setCreateTeamOpen(true)}
            className="inline-flex items-center gap-2 rounded px-3 font-medium text-white cursor-pointer"
            style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7' }}
            aria-label="Create new team"
          >
            <Plus size={16} />
            New Team
          </button>
        </div>

        {/* Search bar */}
        <div className="relative mt-3" style={{ maxWidth: 400 }}>
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" color="#a0a0a0" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full rounded-lg border pl-8 pr-3 py-2.5 text-sm outline-none" style={{ borderColor: '#d1d1d1', backgroundColor: '#fff', color: '#242424' }} />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Clear search">
              <X size={12} color="#a0a0a0" />
            </button>
          )}
        </div>
      </div>

      {/* Team Cards Grid */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        {isLoading ? (
          /* Skeleton loading */
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="rounded-xl border p-4 animate-pulse" style={{ borderColor: '#e1e1e1' }}>
                <div className="flex items-center gap-3">
                  <div className="rounded" style={{ width: 28, height: 28, backgroundColor: '#e1e1e1' }} />
                  <div className="flex-1">
                    <div className="rounded" style={{ width: 120, height: 16, backgroundColor: '#e1e1e1' }} />
                    <div className="rounded mt-1" style={{ width: 80, height: 12, backgroundColor: '#f0f0f0' }} />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="rounded" style={{ width: 32, height: 32, backgroundColor: '#f0f0f0' }} />
                  <div className="rounded" style={{ width: 32, height: 32, backgroundColor: '#f0f0f0' }} />
                  <div className="rounded" style={{ width: 32, height: 32, backgroundColor: '#f0f0f0' }} />
                </div>
              </div>
            ))}
          </div>
        ) : teamData.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16">
            <Users size={48} color="#d1d1d1" className="mb-4" />
            <h3 className="text-base font-semibold" style={{ color: '#242424' }}>No teams found</h3>
            <p className="text-sm mt-1" style={{ color: '#767676' }}>
              {searchQuery ? 'Try adjusting your search' : 'Create your first team to get started'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {teamData.map(({ team, members, ticketCount }, idx) => (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.06, ease: easing }}
              >
                <Card
                  hoverable
                  onClick={() => onSelectTeam(team.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <TeamIcon team={team} />
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>
                          {team.name}
                        </h3>
                        <span
                          className="inline-flex items-center rounded-full px-2 font-semibold"
                          style={{
                            height: 20,
                            fontSize: 11,
                            backgroundColor: `${team.color}15`,
                            color: team.color,
                            marginTop: 4,
                          }}
                        >
                          Department
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditTeam(team.id); }}
                        className="cursor-pointer rounded p-1 hover:bg-gray-100"
                        style={{ background: 'none', border: 'none' }}
                        title="Edit team"
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil size={14} color="#616161" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteTeam(team.id, e)}
                        className="cursor-pointer rounded p-1 hover:bg-red-50"
                        style={{ background: 'none', border: 'none' }}
                        title="Delete team"
                        aria-label={`Delete ${team.name}`}
                      >
                        <Trash2 size={14} color="#c4314b" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setMeetNowOpen(true); }}
                        className="inline-flex items-center gap-1 rounded px-2 font-medium cursor-pointer"
                        style={{ height: 28, fontSize: 12, border: '1px solid #d1d1d1', backgroundColor: 'transparent', color: '#616161', marginLeft: 4 }}
                        aria-label="Start instant meeting"
                      >
                        <Video size={14} />
                        Meet Now
                      </button>
                    </div>
                  </div>

                  {/* Member Avatars */}
                  <div className="mt-4 flex items-center">
                    {members.length > 0 ? (
                      <>
                        <div className="flex -space-x-2">
                          {members.slice(0, 5).map((m) => (
                            <div key={m.id} className="relative">
                              <Avatar
                                src={m.avatar}
                                alt={m.name}
                                size="sm"
                                isAi={m.kind === 'ai'}
                                status={m.status}
                              />
                            </div>
                          ))}
                        </div>
                        <span style={{ fontSize: 13, color: '#616161', marginLeft: 12 }}>
                          {members.length} members
                        </span>
                      </>
                    ) : (
                      <span style={{ fontSize: 13, color: '#767676' }}>No members yet</span>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="mt-4 flex items-center gap-4" style={{ borderTop: '1px solid #e1e1e1', paddingTop: 12 }}>
                    <div className="flex items-center gap-1">
                      <Hash size={14} color="#a0a0a0" />
                      <span style={{ fontSize: 12, color: '#616161' }}>{(team.channels || []).length} channels</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} color="#a0a0a0" />
                      <span style={{ fontSize: 12, color: '#616161' }}>{teamPosts.filter(p => p.channelId.startsWith(team.id.replace('team-', 'ch-').slice(0, 6))).length + 12} posts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ListTodo size={14} color="#a0a0a0" />
                      <span style={{ fontSize: 12, color: '#616161' }}>{ticketCount} tasks</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Meet Now Modal */}
      <AnimatePresence>
        {meetNowOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMeetNowOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-5 w-[400px]"
              style={{ backgroundColor: '#fff' }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Start instant meeting"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Start Instant Meeting</h3>
                <button onClick={() => setMeetNowOpen(false)} className="cursor-pointer rounded p-2 hover:bg-gray-100" style={{ background: 'none', border: 'none', minWidth: 44, minHeight: 44 }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>Start a meeting with this team instantly.</p>
              <div className="flex gap-2">
                <button onClick={handleMeetNow} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white" style={{ backgroundColor: '#237b4b', border: 'none' }}>Start Meeting</button>
                <button onClick={() => setMeetNowOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Team Modal */}
      <AnimatePresence>
        {createTeamOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setCreateTeamOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-5 w-[400px]"
              style={{ backgroundColor: '#fff' }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Create new team"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Create New Team</h3>
                <button onClick={() => setCreateTeamOpen(false)} className="cursor-pointer rounded p-2 hover:bg-gray-100" style={{ background: 'none', border: 'none', minWidth: 44, minHeight: 44 }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <label style={{ fontSize: 12, color: '#616161', display: 'block', marginBottom: 4, fontWeight: 500 }}>Team Name</label>
              <input
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateTeam()}
                placeholder="Team name..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-3"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                autoFocus
                aria-label="Team name"
              />
              <label style={{ fontSize: 12, color: '#616161', display: 'block', marginBottom: 4, fontWeight: 500 }}>Color</label>
              <div className="flex gap-2 mb-4">
                {['#5b5fc7', '#237b4b', '#c4314b', '#b56200', '#7c3aed', '#0891b2'].map(c => (
                  <button
                    key={c}
                    onClick={() => setNewTeamColor(c)}
                    className="cursor-pointer rounded-full border-2"
                    style={{ width: 24, height: 24, backgroundColor: c, borderColor: newTeamColor === c ? '#242424' : 'transparent' }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateTeam}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  disabled={!newTeamName.trim() || newTeamName.trim().length < 2}
                  style={{
                    backgroundColor: newTeamName.trim().length >= 2 ? '#5b5fc7' : '#d1d1d1',
                    border: 'none',
                    cursor: newTeamName.trim().length >= 2 ? 'pointer' : 'not-allowed',
                    opacity: newTeamName.trim().length >= 2 ? 1 : 0.6,
                  }}
                >
                  Create
                </button>
                <button onClick={() => setCreateTeamOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Team Modal */}
      <AnimatePresence>
        {editTeamOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setEditTeamOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="rounded-xl p-5 w-[400px]"
              style={{ backgroundColor: '#fff' }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-label="Edit team"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Edit Team</h3>
                <button onClick={() => setEditTeamOpen(false)} className="cursor-pointer rounded p-2 hover:bg-gray-100" style={{ background: 'none', border: 'none', minWidth: 44, minHeight: 44 }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <input
                value={editTeamName}
                onChange={e => setEditTeamName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEdit()}
                placeholder="Team name..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-4"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                autoFocus
                aria-label="Edit team name"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  disabled={!editTeamName.trim() || editTeamName.trim().length < 2}
                  style={{ backgroundColor: editTeamName.trim().length >= 2 ? '#5b5fc7' : '#d1d1d1', border: 'none', cursor: editTeamName.trim().length >= 2 ? 'pointer' : 'not-allowed' }}
                >
                  Save
                </button>
                <button onClick={() => setEditTeamOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Team Scope View
// ═══════════════════════════════════════════════════════════

function TeamScopeView({ team, onBack }: { team: Team; onBack: () => void }) {
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const [activeTab, setActiveTab] = useState('overview');
  const [meetNowOpen, setMeetNowOpen] = useState(false);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostBody, setNewPostBody] = useState('');
  const [channelList, setChannelList] = useState<TeamChannel[]>(() => {
    return (team.channels || []).map((ch: any) => ({
      id: ch.id || `ch-${Math.random().toString(36).slice(2)}`,
      name: ch.name || 'unnamed',
      type: ch.type || 'text',
      memberCount: ch.memberCount || getEmployeesByTeam(team.id).length,
      private: ch.type === 'private',
    }));
  });
  const [postsList, setPostsList] = useState(teamPosts);
  const [teamEmployees, setTeamEmployees] = useState<Employee[]>(() => getEmployeesByTeam(team.id));
  const [eventsList, setEventsList] = useState<Array<{ title: string; time: string; recurring: boolean; type: string }>>([
    { title: 'Daily Standup', time: '09:00 AM', recurring: true, type: 'meeting' },
    { title: 'Sprint Planning', time: '02:00 PM', recurring: false, type: 'planning' },
    { title: 'Code Review Session', time: '04:00 PM', recurring: true, type: 'review' },
    { title: 'Team Retro', time: 'Friday 03:00 PM', recurring: true, type: 'retro' },
  ]);

  const memberList = teamEmployees;
  const onlineCount = teamEmployees.filter((e) => e.status === 'online').length;
  const teamTicketCount = allTickets.filter((t) =>
    team.memberIds?.includes(t.assigneeId || '')
  ).length;

  // Validation helpers
  const isValidChannelName = newChannelName.trim().length >= 2 && newChannelName.trim().length <= 50;
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div style={{ padding: '12px 20px 8px' }}>
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 font-medium"
          style={{ fontSize: 12, color: '#5b5fc7' }}
          aria-label="Back to all teams"
        >
          <ChevronLeft size={14} />
          All Teams
        </button>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamIcon team={team} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: 22, fontWeight: 600, color: '#242424', letterSpacing: '-0.01em' }}>
                  {team.name}
                </h1>
                <span
                  className="inline-flex items-center rounded-full px-2 font-semibold"
                  style={{ height: 20, fontSize: 11, backgroundColor: `${team.color}15`, color: team.color }}
                >
                  Department
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#616161', marginTop: 2 }}>
                {teamEmployees.length} members · {onlineCount} online · {teamTicketCount} tasks active
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {teamEmployees.slice(0, 4).map((m) => (
                <Avatar key={m.id} src={m.avatar} alt={m.name} size="md" isAi={m.kind === 'ai'} />
              ))}
            </div>
            <button
              onClick={() => setMeetNowOpen(true)}
              className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
              style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', color: 'white', marginLeft: 8 }}
              aria-label="Start instant meeting"
            >
              <Video size={16} />
              Meet Now
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabsBar tabs={teamTabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '16px 20px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: easing }}
          >
            {activeTab === 'overview' && <TeamOverviewTab team={team} members={teamEmployees} />}
            {activeTab === 'channels' && <TeamChannelsTab team={team} members={teamEmployees} channelList={channelList} setCreateChannelOpen={setCreateChannelOpen} />}
            {activeTab === 'members' && <TeamMembersTab team={team} members={teamEmployees} setAddMemberOpen={setAddMemberOpen} />}
            {activeTab === 'posts' && <TeamPostsTab team={team} members={teamEmployees} channelList={channelList} postsList={postsList} setPostsList={setPostsList} currentUser={currentUser} setNewPostOpen={setNewPostOpen} />}
            {activeTab === 'standups' && <TeamStandupsTab team={team} members={teamEmployees} />}
            {activeTab === 'calendar' && <TeamCalendarTab team={team} eventsList={eventsList} setAddEventOpen={setAddEventOpen} />}
            {activeTab === 'performance' && <TeamPerformanceTab team={team} members={teamEmployees} />}
            {activeTab === 'settings' && <TeamSettingsTab team={team} channelList={channelList} setChannelList={setChannelList} setCreateChannelOpen={setCreateChannelOpen} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Meet Now Modal */}
      <AnimatePresence>
        {meetNowOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setMeetNowOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl p-5 w-[400px]" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()} role="dialog">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Start Instant Meeting</h3>
                <button onClick={() => setMeetNowOpen(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <p style={{ fontSize: 13, color: '#616161', marginBottom: 16 }}>Start a meeting with {team.name}.</p>
              <div className="flex gap-2">
                <button onClick={() => { setMeetNowOpen(false); navigate('/calls'); }} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white" style={{ backgroundColor: '#237b4b', border: 'none' }}>Start Meeting</button>
                <button onClick={() => setMeetNowOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Channel Modal */}
      <AnimatePresence>
        {createChannelOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setCreateChannelOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl p-5 w-[400px]" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Create channel">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Create Channel</h3>
                <button onClick={() => setCreateChannelOpen(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <input
                value={newChannelName}
                onChange={e => setNewChannelName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && isValidChannelName) {
                    setChannelList([...channelList, { id: `ch-${Date.now()}`, name: newChannelName, type: 'text', memberCount: teamEmployees.length }]);
                    setNewChannelName('');
                    setCreateChannelOpen(false);
                    showToast('Channel created', 'success');
                  }
                }}
                placeholder="Channel name..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-4"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                autoFocus
                aria-label="Channel name"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isValidChannelName) {
                      setChannelList([...channelList, { id: `ch-${Date.now()}`, name: newChannelName.trim(), type: 'text', memberCount: teamEmployees.length }]);
                      setNewChannelName('');
                      setCreateChannelOpen(false);
                      showToast('Channel created', 'success');
                    }
                  }}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  disabled={!isValidChannelName}
                  style={{ backgroundColor: isValidChannelName ? '#5b5fc7' : '#d1d1d1', border: 'none', cursor: isValidChannelName ? 'pointer' : 'not-allowed' }}
                >
                  Create
                </button>
                <button onClick={() => setCreateChannelOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Member Modal */}
      <AnimatePresence>
        {addMemberOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setAddMemberOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl p-5 w-[400px]" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Add member">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Add Member</h3>
                <button onClick={() => setAddMemberOpen(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <p style={{ fontSize: 13, color: '#616161', marginBottom: 12 }}>Invite a new member to {team.name}.</p>
              <input
                value={newMemberEmail}
                onChange={e => setNewMemberEmail(e.target.value)}
                placeholder="Email address..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-4"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                autoFocus
                aria-label="Member email address"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isValidEmail(newMemberEmail)) {
                      setNewMemberEmail('');
                      setAddMemberOpen(false);
                      showToast(`Invitation sent to ${newMemberEmail.trim()}`, 'success');
                    } else {
                      showToast('error');
                    }
                  }}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#5b5fc7', border: 'none' }}
                >
                  Send Invite
                </button>
                <button onClick={() => setAddMemberOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Event Modal */}
      <AnimatePresence>
        {addEventOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setAddEventOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl p-5 w-[400px]" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="Add event">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Add Event</h3>
                <button onClick={() => setAddEventOpen(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <input
                value={newEventTitle}
                onChange={e => setNewEventTitle(e.target.value)}
                placeholder="Event title..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-3"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                autoFocus
                aria-label="Event title"
              />
              <input
                value={newEventTime}
                onChange={e => setNewEventTime(e.target.value)}
                placeholder="Time (e.g., 10:00 AM)..."
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-4"
                style={{ borderColor: '#d1d1d1', color: '#242424' }}
                aria-label="Event time"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newEventTitle.trim().length >= 2) {
                      setEventsList(prev => [...prev, { title: newEventTitle.trim(), time: newEventTime.trim() || 'TBD', recurring: false, type: 'meeting' }]);
                      setNewEventTitle('');
                      setNewEventTime('');
                      setAddEventOpen(false);
                      showToast('success');
                    }
                  }}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  disabled={newEventTitle.trim().length < 2}
                  style={{ backgroundColor: newEventTitle.trim().length >= 2 ? '#5b5fc7' : '#d1d1d1', border: 'none', cursor: newEventTitle.trim().length >= 2 ? 'pointer' : 'not-allowed' }}
                >
                  Add Event
                </button>
                <button onClick={() => setAddEventOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Post Modal */}
      <AnimatePresence>
        {newPostOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => setNewPostOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="rounded-xl p-5 w-[500px]" style={{ backgroundColor: '#fff' }} onClick={e => e.stopPropagation()} role="dialog" aria-label="New post">
              <div className="flex items-center justify-between mb-4">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>New Post</h3>
                <button onClick={() => setNewPostOpen(false)} className="cursor-pointer" style={{ background: 'none', border: 'none' }} aria-label="Close"><X size={18} color="#616161" /></button>
              </div>
              <input value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} placeholder="Post title..." className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-2" style={{ borderColor: '#d1d1d1', color: '#242424' }} aria-label="Post title" />
              <textarea value={newPostBody} onChange={e => setNewPostBody(e.target.value)} placeholder="Write your post..." className="w-full rounded-lg border px-3 py-2 text-sm outline-none mb-4 resize-none" style={{ borderColor: '#d1d1d1', color: '#242424', minHeight: 120 }} aria-label="Post body" />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (newPostTitle.trim().length >= 2 && newPostBody.trim().length >= 5) {
                      const newPost: TeamPost = {
                        id: `post-${Date.now()}`,
                        channelId: channelList[0]?.id || 'ch-general',
                        authorId: currentUser?.id || 'me',
                        title: newPostTitle.trim(),
                        body: newPostBody.trim(),
                        timestamp: new Date().toISOString(),
                        reactions: [],
                        replyCount: 0,
                      };
                      setPostsList([newPost, ...postsList]);
                      setNewPostTitle('');
                      setNewPostBody('');
                      setNewPostOpen(false);
                      showToast('success');
                    }
                  }}
                  className="flex-1 cursor-pointer rounded py-2 text-sm font-medium text-white"
                  style={{ backgroundColor: '#5b5fc7', border: 'none' }}
                >
                  Post
                </button>
                <button onClick={() => setNewPostOpen(false)} className="flex-1 cursor-pointer rounded py-2 text-sm font-medium" style={{ border: '1px solid #d1d1d1', background: '#fff', color: '#616161' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════
// Overview Tab — Unique per team
// ═══════════════════════════════════════════════════════════

function TeamOverviewTab({ team, members }: { team: Team; members: Employee[] }) {
  const teamTicketCounts = members.map((m) => ({
    member: m,
    count: allTickets.filter((t) => t.assigneeId === m.id).length,
  })).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...teamTicketCounts.map((t) => t.count), 1);
  const velocity = TEAM_VELOCITY[team.id] || 30;
  const completion = TEAM_COMPLETION[team.id] || { done: 40, total: 60 };
  const codeReviews = team.id === 'team-eng' ? 23 : team.id === 'team-design' ? 15 : team.id === 'team-qa' ? 31 : 12;
  const deployFreq = team.id === 'team-eng' ? '4.2/day' : team.id === 'team-design' ? '2.1/day' : team.id === 'team-qa' ? '3.5/day' : '1.8/day';
  const burndown = TEAM_BURNDOWN[team.id] || TEAM_BURNDOWN['team-eng'];
  const mission = TEAM_MISSIONS[team.id] || `Build great things as ${team.name}.`;

  return (
    <div className="space-y-5">
      {/* Mission Statement */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 8 }}>
          <Target size={16} className="mr-2 inline" aria-hidden="true" />
          Mission
        </h3>
        <p style={{ fontSize: 14, color: '#616161', fontStyle: 'italic', lineHeight: '22px' }}>
          {mission}
        </p>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Sprint Velocity', value: `${velocity} pts`, sub: 'Trending up', icon: <Zap size={18} color="#5b5fc7" />, spark: true },
          { label: 'Task Completion', value: `${completion.done}/${completion.total}`, sub: 'This sprint', icon: <CheckSquare size={18} color="#237b4b" />, spark: false },
          { label: 'Code Reviews', value: `${codeReviews}`, sub: '+15% vs last week', icon: <GitPullRequest size={18} color="#5b5fc7" />, spark: false },
          { label: 'Deploy Frequency', value: deployFreq, sub: 'On track', icon: <Rocket size={18} color="#237b4b" />, spark: false },
        ].map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: idx * 0.06, ease: easing }}
          >
            <Card>
              <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
                {stat.icon}
                <span style={{ fontSize: 12, color: '#616161' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#242424' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 11, color: '#767676', marginTop: 2 }}>
                {stat.sub}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Burndown Chart — Unique per team */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>
          <BarChart3 size={16} className="mr-2 inline" aria-hidden="true" />
          Sprint Burndown
        </h3>
        <div className="flex items-end gap-1" style={{ height: 120 }}>
          {(burndown || []).map((d, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end gap-1" style={{ height: '100%' }}>
              <div className="flex gap-[2px]" style={{ height: `${Math.max(d.actual, 4)}%`, alignItems: 'flex-end' }}>
                <div className="flex-1 rounded-t" style={{ height: '100%', backgroundColor: '#dbeafe', opacity: 0.6 }} />
                <motion.div
                  className="flex-1 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: '100%' }}
                  transition={{ duration: 0.5, delay: i * 0.04, ease: easing }}
                  style={{ backgroundColor: '#92c353' }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between" style={{ fontSize: 11, color: '#767676' }}>
          <span>Day 1</span>
          <span>Day 5</span>
          <span>Day 10</span>
        </div>
      </Card>

      {/* Top Contributors */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 16 }}>
          <Users size={16} className="mr-2 inline" aria-hidden="true" />
          Top Contributors This Sprint
        </h3>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users size={32} color="#d1d1d1" className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: '#767676' }}>No members in this team yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {teamTicketCounts.map(({ member, count }, idx) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar src={member.avatar} alt={member.name} size="sm" isAi={member.kind === 'ai'} />
                <span className="flex-shrink-0" style={{ fontSize: 13, color: '#242424', width: 80, fontWeight: 500 }}>
                  {member.name}
                </span>
                <div className="flex-1" style={{ height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(count / maxCount) * 100}%` }}
                    transition={{ duration: 0.5, delay: idx * 0.08, ease: easing }}
                    style={{ height: '100%', backgroundColor: idx === 0 ? '#5b5fc7' : '#92c353', borderRadius: 4 }}
                  />
                </div>
                <span className="flex-shrink-0" style={{ fontSize: 12, color: '#616161', width: 40, textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Channels Tab — With working Create Channel
// ═══════════════════════════════════════════════════════════

function TeamChannelsTab({ team, members, channelList, setCreateChannelOpen }: { team: Team; members: Employee[]; channelList: TeamChannel[]; setCreateChannelOpen: (v: boolean) => void }) {
  const [hoveredChannel, setHoveredChannel] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#616161' }}>{channelList.length} channels</span>
        <button
          onClick={() => setCreateChannelOpen(true)}
          className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
          style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', color: 'white' }}
          aria-label="Create channel"
        >
          <Plus size={16} /> Create Channel
        </button>
      </div>
      {channelList.length === 0 ? (
        <div className="text-center py-16">
          <Hash size={32} color="#d1d1d1" className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: '#767676' }}>No channels yet</p>
          <button onClick={() => setCreateChannelOpen(true)} className="mt-2 text-sm cursor-pointer" style={{ color: '#5b5fc7', background: 'none', border: 'none' }}>Create your first channel</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {channelList.map((ch, idx) => (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25, ease: easing }}
              onMouseEnter={() => setHoveredChannel(ch.id)}
              onMouseLeave={() => setHoveredChannel(null)}
            >
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: ch.type === 'private' || ch.private ? '#fee2e2' : '#e0e7ff' }}>
                    {ch.type === 'private' || ch.private ? <Lock size={18} style={{ color: '#c4314b' }} /> : <Globe size={18} style={{ color: '#5b5fc7' }} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Hash size={12} style={{ color: '#767676' }} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{ch.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: ch.type === 'private' || ch.private ? 'rgba(196,49,75,0.15)' : 'rgba(146,195,83,0.15)', color: ch.type === 'private' || ch.private ? '#c4314b' : '#237b4b' }}>
                        {ch.type || 'text'}
                      </span>
                      <span style={{ fontSize: 11, color: '#767676' }}>{ch.memberCount || members.length} members</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Members Tab — With working Add Member
// ═══════════════════════════════════════════════════════════

function TeamMembersTab({ team, members, setAddMemberOpen }: { team: Team; members: Employee[]; setAddMemberOpen: (v: boolean) => void }) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#616161' }}>
          {members.length} members
        </span>
        <button
          onClick={() => setAddMemberOpen(true)}
          className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
          style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', color: 'white' }}
          aria-label="Add member"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-16">
          <Users size={32} color="#d1d1d1" className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: '#767676' }}>No members in this team yet</p>
          <button onClick={() => setAddMemberOpen(true)} className="mt-2 text-sm cursor-pointer" style={{ color: '#5b5fc7', background: 'none', border: 'none' }}>Add your first member</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {members.map((member, idx) => {
            const ticketCount = allTickets.filter((t) => t.assigneeId === member.id).length;
            const workload = Math.min((ticketCount / 12) * 100, 100);
            const isHovered = hoveredCard === member.id;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.06, ease: easing }}
              >
                <div
                  onMouseEnter={() => setHoveredCard(member.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <Card className="cursor-pointer">
                    <div className="flex items-start gap-3">
                      <Avatar src={member.avatar} alt={member.name} size="lg" isAi={member.kind === 'ai'} status={member.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{member.name}</h3>
                          {member.kind === 'ai' && (
                            <span className="rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: 'rgba(91,95,199,0.15)', color: '#5b5fc7' }}>AI</span>
                          )}
                        </div>
                        <p style={{ fontSize: 12, color: '#616161' }}>{member.title}</p>
                        <p style={{ fontSize: 11, color: '#767676' }}>Level {member.level}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-3" style={{ borderTop: '1px solid #e1e1e1', paddingTop: 12 }}>
                      <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: '#616161' }}>
                          {ticketCount} tasks this sprint
                        </span>
                        <span style={{ fontSize: 11, color: workload > 80 ? '#c4314b' : workload > 50 ? '#b56200' : '#237b4b' }}>
                          {Math.round(workload)}% workload
                        </span>
                      </div>
                      <div style={{ height: 4, backgroundColor: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${workload}%` }}
                          transition={{ duration: 0.5, delay: idx * 0.08, ease: easing }}
                          style={{ height: '100%', backgroundColor: workload > 80 ? '#c4314b' : workload > 50 ? '#ffaa44' : '#92c353', borderRadius: 2 }}
                        />
                      </div>
                    </div>

                    {/* Skills */}
                    {member.kind === 'ai' && (member as any).skills && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {((member as any).skills || []).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="rounded-full px-2 font-medium" style={{ fontSize: 10, backgroundColor: '#e8eaf6', color: '#5b5fc7' }}>
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                          className="mt-3 flex gap-2 overflow-hidden"
                          style={{ borderTop: '1px solid #e1e1e1', paddingTop: 12 }}
                        >
                          <button onClick={() => showToast('info')} className="rounded px-2 py-1 font-medium cursor-pointer" style={{ fontSize: 11, backgroundColor: '#e8eaf6', color: '#5b5fc7', border: 'none' }}>
                            View Profile
                          </button>
                          {member.kind === 'ai' && (
                            <button onClick={() => showToast('info')} className="rounded px-2 py-1 font-medium cursor-pointer" style={{ fontSize: 11, backgroundColor: '#f0f0f0', color: '#616161', border: 'none' }}>
                              Assign Task
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Posts Tab — Fixed crash (was accessing undefined currentUser)
// ═══════════════════════════════════════════════════════════

function TeamPostsTab({
  team,
  members,
  channelList,
  postsList,
  setPostsList,
  currentUser,
  setNewPostOpen,
}: {
  team: Team;
  members: Employee[];
  channelList: TeamChannel[];
  postsList: TeamPost[];
  setPostsList: React.Dispatch<React.SetStateAction<TeamPost[]>>;
  currentUser: any;
  setNewPostOpen: (v: boolean) => void;
}) {
  const channels = useMemo(() => {
    return (team.channels || channelList || []).map((ch: any) => ({
      id: ch.id || '',
      name: ch.name || 'unnamed',
      type: ch.type || 'text',
    }));
  }, [team.channels, channelList]);

  const [selectedChannel, setSelectedChannel] = useState(() => {
    return channels[0]?.id || channelList[0]?.id || 'all';
  });
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  // Guard: ensure channels exist before filtering
  const channelPosts = useMemo(() => {
    if (!channels.length) return postsList;
    if (selectedChannel === 'all') return postsList;
    const filtered = postsList.filter((p) => p.channelId === selectedChannel);
    return filtered.length > 0 ? filtered : postsList;
  }, [channels, selectedChannel, postsList]);

  const handleCreatePost = () => {
    if (composerText.trim().length < 2) return;
    const newPost: TeamPost = {
      id: `post-${Date.now()}`,
      channelId: selectedChannel === 'all' ? (channels[0]?.id || 'ch-general') : selectedChannel,
      authorId: currentUser?.id || 'me',
      title: composerText.trim().substring(0, 60),
      body: composerText.trim(),
      timestamp: new Date().toISOString(),
      reactions: [],
      replyCount: 0,
    };
    setPostsList([newPost, ...postsList]);
    setComposerText('');
    showToast('success');
  };

  return (
    <div className="flex gap-0" style={{ height: 'calc(100vh - 220px)' }}>
      {/* Left Sub-nav: Channel List */}
      <nav
        className="flex-shrink-0 overflow-y-auto"
        style={{ width: 200, borderRight: '1px solid #e1e1e1', paddingRight: 8 }}
        aria-label="Channel list"
      >
        <h4 style={{ fontSize: 11, fontWeight: 600, color: '#616161', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 8, paddingLeft: 8 }}>
          Channels
        </h4>
        <button
          key="all"
          onClick={() => setSelectedChannel('all')}
          className="flex w-full items-center gap-2 rounded px-2 py-1 font-medium text-left cursor-pointer"
          style={{
            fontSize: 13,
            minHeight: 32,
            backgroundColor: selectedChannel === 'all' ? '#e8eaf6' : 'transparent',
            color: selectedChannel === 'all' ? '#5b5fc7' : '#242424',
            borderLeft: selectedChannel === 'all' ? '3px solid #5b5fc7' : '3px solid transparent',
            border: 'none',
          }}
        >
          <Hash size={14} />
          <span className="truncate">all posts</span>
        </button>
        {channels.map((ch) => (
          <button
            key={ch.id}
            onClick={() => setSelectedChannel(ch.id)}
            className="flex w-full items-center gap-2 rounded px-2 py-1 font-medium text-left cursor-pointer"
            style={{
              fontSize: 13,
              minHeight: 32,
              backgroundColor: ch.id === selectedChannel ? '#e8eaf6' : 'transparent',
              color: ch.id === selectedChannel ? '#5b5fc7' : '#242424',
              borderLeft: ch.id === selectedChannel ? '3px solid #5b5fc7' : '3px solid transparent',
              border: 'none',
            }}
          >
            {ch.type === 'private' ? <Lock size={14} /> : <Hash size={14} />}
            <span className="truncate">{ch.name.replace('#', '')}</span>
          </button>
        ))}
      </nav>

      {/* Main Area: Posts */}
      <div className="flex flex-1 flex-col" style={{ paddingLeft: 16 }}>
        <div className="mb-3 flex items-center justify-between">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
            {selectedChannel === 'all' ? 'All Posts' : (channels.find((c: any) => c.id === selectedChannel)?.name || '#general')}
          </h3>
          <button
            onClick={() => setNewPostOpen(true)}
            className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
            style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', color: 'white' }}
            aria-label="New post"
          >
            <Plus size={16} />
            New Post
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto" style={{ paddingRight: 8 }}>
          {channelPosts.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare size={32} color="#d1d1d1" className="mx-auto mb-2" />
              <p className="text-sm" style={{ color: '#767676' }}>No posts in this channel yet</p>
            </div>
          ) : (
            channelPosts.map((post, idx) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, delay: idx * 0.03, ease: easing }}
              >
                <Card padding="md">
                  <PostCard post={post} expandedPost={expandedPost} setExpandedPost={setExpandedPost} />
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Composer */}
        <div className="mt-3 rounded-md border" style={{ borderColor: '#d1d1d1', padding: 12 }}>
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleCreatePost(); }}
            placeholder="Start a new post in this channel..."
            className="w-full resize-none bg-transparent outline-none"
            style={{ fontSize: 13, color: '#242424', minHeight: 48 }}
            aria-label="Write a new post"
          />
          <div className="mt-2 flex items-center justify-between" style={{ borderTop: '1px solid #e1e1e1', paddingTop: 8 }}>
            <div className="flex items-center gap-1">
              <button className="rounded p-2 cursor-pointer" style={{ color: '#616161', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="Bold"><Bold size={14} /></button>
              <button className="rounded p-2 cursor-pointer" style={{ color: '#616161', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="Italic"><Italic size={14} /></button>
              <button className="rounded p-2 cursor-pointer" style={{ color: '#616161', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="Link"><Link2 size={14} /></button>
              <button className="rounded p-2 cursor-pointer" style={{ color: '#616161', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="List"><List size={14} /></button>
              <button className="rounded p-2 cursor-pointer" style={{ color: '#616161', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="Attach file"><Paperclip size={14} /></button>
            </div>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
              style={{
                height: 28,
                fontSize: 12,
                backgroundColor: composerText.trim() ? '#5b5fc7' : '#e1e1e1',
                color: composerText.trim() ? 'white' : '#a0a0a0',
                border: 'none',
              }}
              disabled={!composerText.trim()}
              aria-label="Publish post"
            >
              <Send size={14} />
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Post Card Component ────────────────────────────────────

function PostCard({
  post,
  expandedPost,
  setExpandedPost,
}: {
  post: TeamPost;
  expandedPost: string | null;
  setExpandedPost: (id: string | null) => void;
}) {
  const author = getEmployeeById(post.authorId);
  const [reactionState, setReactionState] = useState(post.reactions);

  return (
    <div className="flex items-start gap-3">
      <Avatar
        src={author?.avatar}
        alt={author?.name || 'Unknown'}
        size="md"
        isAi={author?.kind === 'ai'}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 13, fontWeight: 600, color: '#242424' }}>
            {author?.name || 'Unknown'}
          </span>
          {author?.kind === 'ai' && (
            <span className="rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: 'rgba(91,95,199,0.15)', color: '#5b5fc7' }}>AI</span>
          )}
          <span style={{ fontSize: 11, color: '#767676' }}>
            {formatRelativeTime(post.timestamp)}
          </span>
          {post.pinned && (
            <span className="flex items-center gap-1 rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: 'rgba(255,170,68,0.15)', color: '#b56200' }}>
              <Pin size={10} />
              Pinned
            </span>
          )}
        </div>
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginTop: 4, marginBottom: 6 }}>
          {post.title}
        </h4>
        <div style={{ fontSize: 13, color: '#616161', lineHeight: '20px', whiteSpace: 'pre-wrap' }}>
          {post.body}
        </div>

        {/* Reactions */}
        <div className="mt-3 flex items-center gap-2">
          {reactionState.map((r, i) => (
            <button
              key={i}
              onClick={() => setReactionState(prev => prev.map((ri, idx) => idx === i ? { ...ri, count: ri.count + 1 } : ri))}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium cursor-pointer"
              style={{ fontSize: 11, backgroundColor: '#f0f0f0', color: '#616161', border: '1px solid #e1e1e1' }}
            >
              {r.emoji} {r.count}
            </button>
          ))}
          <button onClick={() => showToast('info')} className="rounded-full p-2 cursor-pointer" style={{ color: '#767676', background: 'none', border: 'none', minWidth: 36, minHeight: 36 }} aria-label="More reactions">
            <Smile size={14} />
          </button>
        </div>

        {/* Reply toggle */}
        {post.replyCount > 0 && (
          <button
            onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
            className="mt-2 flex items-center gap-1 font-medium cursor-pointer"
            style={{ fontSize: 12, color: '#5b5fc7', background: 'none', border: 'none' }}
          >
            <Reply size={14} />
            {post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Replies */}
        <AnimatePresence>
          {expandedPost === post.id && post.replies && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: easing }}
              className="mt-3 space-y-3 overflow-hidden"
              style={{ borderLeft: '2px solid #e1e1e1', paddingLeft: 12 }}
            >
              {post.replies.map((reply, rIdx) => {
                const replyAuthor = getEmployeeById(reply.authorId);
                return (
                  <motion.div
                    key={rIdx}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rIdx * 0.1 }}
                    className="flex items-start gap-2"
                  >
                    <Avatar src={replyAuthor?.avatar} alt={replyAuthor?.name || ''} size="xs" isAi={replyAuthor?.kind === 'ai'} />
                    <div>
                      <div className="flex items-center gap-1">
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#242424' }}>{replyAuthor?.name || 'Unknown'}</span>
                        <span style={{ fontSize: 10, color: '#767676' }}>{formatRelativeTime(reply.timestamp)}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#616161', lineHeight: '18px', marginTop: 2 }}>
                        {reply.body}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Standups Tab
// ═══════════════════════════════════════════════════════════

function TeamStandupsTab({ team, members }: { team: Team; members: Employee[] }) {
  const standupEntries = members.map((m) => ({
    employee: m,
    yesterday: m.kind === 'ai'
      ? `Completed ${Math.floor(Math.random() * 5 + 3)} tasks — all tests passing`
      : 'Worked on assigned tickets',
    today: m.kind === 'ai'
      ? `Planning to take on ${Math.floor(Math.random() * 4 + 2)} new story points`
      : 'Continuing sprint work',
    blockers: m.kind === 'ai' ? 'None — operating at optimal capacity' : 'None',
    submitted: m.kind === 'ai',
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#616161' }}>Daily Standups — {new Date().toLocaleDateString()}</span>
        <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
          {standupEntries.filter(s => s.submitted).length}/{standupEntries.length} Submitted
        </span>
      </div>
      {members.length === 0 ? (
        <div className="text-center py-16">
          <CheckSquare size={32} color="#d1d1d1" className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: '#767676' }}>No standup data yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {standupEntries.map((entry, idx) => (
            <motion.div key={entry.employee.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.06, duration: 0.25, ease: easing }}>
              <Card>
                <div className="flex items-start gap-3">
                  <Avatar size="md" alt={entry.employee.name} initials={entry.employee.name.substring(0, 2)} isAi={entry.employee.kind === 'ai'} status={entry.employee.status} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{entry.employee.name}</span>
                      {entry.employee.kind === 'ai' && <span className="rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: 'rgba(91,95,199,0.15)', color: '#5b5fc7' }}>AI</span>}
                      {entry.submitted && <CheckCircle2 size={14} style={{ color: '#92c353' }} />}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-3">
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#767676', textTransform: 'uppercase' }}>Yesterday</p>
                        <p style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{entry.yesterday}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#767676', textTransform: 'uppercase' }}>Today</p>
                        <p style={{ fontSize: 12, color: '#333', marginTop: 2 }}>{entry.today}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#767676', textTransform: 'uppercase' }}>Blockers</p>
                        <p style={{ fontSize: 12, color: entry.blockers === 'None' ? '#237b4b' : '#c4314b', marginTop: 2 }}>{entry.blockers}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Calendar Tab — With working Add Event
// ═══════════════════════════════════════════════════════════

function TeamCalendarTab({ team, eventsList, setAddEventOpen }: { team: Team; eventsList: Array<{ title: string; time: string; recurring: boolean; type: string }>; setAddEventOpen: (v: boolean) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#616161' }}>Team Calendar — {team.name}</span>
        <button
          onClick={() => setAddEventOpen(true)}
          className="inline-flex items-center gap-1 rounded px-3 font-medium cursor-pointer"
          style={{ height: 32, fontSize: 13, backgroundColor: '#5b5fc7', color: 'white' }}
          aria-label="Add event"
        >
          <Plus size={16} /> Add Event
        </button>
      </div>
      {eventsList.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={32} color="#d1d1d1" className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: '#767676' }}>No events scheduled</p>
        </div>
      ) : (
        <div className="space-y-2">
          {eventsList.map((evt, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05, duration: 0.2 }}>
              <Card className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: evt.type === 'planning' ? '#fef3c7' : evt.type === 'retro' ? '#f3e8ff' : '#e0e7ff' }}>
                  <Calendar size={18} style={{ color: evt.type === 'planning' ? '#f59e0b' : evt.type === 'retro' ? '#8b5cf6' : '#5b5fc7' }} />
                </div>
                <div className="flex-1">
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{evt.title}</span>
                  {evt.recurring && <span className="ml-2 rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: '#e8eaf6', color: '#5b5fc7' }}>Recurring</span>}
                </div>
                <span style={{ fontSize: 12, color: '#616161' }}>{evt.time}</span>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Performance Tab — Unique per team
// ═══════════════════════════════════════════════════════════

function TeamPerformanceTab({ team, members }: { team: Team; members: Employee[] }) {
  // Use deterministic "random" based on member ID for consistency
  const hashString = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  };

  const metrics = members.map((m) => {
    const h = hashString(m.id);
    const ticketCount = (h % 15) + 5;
    const prCount = (h % 8) + 2;
    const reviewCount = (h % 12) + 3;
    const velocity = m.kind === 'ai' ? (h % 20) + 30 : (h % 15) + 15;
    return { employee: m, ticketCount, prCount, reviewCount, velocity };
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 13, color: '#616161' }}>Performance Metrics — Sprint 14</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Team Velocity', value: Math.round(metrics.reduce((s, m) => s + m.velocity, 0) / Math.max(metrics.length, 1)), unit: 'pts/sprint', color: '#5b5fc7' },
          { label: 'Total Tickets', value: metrics.reduce((s, m) => s + m.ticketCount, 0), unit: 'completed', color: '#22c55e' },
          { label: 'PRs Merged', value: metrics.reduce((s, m) => s + m.prCount, 0), unit: 'this sprint', color: '#f59e0b' },
          { label: 'Reviews Done', value: metrics.reduce((s, m) => s + m.reviewCount, 0), unit: 'across team', color: '#8b5cf6' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg border p-3 text-center" style={{ borderColor: '#e1e1e1' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#767676', textTransform: 'uppercase' }}>{kpi.label}</p>
            <p className="mt-1 text-xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
            <p style={{ fontSize: 10, color: '#767676' }}>{kpi.unit}</p>
          </div>
        ))}
      </div>

      {/* Per-Member Table */}
      <Card>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <TrendingUp size={32} color="#d1d1d1" className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: '#767676' }}>No performance data yet</p>
          </div>
        ) : (
          <table className="w-full" style={{ fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e1e1e1' }}>
                <th className="pb-2 text-left font-semibold" style={{ color: '#767676' }}>Member</th>
                <th className="pb-2 text-right font-semibold" style={{ color: '#767676' }}>Velocity</th>
                <th className="pb-2 text-right font-semibold" style={{ color: '#767676' }}>Tickets</th>
                <th className="pb-2 text-right font-semibold" style={{ color: '#767676' }}>PRs</th>
                <th className="pb-2 text-right font-semibold" style={{ color: '#767676' }}>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, idx) => (
                <tr key={m.employee.id} style={{ borderBottom: idx < metrics.length - 1 ? '1px solid #f0f0f0' : undefined }}>
                  <td className="flex items-center gap-2 py-2">
                    <Avatar size="xs" alt={m.employee.name} initials={m.employee.name.substring(0, 2)} isAi={m.employee.kind === 'ai'} status={m.employee.status} />
                    <span style={{ fontWeight: 600, color: '#242424' }}>{m.employee.name}</span>
                  </td>
                  <td className="py-2 text-right font-bold" style={{ color: '#5b5fc7' }}>{m.velocity}</td>
                  <td className="py-2 text-right" style={{ color: '#333' }}>{m.ticketCount}</td>
                  <td className="py-2 text-right" style={{ color: '#333' }}>{m.prCount}</td>
                  <td className="py-2 text-right" style={{ color: '#333' }}>{m.reviewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Settings Tab — Fixed crash (undefined channelList access)
// ═══════════════════════════════════════════════════════════

function TeamSettingsTab({ team, channelList, setChannelList, setCreateChannelOpen }: { team: Team; channelList: TeamChannel[]; setChannelList: React.Dispatch<React.SetStateAction<TeamChannel[]>>; setCreateChannelOpen: (v: boolean) => void }) {
  const [teamName, setTeamName] = useState(team.name);
  const [description, setDescription] = useState(TEAM_MISSIONS[team.id] || '');

  const handleSave = () => {
    showToast('success');
  };

  const handleDeleteChannel = (chId: string) => {
    if (!confirmAction('Delete this channel?')) return;
    setChannelList(prev => prev.filter(c => c.id !== chId));
    showToast('success');
  };

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {/* General */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>General</h3>
        <div className="space-y-4">
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#616161', display: 'block', marginBottom: 4 }}>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              className="w-full rounded border bg-transparent px-3 outline-none focus:border-[#5b5fc7]"
              style={{ height: 32, fontSize: 13, borderColor: '#d1d1d1', color: '#242424' }}
              aria-label="Team name"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: '#616161', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full resize-none rounded border bg-transparent px-3 py-2 outline-none focus:border-[#5b5fc7]"
              style={{ fontSize: 13, borderColor: '#d1d1d1', color: '#242424', minHeight: 60 }}
              aria-label="Team description"
            />
          </div>
          <button
            onClick={handleSave}
            className="cursor-pointer rounded px-3 py-1.5 text-xs font-medium text-white"
            style={{ backgroundColor: '#5b5fc7', border: 'none' }}
          >
            Save Changes
          </button>
        </div>
      </Card>

      {/* Channels */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>Channels ({channelList.length})</h3>
          <button
            onClick={() => setCreateChannelOpen(true)}
            className="inline-flex items-center gap-1 rounded px-2 font-medium cursor-pointer"
            style={{ height: 28, fontSize: 12, backgroundColor: '#5b5fc7', color: 'white' }}
            aria-label="Add channel"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
        {channelList.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: '#767676' }}>No channels yet</p>
        ) : (
          <div className="space-y-1">
            {channelList.map((ch) => (
              <div
                key={ch.id}
                className="flex items-center justify-between rounded px-2 py-1.5"
                style={{ minHeight: 36 }}
              >
                <div className="flex items-center gap-2">
                  {ch.type === 'private' || ch.private ? <Lock size={14} color="#a0a0a0" /> : <Hash size={14} color="#a0a0a0" />}
                  <span style={{ fontSize: 13, color: '#242424' }}>{ch.name}</span>
                  <span className="rounded px-1 font-semibold" style={{ fontSize: 9, backgroundColor: ch.type === 'private' || ch.private ? 'rgba(196,49,75,0.15)' : 'rgba(146,195,83,0.15)', color: ch.type === 'private' || ch.private ? '#c4314b' : '#237b4b' }}>
                    {ch.type || 'text'}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteChannel(ch.id)}
                  className="cursor-pointer rounded p-1 hover:bg-red-50"
                  style={{ background: 'none', border: 'none', color: '#767676' }}
                  aria-label={`Delete ${ch.name}`}
                >
                  <Trash2 size={12} color="#c4314b" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chat Policy */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Chat Policy</h3>
        <div className="space-y-3">
          {[
            { label: 'Allow thread replies', checked: true },
            { label: 'Allow file uploads', checked: true },
            { label: 'Require @mentions for AI agents', checked: false },
            { label: 'Archive messages after 90 days', checked: true },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" defaultChecked={opt.checked} className="h-4 w-4 accent-[#5b5fc7]" aria-label={opt.label} />
              <span style={{ fontSize: 13, color: '#242424' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </Card>

      {/* Integrations */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#242424', marginBottom: 12 }}>Integrations</h3>
        <div className="space-y-2">
          {['GitHub', 'Slack', 'Linear', 'Datadog'].map((integration) => (
            <div key={integration} className="flex items-center justify-between rounded px-2 py-2" style={{ backgroundColor: '#f5f5f3' }}>
              <span style={{ fontSize: 13, color: '#242424' }}>{integration}</span>
              <span className="rounded px-2 py-0.5 font-semibold" style={{ fontSize: 10, backgroundColor: '#92c353', color: 'white' }}>
                Connected
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Danger */}
      <div className="rounded-md border p-4" style={{ borderColor: '#c4314b' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#c4314b', marginBottom: 8 }}>Danger Zone</h3>
        <div className="flex gap-2">
          <button onClick={() => showToast('info')} className="cursor-pointer rounded px-3 py-1 font-medium" style={{ fontSize: 12, border: '1px solid #c4314b', color: '#c4314b', backgroundColor: 'transparent' }}>
            Leave Team
          </button>
          <button onClick={() => showToast('info')} className="cursor-pointer rounded px-3 py-1 font-medium" style={{ fontSize: 12, backgroundColor: '#c4314b', color: 'white', border: 'none' }}>
            Archive Team
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Helper: Team Icon
// ═══════════════════════════════════════════════════════════

function TeamIcon({ team, size = 'md' }: { team: Team; size?: 'md' | 'lg' }) {
  const s = size === 'lg' ? 40 : 28;
  const icons: Record<string, React.ReactNode> = {
    code: <Code size={s * 0.5} color="white" />,
    palette: <Palette size={s * 0.5} color="white" />,
    bug: <Bug size={s * 0.5} color="white" />,
    crown: <Crown size={s * 0.5} color="white" />,
    folder: <FolderOpen size={s * 0.5} color="white" />,
  };

  return (
    <div
      className="flex items-center justify-center rounded"
      style={{ width: s, height: s, backgroundColor: team.color }}
      aria-hidden="true"
    >
      {icons[team.icon] || <FolderOpen size={s * 0.5} color="white" />}
    </div>
  );
}
