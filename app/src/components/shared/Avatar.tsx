import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isAi?: boolean;
  status?: 'online' | 'busy' | 'away' | 'offline';
  className?: string;
  initials?: string;
}

const sizeMap = {
  xs: 24,
  sm: 28,
  md: 32,
  lg: 40,
  xl: 64,
};

const statusColorMap = {
  online: '#92c353',
  busy: '#c4314b',
  away: '#ffaa44',
  offline: '#8a8a8a',
};

export function Avatar({
  src,
  alt = '',
  size = 'md',
  isAi = false,
  status,
  className,
  initials,
}: AvatarProps) {
  const s = sizeMap[size];

  return (
    <div
      className={cn('relative inline-block flex-shrink-0', className)}
      style={{ width: s, height: s }}
    >
      <div
        className="overflow-hidden rounded-full"
        style={{
          width: s,
          height: s,
          backgroundColor: !src ? '#e8eaf6' : undefined,
        }}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
            draggable={false}
            style={isAi ? { filter: 'saturate(1.1)' } : undefined}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-[11px] font-semibold"
            style={{ color: '#5b5fc7', fontSize: Math.max(10, s * 0.35) }}
          >
            {initials || alt.charAt(0).toUpperCase()}
          </div>
        )}
        {isAi && (
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{ backgroundColor: 'rgba(232, 234, 246, 0.15)' }}
          />
        )}
      </div>

      {/* AI Badge */}
      {isAi && size !== 'xs' && (
        <div
          className="absolute flex items-center justify-center rounded-[3px] font-bold text-white"
          style={{
            bottom: -2,
            right: -2,
            width: 14,
            height: 10,
            fontSize: 7,
            backgroundColor: '#5b5fc7',
            fontFamily: 'var(--font-sans)',
          }}
        >
          AI
        </div>
      )}

      {/* Presence Dot */}
      {status && size !== 'xs' && (
        <div
          className="absolute rounded-full border-2 border-white"
          style={{
            bottom: 0,
            right: 0,
            width: 11,
            height: 11,
            backgroundColor: statusColorMap[status],
          }}
        />
      )}
    </div>
  );
}
