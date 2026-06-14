import { cn } from '@/lib/utils';

interface StatusChipProps {
  status: 'online' | 'busy' | 'away' | 'offline' | 'ai-active' | 'ai-idle' | ProjectHealth;
  label?: string;
  className?: string;
}

type ProjectHealth = 'green' | 'amber' | 'red';

const statusConfig: Record<string, { bg: string; color: string; defaultLabel: string }> = {
  online: { bg: 'rgba(146, 195, 83, 0.15)', color: '#237b4b', defaultLabel: 'Online' },
  busy: { bg: 'rgba(196, 49, 75, 0.15)', color: '#c4314b', defaultLabel: 'Busy' },
  away: { bg: 'rgba(255, 170, 68, 0.15)', color: '#b56200', defaultLabel: 'Away' },
  offline: { bg: 'rgba(138, 138, 138, 0.15)', color: '#616161', defaultLabel: 'Offline' },
  'ai-active': { bg: 'rgba(217,119,87,0.15)', color: '#D97757', defaultLabel: 'AI Active' },
  'ai-idle': { bg: 'rgba(217,119,87,0.08)', color: '#767676', defaultLabel: 'AI Idle' },
  green: { bg: 'rgba(35, 123, 75, 0.15)', color: '#237b4b', defaultLabel: 'On Track' },
  amber: { bg: 'rgba(255, 170, 68, 0.15)', color: '#b56200', defaultLabel: 'At Risk' },
  red: { bg: 'rgba(196, 49, 75, 0.15)', color: '#c4314b', defaultLabel: 'Critical' },
};

export function StatusChip({ status, label, className }: StatusChipProps) {
  const config = statusConfig[status] || statusConfig.offline;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 font-semibold',
        className
      )}
      style={{
        minHeight: 28,
        padding: '4px 10px',
        fontSize: 11,
        lineHeight: '16px',
        backgroundColor: config.bg,
        color: config.color,
      }}
    >
      {label || config.defaultLabel}
    </span>
  );
}
