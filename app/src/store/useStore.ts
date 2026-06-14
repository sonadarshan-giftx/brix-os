// ============================================================
// Brixstac — Zustand Store with Persistence & Undo/Redo
// ============================================================

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { enableMapSet } from 'immer';
import { immer } from 'zustand/middleware/immer';
import {
  currentUser,
  approvals as initialApprovals,
  projects as initialProjects,
  teams as initialTeams,
  allTickets as initialTickets,
  allSprints as initialSprints,
  conversations as initialConversations,
  meetings as initialMeetings,
} from '@/data/mockData';
import type {
  Employee,
  Project,
  Team,
  Ticket,
  Sprint,
  Conversation,
  Meeting,
  Approval,
} from '@/data/mockData';
import { sanitizeInput } from '@/utils/helpers';
import { STORAGE_KEYS, UNDO_STACK_LIMIT } from '@/const';

enableMapSet();

// ── App Config Types ────────────────────────────────────────

export interface AppConfig {
  appName: string;
  apiEndpoint: string;
  authToken: string;
  webhookUrl: string;
  events: string[];
}

export interface AppWebhook {
  id: string;
  app: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastDelivery: string;
}

export interface AppApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  scopes: string;
}

export interface AppIntegrationLog {
  id: string;
  app: string;
  action: string;
  status: 'success' | 'error' | 'warning';
  timestamp: string;
  details?: string;
}

// ── Undo/Redo Types ─────────────────────────────────────────

interface UndoFrame {
  label: string;
  timestamp: number;
  patches: Partial<AppState>;
}

// ── Search/Filter Types ─────────────────────────────────────

export interface FilterState {
  searchQuery: string;
  statusFilter: string | null;
  priorityFilter: string | null;
  assigneeFilter: string | null;
  dateRange: { start: string | null; end: string | null } | null;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export interface LoadingState {
  projects: boolean;
  teams: boolean;
  tickets: boolean;
  sprints: boolean;
  approvals: boolean;
  conversations: boolean;
  meetings: boolean;
  settings: boolean;
  rbac: boolean;
}

// ── Main State Interface ────────────────────────────────────

interface AppState {
  // ── User ──
  currentUser: Employee;

  // ── Entity Collections ──
  projects: Project[];
  teams: Team[];
  tickets: Ticket[];
  sprints: Sprint[];
  conversations: Conversation[];
  meetings: Meeting[];
  approvals: Approval[];

  // ── Navigation ──
  activeRailItem: string;

  // ── Scope / Selection ──
  activeScope: string | null;
  activeScopeId: string | null;
  selectedChatId: string | null;
  selectedCallId: string | null;
  selectedProjectId: string | null;
  selectedTeamId: string | null;
  selectedTicketId: string | null;

  // ── Project Search Sync ──
  projectSearchQuery: string;

  // ── Auth Tokens ──
  apiToken: string | null;
  refreshToken: string | null;

  // ── Workspace / Organization ──
  workspace: Workspace | null;
  workspaces: Workspace[];
  workspaceInvites: WorkspaceInvite[];

  // ── UI State ──
  contextListOpen: boolean;
  rightRailOpen: boolean;
  missionTab: string;
  notifications: { id: string; message: string; read: boolean; timestamp: string }[];
  onboardingComplete: boolean;

  // ── Theme ──
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: number;
  settingsOpen: boolean;

  // ── Search/Filter ──
  filters: FilterState;

  // ── Loading ──
  loading: LoadingState;

  // ── Undo/Redo ──
  undoStack: UndoFrame[];
  redoStack: UndoFrame[];

  // ── Dialogs ──
  createProjectDialogOpen: boolean;
  createTaskDialogOpen: boolean;
  createBugDialogOpen: boolean;
  assignTaskDialogOpen: boolean;
  activeDialogProjectId: string | null;

  // ── RBAC ──
  rbacRoles: RoleConfig[];
  securityPolicies: SecurityPolicyConfig[];

  // ── VPN & Secure Access ──
  vpnEnabled: boolean;
  vpnConnectedUsers: number;
  devicePostureRequired: boolean;
  geoBlockingEnabled: boolean;
  trustedNetworks: string[];

  // ── App Configuration ──
  appConfigs: Record<string, AppConfig>;
  appWebhooks: AppWebhook[];
  appApiKeys: AppApiKey[];
  appIntegrationLogs: AppIntegrationLog[];

  // ── Derived ──
  approvalCount: number;

  // ── App Config Actions ──
  setAppConfig: (appName: string, config: Partial<AppConfig>) => void;
  addWebhook: (webhook: Omit<AppWebhook, 'id'> & { id?: string }) => void;
  updateWebhook: (id: string, updates: Partial<AppWebhook>) => void;
  deleteWebhook: (id: string) => void;
  addAppApiKey: (key: Omit<AppApiKey, 'id'> & { id?: string }) => void;
  revokeAppApiKey: (id: string) => void;
  addIntegrationLog: (log: Omit<AppIntegrationLog, 'id'> & { id?: string }) => void;
  clearIntegrationLogs: () => void;

  // ════════════════════════════════════════════
  // Actions
  // ════════════════════════════════════════════

  // ── Theme Actions ──
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: number) => void;
  openSettings: () => void;
  closeSettings: () => void;

  // ── Navigation Actions ──
  setActiveRailItem: (item: string) => void;
  selectProject: (projectId: string) => void;
  selectTeam: (teamId: string) => void;
  selectChat: (chatId: string) => void;
  selectCall: (callId: string) => void;
  selectTicket: (ticketId: string) => void;
  setCurrentUserRole: (role: 'Owner' | 'Manager' | 'Member') => void;

  // ── Auth Actions ──
  setCurrentUser: (user: Employee | null, token?: string, refreshToken?: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setWorkspace: (workspace: any) => void;
  createWorkspace: (workspace: any) => void;
  addWorkspaceMember: (workspaceId: string, member: any) => void;
  setWorkspaceInvites: (invites: any[]) => void;
  logout: () => void;

  // ── UI Actions ──
  toggleContextList: () => void;
  toggleRightRail: () => void;
  openRightRail: () => void;
  closeRightRail: () => void;
  setMissionTab: (tab: string) => void;
  setActiveScope: (scope: string | null, scopeId: string | null) => void;
  addNotification: (n: { id: string; message: string; read?: boolean }) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  completeOnboarding: () => void;

  // ── Loading Actions ──
  setLoading: (key: keyof LoadingState, value: boolean) => void;

  // ── Filter Actions ──
  setSearchQuery: (query: string) => void;
  setProjectSearchQuery: (query: string) => void;
  setStatusFilter: (status: string | null) => void;
  setPriorityFilter: (priority: string | null) => void;
  setAssigneeFilter: (assigneeId: string | null) => void;
  resetFilters: () => void;

  // ── Dialog Actions ──
  openCreateProject: () => void;
  closeCreateProject: () => void;
  openCreateTask: (projectId?: string) => void;
  closeCreateTask: () => void;
  openCreateBug: (projectId?: string) => void;
  closeCreateBug: () => void;
  openAssignTask: (projectId?: string) => void;
  closeAssignTask: () => void;

  // ── Project CRUD ──
  addProject: (project: Omit<Project, 'id'> & { id?: string }) => Project;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  // ── Team CRUD ──
  addTeam: (team: Omit<Team, 'id'> & { id?: string }) => Team;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  deleteTeam: (teamId: string) => void;

  // ── Ticket CRUD ──
  addTicket: (ticket: Omit<Ticket, 'id' | 'key' | 'createdAt'> & { id?: string }) => Ticket;
  updateTicket: (ticketId: string, updates: Partial<Ticket>) => void;
  deleteTicket: (ticketId: string) => void;

  // ── Sprint CRUD ──
  addSprint: (sprint: Omit<Sprint, 'id'> & { id?: string }) => Sprint;
  updateSprint: (sprintId: string, updates: Partial<Sprint>) => void;
  deleteSprint: (sprintId: string) => void;

  // ── Conversation CRUD ──
  addConversation: (conv: Omit<Conversation, 'id'> & { id?: string }) => Conversation;
  updateConversation: (convId: string, updates: Partial<Conversation>) => void;
  deleteConversation: (convId: string) => void;
  addMessage: (convId: string, message: { senderId: string; content: string; attachments?: { name: string; url: string }[] }) => void;

  // ── Meeting CRUD ──
  addMeeting: (meeting: Omit<Meeting, 'id'> & { id?: string }) => Meeting;
  updateMeeting: (meetingId: string, updates: Partial<Meeting>) => void;
  deleteMeeting: (meetingId: string) => void;

  // ── Approval CRUD ──
  addApproval: (approval: Omit<Approval, 'id'> & { id?: string }) => Approval;
  updateApproval: (approvalId: string, updates: Partial<Approval>) => void;
  deleteApproval: (approvalId: string) => void;

  // ── RBAC Actions ──
  addRole: (role: RoleConfig) => void;
  deleteRole: (roleId: string) => void;
  updateRole: (roleId: string, updates: Partial<RoleConfig>) => void;
  togglePolicy: (policyId: string, status: 'active' | 'warning' | 'disabled') => void;
  setPolicyScope: (policyId: string, scope: string) => void;

  // ── VPN & Secure Access Actions ──
  toggleVpn: () => void;
  setVpnConnectedUsers: (count: number) => void;
  toggleDevicePosture: () => void;
  toggleGeoBlocking: () => void;
  addTrustedNetwork: (network: string) => void;
  removeTrustedNetwork: (network: string) => void;

  // ── Undo/Redo Actions ──
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  permissions: {
    canCreateProject: boolean;
    canCreateTask: boolean;
    canCreateBug: boolean;
    canAssignTask: boolean;
    canApprove: boolean;
    canManageTeam: boolean;
    canConfigureSecurity: boolean;
    canViewAllProjects: boolean;
    canViewAllUsers: boolean;
    canViewBudget: boolean;
    canManageRoles: boolean;
  };
  visibleRailItems: string[];
  scope: 'owner' | 'manager' | 'member';
}

export interface SecurityPolicyConfig {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'warning' | 'disabled';
  severity: 'critical' | 'high' | 'medium' | 'low';
  scope: 'all' | 'ai-only' | 'human-only' | 'owner' | 'manager';
  lastModified: string;
}

const DEFAULT_ROLES: RoleConfig[] = [
  {
    id: 'role-owner',
    name: 'Owner / CEO',
    description:
      'Full system access. Can create roles, configure security, manage all projects and users.',
    color: '#c4314b',
    scope: 'owner',
    permissions: {
      canCreateProject: true,
      canCreateTask: true,
      canCreateBug: true,
      canAssignTask: true,
      canApprove: true,
      canManageTeam: true,
      canConfigureSecurity: true,
      canViewAllProjects: true,
      canViewAllUsers: true,
      canViewBudget: true,
      canManageRoles: true,
    },
    visibleRailItems: [
      'projects',
      'teams',
      'chat',
      'calls',
      'calendar',
      'approvals',
      'security',
      'apps',
    ],
  },
  {
    id: 'role-manager',
    name: 'Manager',
    description:
      'Can manage their team, approve requests, view team projects and budgets.',
    color: '#D97757',
    scope: 'manager',
    permissions: {
      canCreateProject: false,
      canCreateTask: true,
      canCreateBug: true,
      canAssignTask: true,
      canApprove: true,
      canManageTeam: true,
      canConfigureSecurity: false,
      canViewAllProjects: false,
      canViewAllUsers: true,
      canViewBudget: true,
      canManageRoles: false,
    },
    visibleRailItems: [
      'projects',
      'teams',
      'chat',
      'calls',
      'calendar',
      'approvals',
      'security',
      'apps',
    ],
  },
  {
    id: 'role-member',
    name: 'Member',
    description:
      'Can work on assigned tasks, participate in chat and calls, view their own projects.',
    color: '#616161',
    scope: 'member',
    permissions: {
      canCreateProject: false,
      canCreateTask: false,
      canCreateBug: true,
      canAssignTask: false,
      canApprove: false,
      canManageTeam: false,
      canConfigureSecurity: false,
      canViewAllProjects: false,
      canViewAllUsers: false,
      canViewBudget: false,
      canManageRoles: false,
    },
    visibleRailItems: ['projects', 'teams', 'chat', 'calls', 'calendar', 'apps'],
  },
];

const DEFAULT_POLICIES: SecurityPolicyConfig[] = [
  { id: 'pol-1', name: 'MFA Required \u2014 All Humans', description: 'Every human employee must use TOTP or hardware key for authentication', status: 'active', severity: 'critical', scope: 'human-only', lastModified: '2026-04-01' },
  { id: 'pol-2', name: 'AI Agent Permission Boundaries', description: 'AI employees cannot access customer PII or financial records without explicit human approval', status: 'active', severity: 'critical', scope: 'ai-only', lastModified: '2026-04-10' },
  { id: 'pol-3', name: 'Device Trust Verification', description: 'Only MDM-enrolled devices can access company resources. BYOD requires security scan.', status: 'warning', severity: 'high', scope: 'all', lastModified: '2026-04-15' },
  { id: 'pol-4', name: 'Network Segmentation', description: 'AI agents operate in isolated VPCs with no direct outbound internet access', status: 'active', severity: 'high', scope: 'ai-only', lastModified: '2026-04-05' },
  { id: 'pol-5', name: 'Least Privilege Access', description: 'Every access request verified against role, context, and need-to-know basis', status: 'active', severity: 'critical', scope: 'all', lastModified: '2026-04-01' },
  { id: 'pol-6', name: 'Continuous Session Verification', description: 'Re-authenticate every 4 hours or on IP/device change', status: 'active', severity: 'medium', scope: 'all', lastModified: '2026-04-12' },
  { id: 'pol-7', name: 'Admin Override Audit', description: 'All admin privilege escalations logged with mandatory peer review within 24h', status: 'active', severity: 'high', scope: 'owner', lastModified: '2026-04-08' },
  { id: 'pol-8', name: 'AI Token Budget Controls', description: 'AI agents have per-session token budgets with auto-cutoff at threshold', status: 'active', severity: 'medium', scope: 'ai-only', lastModified: '2026-04-18' },
  { id: 'pol-9', name: 'Data Loss Prevention', description: 'Automatic scanning and blocking of sensitive data in outbound communications', status: 'warning', severity: 'high', scope: 'all', lastModified: '2026-04-20' },
  { id: 'pol-10', name: 'Anomaly Detection', description: 'ML-based detection of unusual access patterns for both human and AI users', status: 'active', severity: 'medium', scope: 'all', lastModified: '2026-04-22' },
];

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  statusFilter: null,
  priorityFilter: null,
  assigneeFilter: null,
  dateRange: null,
  sortBy: 'createdAt',
  sortDirection: 'desc',
};

const DEFAULT_LOADING: LoadingState = {
  projects: false,
  teams: false,
  tickets: false,
  sprints: false,
  approvals: false,
  conversations: false,
  meetings: false,
  settings: false,
  rbac: false,
};

// ── ID Generator ────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Snapshots for Undo/Redo ─────────────────────────────────

function getUndoSnapshot(state: AppState): Partial<AppState> {
  return {
    projects: state.projects,
    teams: state.teams,
    tickets: state.tickets,
    sprints: state.sprints,
    conversations: state.conversations,
    meetings: state.meetings,
    approvals: state.approvals,
    rbacRoles: state.rbacRoles,
    securityPolicies: state.securityPolicies,
  };
}

// ── Store Creation ──────────────────────────────────────────

export const useStore = create<AppState>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // ════════════════════════════════════════════
          // Initial State
          // ════════════════════════════════════════════

          // ── User ──
          currentUser: null,

          // ── Auth Tokens ──
          apiToken: null as string | null,
          refreshToken: null as string | null,

          // ── Entity Collections ──
          projects: initialProjects,
          teams: initialTeams,
          tickets: initialTickets,
          sprints: initialSprints,
          conversations: initialConversations,
          meetings: initialMeetings,
          approvals: initialApprovals,

          // ── Navigation ──
          activeRailItem: 'home',

          // ── Scope / Selection ──
          activeScope: null,
          activeScopeId: null,
          selectedChatId: null,
          selectedCallId: null,
          selectedProjectId: null,
          selectedTeamId: null,
          selectedTicketId: null,

          // ── Project Search Sync ──
          projectSearchQuery: '',

          // ── Workspace ──
          workspace: null,
          workspaces: [],
          workspaceInvites: [],
          authToken: '',

          // ── UI State ──
          contextListOpen: true,
          rightRailOpen: false,
          missionTab: 'quarter',
          onboardingComplete: false,
          settingsOpen: false,

          // ── Theme ──
          theme: 'light',
          accentColor: '#D97757',
          fontSize: 14,

          // ── Search/Filter ──
          filters: { ...DEFAULT_FILTERS },

          // ── Loading ──
          loading: { ...DEFAULT_LOADING },

          // ── Undo/Redo ──
          undoStack: [],
          redoStack: [],

          // ── Notifications ──
          notifications: [
            { id: 'n1', message: 'Aria mentioned you in #frontend', read: false, timestamp: '2026-05-01T09:00:00Z' },
            { id: 'n2', message: 'PR #347 needs your review', read: false, timestamp: '2026-05-01T08:30:00Z' },
            { id: 'n3', message: 'Sprint 13 planning in 24 hours', read: false, timestamp: '2026-04-30T17:00:00Z' },
          ],

          // ── Dialog State ──
          createProjectDialogOpen: false,
          createTaskDialogOpen: false,
          createBugDialogOpen: false,
          assignTaskDialogOpen: false,
          activeDialogProjectId: null,

          // ── RBAC State ──
          rbacRoles: DEFAULT_ROLES,
          securityPolicies: DEFAULT_POLICIES,

          // ── VPN & Secure Access State ──
          vpnEnabled: true,
          vpnConnectedUsers: 7,
          devicePostureRequired: true,
          geoBlockingEnabled: true,
          trustedNetworks: ['10.0.0.0/8', '192.168.0.0/16'],

          // ── App Configuration ──
          appConfigs: {},
          appWebhooks: [
            { id: 'wh-gh-1', app: 'GitHub', url: 'https://api.brixos.io/webhooks/github', events: ['push', 'pr', 'merge'], status: 'active', lastDelivery: '2 min ago' },
            { id: 'wh-slack-1', app: 'Slack', url: 'https://api.brixos.io/webhooks/slack', events: ['message', 'reaction', 'channel'], status: 'active', lastDelivery: '1 min ago' },
            { id: 'wh-linear-1', app: 'Linear', url: 'https://api.brixos.io/webhooks/linear', events: ['issue', 'cycle'], status: 'active', lastDelivery: '5 min ago' },
            { id: 'wh-sentry-1', app: 'Sentry', url: 'https://api.brixos.io/webhooks/sentry', events: ['alert', 'event'], status: 'inactive', lastDelivery: 'Failed 12 min ago' },
          ],
          appApiKeys: [
            { id: 'key-prod', name: 'Production API Key', prefix: 'ivxt_live_...', created: 'Jan 15, 2025', lastUsed: '2m ago', scopes: 'read,write' },
            { id: 'key-staging', name: 'Staging API Key', prefix: 'ivxt_test_...', created: 'Feb 1, 2025', lastUsed: '1h ago', scopes: 'read,write' },
            { id: 'key-github', name: 'GitHub Integration', prefix: 'ivxt_gh_...', created: 'Mar 10, 2025', lastUsed: '5m ago', scopes: 'read' },
          ],
          appIntegrationLogs: [
            { id: 'log-1', app: 'GitHub', action: 'Push event received', status: 'success', timestamp: '2 min ago' },
            { id: 'log-2', app: 'Slack', action: 'Message forwarded', status: 'success', timestamp: '5 min ago' },
            { id: 'log-3', app: 'Sentry', action: 'Alert webhook failed', status: 'error', timestamp: '12 min ago', details: 'Connection timeout after 30s' },
            { id: 'log-4', app: 'Linear', action: 'Issue created', status: 'success', timestamp: '15 min ago' },
            { id: 'log-5', app: 'GitHub', action: 'PR merged', status: 'success', timestamp: '22 min ago' },
            { id: 'log-6', app: 'Google Workspace', action: 'Rate limit warning', status: 'warning', timestamp: '1h ago', details: 'Quota 85% consumed' },
            { id: 'log-7', app: 'Slack', action: 'Channel sync completed', status: 'success', timestamp: '2h ago' },
            { id: 'log-8', app: 'Stripe', action: 'Payment webhook received', status: 'success', timestamp: '3h ago' },
          ],

          // ── Derived ──
          get approvalCount() {
            return get().approvals.filter((a) => a.status === 'pending').length;
          },

          // ════════════════════════════════════════════
          // Theme Actions
          // ════════════════════════════════════════════

          setTheme: (theme) =>
            set((state) => {
              state.theme = theme;
            }),

          setAccentColor: (color) =>
            set((state) => {
              state.accentColor = color;
            }),

          setFontSize: (size) =>
            set((state) => {
              state.fontSize = size;
            }),

          openSettings: () =>
            set((state) => {
              state.settingsOpen = true;
            }),

          closeSettings: () =>
            set((state) => {
              state.settingsOpen = false;
            }),

          // ════════════════════════════════════════════
          // Navigation Actions
          // ════════════════════════════════════════════

          setActiveRailItem: (item) =>
            set((state) => {
              state.activeRailItem = item;
            }),

          selectProject: (projectId) =>
            set((state) => {
              state.selectedProjectId = projectId;
              state.activeScope = 'project';
              state.activeScopeId = projectId;
            }),

          selectTeam: (teamId) =>
            set((state) => {
              state.selectedTeamId = teamId;
              state.activeScope = 'team';
              state.activeScopeId = teamId;
            }),

          selectChat: (chatId) =>
            set((state) => {
              state.selectedChatId = chatId;
              state.activeScope = 'chat';
              state.activeScopeId = chatId;
            }),

          selectCall: (callId) =>
            set((state) => {
              state.selectedCallId = callId;
              state.activeScope = 'call';
              state.activeScopeId = callId;
            }),

          selectTicket: (ticketId) =>
            set((state) => {
              state.selectedTicketId = ticketId;
            }),

          setCurrentUserRole: (role) =>
            set((state) => {
              state.currentUser = { ...state.currentUser, role };
            }),

          // ════════════════════════════════════════════
          // Auth Actions
          // ════════════════════════════════════════════

          setCurrentUser: (user, token, refreshToken) =>
            set((state) => {
              state.currentUser = user as any;
              if (token) state.authToken = token;
              if (refreshToken) state.refreshToken = refreshToken;
            }),

          setOnboardingComplete: (complete) =>
            set((state) => {
              state.onboardingComplete = complete;
            }),

          setWorkspace: (workspace) =>
            set((state) => {
              state.workspace = workspace;
            }),

          createWorkspace: (workspace) =>
            set((state) => {
              state.workspace = workspace;
              state.workspaces = [...state.workspaces, workspace];
            }),

          addWorkspaceMember: (workspaceId, member) =>
            set((state) => {
              // Find workspace and add member
              const ws = state.workspaces.find((w: any) => w.id === workspaceId);
              if (ws && ws.members) {
                ws.members.push(member);
              }
            }),

          setWorkspaceInvites: (invites) =>
            set((state) => {
              state.workspaceInvites = invites;
            }),

          logout: () =>
            set((state) => {
              // Clear authenticated user and tokens
              state.currentUser = null as any;
              state.authToken = '';
              state.refreshToken = null;
              state.onboardingComplete = false;
              state.workspace = null;
              state.workspaces = [];
              // Reset navigation
              state.activeRailItem = 'projects';
              // Reset scope / selection
              state.activeScope = null;
              state.activeScopeId = null;
              state.selectedChatId = null;
              state.selectedCallId = null;
              state.selectedProjectId = null;
              state.selectedTeamId = null;
              state.selectedTicketId = null;
              // Reset entity collections to initial data
              state.projects = initialProjects;
              state.teams = initialTeams;
              state.tickets = initialTickets;
              state.sprints = initialSprints;
              state.conversations = initialConversations;
              state.meetings = initialMeetings;
              state.approvals = initialApprovals;
              // Reset UI state
              state.contextListOpen = true;
              state.rightRailOpen = false;
              state.missionTab = 'quarter';
              state.onboardingComplete = true;
              state.settingsOpen = false;
              // Reset theme
              state.theme = 'light';
              state.accentColor = '#D97757';
              state.fontSize = 14;
              // Reset filters
              state.filters = { ...DEFAULT_FILTERS };
              // Reset loading
              state.loading = { ...DEFAULT_LOADING };
              // Reset undo/redo
              state.undoStack = [];
              state.redoStack = [];
              // Reset dialogs
              state.createProjectDialogOpen = false;
              state.createTaskDialogOpen = false;
              state.createBugDialogOpen = false;
              state.assignTaskDialogOpen = false;
              state.activeDialogProjectId = null;
              // Reset notifications to default
              state.notifications = [
                { id: 'n1', message: 'Aria mentioned you in #frontend', read: false, timestamp: '2026-05-01T09:00:00Z' },
                { id: 'n2', message: 'PR #347 needs your review', read: false, timestamp: '2026-05-01T08:30:00Z' },
                { id: 'n3', message: 'Sprint 13 planning in 24 hours', read: false, timestamp: '2026-04-30T17:00:00Z' },
              ];
              // Reset RBAC to defaults
              state.rbacRoles = DEFAULT_ROLES;
              state.securityPolicies = DEFAULT_POLICIES;
              // Reset VPN
              state.vpnEnabled = true;
              state.vpnConnectedUsers = 7;
              state.devicePostureRequired = true;
              state.geoBlockingEnabled = true;
              state.trustedNetworks = ['10.0.0.0/8', '192.168.0.0/16'];
            }),

          // ════════════════════════════════════════════
          // UI Actions
          // ════════════════════════════════════════════

          toggleContextList: () =>
            set((state) => {
              state.contextListOpen = !state.contextListOpen;
            }),

          toggleRightRail: () =>
            set((state) => {
              state.rightRailOpen = !state.rightRailOpen;
            }),

          openRightRail: () =>
            set((state) => {
              state.rightRailOpen = true;
            }),

          closeRightRail: () =>
            set((state) => {
              state.rightRailOpen = false;
            }),

          setMissionTab: (tab) =>
            set((state) => {
              state.missionTab = tab;
            }),

          setActiveScope: (scope, scopeId) =>
            set((state) => {
              state.activeScope = scope;
              state.activeScopeId = scopeId;
            }),

          addNotification: (n) =>
            set((state) => {
              const notification = {
                ...n,
                read: n.read ?? false,
                timestamp: new Date().toISOString(),
              };
              state.notifications = [notification, ...state.notifications].slice(
                0,
                50
              );
            }),

          markNotificationRead: (id) =>
            set((state) => {
              const idx = state.notifications.findIndex((n) => n.id === id);
              if (idx !== -1) {
                state.notifications[idx] = { ...state.notifications[idx], read: true };
              }
            }),

          markAllNotificationsRead: () =>
            set((state) => {
              state.notifications = state.notifications.map((n) => ({
                ...n,
                read: true,
              }));
            }),

          dismissNotification: (id) =>
            set((state) => {
              state.notifications = state.notifications.filter(
                (n) => n.id !== id
              );
            }),

          completeOnboarding: () =>
            set((state) => {
              state.onboardingComplete = true;
            }),

          // ════════════════════════════════════════════
          // Loading Actions
          // ════════════════════════════════════════════

          setLoading: (key, value) =>
            set((state) => {
              state.loading[key] = value;
            }),

          // ════════════════════════════════════════════
          // Filter Actions
          // ════════════════════════════════════════════

          setSearchQuery: (query) =>
            set((state) => {
              state.filters.searchQuery = sanitizeInput(query);
            }),

          setProjectSearchQuery: (query) =>
            set((state) => {
              state.projectSearchQuery = sanitizeInput(query);
            }),

          setStatusFilter: (status) =>
            set((state) => {
              state.filters.statusFilter = status;
            }),

          setPriorityFilter: (priority) =>
            set((state) => {
              state.filters.priorityFilter = priority;
            }),

          setAssigneeFilter: (assigneeId) =>
            set((state) => {
              state.filters.assigneeFilter = assigneeId;
            }),

          resetFilters: () =>
            set((state) => {
              state.filters = { ...DEFAULT_FILTERS };
            }),

          // ════════════════════════════════════════════
          // Dialog Actions
          // ════════════════════════════════════════════

          openCreateProject: () =>
            set((state) => {
              state.createProjectDialogOpen = true;
            }),

          closeCreateProject: () =>
            set((state) => {
              state.createProjectDialogOpen = false;
              state.activeDialogProjectId = null;
            }),

          openCreateTask: (projectId) =>
            set((state) => {
              state.createTaskDialogOpen = true;
              state.activeDialogProjectId = projectId || null;
            }),

          closeCreateTask: () =>
            set((state) => {
              state.createTaskDialogOpen = false;
              state.activeDialogProjectId = null;
            }),

          openCreateBug: (projectId) =>
            set((state) => {
              state.createBugDialogOpen = true;
              state.activeDialogProjectId = projectId || null;
            }),

          closeCreateBug: () =>
            set((state) => {
              state.createBugDialogOpen = false;
              state.activeDialogProjectId = null;
            }),

          openAssignTask: (projectId) =>
            set((state) => {
              state.assignTaskDialogOpen = true;
              state.activeDialogProjectId = projectId || null;
            }),

          closeAssignTask: () =>
            set((state) => {
              state.assignTaskDialogOpen = false;
              state.activeDialogProjectId = null;
            }),

          // ════════════════════════════════════════════
          // Project CRUD
          // ════════════════════════════════════════════

          addProject: (project) => {
            const sanitized = {
              ...project,
              name: sanitizeInput(project.name),
              description: sanitizeInput(project.description),
              id: project.id || generateId('proj'),
            };
            set((state) => {
              // Save undo state
              state.undoStack = [
                { label: 'Create project', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.projects.push(sanitized as Project);
            });
            return sanitized as Project;
          },

          updateProject: (projectId, updates) => {
            const sanitized: Partial<Project> = {};
            if (updates.name !== undefined) sanitized.name = sanitizeInput(updates.name);
            if (updates.description !== undefined) sanitized.description = sanitizeInput(updates.description);
            if (updates.risks !== undefined) {
              sanitized.risks = updates.risks.map((r) => ({
                ...r,
                title: sanitizeInput(r.title),
                mitigation: sanitizeInput(r.mitigation),
              }));
            }
            set((state) => {
              const idx = state.projects.findIndex((p) => p.id === projectId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update project', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.projects[idx] = { ...state.projects[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteProject: (projectId) =>
            set((state) => {
              const idx = state.projects.findIndex((p) => p.id === projectId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete project', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.projects.splice(idx, 1);
                // Clean up related tickets and sprints
                state.tickets = state.tickets.filter((t) => t.projectId !== projectId);
                state.sprints = state.sprints.filter((s) => s.projectId !== projectId);
              }
            }),

          // ════════════════════════════════════════════
          // Team CRUD
          // ════════════════════════════════════════════

          addTeam: (team) => {
            const sanitized = {
              ...team,
              name: sanitizeInput(team.name),
              id: team.id || generateId('team'),
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create team', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.teams.push(sanitized as Team);
            });
            return sanitized as Team;
          },

          updateTeam: (teamId, updates) => {
            const sanitized: Partial<Team> = {};
            if (updates.name !== undefined) sanitized.name = sanitizeInput(updates.name);
            set((state) => {
              const idx = state.teams.findIndex((t) => t.id === teamId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update team', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.teams[idx] = { ...state.teams[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteTeam: (teamId) =>
            set((state) => {
              const idx = state.teams.findIndex((t) => t.id === teamId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete team', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.teams.splice(idx, 1);
              }
            }),

          // ════════════════════════════════════════════
          // Ticket CRUD
          // ════════════════════════════════════════════

          addTicket: (ticket) => {
            const now = new Date().toISOString();
            const sanitized = {
              ...ticket,
              title: sanitizeInput(ticket.title),
              description: ticket.description ? sanitizeInput(ticket.description) : undefined,
              id: ticket.id || generateId('ticket'),
              key: `TICK-${Date.now().toString(36).toUpperCase()}`,
              createdAt: now,
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create ticket', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.tickets.push(sanitized as Ticket);
            });
            return sanitized as Ticket;
          },

          updateTicket: (ticketId, updates) => {
            const sanitized: Partial<Ticket> = {};
            if (updates.title !== undefined) sanitized.title = sanitizeInput(updates.title);
            if (updates.description !== undefined) sanitized.description = sanitizeInput(updates.description);
            set((state) => {
              const idx = state.tickets.findIndex((t) => t.id === ticketId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update ticket', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.tickets[idx] = { ...state.tickets[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteTicket: (ticketId) =>
            set((state) => {
              const idx = state.tickets.findIndex((t) => t.id === ticketId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete ticket', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.tickets.splice(idx, 1);
              }
            }),

          // ════════════════════════════════════════════
          // Sprint CRUD
          // ════════════════════════════════════════════

          addSprint: (sprint) => {
            const sanitized = {
              ...sprint,
              name: sanitizeInput(sprint.name),
              goal: sprint.goal ? sanitizeInput(sprint.goal) : undefined,
              id: sprint.id || generateId('sprint'),
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create sprint', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.sprints.push(sanitized as Sprint);
            });
            return sanitized as Sprint;
          },

          updateSprint: (sprintId, updates) => {
            const sanitized: Partial<Sprint> = {};
            if (updates.name !== undefined) sanitized.name = sanitizeInput(updates.name);
            if (updates.goal !== undefined) sanitized.goal = sanitizeInput(updates.goal);
            set((state) => {
              const idx = state.sprints.findIndex((s) => s.id === sprintId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update sprint', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.sprints[idx] = { ...state.sprints[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteSprint: (sprintId) =>
            set((state) => {
              const idx = state.sprints.findIndex((s) => s.id === sprintId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete sprint', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.sprints.splice(idx, 1);
              }
            }),

          // ════════════════════════════════════════════
          // Conversation CRUD
          // ════════════════════════════════════════════

          addConversation: (conv) => {
            const sanitized = {
              ...conv,
              name: sanitizeInput(conv.name),
              id: conv.id || generateId('conv'),
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create conversation', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.conversations.push(sanitized as Conversation);
            });
            return sanitized as Conversation;
          },

          updateConversation: (convId, updates) => {
            const sanitized: Partial<Conversation> = {};
            if (updates.name !== undefined) sanitized.name = sanitizeInput(updates.name);
            set((state) => {
              const idx = state.conversations.findIndex((c) => c.id === convId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update conversation', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.conversations[idx] = { ...state.conversations[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteConversation: (convId) =>
            set((state) => {
              const idx = state.conversations.findIndex((c) => c.id === convId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete conversation', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.conversations.splice(idx, 1);
              }
            }),

          addMessage: (convId, message) => {
            set((state) => {
              const idx = state.conversations.findIndex((c) => c.id === convId);
              if (idx !== -1) {
                const sanitizedContent = sanitizeInput(message.content);
                const newMessage = {
                  id: generateId('msg'),
                  senderId: message.senderId,
                  content: sanitizedContent,
                  timestamp: new Date().toISOString(),
                  attachments: message.attachments,
                };
                state.conversations[idx].messages.push(newMessage);
                state.conversations[idx].lastMessageAt = newMessage.timestamp;
              }
            });
          },

          // ════════════════════════════════════════════
          // Meeting CRUD
          // ════════════════════════════════════════════

          addMeeting: (meeting) => {
            const sanitized = {
              ...meeting,
              title: sanitizeInput(meeting.title),
              description: meeting.description ? sanitizeInput(meeting.description) : undefined,
              id: meeting.id || generateId('mtg'),
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create meeting', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.meetings.push(sanitized as Meeting);
            });
            return sanitized as Meeting;
          },

          updateMeeting: (meetingId, updates) => {
            const sanitized: Partial<Meeting> = {};
            if (updates.title !== undefined) sanitized.title = sanitizeInput(updates.title);
            if (updates.description !== undefined) sanitized.description = sanitizeInput(updates.description);
            set((state) => {
              const idx = state.meetings.findIndex((m) => m.id === meetingId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update meeting', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.meetings[idx] = { ...state.meetings[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteMeeting: (meetingId) =>
            set((state) => {
              const idx = state.meetings.findIndex((m) => m.id === meetingId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete meeting', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.meetings.splice(idx, 1);
              }
            }),

          // ════════════════════════════════════════════
          // Approval CRUD
          // ════════════════════════════════════════════

          addApproval: (approval) => {
            const sanitized = {
              ...approval,
              title: sanitizeInput(approval.title),
              description: sanitizeInput(approval.description),
              id: approval.id || generateId('apr'),
            };
            set((state) => {
              state.undoStack = [
                { label: 'Create approval', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.approvals.push(sanitized as Approval);
            });
            return sanitized as Approval;
          },

          updateApproval: (approvalId, updates) => {
            const sanitized: Partial<Approval> = {};
            if (updates.title !== undefined) sanitized.title = sanitizeInput(updates.title);
            if (updates.description !== undefined) sanitized.description = sanitizeInput(updates.description);
            set((state) => {
              const idx = state.approvals.findIndex((a) => a.id === approvalId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Update approval', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.approvals[idx] = { ...state.approvals[idx], ...updates, ...sanitized };
              }
            });
          },

          deleteApproval: (approvalId) =>
            set((state) => {
              const idx = state.approvals.findIndex((a) => a.id === approvalId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete approval', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.approvals.splice(idx, 1);
              }
            }),

          // ════════════════════════════════════════════
          // RBAC Actions
          // ════════════════════════════════════════════

          addRole: (role) =>
            set((state) => {
              const sanitizedRole = {
                ...role,
                name: sanitizeInput(role.name),
                description: sanitizeInput(role.description),
              };
              state.undoStack = [
                { label: 'Add role', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              state.redoStack = [];
              state.rbacRoles.push(sanitizedRole);
            }),

          deleteRole: (roleId) =>
            set((state) => {
              const idx = state.rbacRoles.findIndex((r) => r.id === roleId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Delete role', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.rbacRoles.splice(idx, 1);
              }
            }),

          updateRole: (roleId, updates) =>
            set((state) => {
              const idx = state.rbacRoles.findIndex((r) => r.id === roleId);
              if (idx !== -1) {
                const sanitized: Partial<RoleConfig> = {};
                if (updates.name !== undefined) sanitized.name = sanitizeInput(updates.name);
                if (updates.description !== undefined) sanitized.description = sanitizeInput(updates.description);
                state.undoStack = [
                  { label: 'Update role', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.rbacRoles[idx] = { ...state.rbacRoles[idx], ...updates, ...sanitized };
              }
            }),

          togglePolicy: (policyId, status) =>
            set((state) => {
              const idx = state.securityPolicies.findIndex((p) => p.id === policyId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Toggle policy', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.securityPolicies[idx] = {
                  ...state.securityPolicies[idx],
                  status,
                  lastModified: new Date().toISOString().split('T')[0],
                };
              }
            }),

          setPolicyScope: (policyId, scope) =>
            set((state) => {
              const idx = state.securityPolicies.findIndex((p) => p.id === policyId);
              if (idx !== -1) {
                state.undoStack = [
                  { label: 'Set policy scope', timestamp: Date.now(), patches: getUndoSnapshot(state) },
                  ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
                ];
                state.redoStack = [];
                state.securityPolicies[idx] = {
                  ...state.securityPolicies[idx],
                  scope: scope as SecurityPolicyConfig['scope'],
                  lastModified: new Date().toISOString().split('T')[0],
                };
              }
            }),

          // ════════════════════════════════════════════
          // VPN & Secure Access Actions
          // ════════════════════════════════════════════

          toggleVpn: () =>
            set((state) => {
              state.vpnEnabled = !state.vpnEnabled;
              // Adjust connected users when toggling
              if (!state.vpnEnabled) {
                state.vpnConnectedUsers = 0;
              } else {
                state.vpnConnectedUsers = Math.floor(Math.random() * 12) + 1;
              }
            }),

          setVpnConnectedUsers: (count) =>
            set((state) => {
              state.vpnConnectedUsers = Math.max(0, count);
            }),

          toggleDevicePosture: () =>
            set((state) => {
              state.devicePostureRequired = !state.devicePostureRequired;
            }),

          toggleGeoBlocking: () =>
            set((state) => {
              state.geoBlockingEnabled = !state.geoBlockingEnabled;
            }),

          addTrustedNetwork: (network) =>
            set((state) => {
              const sanitized = sanitizeInput(network);
              if (sanitized && !state.trustedNetworks.includes(sanitized)) {
                state.trustedNetworks.push(sanitized);
              }
            }),

          removeTrustedNetwork: (network) =>
            set((state) => {
              state.trustedNetworks = state.trustedNetworks.filter(
                (n) => n !== network
              );
            }),

          // ════════════════════════════════════════════
          // App Config Actions
          // ════════════════════════════════════════════

          setAppConfig: (appName, config) =>
            set((state) => {
              state.appConfigs[appName] = { ...state.appConfigs[appName], ...config };
            }),

          addWebhook: (webhook) =>
            set((state) => {
              const newWebhook = { ...webhook, id: webhook.id || generateId('wh') };
              state.appWebhooks.push(newWebhook as AppWebhook);
            }),

          updateWebhook: (id, updates) =>
            set((state) => {
              const idx = state.appWebhooks.findIndex((w) => w.id === id);
              if (idx !== -1) {
                state.appWebhooks[idx] = { ...state.appWebhooks[idx], ...updates };
              }
            }),

          deleteWebhook: (id) =>
            set((state) => {
              state.appWebhooks = state.appWebhooks.filter((w) => w.id !== id);
            }),

          addAppApiKey: (key) =>
            set((state) => {
              const newKey = { ...key, id: key.id || generateId('key') };
              state.appApiKeys.push(newKey as AppApiKey);
            }),

          revokeAppApiKey: (id) =>
            set((state) => {
              state.appApiKeys = state.appApiKeys.filter((k) => k.id !== id);
            }),

          addIntegrationLog: (log) =>
            set((state) => {
              const newLog = { ...log, id: log.id || generateId('log') };
              state.appIntegrationLogs = [newLog as AppIntegrationLog, ...state.appIntegrationLogs].slice(0, 100);
            }),

          clearIntegrationLogs: () =>
            set((state) => {
              state.appIntegrationLogs = [];
            }),

          // ════════════════════════════════════════════
          // Undo/Redo Actions
          // ════════════════════════════════════════════

          undo: () =>
            set((state) => {
              const frame = state.undoStack[0];
              if (!frame) return;
              state.undoStack = state.undoStack.slice(1);
              state.redoStack = [
                { label: frame.label, timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.redoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              // Apply the undo patches
              Object.assign(state, frame.patches);
            }),

          redo: () =>
            set((state) => {
              const frame = state.redoStack[0];
              if (!frame) return;
              state.redoStack = state.redoStack.slice(1);
              state.undoStack = [
                { label: frame.label, timestamp: Date.now(), patches: getUndoSnapshot(state) },
                ...state.undoStack.slice(0, UNDO_STACK_LIMIT - 1),
              ];
              // Apply the redo patches
              Object.assign(state, frame.patches);
            }),

          canUndo: () => get().undoStack.length > 0,
          canRedo: () => get().redoStack.length > 0,
        }),
        {
          name: STORAGE_KEYS.store,
          partialize: (state) => ({
            // Navigation
            activeRailItem: state.activeRailItem,
            contextListOpen: state.contextListOpen,
            // Selection
            selectedProjectId: state.selectedProjectId,
            selectedTeamId: state.selectedTeamId,
            selectedChatId: state.selectedChatId,
            selectedCallId: state.selectedCallId,
            selectedTicketId: state.selectedTicketId,
            // Theme
            theme: state.theme,
            accentColor: state.accentColor,
            fontSize: state.fontSize,
            // User
            currentUser: state.currentUser,
            // Auth tokens (persisted for session restore)
            authToken: state.authToken,
            refreshToken: state.refreshToken,
            // Workspace
            workspace: state.workspace,
            workspaces: state.workspaces,
            // Onboarding
            onboardingComplete: state.onboardingComplete,
          }),
          // Handle migration between store versions
          version: 1,
          migrate: (persistedState: unknown, version: number) => {
            if (version === 0 && persistedState && typeof persistedState === 'object') {
              const state = persistedState as Record<string, unknown>;
              // Migrate old 'selectedProject' to 'selectedProjectId'
              if ('selectedProject' in state && !('selectedProjectId' in state)) {
                state.selectedProjectId = state.selectedProject as string | null;
                delete state.selectedProject;
              }
              // Ensure accentColor exists
              if (!('accentColor' in state)) {
                state.accentColor = '#D97757';
              }
              // Ensure fontSize exists
              if (!('fontSize' in state)) {
                state.fontSize = 14;
              }
            }
            return persistedState as AppState;
          },
        }
      )
    )
  )
);

// ── Cross-tab State Synchronization ─────────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.store && e.newValue) {
      // Another tab updated the store - the persist middleware handles sync
      // We could trigger a refresh here if needed
      const event = new CustomEvent('brixstac-store-sync', {
        detail: JSON.parse(e.newValue),
      });
      window.dispatchEvent(event);
    }
  });
}

// ── DEV-ONLY: expose the live store for preview/QA tooling (stripped in prod build) ──
if (typeof window !== 'undefined' && import.meta.env && import.meta.env.DEV) {
  (window as any).__appStore = useStore;
  // Opt-in auto-login for visual QA: set localStorage.brixDemoAutoLogin='1' then reload.
  // Runs at module-eval (before first render) so the app boots straight into the shell.
  try {
    if (localStorage.getItem('brixDemoAutoLogin') === '1' && !useStore.getState().currentUser) {
      const demoJwt =
        btoa('{}') + '.' + btoa(JSON.stringify({ sub: 'demo', exp: 9999999999 })) + '.s';
      useStore.getState().setCurrentUser(currentUser as any, demoJwt, demoJwt);
      useStore.getState().setOnboardingComplete(true);
    }
  } catch { /* ignore */ }
}
