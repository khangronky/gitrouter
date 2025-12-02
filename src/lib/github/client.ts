import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

/**
 * GitHub App configuration from environment
 */
function getAppConfig() {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_PRIVATE_KEY;
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
