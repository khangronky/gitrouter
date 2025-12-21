'use client';

import { useState } from 'react';
import { IconAlertTriangle, IconBell, IconClock, IconRotate } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const timelineSteps = [
  {
    time: '0h',
    label: 'PR Created',
    icon: IconClock,
    color: 'bg-green-500',
    glowColor: 'shadow-green-500/50',
  },
  {
    time: '24h',
    label: 'Reminder Sent',
    icon: IconBell,
    color: 'bg-yellow-500',
    glowColor: 'shadow-yellow-500/50',
  },
  {
    time: '48h',
    label: 'Escalated',
    icon: IconAlertTriangle,
    color: 'bg-landing-accent',
    glowColor: 'shadow-landing-accent/50',
  },
];

export function EscalationCell() {
  const [activeStep, setActiveStep] = useState(1); // 0, 1, or 2
  const [isAnimating, setIsAnimating] = useState(false);

  const progressPercent = (activeStep / (timelineSteps.length - 1)) * 100;

  const cycleStep = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % timelineSteps.length);
      setIsAnimating(false);
    }, 300);
  };

  const reset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveStep(0);
  };

  return (
    <div 
      className="flex h-full flex-col justify-center cursor-pointer"
      onClick={cycleStep}
    >
      {/* Timeline */}
      <div className="relative">
        {/* Progress bar background */}
        <div className="absolute left-6 top-3 h-0.5 w-[calc(100%-48px)] bg-white/10 rounded-full overflow-hidden">
          {/* Animated progress */}
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              activeStep === 0 && "bg-green-500",
              activeStep === 1 && "bg-gradient-to-r from-green-500 via-yellow-500 to-yellow-500",
              activeStep === 2 && "bg-gradient-to-r from-green-500 via-yellow-500 to-landing-accent"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {timelineSteps.map((step, i) => {
            const isActive = i <= activeStep;
            const isCurrent = i === activeStep;
            
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full transition-all duration-300",
                    isActive
                      ? cn(step.color, isCurrent && `shadow-lg ${step.glowColor}`)
                      : "border border-white/20 bg-landing-card",
                    isCurrent && "scale-125"
                  )}
                >
                  <step.icon
                    className={cn(
                      "h-3 w-3 transition-all duration-300",
                      isActive ? "text-white" : "text-white/40"
                    )}
                  />
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      "text-xs font-medium transition-all duration-300",
                      isActive ? "text-white" : "text-white/40",
                      isCurrent && "scale-110"
                    )}
                  >
                    {step.time}
                  </div>
                  <div className={cn(
                    "text-[10px] transition-colors duration-300",
                    isCurrent ? "text-white/60" : "text-white/30"
                  )}>
                    {step.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-4">
        <p className="text-[10px] text-white/30">Click to advance timeline</p>
        {activeStep > 0 && (
          <button 
            onClick={reset}
            className="text-[10px] text-white/30 hover:text-white/50 flex items-center gap-1"
          >
            <IconRotate className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
