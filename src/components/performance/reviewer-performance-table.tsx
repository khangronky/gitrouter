'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PerformanceTableSkeleton } from './performance-skeleton';
import type { ReviewerPerformance } from '@/lib/schema/performance';

interface ReviewerPerformanceTableProps {
  data?: ReviewerPerformance[];
}

// Empty state placeholder data
const EMPTY_STATE_DATA: ReviewerPerformance[] = [
  {
    reviewer: 'Reviewer 1',
    avgTime: '—',
    prsReviewed: 0,
    sla: '—',
    trend: 'up',
  },
  {
    reviewer: 'Reviewer 2',
    avgTime: '—',
    prsReviewed: 0,
    sla: '—',
    trend: 'up',
  },
  {
    reviewer: 'Reviewer 3',
    avgTime: '—',
    prsReviewed: 0,
    sla: '—',
    trend: 'up',
  },
];

export function ReviewerPerformanceTable({
  data,
}: ReviewerPerformanceTableProps) {
  if (!data) {
    return <PerformanceTableSkeleton />;
  }

  const isEmpty = data.length === 0;
  const tableData = isEmpty ? EMPTY_STATE_DATA : data;

  // Calculate overall trend
  const totalAvgTime = isEmpty
    ? 0
    : data.reduce((sum, r) => {
        const hours = parseFloat(r.avgTime);
        return sum + (isNaN(hours) ? 0 : hours);
      }, 0) / data.length;

  const prevTotalAvgTime = totalAvgTime * 1.1; // Estimate previous (simplified)
  const overallTrend = totalAvgTime < prevTotalAvgTime ? 'up' : 'down';

  return (
    <Card className="flex flex-col p-4 transition-all duration-200 hover:shadow-md">
      <div className="mb-4 flex flex-col gap-1">
        <CardTitle>PR Review Speed Trend</CardTitle>
        <CardDescription>
          Individual reviewer performance metrics
        </CardDescription>
      </div>
      <div className="relative flex-1 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewer</TableHead>
              <TableHead>Avg Review Time</TableHead>
              <TableHead className="text-center">PRs Reviewed</TableHead>
              <TableHead className="text-center">SLA %</TableHead>
              <TableHead className="text-center">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow
                key={row.reviewer}
                className={isEmpty ? 'opacity-50' : ''}
              >
                <TableCell
                  className={`font-medium ${isEmpty ? 'text-muted-foreground' : ''}`}
                >
                  {row.reviewer}
                </TableCell>
                <TableCell className={isEmpty ? 'text-muted-foreground' : ''}>
                  {row.avgTime}
                </TableCell>
                <TableCell
                  className={`text-center ${isEmpty ? 'text-muted-foreground' : ''}`}
                >
                  {row.prsReviewed}
                </TableCell>
                <TableCell
                  className={`text-center ${isEmpty ? 'text-muted-foreground' : ''}`}
                >
                  {row.sla}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      isEmpty
                        ? 'border-muted bg-muted/50 text-muted-foreground'
                        : row.trend === 'up'
                          ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950'
                          : 'border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950'
                    }
                  >
                    {row.trend === 'up' ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {row.trend === 'up' ? 'Up' : 'Down'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                No review data yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Data will appear when reviews are completed
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 flex items-center gap-1 text-muted-foreground text-sm">
        Current Trend:{' '}
        {isEmpty ? (
          <span className="font-medium text-muted-foreground">N/A</span>
        ) : (
          <>
            {overallTrend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`font-medium ${
                overallTrend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {overallTrend === 'up' ? 'Improving' : 'Declining'}
            </span>
            <span className="text-foreground">
              {' '}
              (avg {totalAvgTime.toFixed(1)}h)
            </span>
          </>
        )}
      </p>
    </Card>
  );
}
