'use client';

import { Card } from '@/components/ui/card';
import { SectionTitle } from './section-title';

interface ReviewerWorkload {
  name: string;
  assigned: number;
  capacity: number;
}

export function WorkloadChart({
  reviewerWorkload,
}: {
  reviewerWorkload: ReviewerWorkload[];
}) {
  const workloadData = reviewerWorkload.map((r) => {
    const percentage = Math.round((r.assigned / r.capacity) * 100);
    const prCount = r.assigned;
    return {
      name: r.name,
      percentage,
      prCount,
      label: `${percentage}% (${prCount} PRs)`,
    };
  });

  return (
    <Card className="p-4">
      <SectionTitle>Reviewer Workload Distribution</SectionTitle>

      <div className="mt-4 space-y-3">
        {workloadData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-14 font-medium text-foreground text-xs">
              {item.name}
            </div>
            <div className="flex flex-1 items-center gap-2">
              <div className="flex h-5 flex-1 overflow-hidden bg-muted">
                <div
                  className="h-full bg-primary-700"
                  style={{ width: `${item.percentage}%` }}
                />
                <div className="h-full flex-1 bg-primary-200 dark:bg-primary-700/30" />
              </div>
              <div className="w-24 text-right text-[11px] text-muted-foreground">
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 bg-primary-700" />
          <span>Assigned</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 bg-primary-200 dark:bg-primary-700/30" />
          <span>Available capacity</span>
        </div>
      </div>
    </Card>
  );
}
