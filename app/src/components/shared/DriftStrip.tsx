interface DriftStripProps {
  planPercent: number;
  actualPercent: number;
  driftText?: string;
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export function DriftStrip({
  planPercent,
  actualPercent,
  driftText,
  size = 'md',
  showLabels = false,
}: DriftStripProps) {
  const actualColor =    
    actualPercent >= planPercent * 0.95
      ? actualPercent >= planPercent
        ? '#92c353'
        : '#ffaa44'
      : '#c4314b';

  const h = size === 'sm' ? 6 : 10;

  return (
    <div className="w-full">
      {showLabels && (
        <div className="mb-1 flex justify-between" style={{ fontSize: 11, color: '#616161' }}>
          <span>Plan</span>
          <span>Actual</span>
        </div>
      )}
      {/* Plan strip */}
      <div
        className="mb-[2px] w-full overflow-hidden rounded-sm"
        style={{ height: h, backgroundColor: '#dbeafe' }}
      >
        <div
          className="h-full rounded-sm"
          style={{ width: `${planPercent}%`, backgroundColor: '#dbeafe' }}
        />
      </div>
      {/* Actual strip */}
      <div
        className="w-full overflow-hidden rounded-sm"
        style={{ height: h, backgroundColor: '#f0f0f0' }}
      >
        <div
          className="h-full rounded-sm transition-all duration-500"
          style={{ width: `${Math.min(actualPercent, 100)}%`, backgroundColor: actualColor }}
        />
      </div>
      {driftText && (
        <p
          className="mt-1 italic"
          style={{ fontSize: 11, color: '#616161', lineHeight: '16px' }}
        >
          {driftText}
        </p>
      )}
    </div>
  );
}
