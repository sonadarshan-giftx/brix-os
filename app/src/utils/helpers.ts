// ============================================================
// Brixstac — Helper Utilities
// ============================================================

import DOMPurify from 'dompurify';
import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { CURRENCY_LOCALE, DEFAULT_CURRENCY } from '@/const';

// ── Input Sanitization ──────────────────────────────────────

/**
 * Sanitize user input using DOMPurify to prevent XSS attacks.
 * Strips all HTML tags and returns plain text.
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize HTML content, allowing only safe tags.
 * Use for rich text fields like descriptions/comments.
 */
export function sanitizeRichText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (DOMPurify as any).sanitize(input, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'code', 'pre', 'blockquote',
    ],
    ALLOWED_ATTR: {
      a: ['href', 'target', 'rel'],
    },
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Escape HTML special characters for safe text rendering.
 * Use when you need to display user input as plain text.
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== 'string') return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  return text.replace(/[&<>"'`=/]/g, (s) => map[s] || s);
}

/**
 * Sanitize a search/query input to prevent SQL injection patterns.
 * Removes common SQL special characters and keywords.
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') return '';
  return query
    .replace(/[;'\"]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/xp_/gi, '')
    .replace(/exec\s*\(/gi, '')
    .replace(/union\s+select/gi, '')
    .replace(/drop\s+table/gi, '')
    .replace(/delete\s+from/gi, '')
    .trim();
}

// ── Date Formatting ─────────────────────────────────────────

/**
 * Format a date value to a locale-aware string.
 * Accepts Date objects, ISO strings, or timestamps.
 */
export function formatDate(
  value: Date | string | number,
  formatStr: string = 'MMM d, yyyy'
): string {
  if (!value) return '';

  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  if (!isValid(date)) return String(value);

  try {
    return format(date, formatStr);
  } catch {
    return String(value);
  }
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago").
 */
export function formatRelativeTime(value: Date | string | number): string {
  if (!value) return '';

  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  if (!isValid(date)) return String(value);

  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return String(value);
  }
}

/**
 * Format a date range as a readable string.
 */
export function formatDateRange(
  start: Date | string | number,
  end: Date | string | number,
  formatStr: string = 'MMM d, yyyy'
): string {
  return `${formatDate(start, formatStr)} - ${formatDate(end, formatStr)}`;
}

/**
 * Format an ISO date string for display in the app's standard format.
 */
export function formatISODate(isoString: string): string {
  return formatDate(isoString, 'MMM d, yyyy');
}

/**
 * Format an ISO datetime string for display.
 */
export function formatISODateTime(isoString: string): string {
  return formatDate(isoString, 'MMM d, yyyy h:mm a');
}

// ── Number / Currency Formatting ────────────────────────────

/**
 * Format a number as currency.
 */
export function formatCurrency(
  value: number,
  currency: string = DEFAULT_CURRENCY
): string {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value.toLocaleString()}`;
  }
}

/**
 * Format a number as a percentage.
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with locale-aware separators.
 */
export function formatNumber(value: number, decimals: number = 0): string {
  if (typeof value !== 'number' || isNaN(value)) return '—';
  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format story points with proper singular/plural.
 */
export function formatStoryPoints(points: number): string {
  if (typeof points !== 'number' || isNaN(points)) return '—';
  return `${points} ${points === 1 ? 'point' : 'points'}`;
}

/**
 * Calculate budget utilization percentage.
 */
export function calculateBudgetPercent(spent: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((spent / total) * 100));
}

// ── Debounce / Throttle ─────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFunction = (...args: any[]) => any;

/**
 * Debounce a function call. The function will only execute
 * after `delay` ms of inactivity.
 */
export function debounce<T extends AnyFunction>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle a function call. The function will execute at most
 * once every `limit` ms.
 */
export function throttle<T extends AnyFunction>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a debounced function that can be cancelled.
 */
export function createDebounced<T extends AnyFunction>(
  fn: T,
  delay: number
): {
  call: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastArgs: any[] | null = null;

  const call = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
      lastArgs = null;
    }, delay);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  const flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      fn(...(lastArgs as Parameters<T>));
      timeoutId = null;
      lastArgs = null;
    }
  };

  return { call, cancel, flush };
}

// ── Search / Filter ─────────────────────────────────────────

/**
 * Filter an array of items by a search query across specified keys.
 * Performs case-insensitive partial matching.
 */
export function filterBySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): T[] {
  if (!query || !query.trim()) return items;

  const sanitized = sanitizeSearchQuery(query).toLowerCase();
  if (!sanitized) return items;

  return items.filter((item) =>
    keys.some((key) => {
      const value = item[key];
      if (value == null) return false;
      return String(value).toLowerCase().includes(sanitized);
    })
  );
}

/**
 * Generic fuzzy search that scores matches.
 * Items with matches in multiple keys rank higher.
 */
export function fuzzySearch<T extends Record<string, unknown>>(
  items: T[],
  query: string,
  keys: (keyof T)[]
): T[] {
  if (!query || !query.trim()) return items;

  const sanitized = sanitizeSearchQuery(query).toLowerCase().trim();
  if (!sanitized) return items;

  const terms = sanitized.split(/\s+/);

  return items
    .map((item) => {
      let score = 0;
      for (const key of keys) {
        const value = item[key];
        if (value == null) continue;
        const str = String(value).toLowerCase();
        for (const term of terms) {
          if (str === term) score += 10; // exact match
          else if (str.startsWith(term)) score += 5; // prefix match
          else if (str.includes(term)) score += 2; // partial match
        }
      }
      return { item, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

/**
 * Sort items by a key in ascending or descending order.
 */
export function sortBy<T>(
  items: T[],
  key: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return direction === 'asc' ? 1 : -1;
    if (bVal == null) return direction === 'asc' ? -1 : 1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return direction === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });
}

/**
 * Group items by a key function.
 */
export function groupBy<T>(
  items: T[],
  keyFn: (item: T) => string
): Record<string, T[]> {
  return items.reduce(
    (groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

// ── Confirmation / Toast ────────────────────────────────────

/**
 * Show a confirmation dialog.
 */
export function confirmAction(message: string): boolean {
  return window.confirm(message);
}

/**
 * Show a toast notification.
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
): () => void {
  const container =
    document.getElementById('toast-container') ||
    (() => {
      const c = document.createElement('div');
      c.id = 'toast-container';
      c.style.cssText =
        'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
      document.body.appendChild(c);
      return c;
    })();

  const toast = document.createElement('div');
  toast.style.cssText =
    'padding:12px 20px;border-radius:8px;font-size:13px;font-weight:500;color:#fff;animation:toastSlideIn 0.3s ease;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:360px;word-break:break-word;';

  const colors: Record<string, string> = {
    success: '#237b4b',
    error: '#c4314b',
    info: '#5b5fc7',
    warning: '#ffaa44',
  };
  toast.style.backgroundColor = colors[type] || colors.info;
  toast.textContent = message;

  container.appendChild(toast);

  const remove = () => {
    toast.style.animation = 'toastSlideOut 0.2s ease forwards';
    setTimeout(() => toast.remove(), 200);
  };

  setTimeout(remove, 3000);
  return remove;
}

// ── URL / Navigation ────────────────────────────────────────

/**
 * Validate a URL string.
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
  }

/**
 * Generate a shareable link for a project/team/etc.
 */
export function generateDeepLink(type: string, id: string): string {
  return `${window.location.origin}/#/${type}/${id}`;
}

// ── Crypto / Security ───────────────────────────────────────

/**
 * Generate a cryptographically secure nonce.
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique ID with a prefix.
 */
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

// ── JSON ────────────────────────────────────────────────────

/**
 * Safely parse JSON with a fallback value.
 */
export function safeJSONParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Safely stringify a value to JSON.
 */
export function safeJSONStringify(value: unknown, fallback = '{}'): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

// ── Clipboard ───────────────────────────────────────────────

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

// ── CSS Animation Detection ─────────────────────────────────

/**
 * Check if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration respecting user's motion preference.
 */
export function getAnimationDuration(preferredMs: number): number {
  return prefersReducedMotion() ? 0 : preferredMs;
}

// ── LocalStorage with Error Handling ────────────────────────

/**
 * Safely write to localStorage with quota error handling.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22)) {
      // Storage quota exceeded - try clearing old items
      console.warn(`Storage quota exceeded when setting ${key}`);
    }
    return false;
  }
}

/**
 * Safely read from localStorage.
 */
export function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely remove from localStorage.
 */
export function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Silently fail
  }
}

// ── Array Utilities ─────────────────────────────────────────

/**
 * Remove duplicates from an array.
 */
export function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * Chunk an array into smaller arrays of specified size.
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ── Type Guards ─────────────────────────────────────────────

/**
 * Check if a value is a non-empty string.
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Check if a value is a positive number.
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value > 0;
}
