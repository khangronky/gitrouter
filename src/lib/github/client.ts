import { SignJWT } from 'jose';
import { createPrivateKey } from 'node:crypto';
import type {
  GitHubPullRequestFile,
  InstallationAccessToken,
} from './types';

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * Formats a PEM private key string that may have been stored in an environment variable.
 * Handles various encoding issues: escaped newlines, Windows line endings, base64 on a single line.
 */
function formatPrivateKey(key: string): string {
  // First, trim any whitespace
  let formatted = key.trim();
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Normalize Windows line endings
  formatted = formatted.replace(/\r\n/g, '\n');
  formatted = formatted.replace(/\r/g, '\n');
  
  // If the key doesn't have proper PEM structure (newlines after header/before footer),
  // try to reconstruct it
  if (formatted.includes('-----BEGIN') && !formatted.includes('\n-----BEGIN')) {
    // Check if it's all on one line (common when copied incorrectly)
    const beginMatch = formatted.match(/(-----BEGIN [A-Z ]+-----)/);
    const endMatch = formatted.match(/(-----END [A-Z ]+-----)/);
    
    if (beginMatch && endMatch) {
      const header = beginMatch[1];
      const footer = endMatch[1];
      
      // Extract the base64 content between header and footer
      const startIdx = formatted.indexOf(header) + header.length;
      const endIdx = formatted.indexOf(footer);
      let base64Content = formatted.slice(startIdx, endIdx).trim();
      
      // Remove any existing whitespace/newlines from base64 content
      base64Content = base64Content.replace(/\s/g, '');
      
      // Reconstruct with proper 64-character line breaks
      const lines: string[] = [];
      for (let i = 0; i < base64Content.length; i += 64) {
        lines.push(base64Content.slice(i, i + 64));
      }
      
      formatted = `${header}\n${lines.join('\n')}\n${footer}`;
    }
  }
  
  return formatted;
}

/**
 * Creates a JWT for GitHub App authentication
 */
async function createAppJWT(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

  if (!appId || !privateKey) {
    throw new Error('Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY environment variables');
  }

  const formattedKey = formatPrivateKey(privateKey);
  
  let key;
  try {
    // Use Node.js crypto to parse the key - supports both PKCS#1 (RSA) and PKCS#8 formats
    key = createPrivateKey(formattedKey);
  } catch (error) {
    // Log helpful debug info
    const keyPreview = formattedKey.substring(0, 50);
    const keyLength = formattedKey.length;
    const hasBegin = formattedKey.includes('-----BEGIN');
    const hasEnd = formattedKey.includes('-----END');
    const hasNewlines = formattedKey.includes('\n');
    
    console.error('Failed to parse GitHub App private key:', {
      error: error instanceof Error ? error.message : error,
      keyPreview: `${keyPreview}...`,
      keyLength,
      hasBegin,
      hasEnd,
      hasNewlines,
      lineCount: formattedKey.split('\n').length,
    });
    
    throw new Error(
      `Invalid GITHUB_APP_PRIVATE_KEY format. Key should start with "-----BEGIN RSA PRIVATE KEY-----" or "-----BEGIN PRIVATE KEY-----". ` +
      `Got ${keyLength} chars, hasBegin=${hasBegin}, hasEnd=${hasEnd}, hasNewlines=${hasNewlines}`
    );
  }

  const now = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt(now - 30) // 30 seconds in the past to handle clock skew
    .setExpirationTime(now + 540) // 9 minutes from now (total ~9.5 mins, under 10 min limit)
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

