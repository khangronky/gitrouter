import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

/**
 * GitHub App configuration from environment
 */
function getAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!appId || !privateKey) {
    throw new Error('GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be configured');
  }

  // Handle private key - might have escaped newlines
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  return {
    appId,
    privateKey: formattedPrivateKey,
    clientId,
    clientSecret,
  };
}

/**
 * Create an Octokit instance authenticated as the GitHub App
 * Use this for app-level operations
 */
export function createAppOctokit(): Octokit {
  const { appId, privateKey } = getAppConfig();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
    },
  });
}

/**
 * Create an Octokit instance authenticated as a specific installation
 * Use this for operations that require access to a specific org/user's repos
 */
export function createInstallationOctokit(installationId: number): Octokit {
  const { appId, privateKey } = getAppConfig();

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey,
      installationId,
    },
  });
}

/**
 * Get list of files changed in a pull request
 */
export async function getPullRequestFiles(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<string[]> {
  const octokit = createInstallationOctokit(installationId);

  const { data: files } = await octokit.rest.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 300, // Max per page
  });

  return files.map((file) => file.filename);
}

/**
 * Get pull request details
 */
export async function getPullRequestDetails(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = createInstallationOctokit(installationId);

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  return pr;
}

/**
 * Pull request from GitHub API
 */
export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    id: number;
  };
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  additions: number;
  deletions: number;
  draft: boolean;
}

/**
 * List pull requests for a repository with pagination
 * Fetches all PRs or PRs updated within the specified number of days
 */
export async function listRepositoryPullRequests(
  installationId: number,
  owner: string,
  repo: string,
  options: {
    /** Number of days to look back (undefined = fetch all PRs) */
    sinceDays?: number;
    /** Maximum number of PRs to fetch (default: no limit) */
    maxPRs?: number;
  } = {}
): Promise<GitHubPullRequest[]> {
  const octokit = createInstallationOctokit(installationId);
  const { sinceDays, maxPRs } = options;

  // Calculate the cutoff date (only if sinceDays is specified)
  let sinceDate: Date | null = null;
  if (sinceDays !== undefined) {
    sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - sinceDays);
  }

  const allPRs: GitHubPullRequest[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data: prs } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
      page,
    });

    if (prs.length === 0) {
      hasMore = false;
      break;
    }

    for (const pr of prs) {
      // Stop if we've gone past the cutoff date (only if date filtering is enabled)
      if (sinceDate) {
        const updatedAt = new Date(pr.updated_at);
        if (updatedAt < sinceDate) {
          hasMore = false;
          break;
        }
      }

      allPRs.push({
        id: pr.id,
        number: pr.number,
        title: pr.title,
        body: pr.body,
        state: pr.state as 'open' | 'closed',
        html_url: pr.html_url,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
        closed_at: pr.closed_at,
        merged_at: pr.merged_at,
        user: {
          login: pr.user?.login || 'unknown',
          id: pr.user?.id || 0,
        },
        head: {
          ref: pr.head.ref,
        },
        base: {
          ref: pr.base.ref,
        },
        // Note: additions/deletions are not available from list endpoint, only from get
        additions: 0,
        deletions: 0,
        draft: pr.draft ?? false,
      });

      // Check if we've hit the max limit
      if (maxPRs && allPRs.length >= maxPRs) {
        hasMore = false;
        break;
      }
    }

    page++;
  }

  return allPRs;
}

/**
 * List repositories accessible to an installation
 */
export async function listInstallationRepositories(installationId: number) {
  const octokit = createInstallationOctokit(installationId);

  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });

  return data.repositories;
}

/**
 * Request a review from a user on a pull request
 */
export async function requestPullRequestReview(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  reviewers: string[]
) {
  const octokit = createInstallationOctokit(installationId);

  try {
    const { data } = await octokit.rest.pulls.requestReviewers({
      owner,
      repo,
      pull_number: pullNumber,
      reviewers,
    });
    return data;
  } catch (error) {
    // If reviewer is the PR author, GitHub will reject - that's expected
    console.warn('Failed to request review:', error);
    return null;
  }
}

/**
 * Post a comment on a pull request
 */
export async function createPullRequestComment(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string
) {
  const octokit = createInstallationOctokit(installationId);

  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });

  return data;
}

/**
 * Collaborator info from GitHub
 */
export interface GitHubCollaborator {
  github_username: string;
  github_id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

/**
 * Get repository collaborators
 */
export async function getRepositoryCollaborators(
  installationId: number,
  owner: string,
  repo: string
): Promise<GitHubCollaborator[]> {
  const octokit = createInstallationOctokit(installationId);

  try {
    const { data } = await octokit.rest.repos.listCollaborators({
      owner,
      repo,
      per_page: 100,
    });

    // Get additional user details for each collaborator
    const collaborators: GitHubCollaborator[] = [];

    for (const user of data) {
      try {
        const { data: userDetails } = await octokit.rest.users.getByUsername({
          username: user.login,
        });

        collaborators.push({
          github_username: user.login,
          github_id: user.id,
          avatar_url: user.avatar_url || '',
          name: userDetails.name || null,
          email: userDetails.email || null,
        });
      } catch {
        // If we can't get user details, just use basic info
        collaborators.push({
          github_username: user.login,
          github_id: user.id,
          avatar_url: user.avatar_url || '',
          name: null,
          email: null,
        });
      }
    }

    return collaborators;
  } catch (error) {
    console.error('Failed to get repository collaborators:', error);
    return [];
  }
}

/**
 * Search for GitHub user by email
 * Note: Only works if user has made their email public
 */
export async function searchUserByEmail(
  installationId: number,
  email: string
): Promise<string | null> {
  const octokit = createInstallationOctokit(installationId);

  try {
    const { data } = await octokit.rest.search.users({
      q: `${email} in:email`,
      per_page: 1,
    });

    if (data.total_count > 0 && data.items[0]) {
      return data.items[0].login;
    }

    return null;
  } catch (error) {
    console.error('Failed to search user by email:', error);
    return null;
  }
}
