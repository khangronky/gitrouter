'use client';

import { useState, useEffect, useRef } from 'react';
import { IconTrendingUp, IconTrendingDown, IconRefresh } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const INITIAL_DATA = [
  { day: 'Mon', value: 50 },
  { day: 'Tue', value: 45 },
  { day: 'Wed', value: 55 },
  { day: 'Thu', value: 40 },
  { day: 'Fri', value: 60 },
  { day: 'Sat', value: 25 },
  { day: 'Sun', value: 20 },
];

const INITIAL_STATS = {
  reviewTime: 2.5,
  sla: 92,
  prs: 147,
  trend: 'up' as const,
  trendValue: 11,
};

const generateData = () => [
  { day: 'Mon', value: Math.floor(Math.random() * 40) + 30 },
  { day: 'Tue', value: Math.floor(Math.random() * 40) + 25 },
  { day: 'Wed', value: Math.floor(Math.random() * 40) + 35 },
  { day: 'Thu', value: Math.floor(Math.random() * 40) + 20 },
  { day: 'Fri', value: Math.floor(Math.random() * 40) + 40 },
  { day: 'Sat', value: Math.floor(Math.random() * 25) + 15 },
  { day: 'Sun', value: Math.floor(Math.random() * 25) + 10 },
];

const generateStats = () => ({
  reviewTime: +(Math.random() * 2.5 + 1.5).toFixed(1),
  sla: Math.floor(Math.random() * 12 + 85),
  prs: Math.floor(Math.random() * 80 + 100),
  trend: (Math.random() > 0.5 ? 'up' : 'down') as 'up' | 'down',
  trendValue: Math.floor(Math.random() * 15 + 5),
});

function AnimatedNumber({ value, suffix = '', duration = 500 }: { value: number; suffix?: string; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const current = startValueRef.current + (value - startValueRef.current) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  const formatted = suffix === '%' || suffix === 'h' 
    ? displayValue.toFixed(suffix === 'h' ? 1 : 0) 
    : Math.floor(displayValue);

  return <>{formatted}{suffix}</>;
}

export function AnalyticsCell() {
  const [data, setData] = useState(INITIAL_DATA);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const maxValue = Math.max(...data.map((d) => d.value));

  useEffect(() => {
    // Trigger bar animation on mount
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setIsLoaded(false);

    setTimeout(() => {
      setData(generateData());
      setStats(generateStats());
      setIsLoaded(true);
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px]",
            stats.trend === 'up' 
              ? "bg-green-500/20 text-green-400" 
              : "bg-red-500/20 text-red-400"
          )}>
            {stats.trend === 'up' ? (
              <IconTrendingUp className="h-3 w-3" />
            ) : (
              <IconTrendingDown className="h-3 w-3" />
            )}
            {stats.trendValue}% vs last week
          </div>
        </div>
        <button
          onClick={refresh}
          className="rounded-full p-1.5 text-white/30 transition-all hover:bg-white/10 hover:text-white/60"
        >
          <IconRefresh className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
        </button>
      </div>

      {/* Stats Row */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-white/5 p-2.5 transition-all hover:bg-white/10">
          <div className="text-xl font-bold text-white tabular-nums">
            <AnimatedNumber value={stats.reviewTime} suffix="h" />
          </div>
          <div className="text-[10px] text-white/40">Review Time</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5 transition-all hover:bg-white/10">
          <div className="text-xl font-bold text-green-400 tabular-nums">
            <AnimatedNumber value={stats.sla} suffix="%" />
          </div>
          <div className="text-[10px] text-white/40">SLA Compliance</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2.5 transition-all hover:bg-white/10">
          <div className="text-xl font-bold text-white tabular-nums">
            <AnimatedNumber value={stats.prs} />
          </div>
          <div className="text-[10px] text-white/40">PRs This Week</div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex flex-1 items-end gap-1.5 rounded-lg bg-white/[0.02] p-2">
        {data.map((item, i) => {
          const heightPercent = (item.value / maxValue) * 100;
          const isHovered = hoveredBar === i;

          return (
            <div
              key={i}
              className="group flex flex-1 flex-col items-center gap-1"
              onMouseEnter={() => setHoveredBar(i)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div className="relative flex h-full w-full items-end justify-center">
                {/* Tooltip */}
                <div
                  className={cn(
                    "absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-black shadow-lg transition-all duration-200",
                    isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 pointer-events-none"
                  )}
                >
                  {item.value}h
                </div>

                {/* Bar */}
                <div
                  className={cn(
                    "w-full rounded-sm transition-all cursor-pointer",
                    isHovered
                      ? "bg-gradient-to-t from-white to-white/80 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                      : "bg-gradient-to-t from-landing-accent to-landing-accent-light"
                  )}
                  style={{
                    height: isLoaded ? `${heightPercent}%` : '0%',
                    minHeight: isLoaded ? '4px' : '0px',
                    transitionDuration: `${300 + i * 50}ms`,
                    transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>
              <span
                className={cn(
                  "text-[9px] transition-colors duration-200",
                  isHovered ? "text-white" : "text-white/30"
                )}
              >
                {item.day}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live indicator */}
      <div className="mt-2 flex items-center justify-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
        </span>
        <span className="text-[9px] text-white/30">Live data</span>
      </div>
    </div>
  );
}
