import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
};

export function Card({
  children,
  className,
  onClick,
  hoverable = false,
  padding = 'lg',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[6px] border bg-white',
        hoverable && 'cursor-pointer',
        className
      )}
      style={{
        borderColor: '#d1d1d1',
        padding: paddingMap[padding],
        transition: 'border-color 100ms ease',
        ...(hoverable ? { ':hover': { borderColor: '#b1b1b1' } } : {}),
      }}
      onMouseEnter={(e) => {
        if (hoverable) e.currentTarget.style.borderColor = '#b1b1b1';
      }}
      onMouseLeave={(e) => {
        if (hoverable) e.currentTarget.style.borderColor = '#d1d1d1';
      }}
    >
      {children}
    </div>
  );
}
