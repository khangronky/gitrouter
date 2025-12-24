'use client';

import { Check, ArrowLeft, Rocket, LayoutDashboard, Settings, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGitHubInstallation } from '@/lib/api/github';
import { useSlackIntegration } from '@/lib/api/slack';
import { useJiraIntegration } from '@/lib/api/jira';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

interface CompletionStepProps {
  onComplete: () => void;
  onBack: () => void;
}

interface SetupItem {
  label: string;
  isComplete: boolean;
}

export function CompletionStep({ onComplete, onBack }: CompletionStepProps) {
  const { currentOrgId } = useCurrentOrganization();
  const { data: githubData } = useGitHubInstallation(currentOrgId || '');
  const { data: slackData } = useSlackIntegration(currentOrgId || '');
  const { data: jiraData } = useJiraIntegration(currentOrgId || '');

  const setupItems: SetupItem[] = [
    { label: 'GitHub connected', isComplete: !!githubData?.installation },
    { label: 'Slack connected', isComplete: !!slackData?.integration },
    { label: 'Jira connected', isComplete: !!jiraData?.integration },
  ];

  const completedCount = setupItems.filter((item) => item.isComplete).length;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
          <Rocket className="size-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
        <p className="text-muted-foreground">
          Great job! Your workspace is ready. Here&apos;s what you&apos;ve set up:
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm mb-3">Setup Summary</h3>
        <div className="space-y-2">
          {setupItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm"
            >
              <div
                className={`size-5 rounded-full flex items-center justify-center ${
                  item.isComplete
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.isComplete ? (
                  <Check className="size-3" />
                ) : (
                  <span className="text-xs">-</span>
                )}
              </div>
              <span className={item.isComplete ? '' : 'text-muted-foreground'}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        {completedCount < 3 && (
          <p className="text-xs text-muted-foreground mt-3">
            You can always connect more integrations later in Settings.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-medium text-sm">What&apos;s Next?</h3>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
            <LayoutDashboard className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">View Dashboard</p>
              <p className="text-xs text-muted-foreground">
                Monitor your team&apos;s PR activity
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
            <Settings className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Configure Settings</p>
              <p className="text-xs text-muted-foreground">
                Fine-tune notifications and integrations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-background">
            <BookOpen className="size-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Read Documentation</p>
              <p className="text-xs text-muted-foreground">
                Learn about advanced routing rules
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <Button onClick={onComplete} size="lg">
          <Rocket className="size-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}


