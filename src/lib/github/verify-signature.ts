import { timingSafeEqual, createHmac } from 'node:crypto';

/**
 * Verifies the GitHub webhook signature using HMAC-SHA256
 * @param payload - The raw request body as a string
 * @param signature - The signature from the X-Hub-Signature-256 header
 * @param secret - The webhook secret configured in GitHub
 * @returns true if the signature is valid, false otherwise
 */
export function verifyGitHubWebhookSignature(
  payload: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) {
    return false;
  }

  // GitHub sends the signature as "sha256=<hash>"
  const parts = signature.split('=');
  if (parts.length !== 2 || parts[0] !== 'sha256') {
    return false;
  }

  const receivedSignature = parts[1];

  // Compute the expected signature
  const hmac = createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  const expectedSignature = hmac.digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');

    if (receivedBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(receivedBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

/**
 * Extracts the delivery ID from GitHub webhook headers
 * This is used for idempotency checking
 */
export function extractDeliveryId(headers: Headers): string | null {
  return headers.get('X-GitHub-Delivery');
}

/**
 * Extracts the event type from GitHub webhook headers
 */
export function extractEventType(headers: Headers): string | null {
  return headers.get('X-GitHub-Event');
}

/**
 * Validates all required GitHub webhook headers are present
 */
export function validateWebhookHeaders(headers: Headers): {
  valid: boolean;
  deliveryId: string | null;
  eventType: string | null;
  signature: string | null;
  error?: string;
} {
  const deliveryId = extractDeliveryId(headers);
  const eventType = extractEventType(headers);
  const signature = headers.get('X-Hub-Signature-256');

  if (!deliveryId) {
    return {
      valid: false,
      deliveryId: null,
      eventType,
      signature,
      error: 'Missing X-GitHub-Delivery header',
    };
  }

  if (!eventType) {
    return {
      valid: false,
      deliveryId,
      eventType: null,
      signature,
      error: 'Missing X-GitHub-Event header',
    };
  }

  if (!signature) {
    return {
      valid: false,
      deliveryId,
      eventType,
      signature: null,
      error: 'Missing X-Hub-Signature-256 header',
    };
  }

  return {
    valid: true,
    deliveryId,
    eventType,
    signature,
  };
}

