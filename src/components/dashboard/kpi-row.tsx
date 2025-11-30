'use client';

import { Card } from '@/components/ui/card';
import { DeltaBadge } from './delta-badge';

interface KpiData {
  totalPRs: { value: number; delta: number; note: string };
  pending: { value: number; delta: number; note: string };
  sla: { value: number; delta: number; note: string };
  approved: { value: number; delta: number; note: string };
}

export function KpiRow({ kpis }: { kpis: KpiData }) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-3.5">
        <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Total PRs
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-bold text-4xl text-foreground">
            {kpis.totalPRs.value}
          </div>
          <DeltaBadge delta={kpis.totalPRs.delta} note={kpis.totalPRs.note} />
        </div>
      </Card>

      <Card className="p-3.5">
        <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Pending Reviews
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-bold text-4xl text-foreground">
            {kpis.pending.value}
          </div>
          <DeltaBadge delta={kpis.pending.delta} note={kpis.pending.note} />
        </div>
      </Card>

      <Card className="p-3.5">
        <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          SLA Compliance
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-bold text-4xl text-foreground">
            {(kpis.sla.value * 100).toFixed(0)}%
          </div>
          <DeltaBadge delta={kpis.sla.delta} note={kpis.sla.note} />
        </div>
      </Card>

      <Card className="p-3.5">
        <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
          Approved
        </div>
        <div className="mt-2 flex items-end justify-between">
          <div className="font-bold text-4xl text-foreground">
            {kpis.approved.value}
          </div>
          <DeltaBadge delta={kpis.approved.delta} note={kpis.approved.note} />
        </div>
      </Card>
    </div>
  );
}
