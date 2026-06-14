import { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TabsBarProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function TabsBar({ tabs, activeTab, onTabChange, className }: TabsBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector(`[data-tab="${activeTab}"]`);
      if (activeEl) {
        const rect = activeEl.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setIndicatorStyle({
          left: rect.left - containerRect.left + containerRef.current.scrollLeft,
          width: rect.width,
        });
      }
    }
  }, [activeTab, tabs]);

  return (
    <div
      className={cn('relative w-full overflow-x-auto', className)}
      style={{
        height: 44,
        minHeight: 44,
        borderBottom: '1px solid #e1e1e1',
      }}
      ref={containerRef}
    >
      <div className="flex h-full items-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex-shrink-0 cursor-pointer select-none px-4 transition-colors duration-150',
              activeTab === tab.id
                ? 'font-medium'
                : 'font-medium hover:text-[#242424]'
            )}
            style={{
              fontSize: 13,
              color: activeTab === tab.id ? '#242424' : '#616161',
              background: 'none',
              border: 'none',
              height: '100%',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Animated indicator */}
      <div
        className="absolute bottom-0 h-[2px] transition-all duration-200"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          backgroundColor: '#D97757',
        }}
      />
    </div>
  );
}
