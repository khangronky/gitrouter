import { z } from 'zod';

// =============================================
// Jira Integration Schemas
// =============================================

/**
 * Jira Integration Type
 */
export interface JiraIntegrationType {
  id: string;
  organization_id: string;
  domain: string;
  email: string;
  default_project_key: string | null;
  status_on_merge: string | null;
  created_at: string;
  updated_at: string;
  // Note: api_token is never returned in responses
}

/**
 * Create/Update Jira Integration Schema
 */
export const upsertJiraIntegrationSchema = z.object({
  domain: z
    .string()
    .min(1, 'Jira domain is required')
    .regex(
      /^[a-zA-Z0-9-]+\.atlassian\.net$/,
      'Domain must be in format: your-domain.atlassian.net'
    ),
  email: z.email('Invalid email address'),
  api_token: z
    .string()
    .min(1, 'API token is required')
    .max(500, 'API token is too long'),
  default_project_key: z
    .string()
    .regex(/^[A-Z][A-Z0-9]*$/, 'Project key must be uppercase letters/numbers')
    .nullable()
    .optional(),
  status_on_merge: z.string().nullable().optional(),
});

export type UpsertJiraIntegrationSchema = z.infer<
  typeof upsertJiraIntegrationSchema
>;

/**
 * Test Jira Connection Schema
 */
export const testJiraConnectionSchema = z.object({
  domain: z.string().min(1, 'Jira domain is required'),
  email: z.email('Invalid email address'),
  api_token: z.string().min(1, 'API token is required'),
});

export type TestJiraConnectionSchema = z.infer<typeof testJiraConnectionSchema>;

/**
 * Jira Ticket ID Pattern
 * Matches patterns like: PROJ-123, ABC-1, XYZ-9999
 */
export const jiraTicketIdPattern = /\b([A-Z][A-Z0-9]*-\d+)\b/;

// =============================================
// Jira API Response Types
// =============================================

/**
 * Jira User
 */
export interface JiraUserType {
  accountId: string;
  emailAddress: string;
  displayName: string;
  avatarUrls: {
    '48x48': string;
  };
  active: boolean;
}

/**
 * Jira Project
 */
export interface JiraProjectType {
  id: string;
  key: string;
  name: string;
  projectTypeKey: string;
  avatarUrls: {
    '48x48': string;
  };
}

/**
 * Jira Status
 */
export interface JiraStatusType {
  id: string;
  name: string;
  statusCategory: {
    id: number;
    key: string;
    name: string;
    colorName: string;
  };
}

/**
 * Jira Issue (minimal for our needs)
 */
export interface JiraIssueType {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description?: string;
    status: JiraStatusType;
    assignee?: JiraUserType | null;
    reporter?: JiraUserType;
    project: JiraProjectType;
    issuetype: {
      id: string;
      name: string;
      iconUrl: string;
    };
    created: string;
    updated: string;
  };
}

/**
 * Jira Transition
 */
export interface JiraTransitionType {
  id: string;
  name: string;
  to: JiraStatusType;
}

/**
 * Jira Transitions Response
 */
export interface JiraTransitionsResponse {
  transitions: JiraTransitionType[];
}

/**
 * Jira Remote Link
 */
export interface JiraRemoteLinkType {
  id: number;
  self: string;
  object: {
    url: string;
    title: string;
    icon?: {
      url16x16: string;
      title: string;
    };
  };
}

// =============================================
// Response Types
// =============================================

export interface JiraIntegrationResponseType {
  integration: JiraIntegrationType;
}

export interface JiraConnectionTestResponseType {
  success: boolean;
  message: string;
  user?: {
    displayName: string;
    email: string;
  };
}

export interface JiraProjectListResponseType {
  projects: JiraProjectType[];
}

export interface JiraStatusListResponseType {
  statuses: JiraStatusType[];
}

export interface MessageResponseType {
  message: string;
}

