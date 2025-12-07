'use client';

import { Activity, GitPullRequest, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ActivityItem {
  time: string;
  id: number;
  author: string;
  snippet: string;
  assigned: string[];
}

function getInitials(name: string): string {
  return name.replace('@', '').slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500',
  ];
  const index =
    name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

export function RecentActivity({
  recentActivity,
  className,
}: {
  recentActivity: ActivityItem[];
  className?: string;
}) {
  return (
    <Card className={cn('flex flex-col p-4 gap-1', className)}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <CardTitle>Recent Activity</CardTitle>
          </div>
          <CardDescription>Latest PR assignments and updates</CardDescription>
        </div>
        <Badge variant="outline" className="text-muted-foreground">
          <Activity className="h-3 w-3" />
          {recentActivity.length}
        </Badge>
      </div>

      <ScrollArea className="h-[425px]">
        <div className="relative pr-3">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />

          <ul className="space-y-4">
            {recentActivity.map((a, i) => (
              <li key={`${a.id}-${i}`} className="relative flex gap-3">
                {/* Avatar with timeline dot */}
                <div className="relative z-10">
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarFallback
                      className={cn(
                        'text-[10px] font-semibold text-white',
                        getAvatarColor(a.author)
                      )}
                    >
                      {getInitials(a.author)}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 rounded-lg border bg-card p-3 transition-colors hover:bg-accent/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-semibold text-foreground text-sm">
                          {a.author}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          created
                        </span>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px]"
                        >
                          <GitPullRequest className="mr-1 h-3 w-3" />#{a.id}
                        </Badge>
                      </div>
                      <p className="mt-1.5 truncate text-sm w-[250px] text-muted-foreground">
                        "{a.snippet}"
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                      {a.time}
                    </span>
                  </div>

                  {/* Assignees */}
                  <div className="mt-2 flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {a.assigned.map((assignee) => (
                        <span
                          key={assignee}
                          className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {assignee}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </ScrollArea>
    </Card>
  );
}
