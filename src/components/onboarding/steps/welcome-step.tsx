'use client';

import { GitBranch, Users, Bell, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/user-store';

interface WelcomeStepProps {
  onNext: () => void;
  onSkipAll: () => void;
}

const features = [
  {
    icon: GitBranch,
    title: 'Automated PR Routing',
    description:
      'Assign reviewers based on file patterns, branches, or authors',
  },
  {
    icon: Users,
    title: 'Team Management',
    description: 'Organize reviewers and balance workload across your team',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Get notified via Slack when reviews need attention',
  },
  {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Connect with Jira to track issues and sync status',
  },
];

export function WelcomeStep({ onNext, onSkipAll }: WelcomeStepProps) {
  const { user } = useUserStore();
  const userName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="text-4xl mb-4">👋</div>
        <h2 className="text-2xl font-bold">
          Welcome to GitRouter, {userName}!
        </h2>
        <p className="text-muted-foreground">
          Let&apos;s get you set up in just a few minutes. We&apos;ll help you
          connect your tools and create your first routing rule.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="flex gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
          >
            <div className="shrink-0">
              <feature.icon className="size-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onSkipAll}>
          Skip Setup
        </Button>
        <Button onClick={onNext}>Get Started</Button>
      </div>
    </div>
  );
}
