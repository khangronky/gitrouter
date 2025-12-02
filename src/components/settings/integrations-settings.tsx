'use client';

import { GitHubIntegrationCard } from './github-integration-card';
import { SlackIntegrationCard } from './slack-integration-card';
import { JiraIntegrationCard } from './jira-integration-card';

interface IntegrationsSettingsProps {
  orgId: string;
}

export function IntegrationsSettings({ orgId }: IntegrationsSettingsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <GitHubIntegrationCard orgId={orgId} />
      <SlackIntegrationCard orgId={orgId} />
      <JiraIntegrationCard orgId={orgId} />
    </div>
  );
}

