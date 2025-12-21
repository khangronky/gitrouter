'use client';

import { useState, useRef, useEffect } from 'react';
import { IconGitPullRequest, IconUser, IconCheck, IconChevronRight } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export function RoutingCell() {
  const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0); // 0=idle, 1=left line, 2=right line, 3=complete
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  };

  const handleMouseEnter = () => {
    clearAllTimeouts();
    // Phase 1: Start left line
    setPhase(1);
    
    // Phase 2: Start right line after left completes
    timeoutRefs.current.push(
      setTimeout(() => setPhase(2), 500)
    );
    
    // Phase 3: Complete - show checkmarks
    timeoutRefs.current.push(
      setTimeout(() => setPhase(3), 1000)
    );
  };

  const handleMouseLeave = () => {
    clearAllTimeouts();
    setPhase(0);
  };

  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);

  const leftLineActive = phase >= 1;
  const rightLineActive = phase >= 2;
  const isComplete = phase >= 3;

  return (
    <div 
      className="flex h-full items-center justify-center py-4 cursor-pointer select-none"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex w-full items-center gap-2">
        {/* PR Icon */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl bg-landing-accent/20 ring-1 ring-landing-accent/50",
            "transition-transform duration-200",
            leftLineActive && "scale-105"
          )}>
            <IconGitPullRequest className="h-6 w-6 text-landing-accent-light" />
          </div>
          <span className="text-[10px] text-white/40">PR</span>
        </div>

        {/* Connector 1 - Left line */}
        <div className="flex-1 flex items-center min-w-[40px]">
          <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-landing-accent rounded-full transition-all duration-400 ease-out",
                leftLineActive ? "w-full" : "w-0"
              )} 
            />
          </div>
          <IconChevronRight 
            className={cn(
              "h-4 w-4 -ml-1 transition-all duration-300",
              leftLineActive ? "text-landing-accent opacity-100" : "text-white/20 opacity-50"
            )} 
          />
        </div>

        {/* Rules Engine */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className={cn(
            "rounded-lg border bg-landing-card-hover px-3 py-2 transition-all duration-200",
            leftLineActive ? "border-landing-accent/50 shadow-md shadow-landing-accent/10" : "border-white/10"
          )}>
            <div className="text-[10px] font-semibold text-white/80 mb-1 text-center">Rules</div>
            <div className="flex gap-1">
              <span className={cn(
                "rounded px-1 py-0.5 text-[8px] transition-colors",
                leftLineActive ? "bg-blue-500/40 text-blue-300" : "bg-blue-500/20 text-blue-400"
              )}>files</span>
              <span className={cn(
                "rounded px-1 py-0.5 text-[8px] transition-colors",
                leftLineActive ? "bg-green-500/40 text-green-300" : "bg-green-500/20 text-green-400"
              )}>branch</span>
            </div>
          </div>
        </div>

        {/* Connector 2 - Right line (green) */}
        <div className="flex-1 flex items-center min-w-[40px]">
          <div className="flex-1 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full bg-green-500 rounded-full transition-all duration-400 ease-out",
                rightLineActive ? "w-full" : "w-0"
              )}
            />
          </div>
          <IconChevronRight 
            className={cn(
              "h-4 w-4 -ml-1 transition-all duration-300",
              rightLineActive ? "text-green-500 opacity-100" : "text-white/20 opacity-50"
            )}
          />
        </div>

        {/* Reviewers */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <div className="flex -space-x-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 border-landing-bg",
                  "transition-all duration-200",
                  isComplete 
                    ? "bg-green-500/20 ring-1 ring-green-500/50" 
                    : "bg-landing-card-hover ring-1 ring-white/10"
                )}
                style={{ 
                  transform: isComplete ? `translateY(-${3 - i}px)` : 'translateY(0)',
                  transitionDelay: isComplete ? `${i * 75}ms` : '0ms'
                }}
              >
                {isComplete ? (
                  <IconCheck className="h-4 w-4 text-green-400" />
                ) : (
                  <IconUser className="h-4 w-4 text-white/50" />
                )}
              </div>
            ))}
          </div>
          <span className={cn(
            "text-[10px] transition-colors duration-200",
            isComplete ? "text-green-400" : "text-white/40"
          )}>
            {isComplete ? "Assigned!" : "Reviewers"}
          </span>
        </div>
      </div>
    </div>
  );
}
