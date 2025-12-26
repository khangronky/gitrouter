import { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
}

export function BentoGrid({ children }: BentoGridProps) {
  return (
    <section id="features" className="py-20 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-landing-text mb-4">
            Features
          </h2>
          <p className="text-lg text-landing-text-muted max-w-2xl mx-auto">
            Everything you need to streamline code reviews
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {children}
        </div>
      </div>
    </section>
  );
}
