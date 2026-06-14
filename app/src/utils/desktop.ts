// Desktop API Bridge — calls into Rust backend via Tauri commands
// This module provides a typed interface to all Tauri v2 commands

import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import {
  sendNotification,
  isPermissionGranted,
  requestPermission,
} from '@tauri-apps/plugin-notification';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { check } from '@tauri-apps/plugin-updater';
import { open } from '@tauri-apps/plugin-shell';

// ─────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────

export interface AppVersion {
  version: string;
  name: string;
}

export interface UpdateResult {
  available: boolean;
  version?: string;
  body?: string;
  date?: string;
}

export interface DeepLinkPayload {
  url: string;
  path: string;
  params: Record<string, string>;
}

export interface SecureStore {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// ─────────────────────────────────────────────
// Platform Detection
// ─────────────────────────────────────────────

/**
 * Check if running as a Tauri desktop app
 */
export const isDesktop = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Check if running on a mobile device (Capacitor)
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  // Check for Capacitor bridge or mobile user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobileDevice =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
  const isCapacitor = 'Capacitor' in window;
  return isMobileDevice || isCapacitor;
};

/**
 * Check if running in a web browser (not desktop/mobile native)
 */
export const isWeb = (): boolean => {
  return !isDesktop() && !isMobile();
};

/**
 * Get the current platform name
 */
export const getPlatform = (): 'desktop' | 'mobile' | 'web' => {
  if (isDesktop()) return 'desktop';
  if (isMobile()) return 'mobile';
  return 'web';
};

// ─────────────────────────────────────────────
// DesktopAPI Class
// ─────────────────────────────────────────────

export class DesktopAPI {
  // ── Secure Storage ──────────────────────────

  /**
   * Store an encrypted key-value pair
   */
  static async secureSet(key: string, value: string): Promise<void> {
    if (!isDesktop()) {
      // Fallback to localStorage for web
      localStorage.setItem(`brixstac_secure_${key}`, value);
      return;
    }
    await invoke<void>('store_set', { key, value });
  }

  /**
   * Retrieve a decrypted value by key
   */
  static async secureGet(key: string): Promise<string | null> {
    if (!isDesktop()) {
      return localStorage.getItem(`brixstac_secure_${key}`);
    }
    return invoke<string | null>('store_get', { key });
  }

  /**
   * Delete a key from secure storage
   */
  static async secureDelete(key: string): Promise<void> {
    if (!isDesktop()) {
      localStorage.removeItem(`brixstac_secure_${key}`);
      return;
    }
    await invoke<void>('store_delete', { key });
  }

  /**
   * Clear all secure storage data
   */
  static async secureClear(): Promise<void> {
    if (!isDesktop()) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('brixstac_secure_'))
        .forEach((k) => localStorage.removeItem(k));
      return;
    }
    await invoke<void>('store_clear');
  }

  // ── Auth Token Helpers ──────────────────────

  /**
   * Save an authentication token securely
   */
  static async saveAuthToken(token: string): Promise<void> {
    if (!isDesktop()) {
      localStorage.setItem('brixstac_auth_token', token);
      return;
    }
    await invoke<void>('save_auth_token', { token });
  }

  /**
   * Retrieve the stored authentication token
   */
  static async getAuthToken(): Promise<string | null> {
    if (!isDesktop()) {
      return localStorage.getItem('brixstac_auth_token');
    }
    return invoke<string | null>('get_auth_token');
  }

  /**
   * Clear the stored authentication token (logout)
   */
  static async clearAuth(): Promise<void> {
    if (!isDesktop()) {
      localStorage.removeItem('brixstac_auth_token');
      return;
    }
    await invoke<void>('clear_auth');
  }

  // ── Notifications ───────────────────────────

  /**
   * Request permission to send native notifications
   */
  static async requestNotificationPermission(): Promise<boolean> {
    if (!isDesktop()) return false;

    const granted = await isPermissionGranted();
    if (granted) return true;

    const permission = await requestPermission();
    return permission === 'granted';
  }

  /**
   * Check if notification permission is granted
   */
  static async hasNotificationPermission(): Promise<boolean> {
    if (!isDesktop()) return false;
    return isPermissionGranted();
  }

  /**
   * Send a native desktop notification
   */
  static async sendNotification(title: string, body: string): Promise<void> {
    if (!isDesktop()) return;

    await sendNotification({ title, body });
  }

  /**
   * Schedule a notification for a future time
   * @param title Notification title
   * @param body Notification body
   * @param timestamp Unix timestamp (seconds) when to show the notification
   */
  static async scheduleNotification(
    title: string,
    body: string,
    timestamp: number,
  ): Promise<void> {
    if (!isDesktop()) return;

    await invoke<void>('notify_schedule', { title, body, timestamp });
  }

  // ── Deep Links ──────────────────────────────

  /**
   * Listen for deep link events
   * @param callback Called when a deep link URL is received
   */
  static async onDeepLink(
    callback: (payload: DeepLinkPayload) => void,
  ): Promise<UnlistenFn> {
    if (!isDesktop()) {
      return () => {}; // No-op unlisten for non-desktop
    }

    return listen<DeepLinkPayload>('deep-link:received', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Listen for auth token events from deep link
   * @param callback Called when an auth token is received via deep link
   */
  static async onAuthTokenReceived(
    callback: (token: string) => void,
  ): Promise<UnlistenFn> {
    if (!isDesktop()) {
      return () => {};
    }

    return listen<string>('auth:token-received', (event) => {
      callback(event.payload);
    });
  }

  // ── Updates ─────────────────────────────────

  /**
   * Check if an app update is available
   */
  static async checkForUpdates(): Promise<UpdateResult> {
    if (!isDesktop()) {
      return { available: false };
    }

    try {
      // First try the Rust command
      return await invoke<UpdateResult>('updater_check');
    } catch {
      // Fallback to frontend plugin
      try {
        const update = await check();
        if (update) {
          return {
            available: true,
            version: update.version,
            body: update.body,
            date: update.date,
          };
        }
        return { available: false };
      } catch {
        return { available: false };
      }
    }
  }

  /**
   * Download and install an available update
   */
  static async installUpdate(): Promise<void> {
    if (!isDesktop()) return;
    await invoke<void>('updater_install');
  }

  /**
   * Listen for update available events
   */
  static async onUpdateAvailable(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('updater:update-available', () => {
      callback();
    });
  }

  /**
   * Listen for update download started events
   */
  static async onUpdateDownloadStarted(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('updater:download-started', () => {
      callback();
    });
  }

  /**
   * Listen for update download finished events
   */
  static async onUpdateDownloadFinished(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('updater:download-finished', () => {
      callback();
    });
  }

  // ── Window Management ───────────────────────

  /**
   * Show the main application window
   */
  static async showWindow(): Promise<void> {
    if (!isDesktop()) return;

    const window = getCurrentWindow();
    await window.show();
    await window.setFocus();
  }

  /**
   * Hide the main application window (to tray)
   */
  static async hideWindow(): Promise<void> {
    if (!isDesktop()) return;

    const window = getCurrentWindow();
    await window.hide();
  }

  /**
   * Toggle main window visibility
   */
  static async toggleWindow(): Promise<void> {
    if (!isDesktop()) return;
    await invoke<void>('toggle_window');
  }

  // ── External Links ──────────────────────────

  /**
   * Open a URL in the system default browser
   */
  static async openExternal(url: string): Promise<void> {
    if (!isDesktop()) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    await open(url);
  }

  /**
   * Reveal a file in the system file manager
   */
  static async showInFolder(path: string): Promise<void> {
    if (!isDesktop()) return;
    await invoke<void>('show_in_folder', { path });
  }

  // ── App Information ─────────────────────────

  /**
   * Get the current application version
   */
  static async getVersion(): Promise<string> {
    if (!isDesktop()) {
      return '1.0.0-web';
    }
    const result = await invoke<AppVersion>('get_app_version');
    return result.version;
  }

  /**
   * Get full app info
   */
  static async getAppInfo(): Promise<AppVersion> {
    if (!isDesktop()) {
      return { version: '1.0.0-web', name: 'BrixOS' };
    }
    return invoke<AppVersion>('get_app_version');
  }

  // ── Event Listeners ─────────────────────────

  /**
   * Listen for window focus events
   */
  static async onWindowFocused(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('window:focused', () => {
      callback();
    });
  }

  /**
   * Listen for invite deep links
   */
  static async onInviteDeepLink(callback: (path: string) => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen<string>('deep-link:invite', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Listen for call deep links
   */
  static async onCallDeepLink(callback: (path: string) => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen<string>('deep-link:call', (event) => {
      callback(event.payload);
    });
  }

  /**
   * Listen for quick-action shortcut events
   */
  static async onQuickAction(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('shortcut:quick-action', () => {
      callback();
    });
  }

  /**
   * Listen for toggle-mute shortcut events
   */
  static async onToggleMuteShortcut(callback: () => void): Promise<UnlistenFn> {
    if (!isDesktop()) return () => {};

    return listen('shortcut:toggle-mute', () => {
      callback();
    });
  }

  // ── Lifecycle ───────────────────────────────

  /**
   * Initialize the desktop API — call this early in app startup
   */
  static async initialize(): Promise<void> {
    if (!isDesktop()) {
      console.log('[DesktopAPI] Running in web mode, desktop features disabled');
      return;
    }

    console.log('[DesktopAPI] Initializing desktop features...');

    // Request notification permission early
    try {
      await DesktopAPI.requestNotificationPermission();
    } catch {
      // Permission may be denied, that's okay
    }

    // Listen for deep links and store pending ones
    await listen<DeepLinkPayload>('deep-link:received', (event) => {
      console.log('[DesktopAPI] Deep link received:', event.payload);
    });

    console.log('[DesktopAPI] Desktop features initialized');
  }
}

// ─────────────────────────────────────────────
// Convenience Exports
// ─────────────────────────────────────────────

/**
 * Quick access to the desktop API for common operations
 */
export const desktop = DesktopAPI;

// Default export for convenience
export default DesktopAPI;
