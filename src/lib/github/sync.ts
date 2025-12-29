import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import {
  listRepositoryPullRequests,
  getPullRequestFiles,
  type GitHubPullRequest,
} from './client';
import { extractFromTitle, extractFromBody } from '@/lib/jira/ticket-parser';

/** Sync all historical PRs (no date limit) */

export interface SyncResult {
  success: boolean;
  repositoryId: string;
  prsProcessed: number;
  prsInserted: number;
  prsUpdated: number;
  error?: string;
}

interface RepositoryInfo {
  id: string;
  full_name: string;
  github_installation_id: string;
  installation_id: number;
}

/**
 * Sync pull requests from GitHub for a single repository
 */
export async function syncRepositoryPullRequests(
  supabase: SupabaseClient<Database>,
  repo: RepositoryInfo
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    repositoryId: repo.id,
    prsProcessed: 0,
    prsInserted: 0,
    prsUpdated: 0,
  };

  try {
    const [owner, repoName] = repo.full_name.split('/');
    if (!owner || !repoName) {
      result.error = `Invalid repository name: ${repo.full_name}`;
      return result;
    }

    console.log(`📥 Syncing all PRs for ${repo.full_name}...`);

    // Fetch all PRs from GitHub (no date limit)
    const prs = await listRepositoryPullRequests(
      repo.installation_id,
      owner,
      repoName
    );

    console.log(`  Found ${prs.length} total PRs`);

    // Get existing PRs to determine inserts vs updates
    const { data: existingPrs } = await supabase
      .from('pull_requests')
      .select('github_pr_id')
      .eq('repository_id', repo.id);

    const existingPrIds = new Set(
      existingPrs?.map((p) => p.github_pr_id) || []
    );

    // Process PRs in batches
    const prDataList = await Promise.all(
      prs.map(async (pr) => {
        // Skip draft PRs
        if (pr.draft) {
          return null;
        }

        // Determine PR status
        let status: 'open' | 'merged' | 'closed' = 'open';
        if (pr.merged_at) {
          status = 'merged';
        } else if (pr.state === 'closed') {
          status = 'closed';
        }

        // Extract Jira ticket ID
        const jiraTicketId =
          extractFromTitle(pr.title) || extractFromBody(pr.body) || null;

        // Get files changed for open PRs
        let filesChanged: string[] = [];
        if (status === 'open') {
          try {
            filesChanged = await getPullRequestFiles(
              repo.installation_id,
              owner,
              repoName,
              pr.number
            );
          } catch (error) {
            console.warn(
              `  Failed to fetch files for PR #${pr.number}:`,
              error
            );
          }
        }

        return {
          repository_id: repo.id,
          github_pr_id: pr.id,
          github_pr_number: pr.number,
          title: pr.title,
          body: pr.body,
          author_login: pr.user.login,
          author_id: pr.user.id,
          head_branch: pr.head.ref,
          base_branch: pr.base.ref,
          files_changed: filesChanged,
          additions: pr.additions,
          deletions: pr.deletions,
          status,
          html_url: pr.html_url,
          jira_ticket_id: jiraTicketId,
          created_at: pr.created_at,
          updated_at: new Date().toISOString(),
          merged_at: pr.merged_at,
          closed_at: pr.closed_at,
        };
      })
    );

    // Filter out nulls (draft PRs)
    const validPrData = prDataList.filter(
      (pr): pr is NonNullable<typeof pr> => pr !== null
    );

    result.prsProcessed = validPrData.length;

    // Count inserts vs updates
    for (const pr of validPrData) {
      if (existingPrIds.has(pr.github_pr_id)) {
        result.prsUpdated++;
      } else {
        result.prsInserted++;
      }
    }

    // Upsert all PRs
    if (validPrData.length > 0) {
      const { error: upsertError } = await supabase
        .from('pull_requests')
        .upsert(validPrData, {
          onConflict: 'repository_id,github_pr_id',
        });

      if (upsertError) {
        result.error = `Failed to upsert PRs: ${upsertError.message}`;
        return result;
      }
    }

    // Update the sync timestamp
    const { error: updateError } = await supabase
      .from('repositories')
      .update({ prs_synced_at: new Date().toISOString() })
      .eq('id', repo.id);

    if (updateError) {
      console.warn(`  Failed to update sync timestamp: ${updateError.message}`);
    }

    result.success = true;
    console.log(
      `  ✅ Synced ${result.prsProcessed} PRs (${result.prsInserted} new, ${result.prsUpdated} updated)`
    );

    return result;
  } catch (error) {
    result.error =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`  ❌ Failed to sync PRs for ${repo.full_name}:`, error);
    return result;
  }
}

/**
 * Sync pull requests for all active repositories in an organization
 */
export async function syncOrganizationPullRequests(
  supabase: SupabaseClient<Database>,
  organizationId: string
): Promise<SyncResult[]> {
  // Get all active repositories with their installation info
  const { data: repositories, error } = await supabase
    .from('repositories')
    .select(
      `
      id,
      full_name,
      github_installation_id,
      github_installation:github_installations (
        installation_id
      )
    `
    )
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error || !repositories) {
    console.error('Failed to fetch repositories:', error);
    return [];
  }

  const results: SyncResult[] = [];

  for (const repo of repositories) {
    const installationId = (
      repo.github_installation as unknown as { installation_id: number } | null
    )?.installation_id;

    if (!installationId) {
      results.push({
        success: false,
        repositoryId: repo.id,
        prsProcessed: 0,
        prsInserted: 0,
        prsUpdated: 0,
        error: 'No GitHub installation found',
      });
      continue;
    }

    const result = await syncRepositoryPullRequests(supabase, {
      id: repo.id,
      full_name: repo.full_name,
      github_installation_id: repo.github_installation_id,
      installation_id: installationId,
    });

    results.push(result);
  }

  return results;
}

/**
 * Sync pull requests for all active repositories across all organizations
 * Used by the cron job
 */
export async function syncAllPullRequests(
  supabase: SupabaseClient<Database>
): Promise<{
  totalRepositories: number;
  successCount: number;
  failureCount: number;
  totalPRsProcessed: number;
  results: SyncResult[];
}> {
  console.log('🔄 Starting PR sync for all repositories...');

  // Get all active repositories with their installation info
  const { data: repositories, error } = await supabase
    .from('repositories')
    .select(
      `
      id,
      full_name,
      github_installation_id,
      github_installation:github_installations (
        installation_id
      )
    `
    )
    .eq('is_active', true)
    .is('deleted_at', null);

  if (error || !repositories) {
    console.error('Failed to fetch repositories:', error);
    return {
      totalRepositories: 0,
      successCount: 0,
      failureCount: 0,
      totalPRsProcessed: 0,
      results: [],
    };
  }

  console.log(`Found ${repositories.length} active repositories to sync`);

  const results: SyncResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalPRsProcessed = 0;

  for (const repo of repositories) {
    const installationId = (
      repo.github_installation as unknown as { installation_id: number } | null
    )?.installation_id;

    if (!installationId) {
      results.push({
        success: false,
        repositoryId: repo.id,
        prsProcessed: 0,
        prsInserted: 0,
        prsUpdated: 0,
        error: 'No GitHub installation found',
      });
      failureCount++;
      continue;
    }

    const result = await syncRepositoryPullRequests(supabase, {
      id: repo.id,
      full_name: repo.full_name,
      github_installation_id: repo.github_installation_id,
      installation_id: installationId,
    });

    results.push(result);
    totalPRsProcessed += result.prsProcessed;

    if (result.success) {
      successCount++;
    } else {
      failureCount++;
    }
  }

  console.log(
    `✅ PR sync complete: ${successCount} succeeded, ${failureCount} failed, ${totalPRsProcessed} PRs processed`
  );

  return {
    totalRepositories: repositories.length,
    successCount,
    failureCount,
    totalPRsProcessed,
    results,
  };
}
