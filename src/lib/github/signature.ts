import { verify } from '@octokit/webhooks-methods';

/**
 * Verify GitHub webhook signature
 * @param secret - The webhook secret configured in GitHub App
 * @param payload - The raw request body as string
 * @param signature - The X-Hub-Signature-256 header value
 * @returns true if signature is valid
 */
export async function verifyWebhookSignature(
  secret: string,
  payload: string,
  signature: string
): Promise<boolean> {
  if (!secret || !payload || !signature) {
    return false;
  }

  try {
    return await verify(secret, payload, signature);
  } catch {
    return false;
  }
}

/**
 * Get webhook secret from environment
 */
export function getWebhookSecret(): string {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('GITHUB_WEBHOOK_SECRET is not configured');
  }
  return secret;
}
