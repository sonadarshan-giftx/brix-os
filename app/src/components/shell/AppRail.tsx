import { useState, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { conversations, getPendingApprovalCount } from '@/data/mockData';
import {
  FolderKanban, Users, MessageSquare, Calendar,
  CheckCircle2, Phone, Shield, BrainCircuit,
  BookOpen, Bot, BarChart2, LayoutGrid, Home,
} from 'lucide-react';

const activeCallCount = 2;

const railItems = [
  { id: 'home',         label: 'Home',         icon: Home },
  { id: 'projects',     label: 'Projects',     icon: FolderKanban },
  { id: 'chat',         label: 'Chat',         icon: MessageSquare, badge: 'dm' as const },
  { id: 'calls',        label: 'Calls',        icon: Phone,         badge: 'calls' as const },
  { id: 'docs',         label: 'Docs',         icon: BookOpen },
  { id: 'teams',        label: 'Teams',        icon: Users },
  { id: 'calendar',     label: 'Calendar',     icon: Calendar },
  { id: 'approvals',    label: 'Approvals',    icon: CheckCircle2,  badge: 'approval' as const },
  { id: 'analytics',    label: 'Analytics',    icon: BarChart2 },
  { id: 'ai-employees', label: 'AI Agents',    icon: Bot },
  { id: 'ai-gateway',   label: 'AI Gateway',   icon: BrainCircuit },
  { id: 'security',     label: 'Security',     icon: Shield },
  { id: 'apps',         label: 'Apps',         icon: LayoutGrid },
];

const ROLE_ACCESS: Record<string, string[]> = {
  Owner:   ['home', 'projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'approvals', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
  Manager: ['home', 'projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'approvals', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
  Member:  ['home', 'projects', 'chat', 'calls', 'docs', 'teams', 'calendar', 'analytics', 'ai-employees', 'ai-gateway', 'security', 'apps'],
};

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={() => { timer.current = setTimeout(() => setVisible(true), 300); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setVisible(false); }}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: 'calc(100% + 10px)',
            top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(24,24,27,0.95)',
            color: '#fff',
            fontSize: 11, fontWeight: 600,
            padding: '5px 10px',
            borderRadius: 7,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {text}
          <span style={{
            position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)',
            borderWidth: '4px 4px 4px 0',
            borderStyle: 'solid',
            borderColor: 'transparent rgba(24,24,27,0.95) transparent transparent',
          }} />
        </div>
      )}
    </div>
  );
}

interface AppRailProps {
  collapsed?: boolean;
  onCollapseToggle?: () => void;
}

export function AppRail({ collapsed = false }: AppRailProps) {
  const activeRailItem = useStore((s) => s.activeRailItem);
  const setActiveRailItem = useStore((s) => s.setActiveRailItem);
  const currentUser = useStore((s) => s.currentUser);
  const contextListOpen = useStore((s) => s.contextListOpen);
  const toggleContextList = useStore((s) => s.toggleContextList);

  const unreadCount = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  const approvalCount = getPendingApprovalCount();
  const userRole = currentUser.role;
  const allowedItems = ROLE_ACCESS[userRole] || ROLE_ACCESS.Member;
  const visibleItems = railItems.filter((item) => allowedItems.includes(item.id));

  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.min(index + 1, visibleItems.length - 1);
      setFocusedIndex(next);
      itemRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = Math.max(index - 1, 0);
      setFocusedIndex(prev);
      itemRefs.current[prev]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleItemClick(visibleItems[index]?.id);
    }
  }, [visibleItems, contextListOpen]);

  const handleItemClick = (itemId: string) => {
    if (!itemId) return;
    setActiveRailItem(itemId);
    if (!contextListOpen && ['chat', 'calls', 'projects', 'teams', 'approvals', 'security'].includes(itemId)) {
      toggleContextList();
    }
  };

  const ACCENT = '#D97757';

  return (
    <div
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: 64,
        height: 'calc(100vh - 48px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'var(--op-rail-bg, #f0f0f1)',
        borderRight: '1px solid var(--op-border, #e2e2e6)',
        paddingTop: 10,
        paddingBottom: 10,
        flexShrink: 0,
      }}
    >
      {/* Scrollable nav */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        {visibleItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeRailItem === item.id;

          let badge: number | null = null;
          if (item.badge === 'dm') badge = unreadCount;
          else if (item.badge === 'approval') badge = approvalCount;
          else if (item.badge === 'calls') badge = activeCallCount;

          return (
            <Tooltip key={item.id} text={item.label}>
              <button
                ref={(el) => { itemRefs.current[index] = el; }}
                onClick={() => handleItemClick(item.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                tabIndex={0}
                style={{
                  position: 'relative',
                  width: 48, height: 48,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  cursor: 'pointer',
                  border: 'none',
                  outline: 'none',
                  background: isActive
                    ? `linear-gradient(135deg, ${ACCENT}18, ${ACCENT}10)`
                    : 'transparent',
                  boxShadow: isActive ? `0 0 0 1px ${ACCENT}25, inset 0 1px 0 rgba(255,255,255,0.5)` : 'none',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--surface-hover)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                {/* Active left stripe */}
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    left: -8, top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3, height: 22,
                    borderRadius: '0 3px 3px 0',
                    background: `linear-gradient(180deg, #E8946F, ${ACCENT})`,
                    boxShadow: `0 0 6px ${ACCENT}80`,
                  }} />
                )}

                {/* Icon */}
                <div style={{ position: 'relative' }}>
                  <Icon
                    size={20}
                    color={isActive ? ACCENT : 'var(--text-tertiary)'}
                    strokeWidth={isActive ? 2.2 : 1.6}
                  />
                  {badge !== null && badge > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: -5, right: -7,
                      minWidth: 15, height: 15,
                      borderRadius: 999,
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                      border: '1.5px solid var(--op-rail-bg, #f0f0f1)',
                    }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span style={{
                  fontSize: 9.5,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? ACCENT : 'var(--text-tertiary)',
                  letterSpacing: '0.01em',
                  lineHeight: 1,
                }}>
                  {item.label.length > 8 ? item.label.slice(0, 7) + '…' : item.label}
                </span>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Role pill at bottom */}
      <div style={{
        marginTop: 8,
        padding: '4px 10px',
        borderRadius: 999,
        background: userRole === 'Owner' ? '#fef2f2' : userRole === 'Manager' ? `${ACCENT}18` : 'var(--surface-hover)',
        border: `1px solid ${userRole === 'Owner' ? '#fecaca' : userRole === 'Manager' ? `${ACCENT}30` : 'var(--surface-border)'}`,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          color: userRole === 'Owner' ? '#dc2626' : userRole === 'Manager' ? ACCENT : 'var(--text-tertiary)',
          textTransform: 'uppercase',
        }}>
          {userRole === 'Owner' ? 'CEO' : userRole === 'Manager' ? 'MGR' : 'MBR'}
        </span>
      </div>
    </div>
  );
}
