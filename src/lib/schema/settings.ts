/**
 * Settings Schema Types
 * Type definitions for settings-related data structures
 */

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: OrganizationSettings;
}

export interface OrganizationSettings {
  slackNotifications: boolean;
  emailNotifications: boolean;
  escalationDestination: 'channel' | 'dm';
  notificationFrequency: 'realtime' | 'batched' | 'daily';
}

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'member';
}

export interface Repository {
  id: string;
  name: string;
  full_name: string;
}

export interface SlackIntegration {
  connected: boolean;
  teamName?: string;
  teamChannelId?: string;
  teamChannelName?: string;
}

export interface JiraIntegration {
  connected: boolean;
  siteUrl?: string;
  email?: string;
}

