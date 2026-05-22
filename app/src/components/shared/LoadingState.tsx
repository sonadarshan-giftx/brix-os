import { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

type LoadingVariant = 'skeleton' | 'spinner' | 'progress' | 'dots';

interface LoadingStateProps {
  count?: number;
  className?: string;
  variant?: LoadingVariant;
  label?: string;
  fullScreen?: boolean;
}

// ═══════════════════════════════════════════════════════════
// LoadingState — Multi-variant loading indicator
//
// Variants:
// - skeleton: Pulsing placeholder rows (default)
// - spinner: Rotating spinner
// - progress: Progress bar
// - dots: Bouncing dots
// ═══════════════════════════════════════════════════════════

export function LoadingState({
  count = 4,
  className,
  variant = 'skeleton',
  label = 'Loading...',
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className={className}>
      {variant === 'skeleton' && <SkeletonLoader count={count} />}
      {variant === 'spinner' && <SpinnerLoader label={label} />}
      {variant === 'progress' && <ProgressLoader label={label} />}
      {variant === 'dots' && <DotsLoader label={label} />}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-live="polite"
        aria-label={label}
      >
        {content}
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-label={label}>
      {content}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Skeleton Loader — Pulsing placeholder rows
// ═══════════════════════════════════════════════════════════

function SkeletonLoader({ count }: { count: number }) {
  return (
    <div style={{ padding: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="mb-3 flex items-center gap-3"
        >
          <div
            className="rounded-full skeleton-pulse"
            style={{
              width: 32,
              height: 32,
              backgroundColor: 'var(--op-skeleton-bg, #f0f0f0)',
              animationDelay: `${i * 100}ms`,
            }}
          />
          <div className="flex-1">
            <div
              className="mb-2 rounded skeleton-pulse"
              style={{
                width: '60%',
                height: 12,
                backgroundColor: 'var(--op-skeleton-bg, #f0f0f0)',
                animationDelay: `${i * 100}ms`,
              }}
            />
            <div
              className="rounded skeleton-pulse"
              style={{
                width: '40%',
                height: 10,
                backgroundColor: 'var(--op-skeleton-bg, #f0f0f0)',
                animationDelay: `${i * 100 + 50}ms`,
              }}
            />
          </div>
        </div>
      ))}
      <style>{`
        .skeleton-pulse {
          animation: skeletonPulse 1.5s ease-in-out infinite;
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Spinner Loader — Rotating circle
// ═══════════════════════════════════════════════════════════

function SpinnerLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div
        className="spinner-rotate rounded-full"
        style={{
          width: 36,
          height: 36,
          border: '3px solid #e1e1e1',
          borderTopColor: 'var(--op-accent, #5b5fc7)',
          borderRadius: '50%',
        }}
      />
      {label && (
        <span className="text-xs font-medium" style={{ color: '#767676' }}>
          {label}
        </span>
      )}
      <style>{`
        .spinner-rotate {
          animation: spinnerRotate 0.8s linear infinite;
        }
        @keyframes spinnerRotate {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Progress Loader — Animated progress bar
// ═══════════════════════════════════════════════════════════

function ProgressLoader({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 0;
        return prev + Math.random() * 15;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-8" style={{ minWidth: 200 }}>
      <div
        className="w-full overflow-hidden rounded-full"
        style={{ height: 6, backgroundColor: '#e1e1e1', maxWidth: 240 }}
      >
        <div
          className="progress-bar h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(progress, 100)}%`,
            backgroundColor: 'var(--op-accent, #5b5fc7)',
          }}
        />
      </div>
      {label && (
        <span className="text-xs font-medium" style={{ color: '#767676' }}>
          {label}
        </span>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// Dots Loader — Bouncing dots
// ═══════════════════════════════════════════════════════════

function DotsLoader({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="loading-dot rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: 'var(--op-accent, #5b5fc7)',
              animationDelay: `${i * 150}ms`,
            }}
          />
        ))}
      </div>
      {label && (
        <span className="text-xs font-medium" style={{ color: '#767676' }}>
          {label}
        </span>
      )}
      <style>{`
        .loading-dot {
          animation: loadingBounce 1s ease-in-out infinite;
        }
        @keyframes loadingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PageLoader — Full page loading overlay
// ═══════════════════════════════════════════════════════════

export function PageLoader({ label = 'Loading page...' }: { label?: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <SpinnerLoader label={label} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// InlineLoader — Small inline spinner for buttons/forms
// ═══════════════════════════════════════════════════════════

export function InlineLoader({ size = 14 }: { size?: number }) {
  return (
    <span
      className="inline-loader inline-block rounded-full"
      style={{
        width: size,
        height: size,
        border: '2px solid transparent',
        borderTopColor: 'currentColor',
        borderRadius: '50%',
        verticalAlign: 'middle',
      }}
    >
      <style>{`
        .inline-loader {
          animation: spinnerRotate 0.7s linear infinite;
        }
      `}</style>
    </span>
  );
}
