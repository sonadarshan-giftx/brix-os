// ============================================================
// Brixstac — Root Entry Point with Error Boundary & PWA Support
// ============================================================

import { createRoot } from 'react-dom/client';
import { Component, type ReactNode, type ErrorInfo } from 'react';
import App from './App';
import './index.css';
import './styles/qa-fixes.css';
import './i18n';

// ── Root Error Boundary ─────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Catches JavaScript errors anywhere in the child component tree,
 * logs error details, and displays a fallback UI instead of
 * crashing the entire application.
 */
class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error, errorInfo });

    // Log to console for debugging
    console.error('Root Error Boundary caught an error:', error, errorInfo);

    // Send to error tracking service if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    if (typeof window !== 'undefined' && win.Sentry) {
      try {
        win.Sentry?.captureException?.(error, { extra: { errorInfo: errorInfo.componentStack } });
      } catch {
        // Sentry not available, ignore
      }
    }
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            backgroundColor: '#f5f5f3',
            color: '#242424',
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
              textAlign: 'center',
            }}
          >
            {/* Error icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fde8e8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '28px',
              }}
            >
              &#9888;
            </div>

            <h1
              style={{
                fontSize: '20px',
                fontWeight: 600,
                margin: '0 0 8px',
                color: '#242424',
              }}
            >
              Something went wrong
            </h1>

            <p
              style={{
                fontSize: '14px',
                lineHeight: 1.6,
                color: '#616161',
                margin: '0 0 24px',
              }}
            >
              The application encountered an unexpected error. You can try
              reloading the page or resetting the app state.
            </p>

            {this.state.error && (
              <details
                style={{
                  marginBottom: '24px',
                  textAlign: 'left',
                  borderRadius: '8px',
                  backgroundColor: '#f5f5f3',
                  padding: '12px 16px',
                  fontSize: '12px',
                  color: '#616161',
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 500,
                    color: '#242424',
                  }}
                >
                  Error details
                </summary>
                <pre
                  style={{
                    marginTop: '12px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    fontSize: '11px',
                    lineHeight: 1.5,
                    color: '#c4314b',
                    fontFamily: 'monospace',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#D97757',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d1d1',
                  backgroundColor: '#ffffff',
                  color: '#242424',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Try Again
              </button>
            </div>
          </div>

          <style>{`
            @media (prefers-color-scheme: dark) {
              div { background-color: #1f1f1f !important; color: #e8e8e8 !important; }
              h1 { color: #e8e8e8 !important; }
              p { color: #a0a0a0 !important; }
              summary { color: #e8e8e8 !important; }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Root Rendering ──────────────────────────────────────────

const rootEl = document.getElementById('root');

if (!rootEl) {
  // Critical error: root element not found
  document.body.innerHTML = `
    <div style="
      padding: 40px;
      font-family: Inter, system-ui, sans-serif;
      text-align: center;
      color: #242424;
    ">
      <h1 style="font-size: 20px; margin-bottom: 12px;">Root element not found</h1>
      <p style="color: #616161;">
        The application could not start because the root DOM element is missing.
        Please check that the HTML file contains &lt;div id="root"&gt;&lt;/div&gt;.
      </p>
    </div>
  `;
} else {
  const root = createRoot(rootEl);
  root.render(
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  );
}

// ── Service Worker Registration (PWA) ───────────────────────

/**
 * Register a service worker for offline support and PWA functionality.
 * Uses a simple cache-first strategy for static assets.
 */
function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service worker registered:', registration.scope);

          // Check for updates periodically
          setInterval(
            () => {
              registration.update().catch(() => {
                // Silently fail update checks
              });
            },
            60 * 60 * 1000
          ); // Check every hour

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New version available - show update prompt
                  console.log('[SW] New version available');
                  window.dispatchEvent(new CustomEvent('sw-update-available'));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('[SW] Service worker registration failed:', error);
        });
    });
  }
}

// ── PWA Install Prompt ──────────────────────────────────────

/**
 * Capture the beforeinstallprompt event for PWA installation.
 */
function setupPWAInstall(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let deferredPrompt: any = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the default mini-infobar
    e.preventDefault();
    // Store the event for later use
    deferredPrompt = e;
    // Dispatch event so components can show install UI
    window.dispatchEvent(
      new CustomEvent('pwa-install-available', { detail: { prompt: e } })
    );
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('[PWA] App was installed');
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  });

  // Expose install trigger globally
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).triggerPWAInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt?.();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  };
}

// ── Runtime Error Handling ──────────────────────────────────

/**
 * Catch unhandled errors and promise rejections globally.
 */
function setupGlobalErrorHandling(): void {
  // Unhandled errors
  window.addEventListener('error', (event) => {
    console.error('[Global Error]', event.error);
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('[Unhandled Rejection]', event.reason);
  });
}

// ── Online/Offline Detection ────────────────────────────────

function setupConnectivityDetection(): void {
  window.addEventListener('online', () => {
    console.log('[Network] Connection restored');
    window.dispatchEvent(new CustomEvent('app-online'));
  });

  window.addEventListener('offline', () => {
    console.log('[Network] Connection lost');
    window.dispatchEvent(new CustomEvent('app-offline'));
  });
}

// ── Initialize ──────────────────────────────────────────────

// Only run in browser environment
if (typeof window !== 'undefined') {
  registerServiceWorker();
  setupPWAInstall();
  setupGlobalErrorHandling();
  setupConnectivityDetection();
}

// ── Hot Module Replacement ──────────────────────────────────

if (import.meta.hot) {
  import.meta.hot.accept();
}
