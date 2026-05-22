// ============================================================
// Brixstac — Theme Provider with CSS Variables & Accessibility
// ============================================================

import { type ReactNode, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { THEME } from '@/const';

/**
 * Apply CSS custom properties for the current accent color.
 * Updates the brand color palette dynamically.
 */
function applyAccentColor(color: string): void {
  const root = document.documentElement;

  // Set the primary brand color
  root.style.setProperty('--brand-primary', color);

  // Compute derived colors
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  // Darker variant (deep)
  const deepColor = `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`;
  root.style.setProperty('--brand-deep', deepColor);

  // Light variant (background tint)
  const lightColor = `rgba(${r}, ${g}, ${b}, 0.12)`;
  root.style.setProperty('--brand-light', lightColor);

  // Text on light variant
  const textColor = `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.8)})`;
  root.style.setProperty('--brand-text-on-light', textColor);

  // Selection highlight
  const selectedBg = `rgba(${r}, ${g}, ${b}, 0.15)`;
  root.style.setProperty('--surface-selected', selectedBg);
}

/**
 * Apply font size scaling via CSS variable.
 */
function applyFontSize(fontSize: number): void {
  const root = document.documentElement;
  // Base font size is 14px (scale = 1.0)
  const scale = fontSize / 14;
  root.style.setProperty('--font-scale', String(scale));
  root.style.setProperty('--font-size-base', `${fontSize}px`);

  // Apply to document for em/rem calculations
  document.documentElement.style.fontSize = `${fontSize}px`;
}

/**
 * Apply dark mode classes and dark-specific CSS variables.
 */
function applyDarkMode(isDark: boolean): void {
  const root = document.documentElement;

  if (isDark) {
    root.classList.add('dark');
    root.style.setProperty('--surface-primary', '#1f1f1f');
    root.style.setProperty('--surface-context', '#2a2a2a');
    root.style.setProperty('--surface-rail', '#1a1a1a');
    root.style.setProperty('--surface-hover', '#2d2d2d');
    root.style.setProperty('--surface-active', '#3a3a3a');
    root.style.setProperty('--surface-border', '#404040');
    root.style.setProperty('--surface-divider', '#333333');
    root.style.setProperty('--text-primary', '#e8e8e8');
    root.style.setProperty('--text-secondary', '#a0a0a0');
    root.style.setProperty('--text-tertiary', '#6e6e6e');
  } else {
    root.classList.remove('dark');
    root.style.setProperty('--surface-primary', '#ffffff');
    root.style.setProperty('--surface-context', '#f5f5f3');
    root.style.setProperty('--surface-rail', '#ebebea');
    root.style.setProperty('--surface-hover', '#f0f0f0');
    root.style.setProperty('--surface-active', '#e0e0e0');
    root.style.setProperty('--surface-border', '#d1d1d1');
    root.style.setProperty('--surface-divider', '#e1e1e1');
    root.style.setProperty('--text-primary', '#242424');
    root.style.setProperty('--text-secondary', '#616161');
    root.style.setProperty('--text-tertiary', '#a0a0a0');
  }
}

/**
 * Apply reduced motion preference.
 */
function applyReducedMotion(shouldReduce: boolean): void {
  const root = document.documentElement;
  if (shouldReduce) {
    root.style.setProperty('--transition-duration', '0ms');
    root.style.setProperty('--animation-duration', '0ms');
    root.classList.add('reduce-motion');
  } else {
    root.style.setProperty('--transition-duration', '150ms');
    root.style.setProperty('--animation-duration', '200ms');
    root.classList.remove('reduce-motion');
  }
}

/**
 * Determine if dark mode should be active based on theme setting
 * and system preference.
 */
function resolveDarkMode(theme: 'light' | 'dark' | 'system'): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  // system
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
}

// ── Theme Provider Component ────────────────────────────────

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useStore((s) => s.theme);
  const accentColor = useStore((s) => s.accentColor);
  const fontSize = useStore((s) => s.fontSize);

  // Memoized theme application
  const applyTheme = useCallback(() => {
    const isDark = resolveDarkMode(theme);
    applyDarkMode(isDark);
    applyAccentColor(accentColor);
    applyFontSize(fontSize);
  }, [theme, accentColor, fontSize]);

  // Apply theme on mount and when settings change
  useEffect(() => {
    applyTheme();
  }, [applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme();

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  // Listen for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      applyReducedMotion(e.matches);
    };

    // Apply initial value
    applyReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Listen for accent color changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME.STORAGE_KEY && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.state?.accentColor) {
            applyAccentColor(data.state.accentColor);
          }
          if (data.state?.theme) {
            applyDarkMode(resolveDarkMode(data.state.theme));
          }
          if (data.state?.fontSize) {
            applyFontSize(data.state.fontSize);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <>{children}</>;
}

export default ThemeProvider;
