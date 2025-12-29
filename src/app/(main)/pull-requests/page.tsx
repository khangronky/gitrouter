import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/supabase';
import { PullRequestsClient } from './client';

type PullRequest = {
  id: string;
  title: string;
  author: string;
  reviewer: string | null;
  status: Database['public']['Enums']['pr_status'];
  created: string;
  repository: string;
  html_url: string;
};

export default async function PullRequestsPage() {
  const supabase = await createClient();

  // First, let's check raw PR count (for debugging)
  const { count: totalCount } = await supabase
    .from('pull_requests')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Total PRs in database:', totalCount);

  // Fetch pull requests with joins to get repository and reviewer information
  const { data: pullRequests, error } = await supabase
    .from('pull_requests')
    .select(
      `
      id,
      title,
      author_login,
      status,
      created_at,
      html_url,
      repositories (
        full_name
      ),
      review_assignments (
        reviewer:reviewers (
          user:users (
            full_name,
            github_username
          )
        )
      )
    `
    )
    .order('created_at', { ascending: false });

  console.log('📊 PRs fetched:', pullRequests?.length, 'Error:', error);

  if (error) {
    console.error('Error fetching pull requests:', error);
    return (
      <div className="flex min-h-screen flex-col gap-8 p-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-bold text-2xl text-foreground">
            Browse Pull Requests
          </h1>
          <p className="text-destructive text-sm">
            Failed to load pull requests. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // Transform the data to match the expected format (filter out PRs without repos)
  const transformedPRs: PullRequest[] =
    pullRequests
      ?.filter((pr) => pr.repositories?.full_name)
      .map((pr) => {
        let reviewerName: string | null = null;

        if (pr.review_assignments && pr.review_assignments.length > 0) {
          const reviewer = pr.review_assignments[0]?.reviewer as {
            user: {
              full_name: string | null;
              github_username: string | null;
            } | null;
          } | null;

          if (reviewer?.user) {
            // Prefer github_username, fall back to full_name
            reviewerName = reviewer.user.github_username
              ? `@${reviewer.user.github_username}`
              : reviewer.user.full_name;
          }
        }

        return {
          id: pr.id,
          title: pr.title,
          author: pr.author_login,
          reviewer: reviewerName,
          status: pr.status,
          created: new Date(pr.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          repository: pr.repositories?.full_name || 'Unknown',
          html_url: pr.html_url,
        };
      }) || [];

  return <PullRequestsClient pullRequests={transformedPRs} />;
}
