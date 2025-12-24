'use client';

import {
  Check,
  Loader2,
  ArrowLeft,
  ArrowRight,
  TicketCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJiraIntegration, useGetJiraOAuthUrl } from '@/lib/api/jira';
import { toast } from 'sonner';

interface JiraStepProps {
  onNext: () => void;
  onBack: () => void;
  orgId: string;
}

export function JiraStep({ onNext, onBack, orgId }: JiraStepProps) {
  const { data: jiraData, isLoading } = useJiraIntegration(orgId);
  const getOAuthUrl = useGetJiraOAuthUrl();

  const isConnected = !!jiraData?.integration;

  const handleConnect = async () => {
    try {
      const result = await getOAuthUrl.mutateAsync({ orgId, onboarding: true });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to get Jira OAuth URL:', error);
      toast.error('Failed to connect to Jira. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <TicketCheck className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Connect Jira</h2>
        <p className="text-muted-foreground text-sm">
          Link pull requests to Jira tickets and automatically update issue
          status when PRs are merged.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">What you&apos;ll get:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Auto-link PRs to Jira tickets from branch names
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Update ticket status when PRs are merged
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            View linked tickets in your dashboard
          </li>
        </ul>
      </div>

      {isConnected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="size-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Jira connected:{' '}
            {jiraData.integration?.site_name || jiraData.integration?.site_url}
          </span>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Skip
          </Button>
          {isConnected ? (
            <Button onClick={onNext}>
              Continue
              <ArrowRight className="size-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={getOAuthUrl.isPending || isLoading}
            >
              {(getOAuthUrl.isPending || isLoading) && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              <TicketCheck className="size-4 mr-2" />
              Connect Jira
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
