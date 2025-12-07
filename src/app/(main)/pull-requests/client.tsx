'use client';

import { columns, type PullRequest } from './columns';
import { PullRequestTable } from './pull-request-table';

export function PullRequestsClient({
  pullRequests,
}: {
  pullRequests: PullRequest[];
}) {
  // Get unique repositories and reviewers for filters
  const repositories = Array.from(
    new Set(pullRequests.map((pr) => pr.repository))
  ).sort();
  const reviewers = Array.from(
    new Set(
      pullRequests
        .map((pr) => pr.reviewer)
        .filter((r): r is string => r !== null)
    )
  ).sort();

  return (
    <div className="flex min-h-screen flex-col gap-8 p-4">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-2xl text-foreground">
          Browse Pull Requests
        </h1>
        <p className="text-muted-foreground text-sm">
          Found {pullRequests.length} Pull Requests in the system
        </p>
      </div>

      <PullRequestTable
        columns={columns}
        data={pullRequests}
        repositories={repositories}
        reviewers={reviewers}
      />
    </div>
  );
}
