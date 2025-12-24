'use client';

import { Check, Loader2, ArrowLeft, ArrowRight, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSlackIntegration, useGetSlackOAuthUrl } from '@/lib/api/slack';
import { toast } from 'sonner';

interface SlackStepProps {
  onNext: () => void;
  onBack: () => void;
  orgId: string;
}

export function SlackStep({ onNext, onBack, orgId }: SlackStepProps) {
  const { data: slackData, isLoading } = useSlackIntegration(orgId);
  const getOAuthUrl = useGetSlackOAuthUrl();

  const isConnected = !!slackData?.integration;

  const handleConnect = async () => {
    try {
      const result = await getOAuthUrl.mutateAsync({ orgId, onboarding: true });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to get Slack OAuth URL:', error);
      toast.error('Failed to connect to Slack. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <MessageSquare className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Connect Slack</h2>
        <p className="text-muted-foreground text-sm">
          Get notified in Slack when pull requests need review or when reviews
          are completed.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">What you&apos;ll get:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Instant notifications for new review requests
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Reminders for pending reviews
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Team mentions in your preferred channel
          </li>
        </ul>
      </div>

      {isConnected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="size-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Slack connected: {slackData.integration?.team_name}
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
              <MessageSquare className="size-4 mr-2" />
              Connect Slack
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

