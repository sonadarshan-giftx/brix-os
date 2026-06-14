// ============================================================
// Brixstac — Mock Data Layer
// Complete, realistic demo data for "Acme Software" company
// ============================================================

// ── Type Definitions ────────────────────────────────────────

export type EmployeeRole = 'Owner' | 'Manager' | 'Member';
export type EmployeeKind = 'human' | 'ai';
export type EmployeeLevel = 'IC1' | 'IC2' | 'IC3' | 'IC4' | 'IC5' | 'IC6' | 'Lead' | 'Senior';
export type EmployeeStatus = 'online' | 'busy' | 'away' | 'offline';

export interface ModelBinding {
  provider: string;
  model: string;
  version: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  kind: EmployeeKind;
  level: EmployeeLevel;
  title: string;
  avatar: string;
  status: EmployeeStatus;
  managerId: string | null;
  teamIds: string[];
  skills: string[];
  modelBinding?: ModelBinding;
  toolAllowlist?: string[];
  tokenBudget?: number;
}

export interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  memberIds: string[];
  channels: Channel[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private';
}

export type TicketType = 'epic' | 'story' | 'task' | 'bug';
export type TicketStatus = 'todo' | 'in-progress' | 'review' | 'done';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';

export interface Ticket {
  id: string;
  key: string;
  title: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  assigneeId: string | null;
  reporterId: string;
  estimate: number; // story points
  labels: string[];
  createdAt: string;
  description?: string;
  sprintId?: string;
  projectId: string;
}

export interface Sprint {
  id: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  goal: string;
  projectId: string;
  burndown: BurndownDay[];
  ticketIds: string[];
  velocity: number;
}

export interface BurndownDay {
  day: number;
  date: string;
  ideal: number;
  actual: number;
}

export interface ProjectGoal {
  id: string;
  text: string;
  complete: boolean;
}

export interface ProjectKeyResult {
  id: string;
  text: string;
  current: number;
  target: number;
  unit: string;
}

export interface ProjectRisk {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  ownerId: string;
}

export interface ProjectDecision {
  id: string;
  title: string;
  date: string;
  decidedBy: string;
  status: 'pending' | 'approved' | 'rejected';
}

export type ProjectHealth = 'green' | 'amber' | 'red';

export interface Project {
  id: string;
  key: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  health: ProjectHealth;
  description: string;
  budgetTotal: number;
  budgetSpent: number;
  startDate: string;
  targetEndDate: string;
  goals: ProjectGoal[];
  keyResults: ProjectKeyResult[];
  sprints: Sprint[];
  tickets: Ticket[];
  risks: ProjectRisk[];
  decisions: ProjectDecision[];
  memberIds: string[];
  teamIds: string[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isStreaming?: boolean;
  attachments?: { name: string; url: string }[];
}

export interface Conversation {
  id: string;
  type: 'dm' | 'group';
  name: string;
  participantIds: string[];
  messages: ChatMessage[];
  lastMessageAt: string;
  unreadCount: number;
  avatar?: string;
}

export interface EmailThread {
  id: string;
  subject: string;
  from: string;
  to: string[];
  messages: {
    id: string;
    from: string;
    content: string;
    timestamp: string;
  }[];
  lastMessageAt: string;
  unread: boolean;
  labels: string[];
}

export interface Meeting {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  meetingType: 'standup' | '1:1' | 'planning' | 'retro' | 'review' | 'sync';
  channel: string;
  recurring: boolean;
  description?: string;
}

export type ApprovalType = 'deploy' | 'pr-review' | 'budget' | 'customer-comm' | 'policy';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated';

export interface Approval {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requesterId: string;
  approverId: string;
  status: ApprovalStatus;
  createdAt: string;
  dueAt: string;
  sla: string;
}

export type ActivityType =
  | 'ticket-completed'
  | 'pr-merged'
  | 'deploy-shipped'
  | 'mention'
  | 'commit'
  | 'comment'
  | 'status-change'
  | 'sprint-started'
  | 'sprint-completed'
  | 'risk-flagged'
  | 'goal-updated'
  | 'approval-needed'
  | 'meeting-started'
  | 'file-uploaded'
  | 'review-submitted';

export interface Activity {
  id: string;
  type: ActivityType;
  actorId: string;
  targetName: string;
  message: string;
  timestamp: string;
  projectId?: string;
}

export interface CompanyGoal {
  id: string;
  title: string;
  status: ProjectHealth;
  ownerId: string;
  progress: number;
  keyResults: {
    id: string;
    text: string;
    current: number;
    target: number;
    unit: string;
    status: ProjectHealth;
  }[];
}

// ── Employees (9 total) ─────────────────────────────────────

export const employees: Employee[] = [
  {
    id: 'emp-alex',
    name: 'Alex Chen',
    email: 'alex@acme-brixstac.com',
    role: 'Owner',
    kind: 'human',
    level: 'Lead',
    title: 'CEO & Founder',
    avatar: '/avatar-alex.jpg',
    status: 'online',
    managerId: null,
    teamIds: ['team-leadership'],
    skills: ['Strategy', 'Product', 'Leadership', 'Finance'],
  },
  {
    id: 'emp-maya',
    name: 'Maya',
    email: 'maya@acme-brixstac.com',
    role: 'Manager',
    kind: 'human',
    level: 'IC5',
    title: 'Engineering Manager',
    avatar: '/avatar-maya.jpg',
    status: 'online',
    managerId: 'emp-alex',
    teamIds: ['team-engineering', 'team-leadership'],
    skills: ['Engineering Management', 'React', 'System Design', 'Mentoring'],
  },
  {
    id: 'emp-raj',
    name: 'Raj',
    email: 'raj@acme-brixstac.com',
    role: 'Member',
    kind: 'human',
    level: 'IC3',
    title: 'Frontend Developer',
    avatar: '/avatar-raj.jpg',
    status: 'online',
    managerId: 'emp-maya',
    teamIds: ['team-engineering'],
    skills: ['React', 'TypeScript', 'CSS', 'UI/UX'],
  },
  {
    id: 'emp-priya',
    name: 'Priya',
    email: 'priya@acme-brixstac.com',
    role: 'Member',
    kind: 'human',
    level: 'IC4',
    title: 'QA Lead',
    avatar: '/avatar-priya.jpg',
    status: 'busy',
    managerId: 'emp-maya',
    teamIds: ['team-qa'],
    skills: ['Test Automation', 'Cypress', 'Playwright', 'CI/CD'],
  },
  {
    id: 'emp-aria',
    name: 'Aria',
    email: 'aria@acme-brixstac.com',
    role: 'Member',
    kind: 'ai',
    level: 'Senior',
    title: 'Senior Developer',
    avatar: '/avatar-aria.jpg',
    status: 'online',
    managerId: 'emp-maya',
    teamIds: ['team-engineering'],
    skills: ['Full Stack', 'React', 'Node.js', 'Database', 'Architecture'],
    modelBinding: { provider: 'Anthropic', model: 'claude-opus-4-7', version: '2025-01' },
    toolAllowlist: ['github', 'vscode', 'docker', 'aws-console', 'linear'],
    tokenBudget: 2000,
  },
  {
    id: 'emp-manager',
    name: 'Manager',
    email: 'manager@acme-brixstac.com',
    role: 'Manager',
    kind: 'ai',
    level: 'Senior',
    title: 'Project Manager',
    avatar: '/avatar-manager.jpg',
    status: 'online',
    managerId: 'emp-alex',
    teamIds: ['team-leadership'],
    skills: ['Project Management', 'Agile', 'Scrum', 'Risk Analysis', 'Reporting'],
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o', version: '2025-02' },
    toolAllowlist: ['notion', 'slack', 'calendar', 'jira', 'sheets'],
    tokenBudget: 1500,
  },
  {
    id: 'emp-sage',
    name: 'Sage',
    email: 'sage@acme-brixstac.com',
    role: 'Member',
    kind: 'ai',
    level: 'Senior',
    title: 'Senior Backend Developer',
    avatar: '/avatar-sage.jpg',
    status: 'online',
    managerId: 'emp-maya',
    teamIds: ['team-engineering'],
    skills: ['Node.js', 'PostgreSQL', 'Redis', 'Microservices', 'API Design'],
    modelBinding: { provider: 'Anthropic', model: 'claude-sonnet-4', version: '2025-01' },
    toolAllowlist: ['github', 'docker', 'aws-console', 'datadog', 'postman'],
    tokenBudget: 1800,
  },
  {
    id: 'emp-pixel',
    name: 'Pixel',
    email: 'pixel@acme-brixstac.com',
    role: 'Member',
    kind: 'ai',
    level: 'IC4',
    title: 'Designer',
    avatar: '/avatar-pixel.jpg',
    status: 'away',
    managerId: 'emp-maya',
    teamIds: ['team-design'],
    skills: ['UI Design', 'Figma', 'Design Systems', 'Prototyping', 'Accessibility'],
    modelBinding: { provider: 'OpenAI', model: 'gpt-4o', version: '2025-02' },
    toolAllowlist: ['figma', 'storybook', 'github', 'notion'],
    tokenBudget: 1200,
  },
  {
    id: 'emp-echo',
    name: 'Echo',
    email: 'echo@acme-brixstac.com',
    role: 'Member',
    kind: 'ai',
    level: 'IC4',
    title: 'DevOps Engineer',
    avatar: '/avatar-echo.jpg',
    status: 'online',
    managerId: 'emp-maya',
    teamIds: ['team-engineering'],
    skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring'],
    modelBinding: { provider: 'Anthropic', model: 'claude-sonnet-4', version: '2025-01' },
    toolAllowlist: ['aws-console', 'docker', 'github', 'datadog', 'terraform'],
    tokenBudget: 1500,
  },
];

// ── Teams (4) ───────────────────────────────────────────────

export const teams: Team[] = [
  {
    id: 'team-engineering',
    name: 'Engineering',
    icon: 'code',
    color: '#5b5fc7',
    memberIds: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo'],
    channels: [
      { id: 'ch-eng-general', name: '#general', type: 'public' },
      { id: 'ch-eng-standups', name: '#standups', type: 'public' },
      { id: 'ch-eng-frontend', name: '#frontend', type: 'public' },
      { id: 'ch-eng-backend', name: '#backend', type: 'private' },
      { id: 'ch-eng-devops', name: '#devops', type: 'public' },
    ],
  },
  {
    id: 'team-design',
    name: 'Design',
    icon: 'palette',
    color: '#c4314b',
    memberIds: ['emp-pixel'],
    channels: [
      { id: 'ch-des-general', name: '#general', type: 'public' },
      { id: 'ch-des-system', name: '#design-system', type: 'public' },
      { id: 'ch-des-reviews', name: '#reviews', type: 'public' },
    ],
  },
  {
    id: 'team-qa',
    name: 'QA',
    icon: 'bug',
    color: '#237b4b',
    memberIds: ['emp-priya'],
    channels: [
      { id: 'ch-qa-general', name: '#general', type: 'public' },
      { id: 'ch-qa-automation', name: '#automation', type: 'public' },
      { id: 'ch-qa-reports', name: '#test-reports', type: 'private' },
    ],
  },
  {
    id: 'team-leadership',
    name: 'Leadership',
    icon: 'crown',
    color: '#ffaa44',
    memberIds: ['emp-alex', 'emp-maya', 'emp-manager'],
    channels: [
      { id: 'ch-lead-general', name: '#general', type: 'private' },
      { id: 'ch-lead-planning', name: '#planning', type: 'private' },
      { id: 'ch-lead-reviews', name: '#reviews', type: 'private' },
    ],
  },
];

// ── Tickets (20+ realistic tickets) ─────────────────────────

let ticketIdCounter = 0;
function tKey(project: string, num: number): string {
  return `${project}-${num}`;
}

export const allTickets: Ticket[] = [
  // ── Tax Filing Platform (TAX) ──
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 142), title: 'Implement OAuth 2.0 authentication flow', type: 'story', status: 'done', priority: 'high', assigneeId: 'emp-aria', reporterId: 'emp-maya', estimate: 5, labels: ['auth', 'backend'], createdAt: '2025-03-10T08:00:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 143), title: 'Build tax form 1040 wizard UI', type: 'epic', status: 'in-progress', priority: 'critical', assigneeId: 'emp-raj', reporterId: 'emp-alex', estimate: 13, labels: ['frontend', '1040', 'ux'], createdAt: '2025-03-15T10:30:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 144), title: 'IRS API integration for e-filing', type: 'story', status: 'in-progress', priority: 'critical', assigneeId: 'emp-aria', reporterId: 'emp-maya', estimate: 8, labels: ['api', 'irs', 'integration', 'qa-needed'], createdAt: '2025-03-18T09:15:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 145), title: 'Form validation engine for Schedule C', type: 'task', status: 'todo', priority: 'medium', assigneeId: 'emp-sage', reporterId: 'emp-aria', estimate: 3, labels: ['backend', 'validation'], createdAt: '2025-03-20T11:00:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 146), title: 'Fix memory leak in PDF parser', type: 'bug', status: 'review', priority: 'high', assigneeId: 'emp-sage', reporterId: 'emp-priya', estimate: 3, labels: ['bug', 'pdf', 'memory', 'regression-test'], createdAt: '2025-03-22T14:20:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 147), title: 'Set up SOC2 compliance audit trail', type: 'story', status: 'in-progress', priority: 'high', assigneeId: 'emp-echo', reporterId: 'emp-manager', estimate: 5, labels: ['security', 'soc2', 'infra'], createdAt: '2025-03-25T08:45:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 148), title: 'Implement payment gateway for filing fees', type: 'story', status: 'done', priority: 'high', assigneeId: 'emp-aria', reporterId: 'emp-maya', estimate: 5, labels: ['payment', 'backend', 'e2e-test'], createdAt: '2025-03-28T10:00:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 149), title: 'Responsive layout breaks on mobile Safari', type: 'bug', status: 'todo', priority: 'medium', assigneeId: 'emp-raj', reporterId: 'emp-priya', estimate: 2, labels: ['bug', 'mobile', 'safari'], createdAt: '2025-04-01T13:30:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 150), title: 'Database migration for multi-tenancy', type: 'task', status: 'in-progress', priority: 'critical', assigneeId: 'emp-sage', reporterId: 'emp-echo', estimate: 5, labels: ['database', 'migration'], createdAt: '2025-04-02T09:00:00Z', sprintId: 'spr-tax-12', projectId: 'proj-tax' },
  // TAX Sprint 11 (completed)
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 131), title: 'Design system component library setup', type: 'story', status: 'done', priority: 'high', assigneeId: 'emp-pixel', reporterId: 'emp-maya', estimate: 5, labels: ['design-system', 'frontend'], createdAt: '2025-02-25T08:00:00Z', sprintId: 'spr-tax-11', projectId: 'proj-tax' },
  { id: `t-${++ticketIdCounter}`, key: tKey('TAX', 132), title: 'User onboarding flow redesign', type: 'story', status: 'done', priority: 'medium', assigneeId: 'emp-raj', reporterId: 'emp-pixel', estimate: 5, labels: ['ux', 'onboarding'], createdAt: '2025-02-28T10:00:00Z', sprintId: 'spr-tax-11', projectId: 'proj-tax' },

  // ── Mobile App Redesign (MOB) ──
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 89), title: 'Create design tokens and color palette', type: 'task', status: 'done', priority: 'high', assigneeId: 'emp-pixel', reporterId: 'emp-maya', estimate: 3, labels: ['design', 'tokens'], createdAt: '2025-03-05T09:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 90), title: 'Accessibility audit — 12 issues found', type: 'story', status: 'in-progress', priority: 'high', assigneeId: 'emp-pixel', reporterId: 'emp-priya', estimate: 5, labels: ['a11y', 'audit', 'qa'], createdAt: '2025-03-10T10:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 91), title: 'Implement new navigation drawer', type: 'story', status: 'in-progress', priority: 'medium', assigneeId: 'emp-raj', reporterId: 'emp-pixel', estimate: 5, labels: ['frontend', 'navigation'], createdAt: '2025-03-15T11:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 92), title: 'Dark mode toggle and theme switching', type: 'task', status: 'todo', priority: 'medium', assigneeId: 'emp-raj', reporterId: 'emp-pixel', estimate: 3, labels: ['frontend', 'dark-mode', 'ui-test'], createdAt: '2025-03-20T08:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 93), title: 'Bottom sheet component for filters', type: 'task', status: 'review', priority: 'low', assigneeId: 'emp-raj', reporterId: 'emp-pixel', estimate: 3, labels: ['frontend', 'component'], createdAt: '2025-03-25T14:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },
  { id: `t-${++ticketIdCounter}`, key: tKey('MOB', 94), title: 'Cross-browser testing for form inputs', type: 'task', status: 'todo', priority: 'medium', assigneeId: 'emp-priya', reporterId: 'emp-maya', estimate: 2, labels: ['qa', 'testing'], createdAt: '2025-04-01T09:00:00Z', sprintId: 'spr-mob-8', projectId: 'proj-mob' },

  // ── API Modernization (API) ──
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 56), title: 'GraphQL schema design for core entities', type: 'story', status: 'done', priority: 'high', assigneeId: 'emp-sage', reporterId: 'emp-maya', estimate: 5, labels: ['graphql', 'schema', 'backend'], createdAt: '2025-03-01T08:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 57), title: 'REST to GraphQL migration wrapper', type: 'epic', status: 'in-progress', priority: 'critical', assigneeId: 'emp-sage', reporterId: 'emp-maya', estimate: 8, labels: ['migration', 'api', 'backend', 'integration-test'], createdAt: '2025-03-05T10:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 58), title: 'API rate limiting with Redis', type: 'task', status: 'done', priority: 'high', assigneeId: 'emp-echo', reporterId: 'emp-sage', estimate: 3, labels: ['backend', 'redis', 'performance', 'load-test'], createdAt: '2025-03-10T09:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 59), title: 'OpenAPI spec generation from GraphQL', type: 'task', status: 'in-progress', priority: 'medium', assigneeId: 'emp-sage', reporterId: 'emp-aria', estimate: 3, labels: ['documentation', 'graphql'], createdAt: '2025-03-18T11:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 60), title: 'Load testing suite with k6', type: 'task', status: 'todo', priority: 'medium', assigneeId: 'emp-echo', reporterId: 'emp-priya', estimate: 3, labels: ['testing', 'performance'], createdAt: '2025-03-28T08:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
  { id: `t-${++ticketIdCounter}`, key: tKey('API', 61), title: 'Webhook delivery reliability improvements', type: 'story', status: 'review', priority: 'high', assigneeId: 'emp-sage', reporterId: 'emp-aria', estimate: 5, labels: ['backend', 'webhooks'], createdAt: '2025-04-02T10:00:00Z', sprintId: 'spr-api-6', projectId: 'proj-api' },
];

// ── Sprints ─────────────────────────────────────────────────

export const allSprints: Sprint[] = [
  // Tax Filing sprints
  {
    id: 'spr-tax-12', name: 'Sprint 12', number: 12, startDate: '2025-04-21', endDate: '2025-05-05',
    status: 'active', goal: 'Complete IRS API integration and filing wizard', projectId: 'proj-tax',
    burndown: [
      { day: 1, date: 'Apr 21', ideal: 45, actual: 48 },
      { day: 2, date: 'Apr 22', ideal: 41, actual: 44 },
      { day: 3, date: 'Apr 23', ideal: 37, actual: 39 },
      { day: 4, date: 'Apr 24', ideal: 33, actual: 35 },
      { day: 5, date: 'Apr 25', ideal: 29, actual: 30 },
      { day: 6, date: 'Apr 28', ideal: 25, actual: 27 },
      { day: 7, date: 'Apr 29', ideal: 21, actual: 22 },
      { day: 8, date: 'Apr 30', ideal: 17, actual: 18 },
      { day: 9, date: 'May 1', ideal: 13, actual: 14 },
      { day: 10, date: 'May 2', ideal: 9, actual: 10 },
    ],
    ticketIds: allTickets.filter(t => t.sprintId === 'spr-tax-12').map(t => t.id),
    velocity: 42,
  },
  {
    id: 'spr-tax-11', name: 'Sprint 11', number: 11, startDate: '2025-04-07', endDate: '2025-04-18',
    status: 'completed', goal: 'Auth system and design system foundation', projectId: 'proj-tax',
    burndown: [
      { day: 1, date: 'Apr 7', ideal: 30, actual: 32 },
      { day: 2, date: 'Apr 8', ideal: 27, actual: 28 },
      { day: 3, date: 'Apr 9', ideal: 24, actual: 25 },
      { day: 4, date: 'Apr 10', ideal: 21, actual: 20 },
      { day: 5, date: 'Apr 11', ideal: 18, actual: 17 },
      { day: 6, date: 'Apr 14', ideal: 15, actual: 14 },
      { day: 7, date: 'Apr 15', ideal: 12, actual: 11 },
      { day: 8, date: 'Apr 16', ideal: 9, actual: 8 },
      { day: 9, date: 'Apr 17', ideal: 6, actual: 5 },
      { day: 10, date: 'Apr 18', ideal: 3, actual: 2 },
    ],
    ticketIds: allTickets.filter(t => t.sprintId === 'spr-tax-11').map(t => t.id),
    velocity: 38,
  },
  // Mobile App sprints
  {
    id: 'spr-mob-8', name: 'Sprint 8', number: 8, startDate: '2025-04-21', endDate: '2025-05-05',
    status: 'active', goal: 'Accessibility fixes and navigation overhaul', projectId: 'proj-mob',
    burndown: [
      { day: 1, date: 'Apr 21', ideal: 21, actual: 22 },
      { day: 2, date: 'Apr 22', ideal: 19, actual: 21 },
      { day: 3, date: 'Apr 23', ideal: 17, actual: 19 },
      { day: 4, date: 'Apr 24', ideal: 15, actual: 17 },
      { day: 5, date: 'Apr 25', ideal: 13, actual: 16 },
      { day: 6, date: 'Apr 28', ideal: 11, actual: 14 },
      { day: 7, date: 'Apr 29', ideal: 9, actual: 12 },
      { day: 8, date: 'Apr 30', ideal: 7, actual: 10 },
      { day: 9, date: 'May 1', ideal: 5, actual: 8 },
      { day: 10, date: 'May 2', ideal: 3, actual: 6 },
    ],
    ticketIds: allTickets.filter(t => t.sprintId === 'spr-mob-8').map(t => t.id),
    velocity: 28,
  },
  // API Modernization sprints
  {
    id: 'spr-api-6', name: 'Sprint 6', number: 6, startDate: '2025-04-21', endDate: '2025-05-05',
    status: 'active', goal: 'GraphQL migration and API documentation', projectId: 'proj-api',
    burndown: [
      { day: 1, date: 'Apr 21', ideal: 22, actual: 23 },
      { day: 2, date: 'Apr 22', ideal: 20, actual: 21 },
      { day: 3, date: 'Apr 23', ideal: 18, actual: 19 },
      { day: 4, date: 'Apr 24', ideal: 16, actual: 16 },
      { day: 5, date: 'Apr 25', ideal: 14, actual: 14 },
      { day: 6, date: 'Apr 28', ideal: 12, actual: 12 },
      { day: 7, date: 'Apr 29', ideal: 10, actual: 10 },
      { day: 8, date: 'Apr 30', ideal: 8, actual: 8 },
      { day: 9, date: 'May 1', ideal: 6, actual: 7 },
      { day: 10, date: 'May 2', ideal: 4, actual: 5 },
    ],
    ticketIds: allTickets.filter(t => t.sprintId === 'spr-api-6').map(t => t.id),
    velocity: 32,
  },
];

// ── Projects (3) ────────────────────────────────────────────

export const projects: Project[] = [
  {
    id: 'proj-tax',
    key: 'TAX',
    name: 'Tax Filing Platform',
    status: 'active',
    health: 'green',
    description: 'End-to-end tax filing platform supporting federal and state returns with e-filing capabilities.',
    budgetTotal: 100000,
    budgetSpent: 68100,
    startDate: '2025-01-15',
    targetEndDate: '2025-06-15',
    goals: [
      { id: 'g-tax-1', text: 'Launch MVP for 1040 filing', complete: true },
      { id: 'g-tax-2', text: 'Integrate IRS e-file API', complete: false },
      { id: 'g-tax-3', text: 'Achieve SOC2 compliance', complete: false },
    ],
    keyResults: [
      { id: 'kr-tax-1', text: 'Process 10K returns without errors', current: 7300, target: 10000, unit: 'returns' },
      { id: 'kr-tax-2', text: 'Reduce filing time to <5 min', current: 3.2, target: 5, unit: 'minutes' },
      { id: 'kr-tax-3', text: 'Achieve 99.9% uptime', current: 99.7, target: 99.9, unit: 'percent' },
    ],
    sprints: [allSprints[0], allSprints[1]],
    tickets: allTickets.filter(t => t.projectId === 'proj-tax'),
    risks: [
      { id: 'risk-tax-1', title: 'IRS API rate limits may throttle filings', severity: 'medium', mitigation: 'Implement request batching and queue', ownerId: 'emp-aria' },
      { id: 'risk-tax-2', title: 'SOC2 audit timeline tight', severity: 'high', mitigation: 'Start penetration testing early', ownerId: 'emp-echo' },
    ],
    decisions: [
      { id: 'dec-tax-1', title: 'Use PostgreSQL over MongoDB for transactional integrity', date: '2025-02-01', decidedBy: 'emp-sage', status: 'approved' },
    ],
    memberIds: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo', 'emp-priya'],
    teamIds: ['team-engineering', 'team-qa'],
  },
  {
    id: 'proj-mob',
    key: 'MOB',
    name: 'Mobile App Redesign',
    status: 'active',
    health: 'amber',
    description: 'Complete redesign of the mobile experience with new design system, dark mode, and accessibility improvements.',
    budgetTotal: 55000,
    budgetSpent: 41900,
    startDate: '2025-02-01',
    targetEndDate: '2025-06-30',
    goals: [
      { id: 'g-mob-1', text: 'Ship redesigned iOS and Android apps', complete: false },
      { id: 'g-mob-2', text: 'Pass WCAG 2.1 AA accessibility audit', complete: false },
    ],
    keyResults: [
      { id: 'kr-mob-1', text: 'Increase mobile conversion by 25%', current: 12, target: 25, unit: 'percent' },
      { id: 'kr-mob-2', text: 'Reduce app load time to <2s', current: 2.8, target: 2, unit: 'seconds' },
    ],
    sprints: [allSprints[2]],
    tickets: allTickets.filter(t => t.projectId === 'proj-mob'),
    risks: [
      { id: 'risk-mob-1', title: 'Design system migration taking longer than estimated', severity: 'high', mitigation: 'Parallel track with component library', ownerId: 'emp-pixel' },
      { id: 'risk-mob-2', title: '12 accessibility issues found in audit', severity: 'medium', mitigation: 'Allocate dedicated sprint for fixes', ownerId: 'emp-pixel' },
    ],
    decisions: [
      { id: 'dec-mob-1', title: 'Adopt React Native over Flutter', date: '2025-02-15', decidedBy: 'emp-maya', status: 'approved' },
    ],
    memberIds: ['emp-maya', 'emp-raj', 'emp-pixel', 'emp-priya'],
    teamIds: ['team-engineering', 'team-design', 'team-qa'],
  },
  {
    id: 'proj-api',
    key: 'API',
    name: 'API Modernization',
    status: 'active',
    health: 'green',
    description: 'Migrate from REST to GraphQL, improve API documentation, and implement comprehensive testing.',
    budgetTotal: 45000,
    budgetSpent: 31000,
    startDate: '2025-02-15',
    targetEndDate: '2025-07-01',
    goals: [
      { id: 'g-api-1', text: 'Complete GraphQL migration', complete: false },
      { id: 'g-api-2', text: '99.99% API uptime', complete: false },
    ],
    keyResults: [
      { id: 'kr-api-1', text: 'Migrate 80% of REST endpoints', current: 62, target: 80, unit: 'endpoints' },
      { id: 'kr-api-2', text: 'Reduce API latency by 40%', current: 28, target: 40, unit: 'percent' },
    ],
    sprints: [allSprints[3]],
    tickets: allTickets.filter(t => t.projectId === 'proj-api'),
    risks: [
      { id: 'risk-api-1', title: 'Breaking changes for existing API consumers', severity: 'low', mitigation: 'Deprecate REST gradually with sunset headers', ownerId: 'emp-sage' },
    ],
    decisions: [
      { id: 'dec-api-1', title: 'Use Apollo Server over Yoga', date: '2025-03-01', decidedBy: 'emp-sage', status: 'approved' },
    ],
    memberIds: ['emp-maya', 'emp-aria', 'emp-sage', 'emp-echo'],
    teamIds: ['team-engineering'],
  },
];

// ── Chat Data ───────────────────────────────────────────────

export const conversations: Conversation[] = [
  // DM: CEO <-> Aria
  {
    id: 'conv-aria',
    type: 'dm',
    name: 'Aria',
    participantIds: ['emp-alex', 'emp-aria'],
    messages: [
      { id: 'm1', senderId: 'emp-alex', content: 'Aria, can you review the auth module PR?', timestamp: '2025-04-29T09:00:00Z' },
      { id: 'm2', senderId: 'emp-aria', content: 'On it. I see 3 potential issues in the token validation logic.', timestamp: '2025-04-29T09:01:00Z', isStreaming: false },
      { id: 'm3', senderId: 'emp-aria', content: 'First, the JWT expiry check is missing a grace period for clock skew. Second, the refresh token rotation isn\'t atomic — race condition possible. Third, rate limiting on login needs to be per-IP, not just per-user.', timestamp: '2025-04-29T09:02:30Z' },
      { id: 'm4', senderId: 'emp-alex', content: 'Great catches. Can you open tickets for each?', timestamp: '2025-04-29T09:05:00Z' },
      { id: 'm5', senderId: 'emp-aria', content: 'Done. TAX-151, TAX-152, TAX-153 created and assigned.', timestamp: '2025-04-29T09:06:00Z' },
      { id: 'm6', senderId: 'emp-alex', content: 'How\'s the IRS API integration going?', timestamp: '2025-04-30T10:00:00Z' },
      { id: 'm7', senderId: 'emp-aria', content: '87% complete. The staging environment is fully connected. I\'m working through edge cases for rejected filings. About 12 more scenarios to handle.', timestamp: '2025-04-30T10:01:00Z' },
      { id: 'm8', senderId: 'emp-alex', content: 'Timeline looking good for May 15?', timestamp: '2025-04-30T10:03:00Z' },
      { id: 'm9', senderId: 'emp-aria', content: 'Yes, on track. I\'ll have the integration tests green by May 10.', timestamp: '2025-04-30T10:04:00Z' },
      { id: 'm10', senderId: 'emp-alex', content: 'Perfect. Keep me posted.', timestamp: '2025-04-30T10:05:00Z' },
    ],
    lastMessageAt: '2025-04-30T10:05:00Z',
    unreadCount: 0,
  },
  // DM: Maya <-> Manager
  {
    id: 'conv-manager',
    type: 'dm',
    name: 'Manager',
    participantIds: ['emp-maya', 'emp-manager'],
    messages: [
      { id: 'm1', senderId: 'emp-manager', content: 'Good morning Maya. Here\'s your daily standup summary:\n\n**Sprint 12 — Tax Filing**\n- 5 tickets in progress, 3 in review\n- Velocity trending at 42 SP (target: 45)\n- Risk: IRS API integration has 2 open blockers\n\n**Sprint 8 — Mobile App**\n- Behind by 3 SP due to a11y fixes\n- Pixel needs design review approval\n\n**Upcoming:**\n- Sprint planning tomorrow 10:00 AM', timestamp: '2025-04-30T08:00:00Z' },
      { id: 'm2', senderId: 'emp-maya', content: 'Thanks. Can you schedule a deep-dive on the IRS API blockers?', timestamp: '2025-04-30T08:15:00Z' },
      { id: 'm3', senderId: 'emp-manager', content: 'Scheduled for today at 2:00 PM. Attendees: Aria, Sage, Echo. Agenda:\n1. IRS API error handling review\n2. Staging environment status\n3. Rollback plan for production', timestamp: '2025-04-30T08:16:00Z' },
      { id: 'm4', senderId: 'emp-maya', content: 'Add Raj to that — he\'s been working on the error UI.', timestamp: '2025-04-30T08:20:00Z' },
      { id: 'm5', senderId: 'emp-manager', content: 'Done. Invite sent to Raj.', timestamp: '2025-04-30T08:21:00Z' },
      { id: 'm6', senderId: 'emp-manager', content: 'Weekly report ready. Summary: All 3 projects active. 2 risks flagged this week. Velocity up 12% vs last sprint. Budget on track at 68% spent with 60% timeline elapsed.', timestamp: '2025-04-29T17:00:00Z' },
      { id: 'm7', senderId: 'emp-maya', content: 'Can you highlight the top risk for the leadership sync?', timestamp: '2025-04-29T17:05:00Z' },
      { id: 'm8', senderId: 'emp-manager', content: 'Top risk: Mobile App redesign is behind by 12% due to design system migration complexity. Pixel flagged 12 accessibility issues. Recommend allocating an additional frontend dev for 2 sprints.', timestamp: '2025-04-29T17:06:00Z' },
      { id: 'm9', senderId: 'emp-maya', content: 'I\'ll discuss with Alex Chen. Good work.', timestamp: '2025-04-29T17:10:00Z' },
      { id: 'm10', senderId: 'emp-manager', content: 'Standup starting in 5 minutes. 4 team members confirmed. Raj is out today — sick leave.', timestamp: '2025-04-30T09:25:00Z' },
    ],
    lastMessageAt: '2025-04-30T09:25:00Z',
    unreadCount: 2,
  },
  // DM: Raj <-> Sage
  {
    id: 'conv-sage',
    type: 'dm',
    name: 'Sage',
    participantIds: ['emp-raj', 'emp-sage'],
    messages: [
      { id: 'm1', senderId: 'emp-raj', content: 'Hey Sage, quick question on the auth middleware. How are you handling the token refresh in the GraphQL context?', timestamp: '2025-04-29T14:00:00Z' },
      { id: 'm2', senderId: 'emp-sage', content: 'I\'m using a short-lived access token (15 min) with a sliding refresh. The context builder checks expiry on each request and silently refreshes if within 5 min of expiry.', timestamp: '2025-04-29T14:02:00Z' },
      { id: 'm3', senderId: 'emp-raj', content: 'Smart. What about concurrent requests during refresh?', timestamp: '2025-04-29T14:05:00Z' },
      { id: 'm4', senderId: 'emp-sage', content: 'Redis lock with SET NX. First request refreshes, others wait up to 3 seconds then use the new token. Want me to share the code?', timestamp: '2025-04-29T14:07:00Z' },
      { id: 'm5', senderId: 'emp-raj', content: 'Yes please! I need something similar for the mobile auth flow.', timestamp: '2025-04-29T14:08:00Z' },
      { id: 'm6', senderId: 'emp-sage', content: 'Pushed to the `auth-patterns` branch. Check `src/auth/token-refresh.ts`. Let me know if you have questions!', timestamp: '2025-04-29T14:15:00Z' },
      { id: 'm7', senderId: 'emp-raj', content: 'This is exactly what I needed. Thanks!', timestamp: '2025-04-29T14:20:00Z' },
      { id: 'm8', senderId: 'emp-sage', content: 'Also — I added a fallback to session cookies if refresh fails. Graceful degradation for offline scenarios.', timestamp: '2025-04-29T14:22:00Z' },
    ],
    lastMessageAt: '2025-04-29T14:22:00Z',
    unreadCount: 0,
  },
  // DM: Priya <-> Pixel
  {
    id: 'conv-pixel',
    type: 'dm',
    name: 'Pixel',
    participantIds: ['emp-priya', 'emp-pixel'],
    messages: [
      { id: 'm1', senderId: 'emp-priya', content: 'Pixel, the color contrast on the new button component fails WCAG AA. The ratio is 3.8:1, needs to be 4.5:1 minimum.', timestamp: '2025-04-29T11:00:00Z' },
      { id: 'm2', senderId: 'emp-pixel', content: 'Thanks for catching that! I\'ll adjust the primary color to a darker shade. Should I also update the hover state?', timestamp: '2025-04-29T11:01:00Z' },
      { id: 'm3', senderId: 'emp-priya', content: 'Yes please. And can you add focus-visible styles for keyboard navigation? The current focus ring is too subtle.', timestamp: '2025-04-29T11:03:00Z' },
      { id: 'm4', senderId: 'emp-pixel', content: 'Updated in the design system Figma. New contrast ratio: 7.2:1. Added 2px brand-primary focus ring with 2px offset. Screenshots attached.', timestamp: '2025-04-29T11:15:00Z' },
      { id: 'm5', senderId: 'emp-priya', content: 'Looks great! I\'ll update the test cases to match.', timestamp: '2025-04-29T11:20:00Z' },
    ],
    lastMessageAt: '2025-04-29T11:20:00Z',
    unreadCount: 1,
  },
  // DM: Alex Chen <-> Maya
  {
    id: 'conv-maya',
    type: 'dm',
    name: 'Maya',
    participantIds: ['emp-alex', 'emp-maya'],
    messages: [
      { id: 'm1', senderId: 'emp-alex', content: 'Maya, how are we looking for the Q2 review?', timestamp: '2025-04-28T16:00:00Z' },
      { id: 'm2', senderId: 'emp-maya', content: 'Overall positive. Tax Platform is on track, API Modernization is green. Only concern is Mobile App — behind by 12%.', timestamp: '2025-04-28T16:05:00Z' },
      { id: 'm3', senderId: 'emp-alex', content: 'What do you need to get Mobile back on track?', timestamp: '2025-04-28T16:07:00Z' },
      { id: 'm4', senderId: 'emp-maya', content: 'I\'d like to pull Aria onto the Mobile sprint for 1 week. Her full-stack skills would unblock the frontend team.', timestamp: '2025-04-28T16:10:00Z' },
      { id: 'm5', senderId: 'emp-alex', content: 'Approved. Make the call.', timestamp: '2025-04-28T16:12:00Z' },
      { id: 'm6', senderId: 'emp-maya', content: 'Will do. I\'ll also schedule a design review with Pixel for the navigation component. We need to nail the UX before Raj implements.', timestamp: '2025-04-28T16:15:00Z' },
      { id: 'm7', senderId: 'emp-alex', content: 'Good thinking. Keep me posted on the IRS integration timeline.', timestamp: '2025-04-28T16:18:00Z' },
      { id: 'm8', senderId: 'emp-maya', content: 'Aria says May 10 for test completion. Production ready by May 15.', timestamp: '2025-04-28T16:20:00Z' },
      { id: 'm9', senderId: 'emp-alex', content: 'That works. Tax season is winding down — we have a comfortable window.', timestamp: '2025-04-28T16:22:00Z' },
    ],
    lastMessageAt: '2025-04-28T16:22:00Z',
    unreadCount: 0,
  },
  // Group DM: Engineering Team
  {
    id: 'conv-eng-group',
    type: 'group',
    name: 'Engineering Team',
    participantIds: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo'],
    messages: [
      { id: 'm1', senderId: 'emp-manager', content: 'Daily standup — Engineering Team\n\n**Yesterday:**\n- Aria: Completed payment gateway integration (TAX-148)\n- Sage: Fixed memory leak in PDF parser (TAX-146)\n- Raj: Built navigation drawer component (MOB-91)\n- Echo: Set up CI/CD pipeline for API project', timestamp: '2025-04-30T09:30:00Z' },
      { id: 'm2', senderId: 'emp-manager', content: '**Today:**\n- Aria: Continue IRS API integration (TAX-144)\n- Sage: Database migration for multi-tenancy (TAX-150)\n- Raj: Dark mode toggle implementation (MOB-92)\n- Echo: Load testing suite setup (API-60)', timestamp: '2025-04-30T09:31:00Z' },
      { id: 'm3', senderId: 'emp-manager', content: '**Blockers:**\n- Raj: Needs design review from Pixel for dark mode colors\n- Aria: Waiting for IRS staging credentials from Echo', timestamp: '2025-04-30T09:32:00Z' },
      { id: 'm4', senderId: 'emp-echo', content: 'IRS credentials are ready. Shared in #backend channel.', timestamp: '2025-04-30T09:35:00Z' },
      { id: 'm5', senderId: 'emp-aria', content: 'Got them, thanks Echo!', timestamp: '2025-04-30T09:36:00Z' },
    ],
    lastMessageAt: '2025-04-30T09:36:00Z',
    unreadCount: 0,
  },
  // Group DM: Project TAX
  {
    id: 'conv-tax-group',
    type: 'group',
    name: 'Project TAX',
    participantIds: ['emp-maya', 'emp-aria', 'emp-sage', 'emp-echo', 'emp-priya'],
    messages: [
      { id: 'm1', senderId: 'emp-manager', content: 'Project TAX — Sprint 12 Mid-Sprint Review\n\nProgress: 62% complete (on track)\nVelocity: 42 SP committed, 28 completed, 14 remaining\n\n**At Risk:**\n- IRS API integration: 2 edge cases unresolved\n- SOC2 audit: penetration testing delayed by 3 days', timestamp: '2025-04-29T17:00:00Z' },
      { id: 'm2', senderId: 'emp-aria', content: 'Update on IRS API: I resolved the rejected filing edge cases. Down to 12 scenarios, all with clear handling paths.', timestamp: '2025-04-29T17:15:00Z' },
      { id: 'm3', senderId: 'emp-echo', content: 'Pen test rescheduled for May 2. Vendor confirmed.', timestamp: '2025-04-29T17:20:00Z' },
      { id: 'm4', senderId: 'emp-priya', content: 'Automation suite is green. I added 23 new test cases for the payment flow.', timestamp: '2025-04-29T17:25:00Z' },
      { id: 'm5', senderId: 'emp-maya', content: 'Great work team. Let\'s keep the momentum going. Standup tomorrow at 9:30.', timestamp: '2025-04-29T17:30:00Z' },
    ],
    lastMessageAt: '2025-04-29T17:30:00Z',
    unreadCount: 0,
  },
];

// ── Mail Data ───────────────────────────────────────────────

export const emailThreads: EmailThread[] = [
  {
    id: 'mail-1',
    subject: 'Q2 Feature Request — Multi-State Filing Support',
    from: 'sarah.chen@clientcorp.com',
    to: ['alex@acme-brixstac.com'],
    messages: [
      { id: 'em1-1', from: 'sarah.chen@clientcorp.com', content: 'Hi Alex, We\'d love to see multi-state tax filing in Q2. Our team files in CA, NY, and TX. Is this on the roadmap?', timestamp: '2025-04-28T10:00:00Z' },
      { id: 'em1-2', from: 'alex@acme-brixstac.com', content: 'Hi Sarah, Yes! Multi-state is planned for Q3. I\'ll have our PM send you a detailed timeline by Friday.', timestamp: '2025-04-28T14:00:00Z' },
      { id: 'em1-3', from: 'sarah.chen@clientcorp.com', content: 'That\'s great news. We\'re happy to be beta testers when ready.', timestamp: '2025-04-29T09:00:00Z' },
    ],
    lastMessageAt: '2025-04-29T09:00:00Z',
    unread: true,
    labels: ['customer', 'feature-request'],
  },
  {
    id: 'mail-2',
    subject: 'Invoice #2025-0427 — AWS Infrastructure',
    from: 'billing@aws.amazon.com',
    to: ['echo@acme-brixstac.com', 'alex@acme-brixstac.com'],
    messages: [
      { id: 'em2-1', from: 'billing@aws.amazon.com', content: 'Your April 2025 AWS invoice is available. Total: $3,847.23. Due date: May 15, 2025.', timestamp: '2025-04-27T08:00:00Z' },
      { id: 'em2-2', from: 'echo@acme-brixstac.com', content: 'Received. Within budget. Auto-payment configured.', timestamp: '2025-04-27T09:00:00Z' },
    ],
    lastMessageAt: '2025-04-27T09:00:00Z',
    unread: false,
    labels: ['vendor', 'invoice'],
  },
  {
    id: 'mail-3',
    subject: 'SOC2 Audit — Document Request List',
    from: 'auditor@trustpoint.com',
    to: ['echo@acme-brixstac.com', 'manager@acme-brixstac.com'],
    messages: [
      { id: 'em3-1', from: 'auditor@trustpoint.com', content: 'Please provide the following for SOC2 Type II audit:\n1. Access control policies\n2. Change management logs (Jan-Apr 2025)\n3. Incident response documentation\n4. Employee training records', timestamp: '2025-04-25T12:00:00Z' },
      { id: 'em3-2', from: 'manager@acme-brixstac.com', content: 'We\'re compiling these. Expected delivery: May 5. I\'ll coordinate with Echo on the technical documents.', timestamp: '2025-04-25T15:00:00Z' },
    ],
    lastMessageAt: '2025-04-25T15:00:00Z',
    unread: true,
    labels: ['audit', 'compliance'],
  },
  {
    id: 'mail-4',
    subject: 'Partnership Proposal — Tax Software Integration',
    from: 'partnerships@intuit.com',
    to: ['alex@acme-brixstac.com'],
    messages: [
      { id: 'em4-1', from: 'partnerships@intuit.com', content: 'Dear Alex, We\'d like to explore an integration partnership between Brixstac and QuickBooks. Could we schedule a call next week?', timestamp: '2025-04-24T11:00:00Z' },
      { id: 'em4-2', from: 'alex@acme-brixstac.com', content: 'I\'m interested. How about Tuesday at 2 PM PT? I\'ll loop in our integrations lead.', timestamp: '2025-04-24T16:00:00Z' },
      { id: 'em4-3', from: 'partnerships@intuit.com', content: 'Tuesday works. I\'ll send a calendar invite.', timestamp: '2025-04-25T10:00:00Z' },
    ],
    lastMessageAt: '2025-04-25T10:00:00Z',
    unread: false,
    labels: ['partnership', 'integration'],
  },
  {
    id: 'mail-5',
    subject: 'Job Application — Senior Frontend Engineer',
    from: 'recruiting@acme-brixstac.com',
    to: ['maya@acme-brixstac.com'],
    messages: [
      { id: 'em5-1', from: 'recruiting@acme-brixstac.com', content: 'Hi Maya, We have a promising candidate for the Senior Frontend role: Alex Kim (ex-Stripe, 6 years React). Portfolio looks strong. Shall we schedule a technical screen?', timestamp: '2025-04-30T09:00:00Z' },
      { id: 'em5-2', from: 'maya@acme-brixstac.com', content: 'Yes, please schedule. I want Raj on the panel too — he knows what we need.', timestamp: '2025-04-30T10:00:00Z' },
    ],
    lastMessageAt: '2025-04-30T10:00:00Z',
    unread: true,
    labels: ['hiring', 'recruiting'],
  },
];

// ── Meetings ────────────────────────────────────────────────

export const meetings: Meeting[] = [
  {
    id: 'mtg-1', title: 'Engineering Daily Standup', startTime: '2025-05-01T09:30:00', endTime: '2025-05-01T09:45:00',
    attendees: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo'],
    meetingType: 'standup', channel: '#standups', recurring: true, description: 'Daily sync — blockers, progress, plans',
  },
  {
    id: 'mtg-2', title: 'Maya <> Raj 1:1', startTime: '2025-05-01T14:00:00', endTime: '2025-05-01T14:30:00',
    attendees: ['emp-maya', 'emp-raj'],
    meetingType: '1:1', channel: '', recurring: true, description: 'Weekly check-in — career growth, blockers, feedback',
  },
  {
    id: 'mtg-3', title: 'Sprint 13 Planning', startTime: '2025-05-02T10:00:00', endTime: '2025-05-02T11:30:00',
    attendees: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo', 'emp-priya', 'emp-manager'],
    meetingType: 'planning', channel: '#planning', recurring: false, description: 'Plan Sprint 13 for all active projects',
  },
  {
    id: 'mtg-4', title: 'IRS API Deep Dive', startTime: '2025-05-01T14:00:00', endTime: '2025-05-01T15:00:00',
    attendees: ['emp-maya', 'emp-aria', 'emp-sage', 'emp-echo', 'emp-raj'],
    meetingType: 'sync', channel: '#backend', recurring: false, description: 'Review IRS API integration blockers and staging status',
  },
  {
    id: 'mtg-5', title: 'Design Review — Navigation Component', startTime: '2025-05-02T15:00:00', endTime: '2025-05-02T16:00:00',
    attendees: ['emp-pixel', 'emp-raj', 'emp-maya'],
    meetingType: 'review', channel: '#design-system', recurring: false, description: 'Review dark mode and accessibility for navigation drawer',
  },
  {
    id: 'mtg-6', title: 'Sprint 12 Retrospective', startTime: '2025-05-05T16:00:00', endTime: '2025-05-05T17:00:00',
    attendees: ['emp-maya', 'emp-raj', 'emp-aria', 'emp-sage', 'emp-echo', 'emp-priya'],
    meetingType: 'retro', channel: '#general', recurring: false, description: 'What went well, what didn\'t, action items',
  },
  {
    id: 'mtg-7', title: 'Alex Chen <> Maya — Weekly Sync', startTime: '2025-05-02T10:00:00', endTime: '2025-05-02T10:30:00',
    attendees: ['emp-alex', 'emp-maya'],
    meetingType: '1:1', channel: '', recurring: true, description: 'Weekly leadership alignment — projects, hiring, strategy',
  },
  {
    id: 'mtg-8', title: 'QuickBooks Partnership Call', startTime: '2025-05-06T14:00:00', endTime: '2025-05-06T15:00:00',
    attendees: ['emp-alex', 'emp-manager'],
    meetingType: 'sync', channel: '', recurring: false, description: 'Explore integration partnership with Intuit/QuickBooks',
  },
];

// ── Approvals ───────────────────────────────────────────────

export const approvals: Approval[] = [
  // ── Pending (4) ──
  {
    id: 'apr-1', type: 'deploy', title: 'Deploy Tax Platform v2.3.1 to Production',
    description: 'Bug fixes for payment gateway and PDF parser. Rollback plan: automatic rollback on error rate >0.1%.',
    requesterId: 'emp-echo', approverId: 'emp-alex', status: 'pending',
    createdAt: '2025-04-30T10:00:00Z', dueAt: '2025-05-01T10:00:00Z', sla: '24h',
  },
  {
    id: 'apr-2', type: 'pr-review', title: 'PR #347: IRS API Integration — Final Review',
    description: 'Critical path PR. 1,247 lines changed. All tests passing. Security review complete. Needs final approval.',
    requesterId: 'emp-aria', approverId: 'emp-maya', status: 'pending',
    createdAt: '2025-04-30T08:00:00Z', dueAt: '2025-04-30T18:00:00Z', sla: '10h',
  },
  {
    id: 'apr-3', type: 'budget', title: 'Budget Override: Additional Compute Resources',
    description: 'Request $4,500/month additional AWS compute for load testing. Duration: 3 months. Reason: Tax season peak traffic.',
    requesterId: 'emp-echo', approverId: 'emp-alex', status: 'pending',
    createdAt: '2025-04-29T14:00:00Z', dueAt: '2025-05-02T14:00:00Z', sla: '72h',
  },
  {
    id: 'apr-4', type: 'customer-comm', title: 'Customer Communication: Service Maintenance Window',
    description: 'Planned maintenance May 10, 2-4 AM PT. Notify 15K active users. Email + in-app notification.',
    requesterId: 'emp-manager', approverId: 'emp-alex', status: 'pending',
    createdAt: '2025-04-30T09:00:00Z', dueAt: '2025-05-03T09:00:00Z', sla: '72h',
  },
  // ── Approved (12) ──
  {
    id: 'apr-5', type: 'deploy', title: 'Deploy API Gateway v2.2.0 to Staging',
    description: 'GraphQL schema updates, rate limiting improvements. CI passing, security scan clean.',
    requesterId: 'emp-echo', approverId: 'emp-maya', status: 'approved',
    createdAt: '2025-04-28T09:00:00Z', dueAt: '2025-04-29T09:00:00Z', sla: '24h',
  },
  {
    id: 'apr-6', type: 'pr-review', title: 'PR #341: Payment Gateway Refactor',
    description: 'Extracted payment service into microservice. 847 lines changed. All tests passing.',
    requesterId: 'emp-sage', approverId: 'emp-maya', status: 'approved',
    createdAt: '2025-04-27T10:00:00Z', dueAt: '2025-04-27T18:00:00Z', sla: '8h',
  },
  {
    id: 'apr-7', type: 'budget', title: 'Q2 Design Tool Licenses — Figma',
    description: 'Renewal of 8 Figma Professional seats for Design team. $1,440/quarter.',
    requesterId: 'emp-pixel', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-25T11:00:00Z', dueAt: '2025-04-28T11:00:00Z', sla: '72h',
  },
  {
    id: 'apr-8', type: 'customer-comm', title: 'Product Update Newsletter — April 2025',
    description: 'Monthly product update for 15K subscribers. Includes new features and roadmap.',
    requesterId: 'emp-manager', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-24T08:00:00Z', dueAt: '2025-04-26T08:00:00Z', sla: '48h',
  },
  {
    id: 'apr-9', type: 'deploy', title: 'Deploy Mobile App v1.8.2 to App Store',
    description: 'Accessibility fixes, dark mode improvements. QA sign-off complete.',
    requesterId: 'emp-raj', approverId: 'emp-maya', status: 'approved',
    createdAt: '2025-04-23T14:00:00Z', dueAt: '2025-04-24T14:00:00Z', sla: '24h',
  },
  {
    id: 'apr-10', type: 'policy', title: 'Update Remote Work Policy v3.0',
    description: 'Revised remote work guidelines. HR reviewed. Effective May 1, 2025.',
    requesterId: 'emp-manager', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-22T09:00:00Z', dueAt: '2025-04-25T09:00:00Z', sla: '72h',
  },
  {
    id: 'apr-11', type: 'pr-review', title: 'PR #338: Database Migration Script',
    description: 'Multi-tenancy schema migration. Rollback script included. Tested on staging.',
    requesterId: 'emp-sage', approverId: 'emp-aria', status: 'approved',
    createdAt: '2025-04-21T10:00:00Z', dueAt: '2025-04-21T16:00:00Z', sla: '6h',
  },
  {
    id: 'apr-12', type: 'budget', title: 'Kubernetes Cluster Expansion',
    description: 'Add 3 nodes to EKS cluster for tax season scaling. $2,100/month.',
    requesterId: 'emp-echo', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-20T13:00:00Z', dueAt: '2025-04-23T13:00:00Z', sla: '72h',
  },
  {
    id: 'apr-13', type: 'deploy', title: 'Emergency Hotfix: PDF Parser Memory Leak',
    description: 'Critical production fix. Patches memory leak in tax form PDF parser. Verified with load test.',
    requesterId: 'emp-sage', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-19T16:00:00Z', dueAt: '2025-04-19T18:00:00Z', sla: '2h',
  },
  {
    id: 'apr-14', type: 'customer-comm', title: 'Tax Deadline Reminder Email Campaign',
    description: 'Urgent reminder to 8,500 users about April 15 filing deadline. Pre-approved template.',
    requesterId: 'emp-manager', approverId: 'emp-alex', status: 'approved',
    createdAt: '2025-04-14T08:00:00Z', dueAt: '2025-04-14T12:00:00Z', sla: '4h',
  },
  {
    id: 'apr-15', type: 'pr-review', title: 'PR #329: Auth OAuth 2.0 Flow',
    description: 'Complete OAuth implementation with JWT refresh tokens. Security review passed.',
    requesterId: 'emp-aria', approverId: 'emp-maya', status: 'approved',
    createdAt: '2025-04-10T09:00:00Z', dueAt: '2025-04-10T17:00:00Z', sla: '8h',
  },
  {
    id: 'apr-16', type: 'deploy', title: 'Deploy Analytics Dashboard v1.0',
    description: 'New internal analytics dashboard. Data team reviewed. Rollback plan documented.',
    requesterId: 'emp-echo', approverId: 'emp-maya', status: 'approved',
    createdAt: '2025-04-08T11:00:00Z', dueAt: '2025-04-09T11:00:00Z', sla: '24h',
  },
  // ── Rejected (2) ──
  {
    id: 'apr-17', type: 'budget', title: 'Request for Standing Desk — 10 units',
    description: 'Purchase 10 motorized standing desks for engineering team. $12,000 one-time.',
    requesterId: 'emp-maya', approverId: 'emp-alex', status: 'rejected',
    createdAt: '2025-04-15T10:00:00Z', dueAt: '2025-04-18T10:00:00Z', sla: '72h',
  },
  {
    id: 'apr-18', type: 'deploy', title: 'Deploy Experimental Feature Flag Service',
    description: 'New third-party feature flag tool integration. Security team flagged concerns.',
    requesterId: 'emp-echo', approverId: 'emp-alex', status: 'rejected',
    createdAt: '2025-04-12T09:00:00Z', dueAt: '2025-04-13T09:00:00Z', sla: '24h',
  },
];

// ── Activities ──────────────────────────────────────────────

export const activities: Activity[] = [
  { id: 'act-1', type: 'commit', actorId: 'emp-aria', targetName: 'feat/auth-oauth', message: 'Aria pushed commit `feat/auth-oauth` to Tax Filing', timestamp: '2025-04-30T10:02:00Z', projectId: 'proj-tax' },
  { id: 'act-2', type: 'pr-merged', actorId: 'emp-maya', targetName: 'PR #347', message: 'Maya approved PR #347 — IRS API integration', timestamp: '2025-04-30T09:45:00Z', projectId: 'proj-tax' },
  { id: 'act-3', type: 'file-uploaded', actorId: 'emp-pixel', targetName: 'Mobile App Figma', message: 'Pixel uploaded 3 mockups to Mobile App Redesign', timestamp: '2025-04-30T09:30:00Z', projectId: 'proj-mob' },
  { id: 'act-4', type: 'ticket-completed', actorId: 'emp-sage', targetName: 'TAX-146', message: 'Sage fixed memory leak in PDF parser (TAX-146)', timestamp: '2025-04-30T09:00:00Z', projectId: 'proj-tax' },
  { id: 'act-5', type: 'deploy-shipped', actorId: 'emp-echo', targetName: 'staging', message: 'Echo deployed API v2.2.0 to staging', timestamp: '2025-04-30T08:30:00Z', projectId: 'proj-api' },
  { id: 'act-6', type: 'mention', actorId: 'emp-raj', targetName: 'aria', message: 'Raj mentioned Aria in #frontend: "Need help with GraphQL resolver"', timestamp: '2025-04-30T08:15:00Z' },
  { id: 'act-7', type: 'status-change', actorId: 'emp-manager', targetName: 'TAX-144', message: 'Manager moved TAX-144 to In Progress', timestamp: '2025-04-30T08:00:00Z', projectId: 'proj-tax' },
  { id: 'act-8', type: 'risk-flagged', actorId: 'emp-pixel', targetName: 'MOB-90', message: 'Pixel flagged 12 accessibility issues in Mobile App', timestamp: '2025-04-29T17:00:00Z', projectId: 'proj-mob' },
  { id: 'act-9', type: 'review-submitted', actorId: 'emp-priya', targetName: 'MOB-94', message: 'Priya completed cross-browser testing review', timestamp: '2025-04-29T16:30:00Z', projectId: 'proj-mob' },
  { id: 'act-10', type: 'goal-updated', actorId: 'emp-manager', targetName: 'Q2 OKRs', message: 'Manager updated Q2 OKR progress: 73% on track', timestamp: '2025-04-29T16:00:00Z' },
  { id: 'act-11', type: 'sprint-completed', actorId: 'emp-manager', targetName: 'Sprint 11', message: 'Sprint 11 completed: 38 SP, 95% commitment met', timestamp: '2025-04-29T15:00:00Z', projectId: 'proj-tax' },
  { id: 'act-12', type: 'approval-needed', actorId: 'emp-echo', targetName: 'Deploy v2.3.1', message: 'Echo requested production deploy approval', timestamp: '2025-04-30T10:00:00Z', projectId: 'proj-tax' },
  { id: 'act-13', type: 'meeting-started', actorId: 'emp-manager', targetName: 'Daily Standup', message: 'Manager started Engineering standup', timestamp: '2025-04-30T09:30:00Z' },
  { id: 'act-14', type: 'commit', actorId: 'emp-sage', targetName: 'fix/pdf-memory-leak', message: 'Sage pushed commit `fix/pdf-memory-leak`', timestamp: '2025-04-30T08:45:00Z', projectId: 'proj-tax' },
  { id: 'act-15', type: 'comment', actorId: 'emp-aria', targetName: 'TAX-150', message: 'Aria commented on TAX-150: "Migration script ready for review"', timestamp: '2025-04-30T07:30:00Z', projectId: 'proj-tax' },
  { id: 'act-16', type: 'ticket-completed', actorId: 'emp-echo', targetName: 'API-58', message: 'Echo completed API rate limiting setup (API-58)', timestamp: '2025-04-29T18:00:00Z', projectId: 'proj-api' },
  { id: 'act-17', type: 'mention', actorId: 'emp-alex', targetName: 'maya', message: 'Alex mentioned Maya: "Q2 review looking good"', timestamp: '2025-04-29T17:30:00Z' },
  { id: 'act-18', type: 'file-uploaded', actorId: 'emp-echo', targetName: 'k6-load-tests', message: 'Echo uploaded load test results for API endpoints', timestamp: '2025-04-29T15:00:00Z', projectId: 'proj-api' },
  { id: 'act-19', type: 'status-change', actorId: 'emp-pixel', targetName: 'MOB-89', message: 'Pixel completed design tokens task (MOB-89)', timestamp: '2025-04-29T14:00:00Z', projectId: 'proj-mob' },
  { id: 'act-20', type: 'deploy-shipped', actorId: 'emp-echo', targetName: 'production', message: 'Echo hotfixed production: PDF parser patch', timestamp: '2025-04-29T12:00:00Z', projectId: 'proj-tax' },
  { id: 'act-21', type: 'commit', actorId: 'emp-raj', targetName: 'feat/nav-drawer', message: 'Raj pushed commit `feat/nav-drawer` to Mobile App', timestamp: '2025-04-29T11:00:00Z', projectId: 'proj-mob' },
  { id: 'act-22', type: 'review-submitted', actorId: 'emp-priya', targetName: 'TAX-148', message: 'Priya approved payment gateway QA (TAX-148)', timestamp: '2025-04-29T10:30:00Z', projectId: 'proj-tax' },
];

// ── Company Goals (OKRs) ────────────────────────────────────

export const companyGoals: CompanyGoal[] = [
  {
    id: 'goal-1',
    title: 'Ship Tax Filing Platform v2',
    status: 'green',
    ownerId: 'emp-alex',
    progress: 73,
    keyResults: [
      { id: 'kr-1-1', text: 'Process 10K returns without errors', current: 7300, target: 10000, unit: 'returns', status: 'green' },
      { id: 'kr-1-2', text: 'Reduce filing time to <5 min', current: 3.2, target: 5, unit: 'minutes', status: 'amber' },
      { id: 'kr-1-3', text: 'Achieve 99.9% uptime', current: 99.7, target: 99.9, unit: 'percent', status: 'green' },
      { id: 'kr-1-4', text: 'Get SOC2 compliance', current: 60, target: 100, unit: 'percent', status: 'green' },
    ],
  },
  {
    id: 'goal-2',
    title: 'Launch Mobile App Redesign',
    status: 'amber',
    ownerId: 'emp-maya',
    progress: 58,
    keyResults: [
      { id: 'kr-2-1', text: 'Ship redesigned iOS and Android apps', current: 23, target: 38, unit: 'tasks', status: 'amber' },
      { id: 'kr-2-2', text: 'Pass WCAG 2.1 AA audit', current: 0, target: 12, unit: 'issues', status: 'amber' },
      { id: 'kr-2-3', text: 'Increase mobile conversion by 25%', current: 12, target: 25, unit: 'percent', status: 'red' },
    ],
  },
  {
    id: 'goal-3',
    title: 'Modernize Core APIs',
    status: 'green',
    ownerId: 'emp-sage',
    progress: 81,
    keyResults: [
      { id: 'kr-3-1', text: 'Migrate 80% of REST endpoints', current: 62, target: 80, unit: 'endpoints', status: 'green' },
      { id: 'kr-3-2', text: 'Reduce API latency by 40%', current: 28, target: 40, unit: 'percent', status: 'green' },
      { id: 'kr-3-3', text: '99.99% API uptime', current: 99.95, target: 99.99, unit: 'percent', status: 'green' },
    ],
  },
  {
    id: 'goal-4',
    title: 'Scale Team to 25 Engineers',
    status: 'green',
    ownerId: 'emp-alex',
    progress: 36,
    keyResults: [
      { id: 'kr-4-1', text: 'Hire 16 new engineers', current: 5, target: 16, unit: 'hires', status: 'green' },
      { id: 'kr-4-2', text: 'Maintain <30 day time-to-fill', current: 24, target: 30, unit: 'days', status: 'green' },
    ],
  },
];

// ── Helper Functions ────────────────────────────────────────

export function getEmployeeById(id: string): Employee | undefined {
  return employees.find(e => e.id === id);
}

export function getTeamById(id: string): Team | undefined {
  return teams.find(t => t.id === id);
}

export function getProjectById(id: string): Project | undefined {
  return projects.find(p => p.id === id);
}

export function getTicketsByProject(projectId: string): Ticket[] {
  return allTickets.filter(t => t.projectId === projectId);
}

export function getTicketsBySprint(sprintId: string): Ticket[] {
  return allTickets.filter(t => t.sprintId === sprintId);
}

export function getSprintById(id: string): Sprint | undefined {
  return allSprints.find(s => s.id === id);
}

export function getActiveSprintForProject(projectId: string): Sprint | undefined {
  return allSprints.find(s => s.projectId === projectId && s.status === 'active');
}

export function getConversationById(id: string): Conversation | undefined {
  return conversations.find(c => c.id === id);
}

export function getUnreadMessageCount(): number {
  return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
}

export function getPendingApprovalCount(): number {
  return approvals.filter(a => a.status === 'pending').length;
}

export function getEmployeesByTeam(teamId: string): Employee[] {
  return employees.filter(e => e.teamIds.includes(teamId));
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date('2025-05-01T12:00:00Z').getTime();
  const then = new Date(timestamp).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

export function getHealthColor(health: ProjectHealth): string {
  switch (health) {
    case 'green': return '#237b4b';
    case 'amber': return '#b56200';
    case 'red': return '#c4314b';
    default: return '#8a8a8a';
  }
}

export function getHealthLabel(health: ProjectHealth): string {
  switch (health) {
    case 'green': return 'On Track';
    case 'amber': return 'At Risk';
    case 'red': return 'Critical';
    default: return 'Unknown';
  }
}

export function getSparklineData(): number[] {
  return [32, 35, 34, 38, 40, 39, 42, 44, 43, 42];
}

export const currentUser = employees[0]; // Alex Chen
