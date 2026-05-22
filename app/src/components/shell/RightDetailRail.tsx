import { useStore } from '@/store/useStore';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

interface RightDetailRailProps {
  children?: ReactNode;
  title?: string;
}

export function RightDetailRail({ children, title }: RightDetailRailProps) {
  const rightRailOpen = useStore((s) => s.rightRailOpen);
  const closeRightRail = useStore((s) => s.closeRightRail);

  if (!rightRailOpen) return null;

  return (
    <div
      className="flex flex-shrink-0 flex-col overflow-hidden border-l"
      style={{
        width: 280,
        height: 'calc(100vh - 44px)',
        backgroundColor: '#ffffff',
        borderColor: '#e1e1e1',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{
          height: 44,
          padding: '0 12px',
          borderBottom: '1px solid #e1e1e1',
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: '#242424' }}>
          {title || 'Details'}
        </span>
        <button
          onClick={closeRightRail}
          className="flex cursor-pointer items-center justify-center rounded"
          style={{ width: 28, height: 28, border: 'none', background: 'transparent' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={16} color="#616161" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 12 }}>
        {children || (
          <div style={{ fontSize: 13, color: '#616161', padding: 16 }}>
            Select an item to view details.
          </div>
        )}
      </div>
    </div>
  );
}
