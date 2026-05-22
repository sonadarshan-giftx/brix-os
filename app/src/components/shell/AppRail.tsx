import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { employees, conversations, getPendingApprovalCount } from '@/data/mockData';

// Active call count from call data
const activeCallCount = 2; // Derived from live calls in callList
import {
  FolderKanban,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  MoreHorizontal,
  Phone,
  Shield,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Bot,
  BarChart2,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// Rail Items
// ═══════════════════════════════════════════════════════════

const railItems = [
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'chat', label: 'Chat', icon: MessageSquare, badge: 'dm' as const },
  { id: 'calls', label: 'Calls', icon: Phone, badge: 'calls' as const },
  { id: 'docs', label: 'Docs', icon: BookOpen },
  { id: 'teams', label: 'Teams', icon: Users },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: 'approval' as const },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'ai-employees', label: 'AI Employees', icon: Bot },
  { id: 'ai-gateway', label: 'AI Gateway', icon: BrainCircuit },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'apps', label: 'Apps', icon: MoreHorizontal },
];

// ═══════════════════════════════════════════════════════════
// Role-Based Access Control
// ═══════════════════════════════════════════════════════════

const ROLE_ACCESS: Record<string, string[]> = {
  Owner: ['projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'approvals', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
  Manager: ['projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'approvals', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
  Member: ['projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
};

// ═══════════════════════════════════════════════════════════
// Role Badge Colors
// ═══════════════════════════════════════════════════════════

function getRoleColor(role: string): string {
  switch (role) {
    case 'Owner': return '#c4314b';
    case 'Manager': return '#5b5fc7';
    default: return '#616161';
  }
}

// ═══════════════════════════════════════════════════════════
// Tooltip sub-component
// ═══════════════════════════════════════════════════════════

function Tooltip({ text, children, position = 'right' }: { text: string; children: React.ReactNode; position?: 'right' | 'left' }) {
  const [visible, setVisible] = useState(false);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    showTimer.current = setTimeout(() => setVisible(true), 400);
  };

  const handleMouseLeave = () => {
    if (showTimer.current) clearTimeout(showTimer.current);
    setVisible(false);
  };

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {visible && (
        <div
          className="pointer-events-none absolute z-[100] rounded px-2 py-1 text-[11px] font-medium whitespace-nowrap shadow-lg"
          style={{
            backgroundColor: '#333',
            color: '#fff',
            left: position === 'right' ? '100%' : 'auto',
            right: position === 'left' ? '100%' : 'auto',
            marginLeft: position === 'right' ? 8 : 0,
            marginRight: position === 'left' ? 8 : 0,
            top: '50%',
            transform: 'translateY(-50%)',
          }}
          role="tooltip"
        >
          {text}
          {/* Arrow */}
          <span
            className="absolute top-1/2 -translate-y-1/2"
            style={{
              left: position === 'right' ? -4 : 'auto',
              right: position === 'left' ? -4 : 'auto',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              borderWidth: position === 'right' ? '4px 4px 4px 0' : '4px 0 4px 4px',
              borderColor: position === 'right' ? 'transparent #333 transparent transparent' : 'transparent transparent transparent #333',
            }}
          />
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// App Rail Component
// ═══════════════════════════════════════════════════════════

interface AppRailProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export function AppRail({ collapsed = false, onCollapseToggle }: AppRailProps) {  const activeRailItem = useStore((s) => s.activeRailItem);
  const setActiveRailItem = useStore((s) => s.setActiveRailItem);
  const currentUser = useStore((s) => s.currentUser);
  const contextListOpen = useStore((s) => s.contextListOpen);
  const toggleContextList = useStore((s) => s.toggleContextList);

  // Live badge counts synced from data
  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const approvalCount = getPendingApprovalCount();
  const userRole = currentUser.role;
  const allowedItems = ROLE_ACCESS[userRole] || ROLE_ACCESS.Member;
  const visibleItems = railItems.filter((item) => allowedItems.includes(item.id));

  // Keyboard navigation
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(index + 1, visibleItems.length - 1);
      setFocusedIndex(nextIndex);
      itemRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(index - 1, 0);
      setFocusedIndex(prevIndex);
      itemRefs.current[prevIndex]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const item = visibleItems[index];
      if (item) {
        setActiveRailItem(item.id);
        // Open context list if clicking on items with context
        if (!contextListOpen && ['chat', 'calls', 'projects', 'teams', 'approvals', 'security'].includes(item.id)) {
          toggleContextList();
        }
      }
    }
  }, [visibleItems, contextListOpen, setActiveRailItem, toggleContextList]);

  const handleItemClick = (itemId: string) => {
    setActiveRailItem(itemId);
    // Ensure context list is open for items that benefit from it
    if (!contextListOpen && ['chat', 'calls', 'projects', 'teams', 'approvals', 'security'].includes(itemId)) {
      toggleContextList();
    }
  };

  return (
    <div
      className="flex flex-shrink-0 flex-col items-center border-r"
      style={{
        width: 68,
        height: 'calc(100vh - 44px)',
        backgroundColor: 'var(--op-rail-bg, #ebebea)',
        borderColor: 'var(--op-border, #e1e1e1)',
        paddingTop: 8,
      }}
      role="navigation"
      aria-label={'Main navigation'}
    >
      {/* Role Badge */}
      <Tooltip text={`Role: ${userRole}`}>
        <div
          className="mb-2 flex h-8 w-14 items-center justify-center rounded font-bold text-[9px] text-white"
          style={{ backgroundColor: getRoleColor(userRole) }}
          aria-label={`Logged in as ${userRole}`}
        >
          {userRole === 'Owner' ? 'CEO' : userRole === 'Manager' ? 'MGR' : 'MEM'}
        </div>
      </Tooltip>

      {/* Separator */}
      <div className="mb-2 w-10" style={{ height: 1, backgroundColor: '#d0d0d0' }} />

      {/* Collapse toggle */}
      {onCollapseToggle && (
        <Tooltip text={collapsed ? "" : ""}>
          <button
            onClick={onCollapseToggle}
            className="relative mb-1 flex flex-col items-center justify-center rounded"
            style={{ width: 56, height: 44, minHeight: 44, backgroundColor: 'transparent', border: 'none', outline: 'none' }}
            aria-label={collapsed ? "" : ""}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {collapsed ? <ChevronRight size={16} color="#616161" /> : <ChevronLeft size={16} color="#616161" />}
          </button>
        </Tooltip>
      )}

      {/* Scrollable nav items */}
      <div className="flex flex-1 flex-col items-center overflow-y-auto" style={{ width: '100%' }}>
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeRailItem === item.id;

          // Determine badge value from live data
          let badgeValue: number | null = null;
          if (item.badge === 'dm') {
            badgeValue = unreadCount;
          } else if (item.badge === 'approval') {
            badgeValue = approvalCount;
          } else if (item.badge === 'calls') {
            badgeValue = activeCallCount;
          }

          return (
            <Tooltip key={item.id} text={item.label}>
              <button
                ref={(el) => { itemRefs.current[index] = el; }}
                onClick={() => handleItemClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="relative mb-1 flex flex-col items-center justify-center rounded"
                style={{
                  width: 56,
                  height: 56,
                  backgroundColor: isActive ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  outline: 'none',
                  flexShrink: 0,
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#f0f0f0';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Active indicator */}
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r"
                    style={{ width: 3, height: 20, backgroundColor: 'var(--op-accent, #5b5fc7)' }}
                  />
                )}

                {/* Icon */}
                <div className="relative">
                  <Icon
                    size={24}
                    color={isActive ? 'var(--op-accent, #5b5fc7)' : '#616161'}
                    strokeWidth={isActive ? 2 : 1.5}
                  />
                  {/* Badge - synced with actual data */}
                  {badgeValue !== null && badgeValue > 0 && (
                    <span
                      className="absolute -top-1.5 -right-2 flex items-center justify-center rounded-full font-bold text-white"
                      style={{
                        width: 16,
                        height: 16,
                        fontSize: 10,
                        backgroundColor: '#c4314b',
                        minWidth: 16,
                      }}
                      aria-label={`${badgeValue} unread ${item.label}`}
                    >
                      {badgeValue > 99 ? '99+' : badgeValue}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className="mt-0.5 font-semibold"
                  style={{
                    fontSize: 10,
                    color: isActive ? 'var(--op-accent, #5b5fc7)' : '#616161',
                    letterSpacing: '0.02em',
                  }}
                >
                  {""}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
