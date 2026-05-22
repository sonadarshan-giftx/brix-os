import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

/**
 * ErrorBoundary — Catches JavaScript errors anywhere in child component tree
 *
 * Features:
 * - Displays a polished error UI with reset button
 * - Logs errors to console for debugging
 * - Generates a unique error ID for tracking
 * - Provides options to retry, go home, or copy error details
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Generate unique error ID for tracking
    const errorId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.setState({ errorInfo, errorId });

    // Log error details for debugging
    console.error('╔══════════════════════════════════════════════╗');
    console.error('║  ErrorBoundary caught an error               ║');
    console.error('╠══════════════════════════════════════════════╣');
    console.error(`Error ID: ${errorId}`);
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Timestamp:', new Date().toISOString());
    console.error('╚══════════════════════════════════════════════╝');

    // In production, you could send this to an error tracking service:
    // Sentry.captureException(error, { extra: { errorId, componentStack: errorInfo.componentStack } });
  }

  handleReset = () => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleGoHome = () => {
    window.location.href = '/#';
    this.handleReset();
  };

  handleCopyError = () => {
    const text = `Error ID: ${this.state.errorId}\nMessage: ${this.state.error?.message}\nStack: ${this.state.error?.stack}`;
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-screen items-center justify-center p-4"
          style={{ backgroundColor: 'var(--op-bg-primary, #ffffff)' }}
        >
          <div
            className="w-full max-w-[440px] rounded-xl border p-6 text-center shadow-lg"
            style={{
              borderColor: '#fecaca',
              backgroundColor: '#fef2f2',
            }}
            role="alert"
            aria-live="assertive"
          >
            {/* Error icon */}
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: '#fee2e2' }}
            >
              <AlertTriangle size={28} style={{ color: '#c4314b' }} />
            </div>

            {/* Title */}
            <h2
              className="mb-1 font-semibold"
              style={{ fontSize: 16, color: '#242424' }}
            >
              Something went wrong
            </h2>

            {/* Error message */}
            <p
              className="mb-3"
              style={{ fontSize: 13, color: '#616161' }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {/* Error ID for support */}
            {this.state.errorId && (
              <button
                onClick={this.handleCopyError}
                className="mb-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-mono"
                style={{ backgroundColor: '#fee2e2', color: '#c4314b', border: 'none', cursor: 'pointer' }}
                title="Click to copy error details"
              >
                <Bug size={10} />
                Error ID: {this.state.errorId}
              </button>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReset}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 font-medium"
                style={{
                  fontSize: 13,
                  backgroundColor: 'var(--op-accent, #5b5fc7)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                <RefreshCw size={14} />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 font-medium"
                style={{
                  fontSize: 13,
                  backgroundColor: '#fff',
                  color: '#242424',
                  border: '1px solid #e1e1e1',
                }}
              >
                <Home size={14} />
                Go to Home
              </button>
            </div>

            {/* Collapsible technical details */}
            {this.state.error?.stack && (
              <details className="mt-4 text-left">
                <summary
                  className="cursor-pointer text-[11px] font-medium"
                  style={{ color: '#767676' }}
                >
                  Technical Details
                </summary>
                <pre
                  className="mt-2 overflow-auto rounded-lg p-3 text-[10px]"
                  style={{
                    maxHeight: 200,
                    backgroundColor: '#fff',
                    color: '#616161',
                    border: '1px solid #fecaca',
                  }}
                >
                  {this.state.error.stack}
                  {'\n\n--- Component Stack ---\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
