import { SignJWT, importPKCS8 } from 'jose';
import type {
  GitHubPullRequestFile,
  InstallationAccessToken,
} from './types';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Creates a JWT for GitHub App authentication
 */
async function createAppJWT(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY environment variables');
  }

  // Handle escaped newlines in environment variable
  const formattedKey = privateKey.replace(/\\n/g, '\n');
  
  const key = await importPKCS8(formattedKey, 'RS256');

  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now - 60) // 60 seconds in the past to handle clock skew
    .setExpirationTime(now + 600) // 10 minutes from now
    .setIssuer(appId)
    .sign(key);

  return jwt;
}

/**
 * Gets an installation access token for a specific GitHub App installation
 */
export async function getInstallationAccessToken(
  installationId: number
): Promise<InstallationAccessToken> {
  const jwt = await createAppJWT();

  const response = await fetch(
    `${GITHUB_API_BASE}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${jwt}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get installation access token: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Fetches the list of files changed in a pull request
 */
export async function getPullRequestFiles(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
): Promise<GitHubPullRequestFile[]> {
  const { token } = await getInstallationAccessToken(installationId);

  const files: GitHubPullRequestFile[] = [];
  let page = 1;
  const perPage = 100;

  // Paginate through all files (PR can have many files)
  while (true) {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/files?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to fetch PR files: ${response.status} ${error}`);
    }

    const pageFiles: GitHubPullRequestFile[] = await response.json();
    files.push(...pageFiles);

    // If we got fewer files than requested, we've reached the last page
    if (pageFiles.length < perPage) {
      break;
    }

    page++;
  }

  return files;
}

/**
 * Fetches a pull request by number
 */
export async function getPullRequest(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const { token } = await getInstallationAccessToken(installationId);

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch PR: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Adds reviewers to a pull request
 */
export async function requestReviewers(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
  reviewers: string[]
): Promise<void> {
  const { token } = await getInstallationAccessToken(installationId);

  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/pulls/${pullNumber}/requested_reviewers`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviewers }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to request reviewers: ${response.status} ${error}`);
  }
}

/**
 * Gets the list of repositories accessible to an installation
 */
export async function getInstallationRepositories(installationId: number) {
  const { token } = await getInstallationAccessToken(installationId);

  const response = await fetch(
    `${GITHUB_API_BASE}/installation/repositories`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch repositories: ${response.status} ${error}`);
  }

  return response.json();
}

