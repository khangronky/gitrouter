'use client';

import { Github, Check, Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGitHubInstallation, useGetInstallUrl } from '@/lib/api/github';
import { toast } from 'sonner';

interface GitHubStepProps {
  onNext: () => void;
  onBack: () => void;
  orgId: string;
}

export function GitHubStep({ onNext, onBack, orgId }: GitHubStepProps) {
  const { data: installationData, isLoading } = useGitHubInstallation(orgId);
  const getInstallUrl = useGetInstallUrl();

  const isConnected = !!installationData?.installation;

  const handleConnect = async () => {
    try {
      const result = await getInstallUrl.mutateAsync({ orgId, onboarding: true });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Failed to get GitHub install URL:', error);
      toast.error('Failed to connect to GitHub. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Github className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Connect GitHub</h2>
        <p className="text-muted-foreground text-sm">
          Connect your GitHub account to start routing pull requests to the
          right reviewers automatically.
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <h3 className="font-medium text-sm">What you&apos;ll get:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Automatic reviewer assignments on new PRs
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Track PR status and review progress
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-green-500" />
            Sync collaborators as reviewers
          </li>
        </ul>
      </div>

      {isConnected && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <Check className="size-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            GitHub connected: {installationData.installation?.account_login}
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
              disabled={getInstallUrl.isPending || isLoading}
            >
              {(getInstallUrl.isPending || isLoading) && (
                <Loader2 className="size-4 mr-2 animate-spin" />
              )}
              <Github className="size-4 mr-2" />
              Connect GitHub
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

