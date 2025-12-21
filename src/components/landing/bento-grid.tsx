import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
     
        {/* Bento Grid */}
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      </div>
    </section>
  );
}

