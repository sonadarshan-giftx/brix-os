import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  id?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className = '',
  id,
}) => {
  const switchId = id || `toggle-${Math.random().toString(36).slice(2)}`;

  const sizeMap = {
    sm: { width: 36, height: 20, knob: 14 },
    md: { width: 44, height: 24, knob: 18 },
    lg: { width: 52, height: 28, knob: 22 },
  };

  const s = sizeMap[size];

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && <label htmlFor={switchId} className="block text-sm font-medium text-[var(--text-primary)] cursor-pointer">{label}</label>}
          {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`
          relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out
          focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2
          ${checked ? 'bg-[var(--brand-primary)]' : 'bg-[var(--surface-border)]'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ width: s.width, height: s.height }}
      >
        <span
          className={`
            inline-block rounded-full bg-white shadow transition-transform duration-200 ease-in-out
            ${checked ? 'translate-x-full' : 'translate-x-0'}
          `}
          style={{
            width: s.knob,
            height: s.knob,
            margin: (s.height - s.knob) / 2,
            transform: checked ? `translateX(${s.width - s.knob - (s.height - s.knob)}px)` : 'translateX(0)',
          }}
        />
      </button>
    </div>
  );
};

export default ToggleSwitch;
