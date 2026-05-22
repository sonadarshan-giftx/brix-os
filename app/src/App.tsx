// ============================================================
// Brix OS — Main App Router with Guards, Code Splitting & Scroll
// ============================================================

import { lazy, Suspense, useEffect, useCallback } from 'react';
import {
  HashRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from 'react-router';
import { TRPCProvider } from '@/providers/trpc';
import { ThemeProvider } from '@/providers/theme';
import { Layout } from '@/components/shell/Layout';
import { ROUTES, AUTHENTICATED_ROUTES } from '@/const';
import { useStore } from '@/store/useStore';

// ── API client ──────────────────────────────────────────────
import { authApi, workspaceApi } from '@/utils/api';

// ── Eager-loaded pages (critical path) ──────────────────────
import Login from './pages/Login';
import NotFound from './pages/NotFound';

// ── Landing page (public) ───────────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));

// ── Lazy-loaded pages (code split) ──────────────────────────
const Home = lazy(() => import('./pages/Home'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const TeamsPage = lazy(() => import('./pages/TeamsPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ApprovalsPage = lazy(() => import('./pages/ApprovalsPage'));
const CallsPage = lazy(() => import('./pages/CallsPage'));
const AppsPage = lazy(() => import('./pages/AppsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const AutomationPage = lazy(() => import('./pages/AutomationPage'));
const ZeroTrustPage = lazy(() => import('./pages/ZeroTrustPage'));

// ── AI Gateway ──────────────────────────────────────────────
const AIGatewayPage = lazy(() => import('./pages/AIGateway'));

// ── New enterprise modules ───────────────────────────────────
const DocsPage = lazy(() => import('./pages/DocsPage'));
const AIEmployeesPage = lazy(() => import('./pages/AIEmployeesPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));

// ── New SaaS pages ──────────────────────────────────────────
const SetupWizardPage = lazy(() => import('./pages/SetupWizardPage'));
const StartPage = lazy(() => import('./pages/StartPage'));
const JoinPage = lazy(() => import('./pages/JoinPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const CreateWorkspacePage = lazy(() => import('./pages/CreateWorkspacePage'));
const WorkspaceSettingsPage = lazy(() => import('./pages/WorkspaceSettingsPage'));
const InviteAcceptPage = lazy(() => import('./pages/InviteAcceptPage'));
const BillingPage = lazy(() => import('./pages/BillingPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));
const HelpCenterPage = lazy(() => import('./pages/HelpCenterPage'));
const DataExportPage = lazy(() => import('./pages/DataExportPage'));

// ── Loading Fallback ────────────────────────────────────────

function PageLoader() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          border: '3px solid var(--surface-border)',
          borderTopColor: 'var(--brand-primary)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <span
        style={{
          fontSize: '13px',
          color: 'var(--text-secondary)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Loading...
      </span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          div[style*="animation"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Scroll Restoration ──────────────────────────────────────

function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Reset scroll to top on navigation
    window.scrollTo(0, 0);

    // Also scroll the main content area if it exists
    const mainContent = document.querySelector('.main-content-area');
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

// ── Page Title Updater ──────────────────────────────────────

function TitleUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Brix OS — AI-Native Operating System',
      '/mission': 'Mission — Brix OS',
      '/plan': 'Plan — Brix OS',
      '/projects': 'Projects — Brix OS',
      '/teams': 'Teams — Brix OS',
      '/chat': 'Chat — Brix OS',
      '/calendar': 'Calendar — Brix OS',
      '/approvals': 'Approvals — Brix OS',
      '/calls': 'Calls — Brix OS',
      '/apps': 'Apps — Brix OS',
      '/profile': 'Profile — Brix OS',
      '/security': 'Zero Trust Security — Brix OS',
      '/onboarding': 'Welcome — Brix OS',
      '/automation': 'Automation — Brix OS',
      '/login': 'Login — Brix OS',
      '/start': 'Create Workspace — Brix OS',
      '/join': 'Join Workspace — Brix OS',
      '/forgot-password': 'Forgot Password — Brix OS',
      '/verify-email': 'Verify Email — Brix OS',
      '/create-workspace': 'Create Workspace — Brix OS',
      '/workspace-settings': 'Workspace Settings — Brix OS',
      '/invite': 'Invitation — Brix OS',
      '/billing': 'Billing — Brix OS',
      '/admin': 'Admin — Brix OS',
      '/privacy': 'Privacy Policy — Brix OS',
      '/terms': 'Terms of Service — Brix OS',
      '/help': 'Help Center — Brix OS',
      '/data-export': 'Data Export — Brix OS',
      '/ai-gateway': 'AI Gateway — Brix OS',
      '/docs': 'Docs — Brix OS',
      '/ai-employees': 'AI Employees — Brix OS',
      '/analytics': 'Analytics — Brix OS',
    };
    const title = titles[pathname] || 'Brix OS — AI-Native Operating System';
    document.title = title;
  }, [pathname]);

  return null;
}

// ── Route Guard ─────────────────────────────────────────────

function RouteGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useStore((s) => s.currentUser);
  const onboardingComplete = useStore((s) => s.onboardingComplete);

  // Check if user needs onboarding
  const needsOnboarding = !onboardingComplete;

  // Check if current route requires auth
  const isAuthRoute = AUTHENTICATED_ROUTES.includes(
    location.pathname as (typeof AUTHENTICATED_ROUTES)[number]
  );

  // Route to rail item sync
  useEffect(() => {
    const path = location.pathname;
    if (path === '/') {
      useStore.getState().setActiveRailItem('projects');
    } else {
      const segment = path.replace(/^\//, '').split('/')[0];
      if (segment) {
        useStore.getState().setActiveRailItem(segment);
      }
    }
  }, [location.pathname]);

  // Redirect unauthenticated users to landing or start
  useEffect(() => {
    if (!currentUser) {
      // Public routes that don't require redirect
      const publicRoutes = ['/', '/start', '/login', '/join', '/forgot-password', '/verify-email', '/terms', '/privacy', '/help', '/landing'];
      const isPublic = publicRoutes.some((r) => location.pathname === r || location.pathname.startsWith(r + '/'));
      if (!isPublic) {
        navigate('/login', { replace: true });
      }
    }
  }, [currentUser, location.pathname, navigate]);

  // Redirect logged-in users needing onboarding
  useEffect(() => {
    if (currentUser && needsOnboarding && !['/start', '/onboarding', '/create-workspace'].includes(location.pathname)) {
      navigate('/onboarding', { replace: true });
    }
  }, [currentUser, needsOnboarding, location.pathname, navigate]);

  return <>{children}</>;
}

// ── Layout Wrapper (used by AuthRouter) ────────────────────



// ── Suspense Wrapper ────────────────────────────────────────

function withLazy(PageComponent: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <PageComponent />
    </Suspense>
  );
}

// ── Main App ────────────────────────────────────────────────

// ── Session Restorer — refresh token on startup ──────────────
function SessionRestorer() {
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    const restore = async () => {
      const state = useStore.getState();
      if (!state.currentUser) return;

      const token = state.authToken;
      const refresh = state.refreshToken;

      if (!token) {
        // No token but has user — try refresh
        if (refresh) {
          try {
            const tokens = await authApi.refresh(refresh);
            useStore.setState((s: any) => {
              s.authToken = tokens.accessToken;
              s.refreshToken = tokens.refreshToken;
            });
          } catch {
            useStore.getState().logout();
          }
        } else {
          useStore.getState().logout();
        }
        return;
      }

      // Check if token is expired (client-side decode)
      try {
        const [, payload] = token.split('.');
        const decoded = JSON.parse(atob(payload));
        const now = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < now) {
          // Token expired — try refresh
          if (refresh) {
            try {
              const tokens = await authApi.refresh(refresh);
              useStore.setState((s: any) => {
                s.authToken = tokens.accessToken;
                s.refreshToken = tokens.refreshToken;
              });
            } catch {
              useStore.getState().logout();
            }
          } else {
            useStore.getState().logout();
          }
        } else {
          // Token still valid — reload workspaces in the background
          workspaceApi.list(token)
            .then((ws) => {
              if (ws.length > 0) {
                useStore.setState((s: any) => {
                  s.workspaces = ws;
                  if (!s.workspace) s.workspace = ws[0];
                });
              }
            })
            .catch(() => {/* non-fatal */});
        }
      } catch {
        // Bad token format
        useStore.getState().logout();
      }
    };

    restore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

// ── Auth Router — conditionally renders landing vs app ───────
function AuthRouter() {
  const currentUser = useStore((s) => s.currentUser);

  if (!currentUser) {
    // Not logged in: show landing page
    return (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    );
  }

  // Logged in: show full app layout with routes
  return (
    <RouteGuard>
      <Layout />
    </RouteGuard>
  );
}

export default function App() {
  return (
    <TRPCProvider>
      <ThemeProvider>
        <HashRouter>
          <SessionRestorer />
          <ScrollRestoration />
          <TitleUpdater />
          <Routes>
            {/* Root: Landing page (public) or App Layout (auth) */}
            <Route path="/" element={<AuthRouter />}>
              <Route index element={withLazy(Home)} />
              <Route path="mission" element={withLazy(Home)} />
              <Route path="plan" element={withLazy(Home)} />
              <Route path="projects" element={withLazy(ProjectsPage)} />
              <Route path="teams" element={withLazy(TeamsPage)} />
              <Route path="chat" element={withLazy(ChatPage)} />
              <Route path="calendar" element={withLazy(CalendarPage)} />
              <Route path="approvals" element={withLazy(ApprovalsPage)} />
              <Route path="calls" element={withLazy(CallsPage)} />
              <Route path="apps" element={withLazy(AppsPage)} />
              <Route path="profile" element={withLazy(ProfilePage)} />
              <Route path="security" element={withLazy(ZeroTrustPage)} />
              <Route path="docs" element={withLazy(DocsPage)} />
              <Route path="docs/:spaceId" element={withLazy(DocsPage)} />
              <Route path="docs/:spaceId/:pageId" element={withLazy(DocsPage)} />
              <Route path="ai-employees" element={withLazy(AIEmployeesPage)} />
              <Route path="analytics" element={withLazy(AnalyticsPage)} />
              <Route path="onboarding" element={withLazy(OnboardingPage)} />
              <Route path="automation" element={withLazy(AutomationPage)} />
              <Route path="ai-gateway" element={withLazy(AIGatewayPage)} />
            </Route>

            {/* Auth routes (always accessible, outside app layout) */}
            <Route path="/login" element={<Login />} />
            <Route path="/setup" element={withLazy(SetupWizardPage)} />
            <Route path="/start" element={withLazy(StartPage)} />
            <Route path="/join/:slug" element={withLazy(JoinPage)} />
            <Route path="/forgot-password" element={withLazy(ForgotPasswordPage)} />
            <Route path="/verify-email" element={withLazy(VerifyEmailPage)} />
            <Route path="/create-workspace" element={withLazy(CreateWorkspacePage)} />
            <Route path="/workspace-settings" element={withLazy(WorkspaceSettingsPage)} />
            <Route path="/invite/:token" element={withLazy(InviteAcceptPage)} />
            <Route path="/billing" element={withLazy(BillingPage)} />
            <Route path="/admin" element={withLazy(AdminDashboardPage)} />
            <Route path="/privacy" element={withLazy(PrivacyPolicyPage)} />
            <Route path="/terms" element={withLazy(TermsOfServicePage)} />
            <Route path="/help" element={withLazy(HelpCenterPage)} />
            <Route path="/data-export" element={withLazy(DataExportPage)} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </ThemeProvider>
    </TRPCProvider>
  );
}
