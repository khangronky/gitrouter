import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CellSize = 'sm' | 'md' | 'lg' | 'xl';

interface BentoCellProps {
  size?: CellSize;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

const sizeClasses: Record<CellSize, string> = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-1 row-span-1 md:col-span-2 lg:col-span-1',
  lg: 'col-span-1 row-span-1 md:col-span-2',
  xl: 'col-span-1 row-span-2 md:col-span-2',
};

export function BentoCell({
  size = 'md',
  title,
  description,
  children,
  className,
  delay = 0,
}: BentoCellProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-landing-border bg-landing-card p-6 transition-all duration-300 hover:border-landing-accent/30 hover:bg-landing-card-hover',
        'opacity-0 animate-slide-in-up',
        sizeClasses[size],
        className
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Gradient glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-landing-glow via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-landing-text">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-landing-text-muted">
              {description}
            </p>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
