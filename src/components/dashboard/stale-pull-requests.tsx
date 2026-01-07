'use client';

import Link from 'next/link';
import { Clock, ExternalLink, GitPullRequest } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface StalePullRequest {
  id: number;
  title: string;
  age: string;
}

function parseAge(age: string): number {
  let totalHours = 0;

  const daysMatch = age.match(/(\d+)d/);
  if (daysMatch) {
    totalHours += Number.parseInt(daysMatch[1], 10) * 24;
  }

  const hoursMatch = age.match(/(\d+)h/);
  if (hoursMatch) {
    totalHours += Number.parseInt(hoursMatch[1], 10);
  }

  return totalHours;
}

function getUrgencyLevel(age: string): 'critical' | 'warning' | 'normal' {
  const hours = parseAge(age);
  if (hours >= 20) return 'critical';
  if (hours >= 12) return 'warning';
  return 'normal';
}

export function StalePullRequests({
  stalePRs,
  className,
}: {
  stalePRs: StalePullRequest[];
  className?: string;
}) {
  const sortedPRs = [...stalePRs].sort(
    (a, b) => parseAge(b.age) - parseAge(a.age)
  );

  const criticalCount = stalePRs.filter(
    (pr) => getUrgencyLevel(pr.age) === 'critical'
  ).length;

  return (
    <Card className={cn('flex flex-col p-4 gap-1', className)}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>Stale PRs</CardTitle>
            {criticalCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {criticalCount} critical
              </Badge>
            )}
          </div>
          <CardDescription>
            {stalePRs.length} PRs awaiting review
          </CardDescription>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          <GitPullRequest className="h-3 w-3" />
          {stalePRs.length}
        </Badge>
      </div>

      <ScrollArea className="h-[400px]">
        <ul className="space-y-2 pr-3">
          {sortedPRs.map((pr) => {
            const urgency = getUrgencyLevel(pr.age);
            return (
              <li
                key={pr.id}
                className={cn(
                  'group relative rounded-lg border p-3 transition-all hover:bg-accent/50 min-h-20',
                  urgency === 'critical' &&
                    'border-destructive/30 bg-destructive/5',
                  urgency === 'warning' && 'border-amber-500/30 bg-amber-500/5',
                  urgency === 'normal' && 'border-border'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-mono text-xs font-semibold',
                          urgency === 'critical' && 'text-destructive',
                          urgency === 'warning' && 'text-amber-500',
                          urgency === 'normal' && 'text-primary'
                        )}
                      >
                        #{pr.id}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <p className="mt-1 truncate w-full text-wrap text-sm text-foreground ">
                      {pr.title}
                    </p>
                  </div>
                  <div
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium',
                      urgency === 'critical' &&
                        'bg-destructive/10 text-destructive',
                      urgency === 'warning' && 'bg-amber-500/10 text-amber-500',
                      urgency === 'normal' && 'bg-muted text-muted-foreground'
                    )}
                  >
                    <Clock className="h-3 w-3" />
                    {pr.age}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </ScrollArea>

      <div className="mt-4 border-t pt-4">
        <Link href="/pull-requests">
          <Button variant="outline" size="sm" className="w-full cursor-pointer">
            <GitPullRequest className="mr-2 h-4 w-4" />
            View All Stale PRs
          </Button>
        </Link>
      </div>
    </Card>
  );
}
