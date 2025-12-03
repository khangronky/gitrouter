'use client';

import { Card } from '@/components/ui/card';
import { SectionTitle } from './section-title';

interface Bottleneck {
  repo: string;
  avg: string;
  pending: number;
  sla: string;
}

export function BottlenecksTable({
  bottlenecks,
}: {
  bottlenecks: Bottleneck[];
}) {
  return (
    <Card className="p-4">
      <SectionTitle>Bottlenecks</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground">
              <th className="border-border border-b px-3 py-3 text-left font-medium">
                Repo
              </th>
              <th className="border-border border-b px-3 py-3 text-center font-medium">
                Avg Review Time
              </th>
              <th className="border-border border-b px-3 py-3 text-center font-medium">
                PRs Pending
              </th>
              <th className="border-border border-b px-3 py-3 text-center font-medium">
                SLA%
              </th>
            </tr>
          </thead>
          <tbody>
            {bottlenecks.map((b, i) => (
              <tr key={i} className="border-border/50 border-b last:border-0">
                <td className="px-3 py-3 font-medium text-foreground">
                  {b.repo}
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {b.avg}
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {b.pending}
                </td>
                <td className="px-3 py-3 text-center text-muted-foreground">
                  {b.sla}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
