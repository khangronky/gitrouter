'use client';

import { cn } from '@/lib/utils';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  className,
}: OnboardingProgressProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-2 w-2 rounded-full transition-all duration-300',
            index < currentStep
              ? 'bg-primary'
              : index === currentStep
                ? 'bg-primary w-6'
                : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}
