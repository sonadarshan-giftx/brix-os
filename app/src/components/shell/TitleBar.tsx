import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, User, X, Menu, HelpCircle, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { showToast } from '@/utils/helpers';
import { authApi } from '@/utils/api';
import { Avatar } from '@/components/shared/Avatar';

interface TitleBarProps {
  onMenuToggle?: () => void;
  railCollapsed?: boolean;
  onRailCollapseToggle?: () => void;
}

export function TitleBar({ onMenuToggle }: TitleBarProps) {
  const currentUser = useStore((s) => s.currentUser);
  const workspace = useStore((s) => s.workspace);
  const openSettings = useStore((s) => s.openSettings);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const setActiveRailItem = useStore((s) => s.setActiveRailItem);
  const logout = useStore((s) => s.logout);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const closeAll = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowSearch(false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(t)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(t)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        closeAll();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') closeAll();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeAll]);

  const handleMarkAllRead = () => notifications.forEach((n) => { if (!n.read) markNotificationRead(n.id); });

  const handleSignOut = async () => {
    setShowUserMenu(false);
    const refreshToken = useStore.getState().refreshToken;
    if (refreshToken) authApi.logout(refreshToken).catch(() => {});
    logout();
    localStorage.clear();
    showToast('Signed out successfully', 'success');
    setTimeout(() => { window.location.href = '/'; }, 300);
  };

  const workspaceName = workspace?.name || 'BrixOS';

  return (
    <>
      <div
        className="relative z-50 flex w-full flex-shrink-0 items-center justify-between px-4 select-none"
        style={{
          height: 48,
          background: 'linear-gradient(135deg, #8B3A1E 0%, #C4623E 50%, #D97757 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
        role="banner"
      >
        {/* Left: Logo + Brand */}
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="mr-1 flex cursor-pointer items-center justify-center rounded-lg md:hidden"
              style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', border: 'none' }}
              aria-label="Toggle navigation"
            >
              <Menu size={16} color="white" />
            </button>
          )}

          {/* Logo mark */}
          <div style={{
            width: 28, height: 28,
            background: 'linear-gradient(135deg, #E8946F, #D97757)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(217,119,87,0.5)',
            flexShrink: 0,
          }}>
            <Zap size={15} color="#fff" strokeWidth={2.5} />
          </div>

          <span style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.01em',
            fontFamily: "'Inter', sans-serif",
          }}>
            BrixOS
          </span>

          {/* Workspace pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 20,
            padding: '3px 10px 3px 8px',
            border: '1px solid rgba(255,255,255,0.12)',
            cursor: 'default',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
              {workspaceName}
            </span>
          </div>
        </div>

        {/* Center: Global search trigger */}
        <button
          onClick={() => { closeAll(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.10)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '6px 14px',
            cursor: 'text',
            width: 260,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.16)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
          aria-label="Search (⌘K)"
        >
          <Search size={13} color="rgba(255,255,255,0.5)" />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', flex: 1, textAlign: 'left' }}>
            Search anything…
          </span>
          <span style={{
            fontSize: 10, fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 4, padding: '1px 5px',
          }}>⌘K</span>
        </button>

        {/* Right: Actions + User */}
        <div className="flex items-center gap-1">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <TitleBtn
              aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
              onClick={() => { setShowUserMenu(false); setShowNotifications((p) => !p); }}
            >
              <Bell size={17} color="rgba(255,255,255,0.85)" />
              {unreadNotifications > 0 && (
                <span style={{
                  position: 'absolute', top: 6, right: 6,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#ef4444',
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1.5px solid #C4623E',
                }}>
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </TitleBtn>
            {showNotifications && (
              <Dropdown width={320} onClose={() => setShowNotifications(false)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--surface-border)' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Notifications</span>
                  {unreadNotifications > 0 && (
                    <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: 'var(--brand-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                      You're all caught up ✓
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => { markNotificationRead(n.id); setShowNotifications(false); }}
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--surface-divider)',
                          background: n.read ? 'transparent' : 'var(--brand-light)',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? 'transparent' : 'var(--brand-light)')}
                      >
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-primary)', marginTop: 4, flexShrink: 0 }} />}
                        <p style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>{n.message}</p>
                      </button>
                    ))
                  )}
                </div>
              </Dropdown>
            )}
          </div>

          {/* Settings */}
          <TitleBtn onClick={() => openSettings()} aria-label="Settings">
            <Settings size={17} color="rgba(255,255,255,0.85)" />
          </TitleBtn>

          {/* Divider */}
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

          {/* User avatar */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => { setShowNotifications(false); setShowUserMenu((p) => !p); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: showUserMenu ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none', borderRadius: 8, padding: '4px 8px 4px 4px',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = showUserMenu ? 'rgba(255,255,255,0.15)' : 'transparent')}
                aria-label={`User menu: ${currentUser.name}`}
              >
                <Avatar src={currentUser.avatar} alt={currentUser.name || 'User'} size="sm" status={currentUser.status || 'offline'} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.9)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown size={12} color="rgba(255,255,255,0.5)" />
              </button>
              {showUserMenu && (
                <Dropdown width={230} onClose={() => setShowUserMenu(false)}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--surface-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar src={currentUser.avatar} alt={currentUser.name || 'User'} size="md" />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{currentUser.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: '2px 0 0' }}>{currentUser.email}</p>
                      <span style={{
                        display: 'inline-block', marginTop: 4,
                        fontSize: 10, fontWeight: 700,
                        padding: '1px 7px', borderRadius: 999,
                        background: currentUser.role === 'Owner' ? '#fef2f2' : '#eff6ff',
                        color: currentUser.role === 'Owner' ? '#dc2626' : '#2563eb',
                      }}>
                        {currentUser.role === 'Owner' ? 'CEO' : currentUser.role}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <MenuItem icon={<User size={14} />} label="My Profile" onClick={() => { setShowUserMenu(false); setActiveRailItem('profile'); }} />
                    <MenuItem icon={<Settings size={14} />} label="Settings" shortcut="⌘," onClick={() => { setShowUserMenu(false); openSettings(); }} />
                    <MenuItem icon={<HelpCircle size={14} />} label="Help & Support" onClick={() => setShowUserMenu(false)} />
                    <div style={{ height: 1, background: 'var(--surface-border)', margin: '6px 0' }} />
                    <MenuItem icon={<LogOut size={14} />} label="Sign out" onClick={handleSignOut} danger />
                  </div>
                </Dropdown>
              )}
            </div>
          ) : (
            <a href="/#/login" style={{ padding: '6px 14px', borderRadius: 7, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
              Sign In
            </a>
          )}
        </div>
      </div>

      {/* Global search overlay */}
      {showSearch && (
        <div
          className="fixed inset-0 z-[200] flex items-start justify-center"
          style={{ paddingTop: '14vh', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowSearch(false)}
        >
          <div
            className="animate-slide-down w-full max-w-[560px]"
            style={{ background: 'var(--surface-raised)', borderRadius: 14, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--surface-border)', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--surface-border)' }}>
              <Search size={18} color="var(--text-tertiary)" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Escape') setShowSearch(false); }}
                placeholder="Search people, projects, messages, docs…"
                style={{
                  flex: 1, fontSize: 15, border: 'none', outline: 'none',
                  background: 'transparent', color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button onClick={() => setShowSearch(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <X size={14} color="var(--text-tertiary)" />
              </button>
            </div>
            <div style={{ padding: '8px 0 8px' }}>
              {['Projects', 'Chat messages', 'Team members', 'Documents', 'Analytics'].map((s) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 18px', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Search size={13} color="var(--text-tertiary)" />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Search in {s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */

function TitleBtn({ children, onClick, 'aria-label': ariaLabel }: { children: React.ReactNode; onClick: () => void; 'aria-label'?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: 'relative',
        width: 36, height: 36, borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', cursor: 'pointer',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

function Dropdown({ children, width, onClose }: { children: React.ReactNode; width: number; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div
        className="absolute right-0 top-full animate-slide-down"
        style={{
          marginTop: 8, width, zIndex: 100,
          background: 'var(--surface-raised)',
          borderRadius: 12,
          border: '1px solid var(--surface-border)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick, shortcut, danger }: {
  icon: React.ReactNode; label: string; onClick: () => void; shortcut?: string; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', textAlign: 'left', border: 'none',
        background: 'transparent', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 16px',
        color: danger ? 'var(--text-danger)' : 'var(--text-primary)',
        fontSize: 13, fontWeight: 500,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = danger ? '#fef2f2' : 'var(--surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: danger ? 'var(--text-danger)' : 'var(--text-secondary)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {shortcut && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{shortcut}</span>}
    </button>
  );
}
