import { useEffect, useState } from 'react';
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
/**
 * Layout — Root application shell
 *
 * Responsive, theme-aware, keyboard-shortcut-enabled layout
 * with skip links for accessibility and collapsible sidebars.
 */
export function Layout() {
  // Load real data from backends into the store
  useAppData();

  const contextListOpen = useStore((s) => s.contextListOpen);
  const activeRailItem = useStore((s) => s.activeRailItem);
  const theme = useStore((s) => s.theme);

  // Mobile sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Rail collapsed state
  const [railCollapsed, setRailCollapsed] = useState(false);

  // ChatPage has its own built-in sidebar, so hide the global ContextList
  const showContextList = contextListOpen && activeRailItem !== 'chat';

  // Apply theme class to document root
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && systemDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Toggle sidebar (Ctrl+B)
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSidebarOpen((prev) => !prev);
        } else {
          setRailCollapsed((prev) => !prev);
        }
      }
      // Close mobile sidebar on Escape
      if (e.key === 'Escape') {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [activeRailItem]);

  // CSS variable-based background for theme support
  const bgColor = 'var(--op-bg-primary, #ffffff)';

  return (
    <CommandPaletteProvider>
      <ErrorBoundary>
        {/* Skip to content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:z-[9999] focus:rounded focus:bg-[#5b5fc7] focus:px-4 focus:py-2 focus:text-white focus:text-xs focus:font-semibold focus:top-1 focus:left-1 focus:outline-none"
        >
          Skip to main content
        </a>

        <div
          className="flex h-screen w-screen flex-col overflow-hidden"
          style={{ backgroundColor: bgColor }}
        >
          <Dialogs />
          <TitleBar
            onMenuToggle={() => setMobileSidebarOpen((p) => !p)}
            railCollapsed={railCollapsed}
            onRailCollapseToggle={() => setRailCollapsed((p) => !p)}
          />

          <div
            className="flex flex-1 overflow-hidden"
            style={{ height: 'calc(100vh - 44px)' }}
          >
            {/* AppRail - hidden on mobile unless toggled */}
            <div
              className={`hidden md:block flex-shrink-0 transition-all duration-200 ${railCollapsed ? 'w-0 overflow-hidden opacity-0' : ''}`}
            >
              <AppRail collapsed={railCollapsed} onCollapseToggle={() => setRailCollapsed((p) => !p)} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileSidebarOpen && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-black/40 md:hidden"
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-hidden="true"
                />
                {/* Mobile rail */}
                <div className="fixed left-0 top-[44px] z-50 md:hidden" style={{ height: 'calc(100vh - 44px)' }}>
                  <AppRail collapsed={false} onCollapseToggle={() => setMobileSidebarOpen(false)} />
                </div>
              </>
            )}

            {/* ContextList - responsive */}
            {showContextList && (
              <div
                className="hidden md:block flex-shrink-0"
                style={{ width: 280, borderRight: '1px solid var(--op-border, #e1e1e1)', backgroundColor: 'var(--op-bg-secondary, #f5f5f3)' }}
              >
                <ContextList />
              </div>
            )}

            {/* Main content */}
            <MainContent
              id="main-content"
              mobileRailOpen={mobileSidebarOpen}
            />
          </div>
        </div>

        <AiCopilot />
        <SettingsDialog />
      </ErrorBoundary>
    </CommandPaletteProvider>
  );
}
