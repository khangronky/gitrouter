"use client";

import { Card, CardAction, CardFooter } from "@/components/ui/card";
import { DeltaBadge } from "./delta-badge";
import { Badge } from "../ui/badge";
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

interface KpiData {
  totalPRs: { value: number; delta: number; note: string };
  pending: { value: number; delta: number; note: string };
  sla: { value: number; delta: number; note: string };
  approved: { value: number; delta: number; note: string };
}

export function KpiRow({ kpis }: { kpis: KpiData }) {
  return (
    <div className='mb-4 h-full max-h-[200px] grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4'>
      <Card className='p-4 flex flex-column justify-between gap-4'>
        <div>
          <div className='flex flex-row justify-between items-center w-full'>
            <div className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
              Total PRs
            </div>
            <CardAction>
              <Badge variant='outline'>
                <IconTrendingUp />
                +{kpis.totalPRs.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className='font-bold text-4xl text-foreground'>
            {kpis.totalPRs.value}
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <CardFooter className='flex-col items-start gap-1.5 text-sm p-0'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Trending up this month <IconTrendingUp className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              PRs for the last 7 days
            </div>
          </CardFooter>
        </div>
      </Card>

      <Card className='p-4 flex flex-column justify-between gap-4'>
      <div>
          <div className='flex flex-row justify-between items-center w-full'>
            <div className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
              Pending Reviews
            </div>
            <CardAction>
              <Badge variant='outline'>
                <IconTrendingDown />
                {kpis.pending.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className='font-bold text-4xl text-foreground'>
              {kpis.pending.value}
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <CardFooter className='flex-col items-start gap-1.5 text-sm p-0'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
              Trending down this week <IconTrendingDown className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              Pending reviews in the last 7 days
            </div>
          </CardFooter>
        </div>
      </Card>

      <Card className='p-4 flex flex-column justify-between gap-4'>
        <div>
          <div className='flex flex-row justify-between items-center w-full'>
            <div className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
              SLA Compliance
            </div>
            <CardAction>
              <Badge variant='outline'>
                <IconTrendingUp />
                {kpis.sla.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className='font-bold text-4xl text-foreground'>
              {(kpis.sla.value * 100).toFixed(0)}%
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          <CardFooter className='flex-col items-start gap-1.5 text-sm p-0'>
          <div className='line-clamp-1 flex gap-2 font-medium'>
              Trending up this week <IconTrendingUp className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              SLA compliance in the last 7 days
            </div>
          </CardFooter>
        </div>
      </Card>

      <Card className='p-4 flex flex-column justify-between gap-4'>
        <div>
          <div className='flex flex-row justify-between items-center w-full'>
            <div className='font-medium text-[11px] text-muted-foreground uppercase tracking-wide'>
              Approved
            </div>
            <CardAction>
              <Badge variant='outline'>
                <IconTrendingUp />
                {kpis.approved.delta}%
              </Badge>
            </CardAction>
          </div>
          <div className='font-bold text-4xl text-foreground'>
            {kpis.approved.value}
          </div>
        </div>
        <div className='flex flex-col gap-2'> 
          <CardFooter className='flex-col items-start gap-1.5 text-sm p-0'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Trending up this week <IconTrendingUp className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              Approved in the last 7 days
            </div>
          </CardFooter>
        </div>
      </Card>
    </div>
  );
}
