import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { employees } from '@/data/mockData';
import {
  Search, Target, FolderKanban, Users,
  MessageSquare, Phone, Calendar, CheckCircle2, Shield,
  Sparkles, FileText, Settings, LogOut, Moon, Sun,
  Zap, Bell, User, Star, Clock, TrendingUp, BarChart3,
  Briefcase, Mail, CalendarDays, Lock, Bookmark, HelpCircle,
  ArrowRight, Keyboard,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  section: string;
  keywords?: string[];
}

const RECENT_COMMANDS_KEY = 'brixos-recent-commands';
const MAX_RECENT = 5;

/** Load recent command IDs from localStorage */
function loadRecentCommands(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_COMMANDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

/** Save recent command IDs to localStorage */
function saveRecentCommand(commandId: string) {
  const recent = loadRecentCommands();
  const updated = [commandId, ...recent.filter((id) => id !== commandId)].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(updated));
}

/**
 * CommandPaletteProvider — Global command palette with search, recent commands, and keyboard shortcuts
 *
 * Features:
 * - Full command search and execution
 * - Ctrl+K keyboard shortcut
 * - Recent/featured commands
 * - Keyboard navigation (↑↓ Enter Escape)
 * - Command execution that actually navigates
 */
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(loadRecentCommands);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  const setActiveRailItem = useStore((s) => s.setActiveRailItem);
  const openSettings = useStore((s) => s.openSettings);
  const currentUser = useStore((s) => s.currentUser);
  const setTheme = useStore((s) => s.setTheme);
  const theme = useStore((s) => s.theme);
  const toggleContextList = useStore((s) => s.toggleContextList);

  // Execute command helper
  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    saveRecentCommand(cmd.id);
    setRecentIds(loadRecentCommands());
  }, []);

  // Build commands
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-projects', label: 'Go to Projects', shortcut: '⌘3', icon: <FolderKanban size={16} />, action: () => { setActiveRailItem('projects'); setIsOpen(false); }, section: 'Navigate', keywords: ['project', 'pm'] },
    { id: 'nav-teams', label: 'Go to Teams', shortcut: '⌘4', icon: <Users size={16} />, action: () => { setActiveRailItem('teams'); setIsOpen(false); }, section: 'Navigate', keywords: ['team', 'people'] },
    { id: 'nav-chat', label: 'Go to Chat', shortcut: '⌘5', icon: <MessageSquare size={16} />, action: () => { setActiveRailItem('chat'); setIsOpen(false); }, section: 'Navigate', keywords: ['message', 'dm', 'conversation'] },
    { id: 'nav-calls', label: 'Go to Calls', shortcut: '⌘6', icon: <Phone size={16} />, action: () => { setActiveRailItem('calls'); setIsOpen(false); }, section: 'Navigate', keywords: ['meeting', 'video', 'standup'] },
    { id: 'nav-calendar', label: 'Go to Calendar', shortcut: '⌘7', icon: <Calendar size={16} />, action: () => { setActiveRailItem('calendar'); setIsOpen(false); }, section: 'Navigate', keywords: ['schedule', 'event', 'plan'] },
    { id: 'nav-approvals', label: 'Go to Approvals', shortcut: '⌘8', icon: <CheckCircle2 size={16} />, action: () => { setActiveRailItem('approvals'); setIsOpen(false); }, section: 'Navigate', keywords: ['approve', 'review', 'pending'] },
    { id: 'nav-security', label: 'Go to Security', shortcut: '⌘9', icon: <Shield size={16} />, action: () => { setActiveRailItem('security'); setIsOpen(false); }, section: 'Navigate', keywords: ['zero trust', 'policy', 'rbac', 'vpn'] },
    { id: 'nav-apps', label: 'Go to Apps', shortcut: '', icon: <Zap size={16} />, action: () => { setActiveRailItem('apps'); setIsOpen(false); }, section: 'Navigate', keywords: ['app', 'integration', 'mcp'] },

    // Actions
    { id: 'act-new-call', label: 'Start a new call', icon: <Phone size={16} />, action: () => { setActiveRailItem('calls'); setIsOpen(false); }, section: 'Actions', keywords: ['call', 'meeting', 'start'] },
    { id: 'act-new-chat', label: 'Start a direct message', icon: <MessageSquare size={16} />, action: () => { setActiveRailItem('chat'); setIsOpen(false); }, section: 'Actions', keywords: ['dm', 'message', 'chat'] },
    { id: 'act-new-project', label: 'Create a new project', icon: <FolderKanban size={16} />, action: () => { setActiveRailItem('projects'); setIsOpen(false); }, section: 'Actions', keywords: ['create', 'project', 'new'] },
    { id: 'act-approvals', label: 'View pending approvals', icon: <CheckCircle2 size={16} />, action: () => { setActiveRailItem('approvals'); setIsOpen(false); }, section: 'Actions', keywords: ['approve', 'pending', 'review'] },
    { id: 'act-toggle-sidebar', label: 'Toggle sidebar', shortcut: '⌘B', icon: <BarChart3 size={16} />, action: () => { toggleContextList(); setIsOpen(false); }, section: 'Actions', keywords: ['sidebar', 'context', 'hide'] },
    { id: 'act-clear-notifs', label: 'Mark all notifications read', icon: <Bell size={16} />, action: () => {
      const notifs = useStore.getState().notifications;
      notifs.forEach((n) => { if (!n.read) useStore.getState().markNotificationRead(n.id); });
      setIsOpen(false);
    }, section: 'Actions', keywords: ['notification', 'clear', 'mark'] },

    // People
    ...employees.map((emp) => ({
      id: `person-${emp.id}`,
      label: `Message ${emp.name}`,
      icon: <User size={16} />,
      action: () => { setActiveRailItem('chat'); setIsOpen(false); },
      section: 'People',
      keywords: [emp.name.toLowerCase(), emp.title.toLowerCase()],
    })),

    // Settings
    { id: 'set-theme-dark', label: 'Switch to dark mode', shortcut: '', icon: <Moon size={16} />, action: () => { setTheme('dark'); setIsOpen(false); }, section: 'Settings', keywords: ['dark', 'theme', 'night'] },
    { id: 'set-theme-light', label: 'Switch to light mode', shortcut: '', icon: <Sun size={16} />, action: () => { setTheme('light'); setIsOpen(false); }, section: 'Settings', keywords: ['light', 'theme', 'day'] },
    { id: 'set-theme-system', label: 'Use system theme', shortcut: '', icon: <TrendingUp size={16} />, action: () => { setTheme('system'); setIsOpen(false); }, section: 'Settings', keywords: ['system', 'theme', 'auto'] },
    { id: 'set-settings', label: 'Open settings', shortcut: '⌘,', icon: <Settings size={16} />, action: () => { openSettings(); setIsOpen(false); }, section: 'Settings', keywords: ['settings', 'preferences'] },
    { id: 'set-help', label: 'Open help center', shortcut: '', icon: <HelpCircle size={16} />, action: () => { setIsOpen(false); }, section: 'Settings', keywords: ['help', 'support', 'docs'] },

    // AI
    { id: 'ai-copilot', label: 'Ask AI Copilot', icon: <Sparkles size={16} />, action: () => { setIsOpen(false); /* AI Copilot has its own trigger */ }, section: 'AI', keywords: ['ai', 'copilot', 'ask', 'help'] },
    { id: 'ai-report', label: 'Generate status report', icon: <FileText size={16} />, action: () => { setActiveRailItem('projects'); setIsOpen(false); }, section: 'AI', keywords: ['report', 'status', 'generate'] },
  ];

  // Filter commands by query
  const filtered = query.trim() === ''
    ? commands
    : commands.filter((c) => {
        const q = query.toLowerCase();
        return c.label.toLowerCase().includes(q) ||
          c.keywords?.some((k) => k.includes(q)) ||
          c.section.toLowerCase().includes(q);
      });

  // Group by section
  const sections = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.section]) acc[cmd.section] = [];
    acc[cmd.section].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // If no query, show "Recent" section first
  const flatItems = Object.values(sections).flat();

  // Featured commands when empty (not in recent)
  const featuredCommands = [
    { id: 'feat-projects', label: 'Projects', action: () => { setActiveRailItem('projects'); setIsOpen(false); }, icon: <FolderKanban size={14} /> },
    { id: 'feat-chat', label: 'Chat', action: () => { setActiveRailItem('chat'); setIsOpen(false); }, icon: <MessageSquare size={14} /> },
    { id: 'feat-calls', label: 'Calls', action: () => { setActiveRailItem('calls'); setIsOpen(false); }, icon: <Phone size={14} /> },
    { id: 'feat-calendar', label: 'Calendar', action: () => { setActiveRailItem('calendar'); setIsOpen(false); }, icon: <Calendar size={14} /> },
  ];

  // Get recent command objects
  const recentCommands = recentIds
    .map((id) => commands.find((c) => c.id === id))
    .filter(Boolean) as CommandItem[];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = flatItems[selectedIndex];
      if (item) executeCommand(item);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [flatItems, selectedIndex, executeCommand]);

  const handleCommandClick = (item: CommandItem) => {
    executeCommand(item);
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={() => setIsOpen(false)}
            role="dialog"
            aria-label="Command palette"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="w-full max-w-[600px] overflow-hidden rounded-xl shadow-2xl"
              style={{ backgroundColor: 'var(--op-bg-primary, #ffffff)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'var(--op-border, #e1e1e1)' }}>
                <Search size={18} style={{ color: '#767676' }} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search commands, people, surfaces..."
                  className="flex-1 text-sm outline-none"
                  style={{ color: '#252422', background: 'transparent' }}
                  aria-label="Command palette search"
                />
                <kbd className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: '#f0f0f0', color: '#767676' }}>ESC</kbd>
              </div>

              {/* Results */}
              <div ref={resultsRef} className="max-h-[400px] overflow-y-auto py-2">
                {flatItems.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Search size={24} style={{ color: '#c8c8c8' }} />
                    <p className="mt-2 text-sm" style={{ color: '#767676' }}>No results found</p>
                    <p className="mt-1 text-xs" style={{ color: '#767676' }}>Try a different search term</p>
                  </div>
                ) : (
                  <>
                    {/* Recent commands (only when no query) */}
                    {query.trim() === '' && recentCommands.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>
                          <Clock size={10} /> Recent
                        </div>
                        {recentCommands.map((item) => {
                          const globalIdx = flatItems.indexOf(item);
                          const isSelected = globalIdx === selectedIndex;
                          return (
                            <CommandRow
                              key={item.id}
                              item={item}
                              isSelected={isSelected}
                              onClick={() => handleCommandClick(item)}
                              onHover={() => setSelectedIndex(globalIdx)}
                              ref={isSelected ? selectedRef : undefined}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Featured shortcuts (only when no query and no recents) */}
                    {query.trim() === '' && recentCommands.length === 0 && (
                      <div className="mb-2">
                        <div className="flex items-center gap-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>
                          <Star size={10} /> Quick Access
                        </div>
                        <div className="grid grid-cols-4 gap-1 px-3">
                          {featuredCommands.map((feat) => (
                            <button
                              key={feat.id}
                              onClick={() => { feat.action(); saveRecentCommand(feat.id); }}
                              className="flex flex-col items-center gap-1 rounded-lg p-2 transition-colors"
                              style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0fa')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            >
                              <span style={{ color: '#5b5fc7' }}>{feat.icon}</span>
                              <span style={{ fontSize: 10, color: '#242424' }}>{feat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Grouped results */}
                    {Object.entries(sections).map(([sectionName, items]) => (
                      <div key={sectionName}>
                        <div className="flex items-center gap-1 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>
                          {sectionName === 'Navigate' && <Target size={10} />}
                          {sectionName === 'Actions' && <Zap size={10} />}
                          {sectionName === 'People' && <Users size={10} />}
                          {sectionName === 'Settings' && <Settings size={10} />}
                          {sectionName === 'AI' && <Sparkles size={10} />}
                          <span>{sectionName}</span>
                        </div>
                        {items.map((item) => {
                          const globalIdx = flatItems.indexOf(item);
                          const isSelected = globalIdx === selectedIndex;
                          return (
                            <CommandRow
                              key={item.id}
                              item={item}
                              isSelected={isSelected}
                              onClick={() => handleCommandClick(item)}
                              onHover={() => setSelectedIndex(globalIdx)}
                              ref={isSelected ? selectedRef : undefined}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t px-4 py-2" style={{ borderColor: 'var(--op-border, #e1e1e1)' }}>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: '#767676' }}>
                  <kbd className="rounded px-1 text-[9px]" style={{ backgroundColor: '#f0f0f0' }}>↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: '#767676' }}>
                  <kbd className="rounded px-1 text-[9px]" style={{ backgroundColor: '#f0f0f0' }}>↵</kbd> Select
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: '#767676' }}>
                  <kbd className="rounded px-1 text-[9px]" style={{ backgroundColor: '#f0f0f0' }}>esc</kbd> Close
                </span>
                <span className="ml-auto text-[10px]" style={{ color: '#767676' }}>{flatItems.length} results</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Command Row sub-component ────────────────────────────────

import { forwardRef } from 'react';

interface CommandRowProps {
  item: CommandItem;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
}

const CommandRow = forwardRef<HTMLDivElement, CommandRowProps>(
  ({ item, isSelected, onClick, onHover }, ref) => {
    return (
      <div
        ref={ref}
        onClick={onClick}
        onMouseEnter={onHover}
        className="mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors"
        style={{ backgroundColor: isSelected ? '#f0f0fa' : 'transparent' }}
        role="option"
        aria-selected={isSelected}
      >
        <span style={{ color: isSelected ? 'var(--op-accent, #5b5fc7)' : '#8a8a8a', flexShrink: 0 }}>{item.icon}</span>
        <span className="flex-1 text-sm" style={{ color: isSelected ? 'var(--op-accent, #5b5fc7)' : '#252422', fontWeight: isSelected ? 600 : 400 }}>
          {item.label}
        </span>
        {item.shortcut && (
          <kbd className="rounded px-1.5 py-0.5 text-[10px]" style={{ backgroundColor: '#f0f0f0', color: '#767676' }}>
            {item.shortcut}
          </kbd>
        )}
        {isSelected && <ArrowRight size={14} style={{ color: 'var(--op-accent, #5b5fc7)', flexShrink: 0 }} />}
      </div>
    );
  }
);

CommandRow.displayName = 'CommandRow';
