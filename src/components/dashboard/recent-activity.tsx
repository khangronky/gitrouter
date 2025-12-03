'use client';

import { Card } from '@/components/ui/card';
import { SectionTitle } from './section-title';

interface Activity {
  time: string;
  id: number;
  author: string;
  snippet: string;
  assigned: string[];
}

export function RecentActivity({
  recentActivity,
}: {
  recentActivity: Activity[];
}) {
  return (
    <Card className="p-4">
      <SectionTitle>Recent Activity</SectionTitle>
      <ul className="space-y-3.5 text-xs">
        {recentActivity.map((a, i) => (
          <li key={i} className="flex gap-2.5">
            <div className="w-16 shrink-0 font-medium text-[11px] text-muted-foreground">
              {a.time}
            </div>
            <div className="flex-1">
              <div className="flex items-start gap-2">
                <span
                  className="mt-0.5 text-base"
                  role="img"
                  aria-label="notification"
                >
                  🔔
                </span>
                <div className="flex-1">
                  <div className="font-semibold text-foreground leading-snug">
                    PR #{a.id} created by {a.author}
                  </div>
                  <div className="mt-0.5 text-muted-foreground leading-snug">
                    "{a.snippet}"
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    → Assigned to: {a.assigned.join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
