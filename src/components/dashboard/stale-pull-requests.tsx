'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SectionTitle } from './section-title';

interface StalePullRequest {
  id: number;
  title: string;
  age: string;
}

export function StalePullRequests({
  stalePRs,
}: {
  stalePRs: StalePullRequest[];
}) {
  return (
    <Card className="relative overflow-hidden p-4">
      <SectionTitle>Stale PRs</SectionTitle>

      <ul className="space-y-2.5 text-xs">
        {stalePRs.map((p) => (
          <li key={p.id} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 bg-foreground" />
            <span className="flex-1 leading-relaxed">
              <span className="font-semibold text-foreground">#{p.id}</span>{' '}
              <span className="text-foreground">— {p.title}</span>{' '}
              <span className="text-muted-foreground">({p.age})</span>
            </span>
          </li>
        ))}
      </ul>

      <Button className="inline-flex w-fit items-center bg-primary-700 px-3 py-1.5 font-medium text-white text-xs transition-colors hover:bg-primary-600">
        View All Stale PRs
      </Button>
    </Card>
  );
}
