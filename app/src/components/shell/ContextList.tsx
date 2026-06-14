import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/providers/trpc';
import { useStore } from '@/store/useStore';
import { Avatar } from '@/components/shared/Avatar';
import {
  employees as mockEmployees, conversations, emailThreads, getEmployeeById,
  type Employee, type EmailThread,
} from '@/data/mockData';
import {
  Search, Users, MessageSquare, Phone, Hash, Lock,
  Megaphone, Globe, Inbox, ChevronRight, Sparkles,
  CircleDot, Calendar, Shield, CheckCircle2, Target,
  FolderKanban, TrendingUp, Zap, DollarSign,
  ShieldCheck, AlertTriangle, X,
} from 'lucide-react';
import { projects, getHealthColor, getHealthLabel, getSparklineData } from '@/data/mockData';

/* ─── Org Channels ────────────────────────────────────────── */

const orgChannels = [
  { id: 'ch-general', name: 'general', type: 'public' as const, memberCount: 9, unreadCount: 3, lastMessage: 'Sprint 14 planning moved to 2pm', lastMessageTime: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: 'ch-engineering', name: 'engineering', type: 'public' as const, memberCount: 7, unreadCount: 8, lastMessage: 'Aria: All API tests passing', lastMessageTime: new Date(Date.now() - 12 * 60000).toISOString() },
  { id: 'ch-frontend', name: 'frontend', type: 'public' as const, memberCount: 4, unreadCount: 2, lastMessage: 'Raj: Dashboard widgets ready', lastMessageTime: new Date(Date.now() - 25 * 60000).toISOString() },
  { id: 'ch-backend', name: 'backend', type: 'public' as const, memberCount: 3, unreadCount: 5, lastMessage: 'Sage: DB migration complete', lastMessageTime: new Date(Date.now() - 40 * 60000).toISOString() },
  { id: 'ch-design', name: 'design', type: 'public' as const, memberCount: 3, unreadCount: 1, lastMessage: 'Pixel: New icon set uploaded', lastMessageTime: new Date(Date.now() - 60 * 60000).toISOString() },
  { id: 'ch-ai-updates', name: 'ai-agent-updates', type: 'announcement' as const, memberCount: 9, unreadCount: 4, lastMessage: 'Echo: Auto-scaled production cluster', lastMessageTime: new Date(Date.now() - 8 * 60000).toISOString() },
  { id: 'ch-leadership', name: 'leadership', type: 'private' as const, memberCount: 3, unreadCount: 0, lastMessage: 'Alex Chen: Q2 planning doc', lastMessageTime: new Date(Date.now() - 120 * 60000).toISOString() },
  { id: 'ch-security', name: 'security-alerts', type: 'private' as const, memberCount: 4, unreadCount: 1, lastMessage: 'Echo: Firewall rule updated', lastMessageTime: new Date(Date.now() - 180 * 60000).toISOString() },
];

/* ─── Call Data ───────────────────────────────────────────── */

const callList = [
  { id: 'call-1', title: 'Daily Standup — Frontend Team', status: 'live' as const, callType: 'standup', recording: true, duration: 8, aiAttendants: ['aria', 'pixel'] },
  { id: 'call-2', title: 'Sprint 14 Planning — All Teams', status: 'scheduled' as const, callType: 'planning', aiAttendants: ['aria', 'sage', 'echo'] },
  { id: 'call-3', title: 'Incident Review — API Latency', status: 'live' as const, callType: 'incident', recording: true, duration: 25, aiAttendants: ['echo', 'sage'] },
  { id: 'call-4', title: 'Weekly Engineering Review', status: 'ended' as const, callType: 'review', duration: 45, aiAttendants: ['manager'] },
  { id: 'call-5', title: '1:1 — Alex Chen & Raj', status: 'scheduled' as const, callType: '1on1', aiAttendants: [] },
];

const typeColors: Record<string, string> = { standup: '#22c55e', review: '#3b82f6', planning: '#f59e0b', incident: '#ef4444', '1on1': '#ec4899' };

/* ════════════════════════════════════════════════════════════
   ContextList — Dynamic sidebar wired to store
   ════════════════════════════════════════════════════════════ */

export function ContextList() {
  const activeItem = useStore((s) => s.activeRailItem);
  const projectSearchQuery = useStore((s) => s.projectSearchQuery);
  const setProjectSearchQuery = useStore((s) => s.setProjectSearchQuery);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use store search for projects tab, local for others
  const searchQuery = activeItem === 'projects' ? projectSearchQuery : localSearchQuery;
  const setSearchQuery = activeItem === 'projects' ? setProjectSearchQuery : setLocalSearchQuery;

  // Keyboard shortcut: focus search on /
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const getTitle = () => {
    const titles: Record<string, string> = {
      projects: 'Projects', teams: 'Teams', chat: 'Chat', calls: 'Calls',
      calendar: 'Calendar', approvals: 'Approvals', security: 'Security', apps: 'Apps',
    };
    return titles[activeItem] || activeItem;
  };

  return (
    <div
      className="flex h-full w-[280px] flex-shrink-0 flex-col border-r"
      style={{ borderColor: 'var(--op-border, #e1e1e1)', backgroundColor: 'var(--op-bg-secondary, #f5f5f3)' }}
      role="complementary"
      aria-label={`${getTitle()} context list`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2.5" style={{ borderColor: 'var(--op-border, #e1e1e1)' }}>
        <h2 className="text-xs font-bold uppercase tracking-wider" style={{ color: '#616161' }}>
          {getTitle()}
        </h2>
      </div>

      {/* Search with clear button */}
      <div className="relative border-b px-3 py-2" style={{ borderColor: 'var(--op-border, #e1e1e1)' }}>
        <Search size={12} className="absolute left-5 top-1/2 -translate-y-1/2" style={{ color: '#767676' }} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search... (press / to focus)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md py-2.5 pl-6 pr-6 text-xs outline-none"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e1e1e1' }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 2 }}
            aria-label="Clear search"
          >
            <X size={10} style={{ color: '#767676' }} />
          </button>
        )}
      </div>

      {/* Dynamic content */}
      <div className="flex-1 overflow-y-auto" role="list">
        {activeItem === 'chat' && <ChatList searchQuery={searchQuery} />}
        {activeItem === 'calls' && <CallsList searchQuery={searchQuery} />}
        {activeItem === 'projects' && <ProjectsContext searchQuery={searchQuery} />}
        {activeItem === 'teams' && <TeamsContext searchQuery={searchQuery} />}
        {activeItem === 'calendar' && <CalendarContext searchQuery={searchQuery} />}
        {activeItem === 'approvals' && <ApprovalList searchQuery={searchQuery} />}
        {activeItem === 'security' && <SecurityContext searchQuery={searchQuery} />}
        {activeItem === 'apps' && <AppsContext searchQuery={searchQuery} />}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Chat List — People + Channels + Mail (all wired to store)
   ════════════════════════════════════════════════════════════ */

const teamGroups = [
  { id: 'grp-eng', name: 'Engineering Team', memberCount: 6, type: 'team', lastMessage: 'Raj: API tests all green' },
  { id: 'grp-design', name: 'Design Studio', memberCount: 3, type: 'team', lastMessage: 'Pixel: New icons uploaded' },
  { id: 'grp-qa', name: 'QA Squad', memberCount: 3, type: 'team', lastMessage: 'Priya: Regression complete' },
  { id: 'grp-mgmt', name: 'Management', memberCount: 3, type: 'leadership', lastMessage: 'Alex Chen: Q2 goals doc' },
  { id: 'grp-ai', name: 'AI Agents', memberCount: 5, type: 'ai', lastMessage: 'Echo: Auto-scaled cluster' },
  { id: 'grp-all', name: 'Company All-Hands', memberCount: 9, type: 'company', lastMessage: 'Sage: Monthly report ready' },
];

function ChatList({ searchQuery }: { searchQuery: string }) {
  const [section, setSection] = useState<'people' | 'groups' | 'channels' | 'mail'>('people');
  const [filterKind, setFilterKind] = useState<'all' | 'human' | 'ai'>('all');
  const selectedChatId = useStore((s) => s.selectedChatId);
  const selectChat = useStore((s) => s.selectChat);
  const { data: apiEmployees } = trpc.chat.employees.useQuery();
  const employees = apiEmployees && apiEmployees.length > 0 ? (apiEmployees as unknown as Employee[]) : mockEmployees;

  // Search/filter implementations
  const filteredPeople = employees.filter((e: Employee) => {
    const matchesSearch = !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterKind === 'all' || e.kind === filterKind;
    return matchesSearch && matchesFilter;
  });

  const filteredGroups = teamGroups.filter((g) =>
    !searchQuery || g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredChannels = orgChannels.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMail = emailThreads.filter((t) =>
    !searchQuery || t.subject.toLowerCase().includes(searchQuery.toLowerCase()) || t.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sectionTabs = [
    { id: 'people' as const, label: 'People', icon: Users, count: filteredPeople.length },
    { id: 'groups' as const, label: 'Groups', icon: Users, count: filteredGroups.length },
    { id: 'channels' as const, label: 'Channels', icon: Hash, count: filteredChannels.length },
    { id: 'mail' as const, label: 'Mail', icon: Inbox, count: filteredMail.length },
  ];

  return (
    <>
      {/* Section tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--op-border, #e1e1e1)' }} role="tablist" aria-label="Chat sections">
        {sectionTabs.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="relative flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-semibold"
            style={{ color: section === s.id ? '#5b5fc7' : '#616161', borderBottom: section === s.id ? '2px solid #5b5fc7' : '2px solid transparent' }}
            role="tab"
            aria-selected={section === s.id}
            aria-label={`${s.label} (${s.count})`}
            tabIndex={section === s.id ? 0 : -1}
          >
            <s.icon size={11} /> {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* PEOPLE */}
      {section === 'people' && (
        <>
          {/* AI/Human filter */}
          <div className="flex gap-1 border-b px-2 py-1.5" style={{ borderColor: '#e8e8e8' }}>
            {[{ id: 'all' as const, label: 'All' }, { id: 'human' as const, label: 'Humans' }, { id: 'ai' as const, label: 'AI' }].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterKind(f.id)}
                className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                style={{ backgroundColor: filterKind === f.id ? '#5b5fc7' : '#e8e8e8', color: filterKind === f.id ? '#ffffff' : '#616161' }}
                aria-pressed={filterKind === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
          {/* Org label */}
          <div className="flex items-center gap-1 px-3 py-1" role="separator"><Globe size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Acme Software</span></div>
          {/* Employee list */}
          {filteredPeople.length === 0 ? (
            <EmptySearchResult />
          ) : (
            filteredPeople.map((emp) => {
              const isSelected = selectedChatId === emp.id;
              return (
                <KeyboardListItem
                  key={emp.id}
                  selected={isSelected}
                  onClick={() => selectChat(emp.id)}
                  ariaLabel={`Chat with ${emp.name}, ${emp.title}`}
                >
                  <Avatar size="sm" alt={emp.name} initials={emp.name.substring(0, 2)} isAi={emp.kind === 'ai'} status={emp.status} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="truncate text-xs font-semibold" style={{ color: '#252422' }}>{emp.name}</span>
                      {emp.kind === 'ai' && <span className="rounded px-1 py-0.5 text-[7px] font-bold" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>AI</span>}
                    </div>
                    <span className="truncate text-[10px]" style={{ color: '#767676' }}>{emp.title}</span>
                  </div>
                </KeyboardListItem>
              );
            })
          )}
        </>
      )}

      {/* GROUPS */}
      {section === 'groups' && (
        <>
          <div className="flex items-center gap-1 px-3 py-1"><Users size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Team Groups</span></div>
          {filteredGroups.length === 0 ? <EmptySearchResult /> : filteredGroups.map((g) => {
            const groupColors: Record<string, string> = { team: '#5b5fc7', leadership: '#c4314b', ai: '#7c3aed', company: '#237b4b' };
            const color = groupColors[g.type] || '#5b5fc7';
            return (
              <KeyboardListItem
                key={g.id}
                onClick={() => selectChat(g.id)}
                ariaLabel={`${g.name} group, ${g.memberCount} members`}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: color + '18', color }}>
                  <Users size={11} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="truncate text-xs font-semibold" style={{ color: '#252422' }}>{g.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px]" style={{ color: '#767676' }}>{g.memberCount} members</span>
                    {g.type === 'ai' && <span className="rounded px-1 py-0.5 text-[7px] font-bold" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>AI</span>}
                  </div>
                </div>
                <CircleDot size={10} style={{ color, flexShrink: 0 }} />
              </KeyboardListItem>
            );
          })}
        </>
      )}

      {/* CHANNELS */}
      {section === 'channels' && (
        <>
          <div className="flex items-center gap-1 px-3 py-1"><Hash size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Organization</span></div>
          {filteredChannels.length === 0 ? <EmptySearchResult /> : filteredChannels.map((ch) => {
            const Icon = ch.type === 'announcement' ? Megaphone : ch.type === 'private' ? Lock : Hash;
            return (
              <KeyboardListItem
                key={ch.id}
                ariaLabel={`#${ch.name} channel, ${ch.memberCount} members`}
              >
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded" style={{ backgroundColor: ch.type === 'announcement' ? '#fef3c7' : ch.type === 'private' ? '#fee2e2' : '#e0e7ff', color: ch.type === 'announcement' ? '#f59e0b' : ch.type === 'private' ? '#ef4444' : '#5b5fc7' }}>
                  <Icon size={11} />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="truncate text-xs font-semibold" style={{ color: '#252422' }}>#{ch.name}</span>
                  <span className="ml-1 text-[9px]" style={{ color: '#767676' }}>({ch.memberCount})</span>
                </div>
                {ch.unreadCount > 0 && <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white" aria-label={`${ch.unreadCount} unread`}>{ch.unreadCount}</span>}
              </KeyboardListItem>
            );
          })}
        </>
      )}

      {/* MAIL */}
      {section === 'mail' && (
        <>
          <div className="flex items-center gap-1 px-3 py-1"><Inbox size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Mail Threads</span></div>
          {filteredMail.length === 0 ? <EmptySearchResult /> : filteredMail.map((thread) => {
            const lastMsg = thread.messages[thread.messages.length - 1];
            const fromEmp = getEmployeeById(lastMsg.from);
            return (
              <KeyboardListItem
                key={thread.id}
                ariaLabel={`Email thread: ${thread.subject}`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {fromEmp ? <Avatar size="sm" alt={fromEmp.name} initials={fromEmp.name.substring(0, 2)} isAi={fromEmp.kind === 'ai'} status={fromEmp.status} /> : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-xs">?</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold" style={{ color: thread.unread ? '#252422' : '#8a8a8a' }}>{thread.subject}</span>
                    {thread.unread && <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" aria-label="Unread" />}
                  </div>
                  <p className="truncate text-[10px]" style={{ color: '#767676' }}>{lastMsg.content.substring(0, 50)}...</p>
                  <span className="text-[9px]" style={{ color: '#c8c8c8' }}>{fromEmp?.name || lastMsg.from}</span>
                </div>
              </KeyboardListItem>
            );
          })}
        </>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Calls List — Wired to store
   ════════════════════════════════════════════════════════════ */

function CallsList({ searchQuery }: { searchQuery: string }) {
  const [tab, setTab] = useState<'active' | 'scheduled' | 'history'>('active');
  const selectedCallId = useStore((s) => s.selectedCallId);
  const selectCall = useStore((s) => s.selectCall);

  const filtered = callList
    .filter((c) => (tab === 'active' ? c.status === 'live' : tab === 'scheduled' ? c.status === 'scheduled' : c.status === 'ended'))
    .filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      <div className="flex border-b" style={{ borderColor: 'var(--op-border, #e1e1e1)' }} role="tablist" aria-label="Call filter">
        {[{ id: 'active' as const, label: 'Live' }, { id: 'scheduled' as const, label: 'Upcoming' }, { id: 'history' as const, label: 'Past' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 py-2 text-center text-[10px] font-semibold"
            style={{ color: tab === t.id ? '#5b5fc7' : '#616161', borderBottom: tab === t.id ? '2px solid #5b5fc7' : '2px solid transparent' }}
            role="tab"
            aria-selected={tab === t.id}
            tabIndex={tab === t.id ? 0 : -1}
          >
            {t.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptySearchResult /> : filtered.map((call) => {
        const tc = typeColors[call.callType] || '#5b5fc7';
        const isSelected = selectedCallId === call.id;
        return (
          <KeyboardListItem
            key={call.id}
            selected={isSelected}
            onClick={() => selectCall(call.id)}
            ariaLabel={`${call.title}, ${call.callType}, ${call.status}`}
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-shrink-0">
                {call.status === 'live' ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#fee2e2' }}>
                    <Phone size={14} style={{ color: '#ef4444' }} />
                  </div>
                ) : call.status === 'scheduled' ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#fef3c7' }}>
                    <Calendar size={14} style={{ color: '#f59e0b' }} />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: '#f0f0f0' }}>
                    <PhoneOff size={14} style={{ color: '#767676' }} />
                  </div>
                )}
                {call.status === 'live' && <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white" style={{ backgroundColor: '#ef4444' }} />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="truncate text-xs font-semibold" style={{ color: '#252422' }}>{call.title}</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="rounded px-1 py-0.5 text-[9px] font-semibold" style={{ backgroundColor: tc + '15', color: tc }}>{call.callType}</span>
                  {call.recording && <span className="flex items-center gap-0.5 text-[9px]" style={{ color: '#c4314b' }}><CircleDot size={7} /> REC</span>}
                </div>
              </div>
            </div>
            {call.aiAttendants.length > 0 && (
              <span className="mt-1 flex items-center gap-0.5 text-[9px] font-semibold" style={{ color: '#7c3aed' }}>
                <Sparkles size={8} /> {call.aiAttendants.length} AI attending
              </span>
            )}
          </KeyboardListItem>
        );
      })}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Projects Context — KPI strip + project list
   ════════════════════════════════════════════════════════════ */

function ProjectsContext({ searchQuery }: { searchQuery: string }) {
  const selectProject = useStore((s) => s.selectProject);
  const selectedProjectId = useStore((s) => s.selectedProjectId);
  const sparkData = getSparklineData().map((v, i) => ({ i, v }));

  const filteredProjects = projects.filter((p) =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.key.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mini KPI strip */}
      <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--op-border, #e1e1e1)', backgroundColor: '#ebebea' }}>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={12} color="#5b5fc7" />
            <span className="text-[10px] font-semibold" style={{ color: '#242424' }}>{projects.length} Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users size={12} color="#5b5fc7" />
            <span className="text-[10px] font-semibold" style={{ color: '#242424' }}>9 Members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} color="#237b4b" />
            <span className="text-[10px] font-semibold" style={{ color: '#242424' }}>42 pts/sprint</span>
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign size={12} color="#b56200" />
            <span className="text-[10px] font-semibold" style={{ color: '#242424' }}>68% Budget</span>
          </div>
        </div>
      </div>

      {/* Project list */}
      <div className="flex items-center gap-1 px-3 py-1.5"><FolderKanban size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Active Projects</span></div>

      {filteredProjects.length === 0 ? <EmptySearchResult /> : filteredProjects.map((project) => {
        const isSelected = selectedProjectId === project.id;
        const nonBugTickets = project.tickets.filter((t) => t.type !== 'bug');
        const progress = Math.round((nonBugTickets.filter((t) => t.status === 'done').length / Math.max(nonBugTickets.length, 1)) * 100);
        return (
          <KeyboardListItem
            key={project.id}
            selected={isSelected}
            onClick={() => selectProject(project.id)}
            ariaLabel={`${project.name}, ${project.key}, ${progress}% complete`}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span className="truncate text-xs font-semibold" style={{ color: '#252422' }}>{project.name}</span>
              <span className="rounded px-1 py-0.5 text-[8px] font-semibold" style={{ backgroundColor: getHealthColor(project.health) + '22', color: getHealthColor(project.health) }}>{getHealthLabel(project.health)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px]" style={{ color: '#767676' }}>{project.key} · {nonBugTickets.length} tasks</span>
              <span className="text-[10px] font-semibold" style={{ color: '#5b5fc7' }}>{progress}%</span>
            </div>
            <div className="mt-1 w-full overflow-hidden rounded-full" style={{ height: 3, backgroundColor: '#e1e1e1' }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: getHealthColor(project.health) }} />
            </div>
          </KeyboardListItem>
        );
      })}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Teams Context — Searchable team list
   ════════════════════════════════════════════════════════════ */

function TeamsContext({ searchQuery }: { searchQuery: string }) {
  const teams = [
    { id: 't1', name: 'Frontend Squad', count: 4, icon: Users },
    { id: 't2', name: 'Backend Crew', count: 3, icon: Users },
    { id: 't3', name: 'Design Studio', count: 3, icon: Users },
    { id: 't4', name: 'DevOps Cell', count: 2, icon: Users },
  ];
  const filtered = teams.filter((t) => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <>
      {filtered.length === 0 ? <EmptySearchResult /> : filtered.map((t) => (
        <KeyboardListItem key={t.id} ariaLabel={`${t.name}, ${t.count} members`}>
          <t.icon size={13} style={{ color: '#5b5fc7', flexShrink: 0 }} />
          <span className="flex-1 truncate text-xs font-medium" style={{ color: '#333' }}>{t.name}</span>
          <span className="text-[9px]" style={{ color: '#767676' }}>{t.count}</span>
        </KeyboardListItem>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Calendar Context
   ════════════════════════════════════════════════════════════ */

function CalendarContext({ searchQuery }: { searchQuery: string }) {
  const items = [
    { label: 'Today', icon: Calendar, detail: '3 events' },
    { label: 'This Week', icon: Calendar, detail: '12 events' },
    { label: 'This Month', icon: Calendar, detail: '48 events' },
    { label: 'Upcoming', icon: Calendar, detail: '5 soon' },
  ];
  const filtered = items.filter((i) => !searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <>
      {filtered.length === 0 ? <EmptySearchResult /> : filtered.map((item, i) => (
        <KeyboardListItem key={i} ariaLabel={`${item.label}, ${item.detail}`}>
          <item.icon size={13} style={{ color: '#5b5fc7' }} />
          <span className="flex-1 text-xs font-medium" style={{ color: '#333' }}>{item.label}</span>
          <span className="text-[9px]" style={{ color: '#767676' }}>{item.detail}</span>
        </KeyboardListItem>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Approval List — Searchable
   ════════════════════════════════════════════════════════════ */

function ApprovalList({ searchQuery }: { searchQuery: string }) {
  const approvals = useStore((s) => s.approvals);
  const items = [
    { label: 'Pending', count: approvals.filter((a) => a.status === 'pending').length, color: '#f59e0b' },
    { label: 'Approved', count: approvals.filter((a) => a.status === 'approved').length, color: '#22c55e' },
    { label: 'Rejected', count: approvals.filter((a) => a.status === 'rejected').length, color: '#ef4444' },
  ];
  const filtered = items.filter((i) => !searchQuery || i.label.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <>
      {filtered.length === 0 ? <EmptySearchResult /> : filtered.map((item) => (
        <KeyboardListItem key={item.label} ariaLabel={`${item.label} approvals: ${item.count}`}>
          <span className="flex-1 text-xs font-medium" style={{ color: '#333' }}>{item.label}</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: item.color }}>{item.count}</span>
        </KeyboardListItem>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Security Context — Role-aware sidebar
   ════════════════════════════════════════════════════════════ */

function SecurityContext({ searchQuery }: { searchQuery: string }) {
  const userRole = useStore((s) => s.currentUser.role);
  const policies = useStore((s) => s.securityPolicies);
  const activeCount = policies.filter((p) => p.status === 'active').length;
  const warningCount = policies.filter((p) => p.status === 'warning').length;

  const getItems = () => {
    if (userRole === 'Owner') return ['Dashboard', 'Policy Engine', 'RBAC & Roles', 'Trust Scores', 'Access Logs'];
    if (userRole === 'Manager') return ['Dashboard', 'Policies', 'Trust Scores', 'Team Logs'];
    return ['My Rules', 'My Trust Score', 'My Access Logs'];
  };

  const items = getItems().filter((item) => !searchQuery || item.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <>
      {userRole === 'Owner' && (
        <>
          <div className="flex items-center gap-1 px-3 py-1.5"><Shield size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Admin Controls</span></div>
          {items.map((item) => (
            <KeyboardListItem key={item} ariaLabel={item}>
              <Shield size={12} color="#5b5fc7" /><span className="text-xs font-medium" style={{ color: '#252422' }}>{item}</span>
            </KeyboardListItem>
          ))}
        </>
      )}
      {userRole === 'Manager' && (
        <>
          <div className="flex items-center gap-1 px-3 py-1.5"><Shield size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Security Manager</span></div>
          {items.map((item) => (
            <KeyboardListItem key={item} ariaLabel={item}>
              <Shield size={12} color="#5b5fc7" /><span className="text-xs font-medium" style={{ color: '#252422' }}>{item}</span>
            </KeyboardListItem>
          ))}
        </>
      )}
      {userRole === 'Member' && (
        <>
          <div className="border-b px-3 py-2.5" style={{ borderColor: 'var(--op-border, #e1e1e1)', backgroundColor: '#ebebea' }}>
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={12} color="#237b4b" />
              <span className="text-[10px] font-semibold" style={{ color: '#237b4b' }}>{activeCount} Active Policies</span>
            </div>
            {warningCount > 0 && (
              <div className="mt-1 flex items-center gap-1.5">
                <AlertTriangle size={12} color="#f59e0b" />
                <span className="text-[10px] font-semibold" style={{ color: '#f59e0b' }}>{warningCount} Warnings</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 px-3 py-1.5"><Shield size={10} style={{ color: '#767676' }} /><span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>My Security</span></div>
          {items.map((item) => (
            <KeyboardListItem key={item} ariaLabel={item}>
              <Shield size={12} color="#5b5fc7" /><span className="text-xs font-medium" style={{ color: '#252422' }}>{item}</span>
            </KeyboardListItem>
          ))}
        </>
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Apps Context
   ════════════════════════════════════════════════════════════ */

function AppsContext({ searchQuery }: { searchQuery: string }) {
  const apps = [
    { label: 'Work MCPs', icon: Sparkles },
    { label: 'Admin Apps', icon: Sparkles },
    { label: 'Workforce', icon: Users },
    { label: 'AI Profile', icon: Sparkles },
  ];
  const filtered = apps.filter((a) => !searchQuery || a.label.toLowerCase().includes(searchQuery.toLowerCase()));
  return (
    <>
      {filtered.length === 0 ? <EmptySearchResult /> : filtered.map((app, i) => (
        <KeyboardListItem key={i} ariaLabel={app.label}>
          <app.icon size={13} style={{ color: '#5b5fc7' }} />
          <span className="text-xs font-medium" style={{ color: '#333' }}>{app.label}</span>
        </KeyboardListItem>
      ))}
    </>
  );
}

/* ════════════════════════════════════════════════════════════
   Shared: Keyboard-accessible list item
   ════════════════════════════════════════════════════════════ */

interface KeyboardListItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  ariaLabel?: string;
}

function KeyboardListItem({ children, onClick, selected, ariaLabel }: KeyboardListItemProps) {
  return (
    <div
      role="listitem"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="flex cursor-pointer items-center gap-2 border-b px-3 py-2 transition-colors"
      style={{
        borderColor: '#e8e8e8',
        backgroundColor: selected ? '#e8e8ff' : 'transparent',
        outline: 'none',
      }}
      aria-label={ariaLabel}
      onFocus={(e) => { if (!selected) e.currentTarget.style.backgroundColor = '#ececf8'; }}
      onBlur={(e) => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
      onMouseEnter={(e) => { if (!selected) e.currentTarget.style.backgroundColor = '#ececf8'; }}
      onMouseLeave={(e) => { if (!selected) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {children}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Shared: Empty search result
   ════════════════════════════════════════════════════════════ */

function EmptySearchResult() {
  return (
    <div className="px-3 py-8 text-center">
      <Search size={20} style={{ color: '#c8c8c8', margin: '0 auto' }} />
      <p className="mt-2 text-[11px]" style={{ color: '#767676' }}>No results found</p>
    </div>
  );
}

/* ─── SVG Icons not in lucide ─────────────────────────────── */

function PhoneOff({ size, style }: { size: number; style?: React.CSSProperties }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{style}}><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.86.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" /><line x1="22" x2="2" y1="2" y2="22" /></svg>;
}
