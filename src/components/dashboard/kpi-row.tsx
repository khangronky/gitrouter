'use client';

import { Card, CardAction, CardFooter } from '@/components/ui/card';
import { Badge } from '../ui/badge';
import {
  IconTrendingDown,
  IconTrendingUp,
  IconMinus,
} from '@tabler/icons-react';

interface KpiData {
  totalPRs: { value: number; delta: number; note: string };
  pending: { value: number; delta: number; note: string };
  sla: { value: number; delta: number; note: string };
  approved: { value: number; delta: number; note: string };
}

// Helper to get trend info based on delta and whether lower is better
function getTrendInfo(delta: number, lowerIsBetter = false) {
  const isPositive = lowerIsBetter ? delta < 0 : delta > 0;
  const isNegative = lowerIsBetter ? delta > 0 : delta < 0;

  if (isPositive) {
    return {
      text: 'Trending up',
      Icon: IconTrendingUp,
    };
  }
  if (isNegative) {
    return {
      text: 'Trending down',
      Icon: IconTrendingDown,
    };
  }
  return {
    text: 'No change',
    Icon: IconMinus,
  };
}

export function KpiRow({ kpis }: { kpis: KpiData }) {
  const totalPRsTrend = getTrendInfo(kpis.totalPRs.delta);
  const pendingTrend = getTrendInfo(kpis.pending.delta, true); // lower pending is better
  const slaTrend = getTrendInfo(kpis.sla.delta);
  const approvedTrend = getTrendInfo(kpis.approved.delta);

  return (
    <div className="mb-4 h-full max-h-[200px] grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4 flex flex-column justify-between gap-4">
        <div>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Total PRs
            </div>
            <CardAction>
              <Badge variant="outline">
                {kpis.totalPRs.delta >= 0 ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {kpis.totalPRs.delta >= 0 ? '+' : ''}
                {kpis.totalPRs.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className="font-bold text-4xl text-foreground">
            {kpis.totalPRs.value}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
            <div className="line-clamp-1 flex gap-2 font-medium items-center">
              {totalPRsTrend.text} <totalPRsTrend.Icon className="size-4" />
            </div>
            <div className="text-muted-foreground">{kpis.totalPRs.note}</div>
          </CardFooter>
        </div>
      </Card>

      <Card className="p-4 flex flex-column justify-between gap-4">
        <div>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Pending Reviews
            </div>
            <CardAction>
              <Badge variant="outline">
                {kpis.pending.delta <= 0 ? (
                  <IconTrendingDown />
                ) : (
                  <IconTrendingUp />
                )}
                {kpis.pending.delta >= 0 ? '+' : ''}
                {kpis.pending.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className="font-bold text-4xl text-foreground">
            {kpis.pending.value}
          </div>
        </div>
        <div className="flex flex-col gap-2 ">
          <CardFooter className="flex-col items-start justify-center gap-1.5 text-sm p-0">
            <div className="line-clamp-1 flex gap-2 font-medium items-center">
              {pendingTrend.text} <pendingTrend.Icon className="size-4" />
            </div>
            <div className="text-muted-foreground">{kpis.pending.note}</div>
          </CardFooter>
        </div>
      </Card>

      <Card className="p-4 flex flex-column justify-between gap-4">
        <div>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              SLA Compliance
            </div>
            <CardAction>
              <Badge variant="outline">
                {kpis.sla.delta >= 0 ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {kpis.sla.delta >= 0 ? '+' : ''}
                {kpis.sla.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className="font-bold text-4xl text-foreground">
            {(kpis.sla.value * 100).toFixed(0)}%
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <CardFooter className="flex-col items-start gap-1.5 text-sm p-0 ">
            <div className="line-clamp-1 flex gap-2 font-medium items-center">
              {slaTrend.text} <slaTrend.Icon className="size-4" />
            </div>
            <div className="text-muted-foreground">{kpis.sla.note}</div>
          </CardFooter>
        </div>
      </Card>

      <Card className="p-4 flex flex-column justify-between gap-4">
        <div>
          <div className="flex flex-row justify-between items-center w-full">
            <div className="font-medium text-[11px] text-muted-foreground uppercase tracking-wide">
              Approved
            </div>
            <CardAction>
              <Badge variant="outline">
                {kpis.approved.delta >= 0 ? (
                  <IconTrendingUp />
                ) : (
                  <IconTrendingDown />
                )}
                {kpis.approved.delta >= 0 ? '+' : ''}
                {kpis.approved.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className="font-bold text-4xl text-foreground">
            {kpis.approved.value}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <CardFooter className="flex-col items-start gap-1.5 text-sm p-0">
            <div className="line-clamp-1 flex gap-2 font-medium items-center">
              {approvedTrend.text} <approvedTrend.Icon className="size-4" />
            </div>
            <div className="text-muted-foreground">{kpis.approved.note}</div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
