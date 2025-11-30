/**
 * Settings API Client
 * Frontend functions for interacting with settings-related APIs
 */

// Re-export types from schema
export type {
  Organization,
  OrganizationSettings,
  TeamMember,
  Repository,
  SlackIntegration,
  JiraIntegration,
} from '@/lib/schema/settings';

import type {
  Organization,
  OrganizationSettings,
  TeamMember,
  Repository,
  SlackIntegration,
  JiraIntegration,
} from '@/lib/schema/settings';

// Error handling helper
class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json();
  if (!response.ok) {
    throw new ApiError(response.status, data.error || 'An error occurred');
  }
  return data as T;
}

// ==================== Organization APIs ====================

export async function getOrganization(): Promise<{ organization: Organization | null; role?: string }> {
  const response = await fetch('/api/organizations');
  return handleResponse(response);
}

export async function createOrganization(name: string): Promise<{ success: boolean; organization: Organization }> {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return handleResponse(response);
}

export async function updateOrganization(
  organizationId: string,
  updates: { name?: string }
): Promise<{ success: boolean; organization: Organization }> {
  const response = await fetch('/api/organizations', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, ...updates }),
  });
  return handleResponse(response);
}

// ==================== Members APIs ====================

export async function getMembers(organizationId: string): Promise<{ members: TeamMember[] }> {
  const response = await fetch(`/api/organizations/members?organizationId=${organizationId}`);
  return handleResponse(response);
}

export async function addMember(
  organizationId: string,
  email: string,
  role: 'admin' | 'member'
): Promise<{ success: boolean; member: TeamMember }> {
  const response = await fetch('/api/organizations/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, email, role }),
  });
  return handleResponse(response);
}

export async function updateMemberRole(
  organizationId: string,
  memberId: string,
  role: 'admin' | 'member'
): Promise<{ success: boolean }> {
  const response = await fetch('/api/organizations/members', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, memberId, role }),
  });
  return handleResponse(response);
}

export async function removeMember(
  organizationId: string,
  memberId: string
): Promise<{ success: boolean }> {
  const response = await fetch('/api/organizations/members', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, memberId }),
  });
  return handleResponse(response);
}

// ==================== Settings APIs ====================

export async function getSettings(organizationId: string): Promise<{ settings: OrganizationSettings }> {
  const response = await fetch(`/api/settings?organizationId=${organizationId}`);
  return handleResponse(response);
}

export async function updateSettings(
  organizationId: string,
  settings: Partial<OrganizationSettings>
): Promise<{ success: boolean; settings: OrganizationSettings }> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, settings }),
  });
  return handleResponse(response);
}

// ==================== Slack APIs ====================

export async function getSlackStatus(organizationId: string): Promise<SlackIntegration> {
  const response = await fetch(`/api/slack?organizationId=${organizationId}`);
  return handleResponse(response);
}

export async function initiateSlackConnect(organizationId: string): Promise<{ url: string }> {
  const response = await fetch('/api/slack/oauth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  });
  return handleResponse(response);
}

export async function disconnectSlack(organizationId: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/slack', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  });
  return handleResponse(response);
}

// ==================== Jira APIs ====================

export async function getJiraStatus(organizationId: string): Promise<JiraIntegration> {
  const response = await fetch(`/api/jira/connect?organizationId=${organizationId}`);
  return handleResponse(response);
}

export async function connectJira(
  organizationId: string,
  email: string,
  apiToken: string,
  siteUrl: string
): Promise<{ success: boolean }> {
  const response = await fetch('/api/jira/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, email, apiToken, siteUrl }),
  });
  return handleResponse(response);
}

export async function disconnectJira(organizationId: string): Promise<{ success: boolean }> {
  const response = await fetch('/api/jira/connect', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId }),
  });
  return handleResponse(response);
}

// ==================== Repository APIs ====================

export async function getRepositories(organizationId: string): Promise<{ repositories: Repository[] }> {
  const response = await fetch(`/api/github/repositories?organizationId=${organizationId}`);
  return handleResponse(response);
}

export async function addRepository(
  organizationId: string,
  repositoryUrl: string
): Promise<{ success: boolean; repository: Repository }> {
  const response = await fetch('/api/github/repositories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, repositoryUrl }),
  });
  return handleResponse(response);
}

export async function removeRepository(
  organizationId: string,
  repositoryId: string
): Promise<{ success: boolean }> {
  const response = await fetch('/api/github/repositories', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ organizationId, repositoryId }),
  });
  return handleResponse(response);
}

