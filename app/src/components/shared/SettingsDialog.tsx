import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import {
  X, Sun, Moon, Monitor, Palette, Bell, Globe,
  Keyboard, Shield, User, ChevronRight, Check, Search,
  AlertTriangle, Trash2, Save, RotateCcw,
} from 'lucide-react';

const themeOptions = [
  { id: 'light' as const, label: "Light", icon: Sun, desc: 'Clean, bright interface' },
  { id: 'dark' as const, label: "Dark", icon: Moon, desc: 'Easy on the eyes' },
  { id: 'system' as const, label: "System", icon: Monitor, desc: 'Follows your OS setting' },
];

const accentColors = [
  { color: '#5b5fc7', name: "Indigo" },
  { color: '#237b4b', name: "Forest" },
  { color: '#c4314b', name: "Crimson" },
  { color: '#b56200', name: "Amber" },
  { color: '#0891b2', name: "Ocean" },
  { color: '#7c3aed', name: "Violet" },
];

const sections = [
  { id: 'appearance', label: "Appearance", icon: Palette },
  { id: 'notifications', label: "Notifications", icon: Bell },
  { id: 'language', label: "Language & Region", icon: Globe },
  { id: 'shortcuts', label: "Keyboard", icon: Keyboard },
  { id: 'privacy', label: "Privacy & Security", icon: Shield },
  { id: 'account', label: "Account", icon: User },
];

/** Load settings from localStorage */
function loadPersistedSettings(): { accentColor: string; fontSize: string } {
  try {
    const raw = localStorage.getItem('brixstac-ui-settings');
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { accentColor: '#5b5fc7', fontSize: 'Default' };
}

/** Save settings to localStorage */
function savePersistedSettings(settings: { accentColor: string; fontSize: string }) {
  localStorage.setItem('brixstac-ui-settings', JSON.stringify(settings));
}

/**
 * SettingsDialog — Full-featured settings with persistence, theme, search, and account management
 *
 * Features:
 * - Settings persist to localStorage
 * - Theme class application (light/dark/system)
 * - Accent color CSS variable updates
 * - Font size class application
 * - Event propagation fix (language rows don't close modal)
 * - Explicit Save/Cancel buttons
 * - Unsaved changes warning on backdrop close
 * - Search within settings
 * - 2FA disable with password confirmation
 * - Editable account fields
 * - Delete account with confirmation
 */
export function SettingsDialog() {  const settingsOpen = useStore((s) => s.settingsOpen);
  const closeSettings = useStore((s) => s.closeSettings);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const currentUser = useStore((s) => s.currentUser);

  const [activeSection, setActiveSection] = useState('appearance');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Load persisted UI settings
  const persisted = loadPersistedSettings();
  const [accentColor, setAccentColor] = useState(persisted.accentColor);
  const [fontSize, setFontSize] = useState(persisted.fontSize);

  // Account fields (editable)
  const [accountName, setAccountName] = useState(currentUser.name);
  const [accountEmail, setAccountEmail] = useState(currentUser.email || 'alex@acme-brixstac.com');
  const [accountOrg, setAccountOrg] = useState('Acme Software');

  // 2FA
  const [twoFAEnabled, setTwoFAEnabled] = useState(true);
  const [show2FAPassword, setShow2FAPassword] = useState(false);
  const [twoFAPassword, setTwoFAPassword] = useState('');

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Track changes
  const initialSnapshot = useRef({
    accentColor: persisted.accentColor,
    fontSize: persisted.fontSize,
    accountName: currentUser.name,
    accountEmail: currentUser.email || 'alex@acme-brixstac.com',
    accountOrg: 'Acme Software',
    twoFAEnabled: true,
  });

  // Reset snapshot when modal opens
  useEffect(() => {
    if (settingsOpen) {
      const p = loadPersistedSettings();
      initialSnapshot.current = {
        accentColor: p.accentColor,
        fontSize: p.fontSize,
        accountName: currentUser.name,
        accountEmail: currentUser.email || 'alex@acme-brixstac.com',
        accountOrg: 'Acme Software',
        twoFAEnabled: true,
      };
      setHasChanges(false);
    }
  }, [settingsOpen, currentUser.name, currentUser.email]);

  useEffect(() => {
    const snap = initialSnapshot.current;
    const dirty =
      accentColor !== snap.accentColor ||
      fontSize !== snap.fontSize ||
      accountName !== snap.accountName ||
      accountEmail !== snap.accountEmail ||
      accountOrg !== snap.accountOrg ||
      twoFAEnabled !== snap.twoFAEnabled;
    setHasChanges(dirty);
  }, [accentColor, fontSize, accountName, accountEmail, accountOrg, twoFAEnabled]);

  // Apply accent color to CSS variables
  useEffect(() => {
    document.documentElement.style.setProperty('--op-accent', accentColor);
  }, [accentColor]);

  // Apply font size class
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    if (fontSize === 'Small') root.classList.add('text-sm');
    else if (fontSize === 'Large') root.classList.add('text-lg');
    else root.classList.add('text-base');
  }, [fontSize]);

  // Keyboard shortcut: Ctrl+, opens settings
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        useStore.getState().openSettings();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Keyboard shortcut: / focuses search when settings open
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settingsOpen]);

  // Focus management: trap focus, Escape to close, return focus on close
  useEffect(() => {
    if (settingsOpen) {
      // Save the element that had focus before opening
      lastFocusedElement.current = document.activeElement as HTMLElement;
      // Focus the dialog container
      setTimeout(() => dialogRef.current?.focus(), 100);
    } else if (lastFocusedElement.current) {
      // Return focus to the trigger element
      lastFocusedElement.current.focus();
    }
  }, [settingsOpen]);

  // Trap focus within modal and handle Escape
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showUnsavedWarning) {
          setShowUnsavedWarning(false);
        } else if (show2FAPassword) {
          setShow2FAPassword(false);
          setTwoFAPassword('');
        } else {
          handleCancel();
        }
        return;
      }
      // Focus trapping: Tab cycles within modal
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [settingsOpen, showUnsavedWarning, show2FAPassword]);

  const handleSave = () => {
    savePersistedSettings({ accentColor, fontSize });
    setHasChanges(false);
    closeSettings();
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    closeSettings();
  };

  const handleBackdropClick = () => {
    if (hasChanges) {
      setShowUnsavedWarning(true);
      return;
    }
    closeSettings();
  };

  const handleConfirmDiscard = () => {
    // Revert to persisted values
    const p = loadPersistedSettings();
    setAccentColor(p.accentColor);
    setFontSize(p.fontSize);
    setAccountName(currentUser.name);
    setAccountEmail(currentUser.email || 'alex@acme-brixstac.com');
    setAccountOrg('Acme Software');
    setHasChanges(false);
    setShowUnsavedWarning(false);
    closeSettings();
  };

  const handle2FAToggle = (value: boolean) => {
    if (!value && twoFAEnabled) {
      // Trying to disable 2FA — require password
      setShow2FAPassword(true);
      return;
    }
    setTwoFAEnabled(value);
  };

  const handle2FAConfirm = () => {
    if (twoFAPassword.length < 6) return;
    setTwoFAEnabled(false);
    setShow2FAPassword(false);
    setTwoFAPassword('');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      localStorage.removeItem('brixstac-store');
      localStorage.removeItem('brixstac-ui-settings');
      window.location.reload();
    }
  };

  // Filter sections and settings based on search
  const filteredSections = searchQuery
    ? sections.filter((s) =>
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSectionKeywords(s.id).some((k) => k.includes(searchQuery.toLowerCase()))
      )
    : sections;

  if (!settingsOpen) return null;

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200]"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            onClick={handleBackdropClick}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 outline-none"
            role="dialog"
            aria-label="Settings"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Escape') e.stopPropagation(); }}
          >
            <div
              className="flex overflow-hidden rounded-lg shadow-2xl"
              style={{
                width: 720,
                maxWidth: '95vw',
                height: 560,
                maxHeight: '90vh',
                backgroundColor: 'var(--op-bg-primary, #ffffff)',
              }}
            >
              {/* Left sidebar */}
              <div
                className="flex w-[200px] flex-shrink-0 flex-col"
                style={{ backgroundColor: 'var(--op-bg-secondary, #f5f5f3)', borderRight: '1px solid var(--op-border, #e1e1e1)' }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--op-border, #e1e1e1)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: '#242424' }}>Settings</h2>
                  <button
                    onClick={handleCancel}
                    className="cursor-pointer rounded p-2 hover:bg-white"
                    style={{ border: 'none', background: 'transparent', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    aria-label="Close settings"
                  >
                    <X size={18} color="#616161" />
                  </button>
                </div>

                {/* Settings search */}
                <div className="px-3 py-2" style={{ borderBottom: '1px solid var(--op-border, #e1e1e1)' }}>
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: '#767676' }} />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search settings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md py-2 pl-7 pr-2 text-xs outline-none"
                      style={{ backgroundColor: '#ffffff', border: '1px solid #e1e1e1', minHeight: 36 }}
                      aria-label="Search settings"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                  {filteredSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className="flex w-full cursor-pointer items-center gap-2 px-4 text-left transition-colors"
                      style={{
                        backgroundColor: activeSection === section.id ? '#e8e8ff' : 'transparent',
                        border: 'none',
                        minHeight: 44,
                      }}
                      aria-current={activeSection === section.id ? 'true' : undefined}
                    >
                      <section.icon
                        size={16}
                        color={activeSection === section.id ? 'var(--op-accent, #5b5fc7)' : '#616161'}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          color: activeSection === section.id ? 'var(--op-accent, #5b5fc7)' : '#242424',
                          fontWeight: activeSection === section.id ? 600 : 400,
                        }}
                      >
                        {section.label}
                      </span>
                      <ChevronRight size={14} color="#767676" style={{ marginLeft: 'auto' }} />
                    </button>
                  ))}
                  {filteredSections.length === 0 && (
                    <div className="px-4 py-6 text-center text-[11px]" style={{ color: '#767676' }}>No settings found</div>
                  )}
                </div>
              </div>

              {/* Right content */}
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Appearance Section */}
                  {activeSection === 'appearance' && (
                    <div className="space-y-6">
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Theme</h3>
                        <p style={{ fontSize: 12, color: '#616161', marginBottom: 16 }}>Choose how Brixstac looks for you</p>

                        <div className="grid grid-cols-3 gap-3">
                          {themeOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = theme === option.id;
                            return (
                              <button
                                key={option.id}
                                onClick={() => setTheme(option.id)}
                                className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all"
                                style={{
                                  borderColor: isSelected ? 'var(--op-accent, #5b5fc7)' : '#e1e1e1',
                                  backgroundColor: isSelected ? '#f8f8ff' : '#ffffff',
                                }}
                              >
                                <Icon size={24} color={isSelected ? 'var(--op-accent, #5b5fc7)' : '#616161'} />
                                <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--op-accent, #5b5fc7)' : '#242424' }}>{option.label}</span>
                                <span style={{ fontSize: 11, color: '#767676' }}>{option.desc}</span>
                                {isSelected && (
                                  <div className="flex items-center justify-center rounded-full" style={{ width: 20, height: 20, backgroundColor: 'var(--op-accent, #5b5fc7)', marginTop: 4 }}>
                                    <Check size={12} color="#fff" />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e1e1e1', paddingTop: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Accent Color</h3>
                        <p style={{ fontSize: 12, color: '#616161', marginBottom: 12 }}>Pick your brand accent</p>
                        <div className="flex gap-3">
                          {accentColors.map((c) => (
                            <button
                              key={c.color}
                              onClick={() => setAccentColor(c.color)}
                              className="flex cursor-pointer flex-col items-center gap-1"
                              style={{ border: 'none', background: 'transparent', opacity: accentColor === c.color ? 1 : 0.5 }}
                              title={c.name}
                            >
                              <div
                                className="rounded-full"
                                style={{
                                  width: 28, height: 28, backgroundColor: c.color,
                                  outline: accentColor === c.color ? '2px solid ' + c.color : 'none',
                                  outlineOffset: 2,
                                }}
                              />
                              <span style={{ fontSize: 10, color: '#616161' }}>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid #e1e1e1', paddingTop: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Font Size</h3>
                        <p style={{ fontSize: 12, color: '#616161', marginBottom: 12 }}>Adjust text size across the app</p>
                        <div className="flex items-center gap-3">
                          <span style={{ fontSize: 12, color: '#616161' }}>Small</span>
                          <div className="flex flex-1 gap-1">
                            {['Small', 'Default', 'Large'].map((size) => (
                              <button
                                key={size}
                                onClick={() => setFontSize(size)}
                                className="flex-1 cursor-pointer rounded border py-1 text-center"
                                style={{
                                  fontSize: 12,
                                  borderColor: size === fontSize ? 'var(--op-accent, #5b5fc7)' : '#e1e1e1',
                                  backgroundColor: size === fontSize ? '#f8f8ff' : '#fff',
                                  color: size === fontSize ? 'var(--op-accent, #5b5fc7)' : '#242424',
                                }}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                          <span style={{ fontSize: 14, color: '#616161' }}>Large</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Section */}
                  {activeSection === 'notifications' && (
                    <div className="space-y-4">
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Notification Preferences</h3>
                      <p style={{ fontSize: 12, color: '#616161', marginBottom: 16 }}>Control how you receive alerts and updates</p>
                      {[
                        { label: "Mentions & Replies", desc: "When someone mentions you or replies to your message", enabled: true },
                        { label: "Approval Requests", desc: "When a new approval needs your review", enabled: true },
                        { label: "Sprint Updates", desc: "Daily sprint progress summary", enabled: false },
                        { label: "Security Alerts", desc: "Critical security notifications", enabled: true },
                        { label: "AI Agent Updates", desc: "When AI agents complete tasks", enabled: true },
                      ].map((item) => (
                        <ToggleRow key={item.label} label={item.label} desc={item.desc} defaultOn={item.enabled} />
                      ))}
                    </div>
                  )}

                  {/* Language Section */}
                  {activeSection === 'language' && (
                    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Language & Region</h3>
                      <p style={{ fontSize: 12, color: '#616161', marginBottom: 16 }}>Configure your language and regional preferences</p>
                      <div className="space-y-3">
                        <EditableRow label="Language" defaultValue="English (US)" options={['English (US)', 'English (UK)', 'Spanish', 'French', 'German', 'Japanese', 'Chinese (Simplified)']} />
                        <EditableRow label="Time Zone" defaultValue="America/Los_Angeles (PST)" options={['America/Los_Angeles (PST)', 'America/New_York (EST)', 'Europe/London (GMT)', 'Asia/Tokyo (JST)', 'Asia/Shanghai (CST)']} />
                        <EditableRow label="Date Format" defaultValue="MM/DD/YYYY" options={['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']} />
                        <EditableRow label="Time Format" defaultValue="12-hour" options={['12-hour', '24-hour']} />
                        <EditableRow label="First Day of Week" defaultValue="Sunday" options={['Sunday', 'Monday', 'Saturday']} />
                      </div>
                    </div>
                  )}

                  {/* Keyboard Section */}
                  {activeSection === 'shortcuts' && (
                    <div className="space-y-4">
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Keyboard Shortcuts</h3>
                      <p style={{ fontSize: 12, color: '#616161', marginBottom: 16 }}>Quick actions to boost your productivity</p>
                      <div className="space-y-2">
                        {[
                          { keys: ['Cmd', 'K'], action: 'Command Palette' },
                          { keys: ['Cmd', '/'], action: 'AI Copilot' },
                          { keys: ['Cmd', '1-8'], action: 'Switch surface' },
                          { keys: ['Cmd', 'N'], action: 'New task' },
                          { keys: ['Cmd', 'B'], action: 'Toggle sidebar' },
                          { keys: ['Esc'], action: 'Close dialog / Go back' },
                          { keys: ['Cmd', ','], action: 'Open Settings' },
                        ].map((shortcut) => (
                          <div key={shortcut.action} className="flex items-center justify-between rounded p-2" style={{ backgroundColor: '#f8f8f8' }}>
                            <span style={{ fontSize: 13, color: '#242424' }}>{shortcut.action}</span>
                            <div className="flex gap-1">
                              {shortcut.keys.map((k) => (
                                <kbd key={k} className="rounded px-1.5 py-0.5 text-xs font-mono" style={{ backgroundColor: '#fff', border: '1px solid #d1d1d1', color: '#616161' }}>{k}</kbd>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Privacy Section */}
                  {activeSection === 'privacy' && (
                    <div className="space-y-4">
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Privacy & Security</h3>
                      <div className="space-y-3">
                        <div>
                          <ToggleRow label="Two-Factor Authentication" desc="Require OTP for login" defaultOn={twoFAEnabled} onToggle={handle2FAToggle} />
                          {/* 2FA Password Confirmation Dialog */}
                          {show2FAPassword && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 rounded-lg p-3"
                              style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
                            >
                              <p style={{ fontSize: 12, color: '#c4314b', fontWeight: 500, marginBottom: 8 }}>
                                <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                                Enter your password to disable 2FA
                              </p>
                              <input
                                type="password"
                                placeholder="Enter password"
                                value={twoFAPassword}
                                onChange={(e) => setTwoFAPassword(e.target.value)}
                                className="mb-2 w-full rounded border px-2 py-1 text-xs outline-none"
                                style={{ borderColor: '#e1e1e1' }}
                                onKeyDown={(e) => { if (e.key === 'Enter') handle2FAConfirm(); }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handle2FAConfirm}
                                  disabled={twoFAPassword.length < 6}
                                  className="cursor-pointer rounded px-3 py-1 text-xs font-medium"
                                  style={{ backgroundColor: twoFAPassword.length >= 6 ? '#c4314b' : '#d1d1d1', color: '#fff', border: 'none' }}
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => { setShow2FAPassword(false); setTwoFAPassword(''); }}
                                  className="cursor-pointer rounded px-3 py-1 text-xs"
                                  style={{ backgroundColor: '#f0f0f0', border: '1px solid #e1e1e1' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                        <ToggleRow label="Session Timeout" desc="Auto-logout after 4 hours of inactivity" defaultOn={true} />
                        <ToggleRow label="Activity Logging" desc="Log all actions for audit trail" defaultOn={true} />
                        <ToggleRow label="Data Sharing" desc="Share anonymized usage data" defaultOn={false} />
                      </div>
                      <div className="mt-4 rounded p-3" style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
                        <p style={{ fontSize: 12, color: '#c4314b', fontWeight: 500 }}>Active Sessions: 3 devices</p>
                        <button style={{ fontSize: 11, color: 'var(--op-accent, #5b5fc7)', border: 'none', background: 'transparent', cursor: 'pointer', marginTop: 4 }}>
                          Manage all sessions →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Account Section */}
                  {activeSection === 'account' && (
                    <div className="space-y-4">
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: '#242424', marginBottom: 4 }}>Account</h3>
                      <div className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
                        <div className="rounded-full" style={{ width: 48, height: 48, backgroundColor: 'var(--op-accent, #5b5fc7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ color: '#fff', fontSize: 18, fontWeight: 600 }}>{accountName.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>{accountName}</p>
                          <p style={{ fontSize: 12, color: '#616161' }}>{accountEmail}</p>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: '#c4314b22', color: '#c4314b' }}>
                            {currentUser.role === 'Owner' ? 'Owner / CEO' : currentUser.role === 'Manager' ? 'Manager' : 'Member'}
                          </span>
                        </div>
                      </div>

                      {/* Editable account fields */}
                      <div className="space-y-3" style={{ marginTop: 16 }}>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Full Name</label>
                          <input
                            type="text"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-xs outline-none"
                            style={{ borderColor: '#e1e1e1', backgroundColor: '#fff' }}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Email</label>
                          <input
                            type="email"
                            value={accountEmail}
                            onChange={(e) => setAccountEmail(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-xs outline-none"
                            style={{ borderColor: '#e1e1e1', backgroundColor: '#fff' }}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Organization</label>
                          <input
                            type="text"
                            value={accountOrg}
                            onChange={(e) => setAccountOrg(e.target.value)}
                            className="w-full rounded border px-3 py-2 text-xs outline-none"
                            style={{ borderColor: '#e1e1e1', backgroundColor: '#fff' }}
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: '#767676' }}>Role</label>
                          <input
                            type="text"
                            value={currentUser.role === 'Owner' ? 'Owner / CEO' : currentUser.role === 'Manager' ? 'Manager' : 'Member'}
                            disabled
                            className="w-full rounded border px-3 py-2 text-xs"
                            style={{ borderColor: '#e1e1e1', backgroundColor: '#f0f0f0', color: '#767676' }}
                          />
                          <p className="mt-0.5 text-[9px]" style={{ color: '#767676' }}>Role is assigned by admin and cannot be changed</p>
                        </div>
                      </div>

                      {/* Delete Account */}
                      <div className="mt-6 rounded-lg p-4" style={{ border: '1px solid #fecaca', backgroundColor: '#fef2f2' }}>
                        <h4 className="mb-1 flex items-center gap-1 font-semibold" style={{ fontSize: 13, color: '#c4314b' }}>
                          <Trash2 size={13} /> Delete Account
                        </h4>
                        <p style={{ fontSize: 11, color: '#616161', marginBottom: 8 }}>
                          This action cannot be undone. All your data will be permanently removed.
                        </p>
                        {!showDeleteConfirm ? (
                          <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="cursor-pointer rounded px-3 py-1.5 text-xs font-medium"
                            style={{ backgroundColor: '#c4314b', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
                          >
                            Delete Account
                          </button>
                        ) : (
                          <div className="space-y-2">
                            <p style={{ fontSize: 11, color: '#c4314b', fontWeight: 500 }}>
                              Type &quot;DELETE&quot; to confirm:
                            </p>
                            <input
                              type="text"
                              value={deleteConfirmText}
                              onChange={(e) => setDeleteConfirmText(e.target.value)}
                              placeholder="DELETE"
                              className="w-full rounded border px-2 py-1 text-xs outline-none"
                              style={{ borderColor: '#c4314b' }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'DELETE'}
                                className="cursor-pointer rounded px-3 py-1 text-xs font-medium"
                                style={{ backgroundColor: deleteConfirmText === 'DELETE' ? '#c4314b' : '#d1d1d1', color: '#fff', border: 'none' }}
                              >
                                Permanently Delete
                              </button>
                              <button
                                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                className="cursor-pointer rounded px-3 py-1 text-xs"
                                style={{ backgroundColor: '#f0f0f0', border: '1px solid #e1e1e1' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Save / Cancel */}
                <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--op-border, #e1e1e1)' }}>
                  {hasChanges && (
                    <span className="flex items-center gap-1 text-[10px] font-medium" style={{ color: '#f59e0b' }}>
                      <AlertTriangle size={10} /> Unsaved changes
                    </span>
                  )}
                  {!hasChanges && <span />}
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancel}
                      className="cursor-pointer rounded px-3 py-1.5 text-xs"
                      style={{ backgroundColor: '#f0f0f0', border: '1px solid #e1e1e1', color: '#242424' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="flex cursor-pointer items-center gap-1 rounded px-3 py-1.5 text-xs font-medium"
                      style={{ backgroundColor: 'var(--op-accent, #5b5fc7)', color: '#fff', border: 'none' }}
                    >
                      <Save size={12} /> Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Unsaved Changes Warning Dialog */}
          {showUnsavedWarning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[202] flex items-center justify-center p-4"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[360px] rounded-lg bg-white p-5 shadow-xl"
              >
                <h3 className="mb-1 font-semibold" style={{ fontSize: 14, color: '#242424' }}>Unsaved Changes</h3>
                <p className="mb-4 text-xs" style={{ color: '#616161' }}>You have unsaved changes. Do you want to save them before closing?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={handleConfirmDiscard}
                    className="cursor-pointer rounded px-3 py-1.5 text-xs"
                    style={{ backgroundColor: '#f0f0f0', border: '1px solid #e1e1e1' }}
                  >
                    <RotateCcw size={10} className="mr-1 inline" />
                    Discard
                  </button>
                  <button
                    onClick={() => { setShowUnsavedWarning(false); }}
                    className="cursor-pointer rounded px-3 py-1.5 text-xs"
                    style={{ backgroundColor: '#f0f0f0', border: '1px solid #e1e1e1' }}
                  >
                    Keep Editing
                  </button>
                  <button
                    onClick={handleSave}
                    className="cursor-pointer rounded px-3 py-1.5 text-xs font-medium"
                    style={{ backgroundColor: 'var(--op-accent, #5b5fc7)', color: '#fff', border: 'none' }}
                  >
                    Save & Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Keyword helper for settings search ── */

function getSectionKeywords(sectionId: string): string[] {
  const keywords: Record<string, string[]> = {
    appearance: ['theme', 'dark', 'light', 'color', 'accent', 'font', 'size', 'style'],
    notifications: ['alert', 'mention', 'email', 'push', 'bell', 'notify'],
    language: ['locale', 'timezone', 'region', 'date', 'time', 'format'],
    shortcuts: ['keyboard', 'hotkey', 'keybinding', 'shortcut'],
    privacy: ['security', '2fa', 'password', 'session', 'privacy', 'logout'],
    account: ['profile', 'name', 'email', 'delete', 'avatar', 'personal'],
  };
  return keywords[sectionId] || [];
}

/* ── Helper components ── */

function ToggleRow({ label, desc, defaultOn, onToggle }: { label: string; desc: string; defaultOn: boolean; onToggle?: (value: boolean) => void }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{label}</p>
        <p style={{ fontSize: 11, color: '#616161' }}>{desc}</p>
      </div>
      <button
        onClick={() => { setOn(!on); onToggle?.(!on); }}
        className="cursor-pointer"
        style={{
          width: 48, height: 26, borderRadius: 13, border: 'none',
          backgroundColor: on ? 'var(--op-accent, #5b5fc7)' : '#d1d1d1',
          position: 'relative', transition: 'background-color 150ms',
          flexShrink: 0,
        }}
        aria-checked={on}
        role="switch"
      >
        <div
          style={{
            width: 20, height: 20, borderRadius: '50%', backgroundColor: '#fff',
            position: 'absolute', top: 3, left: on ? 25 : 3,
            transition: 'left 150ms', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </button>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg p-3" style={{ backgroundColor: '#f8f8f8' }}>
      <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#616161' }}>{value}</span>
    </div>
  );
}

function EditableRow({ label, defaultValue, options }: { label: string; defaultValue: string; options: string[] }) {
  const [value, setValue] = useState(defaultValue);
  const [editing, setEditing] = useState(false);

  return (
    <div
      className="flex items-center justify-between rounded-lg p-3"
      style={{ backgroundColor: '#f8f8f8' }}
      onClick={(e) => e.stopPropagation()}
    >
      <span style={{ fontSize: 13, fontWeight: 500, color: '#242424' }}>{label}</span>
      {!editing ? (
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true); }}
          className="cursor-pointer rounded px-3 py-2 text-xs"
          style={{ color: 'var(--op-accent, #5b5fc7)', backgroundColor: '#e8e8ff', border: 'none', minHeight: 36 }}
        >
          {value}
        </button>
      ) : (
        <select
          value={value}
          onChange={(e) => { setValue(e.target.value); setEditing(false); }}
          onBlur={() => setEditing(false)}
          className="rounded border px-2 py-0.5 text-xs outline-none"
          style={{ borderColor: '#e1e1e1', backgroundColor: '#fff' }}
          autoFocus
        >
          {options.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      )}
    </div>
  );
}
