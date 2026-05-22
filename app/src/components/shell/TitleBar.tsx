import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, ChevronDown, Settings, LogOut, User, X, Menu, HelpCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { showToast } from '@/utils/helpers';
import { authApi } from '@/utils/api';
import { Avatar } from '@/components/shared/Avatar';

interface TitleBarProps {
  onMenuToggle?: () => void;
  railCollapsed?: boolean;
  onRailCollapseToggle?: () => void;
}

/**
 * TitleBar — Top app header with company switcher, search, notifications, and user menu
 *
 * Features:
 * - Company dropdown with selection
 * - Global search (Ctrl+K opens command palette)
 * - Notification bell with live badge + mark all read
 * - User profile dropdown with navigation actions
 * - Proper z-index management (only one dropdown at a time)
 * - Keyboard shortcuts (Ctrl+K for search)
 * - Tooltips on icon buttons
 */
export function TitleBar({ onMenuToggle }: TitleBarProps) {  const currentUser = useStore((s) => s.currentUser);
  const openSettings = useStore((s) => s.openSettings);
  const notifications = useStore((s) => s.notifications);
  const markNotificationRead = useStore((s) => s.markNotificationRead);
  const setActiveRailItem = useStore((s) => s.setActiveRailItem);
  const logout = useStore((s) => s.logout);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCompanySwitcher, setShowCompanySwitcher] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentCompany, setCurrentCompany] = useState('Acme Software');

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close all dropdowns helper
  const closeAllDropdowns = useCallback(() => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowCompanySwitcher(false);
    setShowSearch(false);
  }, []);

  // Toggle helpers that close others
  const toggleNotifications = () => {
    setShowUserMenu(false);
    setShowCompanySwitcher(false);
    setShowNotifications((prev) => !prev);
  };
  const toggleUserMenu = () => {
    setShowNotifications(false);
    setShowCompanySwitcher(false);
    setShowUserMenu((prev) => !prev);
  };
  const toggleCompanySwitcher = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowCompanySwitcher((prev) => !prev);
  };

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setShowUserMenu(false);
      if (companyRef.current && !companyRef.current.contains(target)) setShowCompanySwitcher(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard shortcut: Ctrl+K opens search/command palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        closeAllDropdowns();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        closeAllDropdowns();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeAllDropdowns]);

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  // Mark single notification as read
  const handleNotifClick = (id: string) => {
    markNotificationRead(id);
    setShowNotifications(false);
  };

  // Company options
  const companies = ['Acme Software', 'Brixstac Labs', 'Beta Corp', 'Demo Org'];

  // Sign out handler
  const handleSignOut = async () => {
    setShowUserMenu(false);
    const refreshToken = useStore.getState().refreshToken;
    // Revoke refresh token on the server (best-effort)
    if (refreshToken) {
      authApi.logout(refreshToken).catch(() => {/* ignore */});
    }
    // Reset store
    logout();
    // Clear localStorage
    localStorage.clear();
    showToast("Signed out successfully", "success");
    // Navigate to landing page (HashRouter)
    setTimeout(() => { window.location.href = '/'; }, 300);
  };

  // Navigate to profile
  const handleProfileClick = () => {
    setShowUserMenu(false);
    setActiveRailItem('profile');
  };

  // Search submit
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      // Could trigger global search, for now navigate to chat
      setActiveRailItem('chat');
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  return (
    <div
      className="relative z-50 flex w-full flex-shrink-0 items-center justify-between px-3 select-none"
      style={{ height: 44, backgroundColor: '#464775' }}
      role="banner"
    >
      {/* Left: Menu toggle (mobile) + Logo + App name */}
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="mr-1 flex cursor-pointer items-center justify-center rounded md:hidden"
            style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
            aria-label={"Toggle navigation menu"}
            title={"Toggle menu"}
          >
            <Menu size={18} color="white" />
          </button>
        )}
        {/* Logo mark - hexagonal "I" as inline SVG */}
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path
            d="M16 2L28 9v14L16 30 4 23V9l12-7z"
            fill="#5b5fc7"
            stroke="white"
            strokeWidth="1.5"
          />
          <text
            x="16"
            y="20"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="700"
            fontFamily="Segoe UI, sans-serif"
          >
            I
          </text>
        </svg>
        <span
          className="font-semibold"
          style={{ fontSize: 14, color: '#ffffff', fontWeight: 600 }}
        >
          Brixstac
        </span>
      </div>

      {/* Center: Company breadcrumb switcher */}
      <div className="absolute left-1/2 -translate-x-1/2" ref={companyRef}>
        <button
          className="flex cursor-pointer items-center gap-1"
          style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', background: 'transparent', border: 'none' }}
          onClick={toggleCompanySwitcher}
          aria-label={`Current company: ${currentCompany}. Click to switch.`}
          aria-expanded={showCompanySwitcher}
          title="Switch company"
        >
          <span>{currentCompany}</span>
          <ChevronDown size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
        </button>

        {showCompanySwitcher && (
          <>
            <div className="fixed inset-0" onClick={() => setShowCompanySwitcher(false)} />
            <div
              className="absolute left-1/2 top-full mt-1 -translate-x-1/2 rounded-md border bg-white shadow-lg"
              style={{ width: 200, borderColor: '#e1e1e1', zIndex: 100 }}
            >
              <div className="px-3 py-2" style={{ borderBottom: '1px solid #e1e1e1' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#616161' }}>Switch Company</span>
              </div>
              {companies.map((c) => (
                <button
                  key={c}
                  className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left"
                  style={{
                    fontSize: 12,
                    border: 'none',
                    background: currentCompany === c ? '#f0f0fa' : 'transparent',
                  }}
                  onClick={() => { setCurrentCompany(c); setShowCompanySwitcher(false); }}
                  onMouseEnter={(e) => { if (currentCompany !== c) e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
                  onMouseLeave={(e) => { if (currentCompany !== c) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  <span style={{ color: '#242424' }}>{c}</span>
                  {currentCompany === c && <span style={{ color: '#5b5fc7', fontSize: 11, fontWeight: 600 }}>Active</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center gap-1">
        {/* Search button */}
        <button
          aria-label="Search (Ctrl+K)"
          title={"Search (Ctrl+K)"}
          className="flex cursor-pointer items-center justify-center rounded"
          style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
          onClick={() => { closeAllDropdowns(); setShowSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <Search size={18} color="white" />
        </button>

        {/* Inline search overlay */}
        {showSearch && (
          <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} onClick={() => setShowSearch(false)}>
            <div
              className="flex w-full max-w-[480px] items-center gap-2 rounded-lg border bg-white px-4 py-3 shadow-2xl"
              style={{ borderColor: '#e1e1e1' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Search size={18} style={{ color: '#767676' }} />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); if (e.key === 'Escape') setShowSearch(false); }}
                placeholder={"Search people, projects, messages..."}
                className="flex-1 text-sm outline-none"
                style={{ color: '#242424' }}
              />
              <button onClick={() => setShowSearch(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={14} style={{ color: '#767676' }} />
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
            title="Notifications"
            className="relative flex cursor-pointer items-center justify-center rounded"
            style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, background: 'transparent', border: 'none' }}
            onClick={toggleNotifications}
            aria-expanded={showNotifications}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Bell size={18} color="white" />
            {/* Live badge synced with actual notifications */}
            {unreadNotifications > 0 && (
              <span
                className="absolute top-0 right-0 flex items-center justify-center rounded-full font-bold text-white"
                style={{
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  backgroundColor: '#c4314b',
                  transform: 'translate(2px, -2px)',
                }}
                aria-hidden="true"
              >
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </span>
            )}
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
              <div
                className="absolute right-0 top-full mt-1 rounded-md border bg-white shadow-lg"
                style={{ width: 320, borderColor: '#e1e1e1', zIndex: 100 }}
                role="dialog"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-between px-3" style={{ height: 40, borderBottom: '1px solid #e1e1e1' }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                  {unreadNotifications > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      style={{ fontSize: 11, color: '#5b5fc7', cursor: 'pointer', background: 'transparent', border: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="px-3 py-6 text-center" style={{ fontSize: 12, color: '#767676' }}>No notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <button
                        key={n.id}
                        className="w-full cursor-pointer px-3 py-2 text-left"
                        style={{
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: n.read ? 'transparent' : '#f5f5f3',
                          border: 'none',
                          display: 'block',
                        }}
                        onClick={() => handleNotifClick(n.id)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = n.read ? 'transparent' : '#f5f5f3')}
                      >
                        <p style={{ fontSize: 12, color: '#242424' }}>{n.message}</p>
                        {!n.read && <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#5b5fc7' }} />}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User avatar */}
        {currentUser ? (
        <div className="relative ml-1" ref={userMenuRef}>
          <button
            className="flex cursor-pointer items-center justify-center rounded-full"
            style={{ width: 44, height: 44, minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', padding: 0 }}
            onClick={toggleUserMenu}
            aria-label={`User menu: ${currentUser?.name || 'User'}`}
            aria-expanded={showUserMenu}
            title={`${currentUser?.name || 'User'} — ${currentUser?.role || 'Member'}`}
          >
            <Avatar
              src={currentUser?.avatar}
              alt={currentUser?.name || 'User'}
              size="md"
              status={currentUser?.status || 'offline'}
            />
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 top-full mt-1 rounded-md border bg-white shadow-lg"
                style={{ width: 220, borderColor: '#e1e1e1', zIndex: 100 }}
                role="menu"
              >
                {/* User info header */}
                <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '1px solid #e1e1e1' }}>
                  <Avatar src={currentUser?.avatar} alt={currentUser?.name || 'User'} size="sm" />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{currentUser?.name || 'User'}</p>
                    <p style={{ fontSize: 11, color: '#616161' }}>{currentUser?.email || ''}</p>
                  </div>
                </div>

                {/* Role info display */}
                <div className="px-3 py-1.5" style={{ borderBottom: '1px solid #e1e1e1' }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Your Role</p>
                  <p className="text-xs font-medium" style={{ color: '#242424' }}>
                    {currentUser?.role === 'Owner' ? 'Owner / CEO' : currentUser?.role === 'Manager' ? 'Manager' : 'Member'}
                    <span className="ml-1 text-[10px]" style={{ color: '#767676' }}>— Assigned by admin</span>
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1" role="none">
                  <UserMenuItem
                    icon={<User size={14} />}
                    label={"Profile"}
                    onClick={handleProfileClick}
                  />
                  <UserMenuItem
                    icon={<Settings size={14} />}
                    label={"Settings"}
                    onClick={() => { setShowUserMenu(false); openSettings(); }}
                    shortcut="Ctrl+,"
                  />
                  <UserMenuItem
                    icon={<HelpCircle size={14} />}
                    label={"Help & Support"}
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div style={{ borderTop: '1px solid #e1e1e1', margin: '4px 0' }} />
                  <UserMenuItem
                    icon={<LogOut size={14} />}
                    label={"Sign out"}
                    onClick={handleSignOut}
                    danger
                  />
                </div>
              </div>
            </>
          )}
        </div>
        ) : (
          <a
            href="/#/login"
            className="ml-2 flex items-center justify-center rounded text-sm font-medium"
            style={{ width: 'auto', height: 44, padding: '0 12px', color: '#fff', textDecoration: 'none' }}
          >
            Sign In
          </a>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────

function UserMenuItem({ icon, label, onClick, shortcut, danger }: { icon: React.ReactNode; label: string; onClick: () => void; shortcut?: string; danger?: boolean }) {
  return (
    <button
      role="menuitem"
      className="flex w-full cursor-pointer items-center gap-2 px-3 text-left"
      style={{ fontSize: 12, border: 'none', background: 'transparent', color: danger ? '#c4314b' : '#242424', minHeight: 44 }}
      onClick={onClick}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <span style={{ color: danger ? '#c4314b' : '#616161' }}>{icon}</span>
      <span className="flex-1">{label}</span>
      {shortcut && <span style={{ fontSize: 10, color: '#767676' }}>{shortcut}</span>}
    </button>
  );
}
