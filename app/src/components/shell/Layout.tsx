import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useStore } from '@/store/useStore';
import { useAppData } from '@/hooks/useAppData';
import { TitleBar } from './TitleBar';
import { AppRail } from './AppRail';
import { ContextList } from './ContextList';
import { MainContent } from './MainContent';
import { CommandPaletteProvider } from '@/components/shared/CommandPalette';
import { AiCopilot } from '@/components/shared/AiCopilot';
import { Dialogs } from '@/components/shared/Dialogs';
import { SettingsDialog } from '@/components/shared/SettingsDialog';

export function Layout() {
  useAppData();

  const contextListOpen = useStore((s) => s.contextListOpen);
  const activeRailItem = useStore((s) => s.activeRailItem);
  const theme = useStore((s) => s.theme);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(true);

  // Pages that have their own built-in sidebar — hide the global ContextList
  const PAGES_WITH_OWN_SIDEBAR = ['chat', 'ai-companion', 'ai-gateway', 'ai-employees', 'analytics', 'docs', 'apps', 'home'];
  const showContextList = contextListOpen && !PAGES_WITH_OWN_SIDEBAR.includes(activeRailItem);

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        window.innerWidth < 768 ? setMobileSidebarOpen((p) => !p) : setRailCollapsed((p) => !p);
      }
      if (e.key === 'Escape') setMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => { setMobileSidebarOpen(false); }, [activeRailItem]);

  const bgColor = 'var(--op-bg-primary, #ffffff)';

  return (
    <CommandPaletteProvider>
      <ErrorBoundary>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:rounded focus:bg-[#D97757] focus:px-4 focus:py-2 focus:text-white focus:text-xs focus:font-semibold focus:top-1 focus:left-1 focus:outline-none">
          Skip to main content
        </a>

        <div className="flex h-screen w-screen flex-col overflow-hidden" style={{ backgroundColor: bgColor }}>
          <Dialogs />
          <TitleBar
            onMenuToggle={() => setMobileSidebarOpen((p) => !p)}
            railCollapsed={railCollapsed}
            onRailCollapseToggle={() => setRailCollapsed((p) => !p)}
          />

          <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 44px)' }}>
            {/* AppRail */}
            <div className={`hidden md:block flex-shrink-0 transition-all duration-200 ${railCollapsed ? 'w-0 overflow-hidden opacity-0' : ''}`}>
              <AppRail collapsed={railCollapsed} onCollapseToggle={() => setRailCollapsed((p) => !p)} />
            </div>

            {/* Mobile sidebar */}
            {mobileSidebarOpen && (
              <>
                <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setMobileSidebarOpen(false)} aria-hidden="true" />
                <div className="fixed left-0 top-[44px] z-50 md:hidden" style={{ height: 'calc(100vh - 44px)' }}>
                  <AppRail collapsed={false} onCollapseToggle={() => setMobileSidebarOpen(false)} />
                </div>
              </>
            )}

            {/* ContextList — collapsible secondary sidebar */}
            {showContextList && (
              <div
                className="hidden md:flex flex-shrink-0 relative"
                style={{
                  width: contextCollapsed ? 20 : 260,
                  transition: 'width 0.2s ease',
                  borderRight: '1px solid var(--op-border, #e1e1e1)',
                  backgroundColor: 'var(--op-bg-secondary, #f5f5f3)',
                  overflow: 'hidden',
                }}
              >
                {!contextCollapsed && <ContextList />}

                {/* Collapse toggle tab */}
                <button
                  onClick={() => setContextCollapsed((p) => !p)}
                  title={contextCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  style={{
                    position: 'absolute',
                    right: -10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 20,
                    height: 40,
                    borderRadius: '0 6px 6px 0',
                    background: '#D97757',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    boxShadow: '2px 0 6px rgba(0,0,0,0.12)',
                  }}
                >
                  {contextCollapsed
                    ? <ChevronRight size={11} color="#fff" />
                    : <ChevronLeft size={11} color="#fff" />
                  }
                </button>
              </div>
            )}

            {/* Main content */}
            <MainContent id="main-content" mobileRailOpen={mobileSidebarOpen} />
          </div>
        </div>

        <AiCopilot />
        <SettingsDialog />
      </ErrorBoundary>
    </CommandPaletteProvider>
  );
}
