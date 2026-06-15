import { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { LoadingState } from '@/components/shared/LoadingState';
import { ChevronRight, Home } from 'lucide-react';

// Lazy load pages for code-splitting
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const TeamsPage = lazy(() => import('@/pages/TeamsPage'));
const ChatPage = lazy(() => import('@/pages/ChatPage'));
const CallsPage = lazy(() => import('@/pages/CallsPage'));
const CalendarPage = lazy(() => import('@/pages/CalendarPage'));
const ApprovalsPage = lazy(() => import('@/pages/ApprovalsPage'));
const AppsPage = lazy(() => import('@/pages/AppsPage'));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const AutomationPage = lazy(() => import('@/pages/AutomationPage'));
const ZeroTrustPage = lazy(() => import('@/pages/ZeroTrustPage'));
const AIGatewayPage = lazy(() => import('@/pages/AIGateway'));
const AICompanionPage = lazy(() => import('@/pages/AICompanionPage'));
const DocsPage = lazy(() => import('@/pages/DocsPage'));
const AIEmployeesPage = lazy(() => import('@/pages/AIEmployeesPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const HomePage = lazy(() => import('@/pages/Home'));

interface MainContentProps {
  id?: string;
  mobileRailOpen?: boolean;
}

// Scroll position cache for restoration
const scrollPositions = new Map<string, number>();

/**
 * MainContent — Page display area with transitions, scroll restoration, and breadcrumbs
 *
 * Features:
 * - Page transitions between routes
 * - Loading indicator during navigation
 * - Scroll position restoration
 * - Breadcrumb navigation
 * - URL hash sync with active view
 */
export function MainContent({ id = 'main-content' }: MainContentProps) {
  const activeRailItem = useStore((s) => s.activeRailItem);
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const prevItemRef = useRef(activeRailItem);

  // Save scroll position on route change
  useEffect(() => {
    if (prevItemRef.current !== activeRailItem) {
      // Save previous position
      if (scrollRef.current) {
        scrollPositions.set(prevItemRef.current, scrollRef.current.scrollTop);
      }
      // Show loading briefly
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setIsNavigating(false);
        // Restore scroll position for new route
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            // Pages with own internal scroll always start at top
            const noRestorePages = ['chat', 'ai-companion', 'ai-gateway', 'ai-employees', 'analytics'];
            const savedPos = noRestorePages.includes(activeRailItem) ? 0 : (scrollPositions.get(activeRailItem) || 0);
            scrollRef.current.scrollTop = savedPos;
          }
        });
      }, 150);
      prevItemRef.current = activeRailItem;
      return () => clearTimeout(timer);
    }
  }, [activeRailItem]);

  // Sync URL hash with active view
  useEffect(() => {
    const hash = `#/${activeRailItem}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(null, '', hash);
    }
  }, [activeRailItem]);

  // Listen for URL hash changes (browser back/forward)
  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      const item = hash.replace('#/', '');
      if (item && item !== activeRailItem) {
        const setItem = useStore.getState().setActiveRailItem;
        if (['home', 'projects', 'teams', 'chat', 'calls', 'calendar', 'approvals', 'security', 'apps', 'profile', 'ai-gateway', 'ai-companion', 'docs', 'ai-employees', 'analytics'].includes(item)) {
          setItem(item);
        }
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, [activeRailItem]);

  // Keyboard: Home key scrolls to top
  useEffect(() => {
    const ref = scrollRef.current;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Home' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        ref?.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    ref?.addEventListener('keydown', handler);
    return () => ref?.removeEventListener('keydown', handler);
  }, []);

  if (!onboardingComplete) {
    return (
      <div
        id={id}
        className="relative flex flex-1 flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 44px)', backgroundColor: 'var(--op-bg-primary, #ffffff)' }}
      >
        <Suspense fallback={<LoadingState count={6} />}>
          <OnboardingPage />
        </Suspense>
      </div>
    );
  }

  return (
    <div
      id={id}
      className="relative flex flex-1 flex-col overflow-hidden"
      style={{ height: 'calc(100vh - 44px)', backgroundColor: 'var(--op-bg-primary, #ffffff)' }}
    >
      {/* Breadcrumb navigation */}
      <BreadcrumbNav activeItem={activeRailItem} />

      {/* Page content with transitions */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        tabIndex={0}
        aria-live="polite"
        aria-busy={isNavigating}
      >
        {/* Loading indicator during navigation */}
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-10 z-10 flex items-center justify-center py-2"
          >
            <div className="rounded-full px-3 py-1 text-[11px] font-medium shadow-md" style={{ backgroundColor: '#D97757', color: '#fff' }}>
              Loading...
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeRailItem}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <Suspense
              fallback={<LoadingState count={6} />}
            >
              <SurfaceRouter activeItem={activeRailItem} />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * BreadcrumbNav — Shows current navigation path
 */
function BreadcrumbNav({ activeItem }: { activeItem: string }) {
  const setActiveRailItem = useStore((s) => s.setActiveRailItem);

  const labels: Record<string, string> = {
    home: 'Dashboard',
    projects: 'Projects',
    teams: 'Teams',
    chat: 'Chat',
    calls: 'Calls',
    calendar: 'Calendar',
    approvals: 'Approvals',
    security: 'Security',
    apps: 'Apps',
    profile: 'Profile',
    automation: 'Automation',
    'ai-gateway': 'AI Gateway',
    'ai-companion': 'AI Companion',
    docs: 'Docs',
    'ai-employees': 'AI Employees',
    analytics: 'Analytics',
    mission: 'Mission Control',
    plan: 'Plan',
  };

  return (
    <nav
      className="flex flex-shrink-0 items-center gap-1.5 border-b px-4"
      style={{
        height: 36,
        borderColor: 'var(--op-border, #e2e2e6)',
        backgroundColor: 'var(--op-bg-secondary, #f4f4f5)',
      }}
    >
      <button
        onClick={() => setActiveRailItem('home')}
        className="flex items-center gap-1 rounded"
        style={{ fontSize: 11, color: '#D97757', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        aria-label="Home"
      >
        <Home size={10} />
        <span>BrixOS</span>
      </button>
      <ChevronRight size={10} style={{ color: 'var(--text-tertiary, #a1a1aa)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary, #18181b)' }} aria-current="page">
        {labels[activeItem] || activeItem}
      </span>
    </nav>
  );
}

/**
 * SurfaceRouter — Route to correct page component
 */
function SurfaceRouter({ activeItem }: { activeItem: string }) {
  switch (activeItem) {
    case 'home':
      return <HomePage />;
    case 'projects':
      return <ProjectsPage />;
    case 'teams':
      return <TeamsPage />;
    case 'chat':
      return <ChatPage />;
    case 'calls':
      return <CallsPage />;
    case 'calendar':
      return <CalendarPage />;
    case 'approvals':
      return <ApprovalsPage />;
    case 'security':
      return <ZeroTrustPage />;
    case 'apps':
      return <AppsPage />;
    case 'profile':
      return <ProfilePage />;
    case 'automation':
      return <AutomationPage />;
    case 'ai-gateway':
      return <AIGatewayPage />;
    case 'ai-companion':
      return <AICompanionPage />;
    case 'docs':
      return <DocsPage />;
    case 'ai-employees':
      return <AIEmployeesPage />;
    case 'analytics':
      return <AnalyticsPage />;
    default:
      return <ProjectsPage />;
  }
}
