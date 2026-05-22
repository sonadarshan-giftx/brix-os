// ============================================================
// Brixstac — Application Constants
// ============================================================

// ── Authentication ──────────────────────────────────────────
export const LOGIN_PATH = '/login';
export const AUTH_TOKEN_KEY = 'brixstac_auth_token';
export const AUTH_REFRESH_KEY = 'brixstac_refresh_token';
export const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

// ── API ─────────────────────────────────────────────────────
export const API_BASE_URL = '/api/trpc';
export const API_TIMEOUT_MS = 30000;
export const API_RETRY_ATTEMPTS = 3;
export const API_RETRY_DELAY_MS = 1000;

// ── Routes ──────────────────────────────────────────────────
export const ROUTES = {
  home: '/',
  mission: '/mission',
  plan: '/plan',
  projects: '/projects',
  teams: '/teams',
  chat: '/chat',
  calendar: '/calendar',
  approvals: '/approvals',
  calls: '/calls',
  apps: '/apps',
  profile: '/profile',
  security: '/security',
  onboarding: '/onboarding',
  automation: '/automation',
  login: '/login',
  start: '/start',
  forgotPassword: '/forgot-password',
  verifyEmail: '/verify-email',
  createWorkspace: '/create-workspace',
  workspaceSettings: '/workspace-settings',
  inviteAccept: '/invite',
  joinWorkspace: '/join',
  billing: '/billing',
  admin: '/admin',
  privacy: '/privacy',
  terms: '/terms',
  help: '/help',
  dataExport: '/data-export',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

// Route display names (for breadcrumbs, analytics)
export const ROUTE_NAMES: Record<AppRoute, string> = {
  '/': 'Dashboard',
  '/mission': 'Mission',
  '/plan': 'Plan',
  '/projects': 'Projects',
  '/teams': 'Teams',
  '/chat': 'Chat',
  '/calendar': 'Calendar',
  '/approvals': 'Approvals',
  '/calls': 'Calls',
  '/apps': 'Apps',
  '/profile': 'Profile',
  '/security': 'Security',
  '/onboarding': 'Onboarding',
  '/automation': 'Automation',
  '/login': 'Login',
  '/start': 'Create Workspace',
  '/forgot-password': 'Forgot Password',
  '/verify-email': 'Verify Email',
  '/create-workspace': 'Create Workspace',
  '/workspace-settings': 'Workspace Settings',
  '/invite': 'Invitation',
  '/join': 'Join Workspace',
  '/billing': 'Billing',
  '/admin': 'Admin Dashboard',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/help': 'Help Center',
  '/data-export': 'Data Export',
};

// Routes that require authentication
export const AUTHENTICATED_ROUTES: AppRoute[] = [
  '/',
  '/mission',
  '/plan',
  '/projects',
  '/teams',
  '/chat',
  '/calendar',
  '/approvals',
  '/calls',
  '/apps',
  '/profile',
  '/security',
  '/onboarding',
  '/automation',
  '/workspace-settings',
  '/billing',
  '/admin',
  '/data-export',
];

// ── Validation Constants ────────────────────────────────────
export const VALIDATION = {
  // Text input limits
  MAX_PROJECT_NAME_LENGTH: 100,
  MAX_TASK_TITLE_LENGTH: 200,
  MAX_BUG_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_TEAM_NAME_LENGTH: 100,
  MAX_CHANNEL_NAME_LENGTH: 50,
  MAX_COMMENT_LENGTH: 2000,
  MAX_SPRINT_NAME_LENGTH: 100,
  MAX_ROLE_NAME_LENGTH: 100,
  MAX_POLICY_NAME_LENGTH: 200,
  MAX_MESSAGE_LENGTH: 4000,
  MAX_FILE_NAME_LENGTH: 255,

  // Numeric limits
  MIN_STORY_POINTS: 0,
  MAX_STORY_POINTS: 100,
  MAX_BUDGET_TOTAL: 100000000, // $100M
  MIN_PASSWORD_LENGTH: 12,

  // Array limits
  MAX_PROJECT_MEMBERS: 100,
  MAX_TEAM_MEMBERS: 50,
  MAX_LABELS_PER_TICKET: 10,
  MAX_ATTACHMENTS_PER_MESSAGE: 5,
} as const;

// ── Pagination ──────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ── Feature Flags ───────────────────────────────────────────
export const FEATURE_FLAGS = {
  // Core features (stable)
  projects: true,
  teams: true,
  chat: true,
  calendar: true,
  approvals: true,
  calls: true,

  // Security features (stable)
  rbac: true,
  vpn: true,
  zeroTrust: true,

  // In-progress features (may be incomplete)
  automation: true, // Workflow automation - UI complete, backend WIP
  apps: true,       // App marketplace - mock data only
  mission: true,    // Mission/OKR tracking - partial implementation
  plan: true,       // Quarterly planning - partial implementation

  // Experimental features
  aiCopilot: true,
  realTimeNotifications: false, // WebSocket notifications - not implemented
  advancedAnalytics: false,     // Detailed analytics dashboard - not implemented
  customDashboards: false,      // User-customizable dashboards - not implemented
} as const;

// ── Theme Constants ─────────────────────────────────────────
export const THEME = {
  STORAGE_KEY: 'brixstac-theme',
  ACCENT_COLORS: [
    { name: 'Royal', value: '#5b5fc7' },
    { name: 'Crimson', value: '#c4314b' },
    { name: 'Forest', value: '#237b4b' },
    { name: 'Azure', value: '#0078d4' },
    { name: 'Amber', value: '#ffaa44' },
    { name: 'Teal', value: '#008484' },
  ],
  FONT_SIZE_OPTIONS: [
    { label: 'Small', value: 13, scale: 0.875 },
    { label: 'Medium', value: 14, scale: 1 },
    { label: 'Large', value: 16, scale: 1.125 },
    { label: 'Extra Large', value: 18, scale: 1.25 },
  ],
  DENSITY_OPTIONS: [
    { label: 'Compact', value: 'compact', spacing: 0.75 },
    { label: 'Comfortable', value: 'comfortable', spacing: 1 },
    { label: 'Spacious', value: 'spacious', spacing: 1.25 },
  ],
} as const;

// ── Storage Keys ────────────────────────────────────────────
export const STORAGE_KEYS = {
  store: 'brixstac-store',
  theme: 'brixstac-theme',
  auth: 'brixstac-auth',
  sidebarState: 'brixstac-sidebar',
  notifications: 'brixstac-notifications',
  recentViews: 'brixstac-recent-views',
  draftMessages: 'brixstac-draft-messages',
  undoStack: 'brixstac-undo-stack',
} as const;

// ── Date/Time Formats ───────────────────────────────────────
export const DATE_FORMATS = {
  shortDate: 'MMM d, yyyy',
  longDate: 'MMMM d, yyyy',
  shortDateTime: 'MMM d, yyyy h:mm a',
  longDateTime: 'MMMM d, yyyy h:mm:ss a',
  isoDate: 'yyyy-MM-dd',
  isoDateTime: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  timeOnly: 'h:mm a',
  relative: 'relative',
} as const;

// ── Notification Settings ───────────────────────────────────
export const NOTIFICATION = {
  MAX_NOTIFICATIONS: 50,
  AUTO_DISMISS_MS: 5000,
  MAX_TOASTS: 3,
} as const;

// ── Undo/Redo ───────────────────────────────────────────────
export const UNDO_STACK_LIMIT = 20;

// ── Security ────────────────────────────────────────────────
export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 12,
  SESSION_REAUTH_HOURS: 4,
  TOKEN_REFRESH_MINUTES: 5,
} as const;

// ── Currency ────────────────────────────────────────────────
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_LOCALE = 'en-US';

// ── Company Info ────────────────────────────────────────────
export const COMPANY = {
  name: 'Brixstac',
  shortName: 'Brix',
  defaultAvatarPath: '/avatar-default.jpg',
} as const;
