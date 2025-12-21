'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const reviewerPerformanceData = [
  {
    reviewer: '@alice',
    avgTime: '2.4 hours',
    prsReviewed: 45,
    sla: '98%',
    trend: 'up',
  },
  {
    reviewer: '@bob',
    avgTime: '3.1 hours',
    prsReviewed: 38,
    sla: '92%',
    trend: 'up',
  },
  {
    reviewer: '@charlie',
    avgTime: '2.8 hours',
    prsReviewed: 42,
    sla: '95%',
    trend: 'up',
  },
  {
    reviewer: '@diana',
    avgTime: '2.2 hours',
    prsReviewed: 51,
    sla: '99%',
    trend: 'up',
  },
  {
    reviewer: '@eve',
    avgTime: '3.5 hours',
    prsReviewed: 35,
    sla: '88%',
    trend: 'down',
  },
  {
    reviewer: '@frank',
    avgTime: '2.6 hours',
    prsReviewed: 40,
    sla: '96%',
    trend: 'up',
  },
];

export function ReviewerPerformanceTable() {
  return (
    <Card className="p-4 flex flex-col transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-1 mb-4">
        <CardTitle>PR Review Speed Trend</CardTitle>
        <CardDescription>
          Individual reviewer performance metrics
        </CardDescription>
      </div>
      <div className="rounded-lg border flex-1">
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
            {reviewerPerformanceData.map((row) => (
              <TableRow key={row.reviewer}>
                <TableCell className="font-medium">{row.reviewer}</TableCell>
                <TableCell>{row.avgTime}</TableCell>
                <TableCell className="text-center">{row.prsReviewed}</TableCell>
                <TableCell className="text-center">{row.sla}</TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className={
                      row.trend === 'up'
                        ? 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800'
                        : 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800'
                    }
                  >
                    {row.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {row.trend === 'up' ? 'Up' : 'Down'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-muted-foreground text-sm mt-4 flex items-center gap-1">
        Current Trend: <TrendingDown className="h-4 w-4 text-green-600" />
        <span className="text-green-600 font-medium">Improving</span>
        <span className="text-foreground">(avg 4.2h → 3.1h)</span>
      </p>
    </Card>
  );
}
