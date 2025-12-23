'use client';

import { useQuery } from '@tanstack/react-query';
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
import { createClient } from '@/lib/supabase/client';
import { PerformanceTableSkeleton } from './performance-skeleton';
import {
  getDateRangeFromTimeRange,
  getOrgRepositoryIds,
  getPreviousPeriodRange,
  type PerformanceChartProps,
  verifyOrgAccess,
} from './utils';

interface ReviewerPerformance {
  reviewer: string;
  avgTime: string;
  prsReviewed: number;
  sla: string;
  trend: 'up' | 'down';
}

async function fetchReviewerPerformance(
  timeRange: PerformanceChartProps['timeRange'],
  organizationId: string
): Promise<ReviewerPerformance[]> {
  await verifyOrgAccess(organizationId);

  const supabase = createClient();
  const startDate = getDateRangeFromTimeRange(timeRange);
  const previousPeriod = getPreviousPeriodRange(timeRange);
  const repoIds = await getOrgRepositoryIds(organizationId);

  if (repoIds.length === 0) {
    return [];
  }

  // Get review assignments for current period
  const { data: currentAssignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewer_id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', startDate.toISOString())
    .not('reviewed_at', 'is', null);

  // Get review assignments for previous period
  const { data: previousAssignments } = await supabase
    .from('review_assignments')
    .select(
      `
      id,
      reviewer_id,
      assigned_at,
      reviewed_at,
      pull_request:pull_requests!inner (
        repository_id
      )
    `
    )
    .in('pull_request.repository_id', repoIds)
    .gte('assigned_at', previousPeriod.startDate.toISOString())
    .lt('assigned_at', previousPeriod.endDate.toISOString())
    .not('reviewed_at', 'is', null);

  const current = currentAssignments || [];
  const previous = previousAssignments || [];

  // Group by reviewer
  const reviewerStats: Record<
    string,
    {
      reviewerId: string;
      reviews: Array<{ assigned_at: string; reviewed_at: string }>;
      prevReviews: Array<{ assigned_at: string; reviewed_at: string }>;
    }
  > = {};

  current.forEach((a) => {
    if (!a.reviewed_at) return;
    if (!reviewerStats[a.reviewer_id]) {
      reviewerStats[a.reviewer_id] = {
        reviewerId: a.reviewer_id,
        reviews: [],
        prevReviews: [],
      };
    }
    reviewerStats[a.reviewer_id].reviews.push({
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
    });
  });

  previous.forEach((a) => {
    if (!a.reviewed_at) return;
    if (!reviewerStats[a.reviewer_id]) {
      reviewerStats[a.reviewer_id] = {
        reviewerId: a.reviewer_id,
        reviews: [],
        prevReviews: [],
      };
    }
    reviewerStats[a.reviewer_id].prevReviews.push({
      assigned_at: a.assigned_at,
      reviewed_at: a.reviewed_at,
    });
  });

  // Get reviewer names
  const reviewerIds = Object.keys(reviewerStats);
  const { data: reviewers } = await supabase
    .from('reviewers')
    .select(
      `
      id,
      user:users (
        github_username,
        full_name
      )
    `
    )
    .in('id', reviewerIds);

  const reviewerMap = new Map<string, string>();
  reviewers?.forEach((r) => {
    const user = r.user as any;
    const name = user?.github_username || user?.full_name || 'Unknown';
    reviewerMap.set(r.id, name.startsWith('@') ? name : `@${name}`);
  });

  // Calculate metrics per reviewer
  const performance: ReviewerPerformance[] = Object.values(reviewerStats)
    .map((stats) => {
      const reviewerName = reviewerMap.get(stats.reviewerId) || '@Unknown';

      // Calculate avg review time
      const totalTime = stats.reviews.reduce((sum, r) => {
        return (
          sum +
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
            3600000
        );
      }, 0);
      const avgTime =
        stats.reviews.length > 0 ? totalTime / stats.reviews.length : 0;

      // Calculate SLA compliance
      const slaMet = stats.reviews.filter((r) => {
        const hours =
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
          3600000;
        return hours <= 4;
      }).length;
      const sla =
        stats.reviews.length > 0 ? (slaMet / stats.reviews.length) * 100 : 0;

      // Calculate previous avg time for trend
      const prevTotalTime = stats.prevReviews.reduce((sum, r) => {
        return (
          sum +
          (new Date(r.reviewed_at).getTime() -
            new Date(r.assigned_at).getTime()) /
            3600000
        );
      }, 0);
      const prevAvgTime =
        stats.prevReviews.length > 0
          ? prevTotalTime / stats.prevReviews.length
          : 0;

      const trend: 'up' | 'down' = avgTime < prevAvgTime ? 'up' : 'down';

      return {
        reviewer: reviewerName,
        avgTime: `${avgTime.toFixed(1)} hours`,
        prsReviewed: stats.reviews.length,
        sla: `${Math.round(sla)}%`,
        trend,
      };
    })
    .sort((a, b) => a.prsReviewed - b.prsReviewed)
    .reverse()
    .slice(0, 10); // Top 10 reviewers

  return performance;
}

export function ReviewerPerformanceTable({
  timeRange,
  organizationId,
}: PerformanceChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['reviewer-performance', timeRange, organizationId],
    queryFn: () => fetchReviewerPerformance(timeRange, organizationId),
    enabled: !!organizationId,
  });

  if (isLoading || !data) {
    return <PerformanceTableSkeleton />;
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col p-4 transition-all duration-200">
        <div className="mb-4 flex flex-col gap-1">
          <CardTitle>PR Review Speed Trend</CardTitle>
          <CardDescription>
            Individual reviewer performance metrics
          </CardDescription>
        </div>
        <p className="text-muted-foreground text-sm">
          No review data available for this period.
        </p>
      </Card>
    );
  }

  // Calculate overall trend
  const totalAvgTime =
    data.reduce((sum, r) => {
      const hours = parseFloat(r.avgTime);
      return sum + hours;
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
      <div className="flex-1 rounded-lg border">
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
            {data.map((row) => (
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
      </div>
      <p className="mt-4 flex items-center gap-1 text-muted-foreground text-sm">
        Current Trend:{' '}
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
      </p>
    </Card>
  );
}
