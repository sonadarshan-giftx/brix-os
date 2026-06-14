import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: string;
  className?: string;
  height?: number;
  animated?: boolean;
  label?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'var(--brand-primary, #D97757)',
  className = '',
  height = 8,
  animated = true,
  label,
  showPercentage = false,
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={clampedProgress} aria-valuemin={0} aria-valuemax={100} aria-label={label || `Progress: ${clampedProgress}%`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-[var(--text-secondary)]">{label}</span>}
          {showPercentage && (
            <span className="text-xs font-medium" style={{ color }}>
              {clampedProgress}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: `${height}px`, backgroundColor: 'var(--surface-hover, #f0f0f0)' }}
      >
        <div
          className={`h-full rounded-full ${animated ? 'transition-all duration-700 ease-out' : ''}`}
          style={{
            width: `${clampedProgress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
