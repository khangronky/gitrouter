'use client';

import React from 'react';
import {
  ChartColumnIncreasing,
  ChartLine,
  Factory,
  List,
  Settings,
  HelpCircle,
  BookOpen,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Clock,
  Users,
  GitPullRequest,
  BarChart3,
  Zap,
  Shield,
} from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import Link from 'next/link';
import { useGitHubInstallation } from '@/lib/api/github';
import { useRoutingRules } from '@/lib/api/rules';
import { useCurrentOrganization } from '@/hooks/use-current-organization';

const pageGuides = [
  {
    title: 'Dashboard',
    icon: ChartColumnIncreasing,
    url: '/dashboard',
    description:
      'Your central hub for monitoring PR activity and team performance',
    features: [
      'View real-time PR statistics and metrics',
      'Monitor reviewer workload distribution',
      'Track stale PRs and bottlenecks',
      'Filter data by time range (7 days, 30 days, 3 months)',
    ],
  },
  {
    title: 'Pull Requests',
    icon: List,
    url: '/pull-requests',
    description: 'Browse and manage all pull requests in your organization',
    features: [
      'View all open and closed PRs',
      'Filter by status, author, or reviewer',
      'Quick access to PR details and GitHub links',
      'Track review progress and comments',
    ],
  },
  {
    title: 'Rules Builder',
    icon: Factory,
    url: '/rules-builder',
    description: 'Create and manage automated reviewer assignment rules',
    features: [
      'Define rules based on file patterns',
      'Auto-assign reviewers by author or branch',
      'Set priority levels for rule execution',
      'Enable/disable rules as needed',
    ],
  },
  {
    title: 'Trend Analytics',
    icon: ChartColumnIncreasing,
    url: '/trend',
    description: 'Analyze historical trends in your PR workflow',
    features: [
      'PR Review Speed and SLA Compliance trends',
      'PR Volume and Size Distribution over time',
      'Rework Rate and Approval Rate analysis',
      'First Response Time tracking',
    ],
  },
  {
    title: 'Performance',
    icon: ChartLine,
    url: '/performance',
    description: 'Deep dive into individual and team performance metrics',
    features: [
      'Repository comparison charts',
      'Reviewer quality scores (Radar chart)',
      'Response time analysis by hour',
      'Bottleneck frequency tracking',
    ],
  },
  {
    title: 'Settings',
    icon: Settings,
    url: '/settings',
    description: 'Configure your GitRouter preferences',
    features: [
      'Manage organization settings',
      'Configure notification preferences',
      'Set up integrations',
      'Customize display options',
    ],
  },
];

const quickTips = [
  {
    icon: Zap,
    title: 'Sortable Tables',
    description:
      'Click column headers in Rules Builder to sort data ascending or descending',
  },
  {
    icon: Clock,
    title: 'Time Range Filters',
    description:
      'Use the time range toggle on Dashboard to focus on recent or historical data',
  },
  {
    icon: Shield,
    title: 'Rule Priority',
    description:
      'Higher priority rules (lower number) are evaluated first in the Rules Builder',
  },
  {
    icon: Users,
    title: 'Chart Tooltips',
    description:
      'Hover over any chart element to see detailed data values and insights',
  },
];

const faqs = [
  {
    question: 'How do I connect my GitHub organization?',
    answer:
      'Navigate to Settings and click "Connect GitHub" in the Integrations section. You\'ll be redirected to GitHub to authorize the GitRouter app. You\'ll need admin permissions for your GitHub organization to complete the installation. Once connected, GitRouter will automatically sync your repositories and team members.',
  },
  {
    question: 'How do routing rules work?',
    answer:
      'Routing rules automatically assign reviewers when a new PR is opened. Each rule has conditions (like file patterns, branch names, or PR authors) and a list of reviewers to assign when conditions match. Rules are evaluated by priority (lower number = higher priority), and the first matching rule assigns its reviewers. You can create multiple rules to handle different parts of your codebase.',
  },
  {
    question: 'Can I integrate GitRouter with Slack?',
    answer:
      'Yes! Go to Settings > Integrations and click "Connect Slack". Once connected, you can receive notifications for PR assignments, reviews, and bottlenecks directly in your Slack channels. You can customize which events trigger notifications in your notification preferences.',
  },
  {
    question: 'What file patterns can I use in routing rules?',
    answer:
      'GitRouter supports glob patterns for file matching. Examples: "*.tsx" matches all TSX files, "src/api/**" matches everything in the api folder, "**/*.test.ts" matches all test files. You can combine multiple patterns separated by commas, and use "any" or "all" match modes.',
  },
  {
    question: 'How is reviewer workload calculated?',
    answer:
      'Workload is calculated based on the number of open PRs currently assigned to a reviewer. The workload chart shows distribution across your team. You can set capacity limits per reviewer in Settings, and GitRouter will consider workload when suggesting reviewers to help balance the load.',
  },
  {
    question: 'What do the dashboard metrics mean?',
    answer:
      'The dashboard shows key metrics: "Open PRs" is the count of unmerged PRs, "Avg Review Time" is the average time from PR open to first review, "Merge Rate" is the percentage of PRs merged vs closed, and "Bottlenecks" shows PRs waiting too long for review. Use the time range filter to compare different periods.',
  },
  {
    question: 'How do I identify bottlenecks in my workflow?',
    answer:
      'Check the Bottlenecks table on the Dashboard for PRs that have been waiting longest for review. The Performance page shows detailed bottleneck frequency by repository and author. Common causes include unbalanced workload, missing routing rules, or reviewers being unavailable.',
  },
  {
    question: 'Can I connect Jira to track issues?',
    answer:
      'Yes, GitRouter integrates with Jira. Go to Settings > Integrations and click "Connect Jira". Once connected, GitRouter can link PRs to Jira issues and display issue context alongside your PR data for better traceability.',
  },
  {
    question: 'How do I add team members as reviewers?',
    answer:
      'Team members are automatically synced from your GitHub organization as collaborators. Go to Settings > Team Members to view and manage your team. You can then assign them as reviewers in your routing rules or manually on individual PRs.',
  },
  {
    question: "What's the difference between Trend and Performance pages?",
    answer:
      'The Trend page shows how your metrics change over time (weekly/monthly trends for review speed, PR volume, etc.). The Performance page provides deeper analysis including repository comparisons, individual reviewer metrics, and identifies specific areas for improvement.',
  },
];

// Step indicator component
function StepIndicator({
  stepNumber,
  completed,
}: {
  stepNumber: number;
  completed: boolean;
}) {
  if (completed) {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
        <CheckCircle2 className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
      {stepNumber}
    </span>
  );
}

// LocalStorage key for visit-based step completion (dashboard, trends)
const VISITS_STORAGE_KEY = 'gitrouter-getting-started-visits';

// Step definitions with type: 'action' (API-detected) or 'visit' (localStorage)
const steps = [
  {
    id: 'github',
    type: 'action' as const,
    label: 'Connect your GitHub organization',
    description: 'in Settings to sync your repositories and team members.',
    url: '/settings',
  },
  {
    id: 'rules',
    type: 'action' as const,
    label: 'Create routing rules',
    description: 'in the Rules Builder to automate reviewer assignments.',
    url: '/rules-builder',
  },
  {
    id: 'dashboard',
    type: 'visit' as const,
    label: 'Monitor your Dashboard',
    description: 'to track PR metrics, bottlenecks, and team workload.',
    url: '/dashboard',
  },
  {
    id: 'trends',
    type: 'visit' as const,
    label: 'Analyze trends',
    description: 'in the Analytics section to identify areas for improvement.',
    url: '/trend',
  },
];

export default function SupportPage() {
  const [visitedSteps, setVisitedSteps] = React.useState<string[]>([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Get current organization for API queries
  const { currentOrgId } = useCurrentOrganization();

  // API hooks for action-based step completion detection
  const { data: githubData, isLoading: githubLoading } = useGitHubInstallation(
    currentOrgId || ''
  );
  const { data: rulesData, isLoading: rulesLoading } = useRoutingRules(
    currentOrgId || ''
  );

  // Determine completion status from API data
  const isGitHubConnected = !!githubData?.installation;
  const hasRoutingRules = (rulesData?.rules?.length ?? 0) > 0;

  // Load visited steps from localStorage on mount
  React.useEffect(() => {
    const stored = localStorage.getItem(VISITS_STORAGE_KEY);
    if (stored) {
      try {
        setVisitedSteps(JSON.parse(stored));
      } catch {
        setVisitedSteps([]);
      }
    }
    setIsHydrated(true);
  }, []);

  // Mark a visit-based step as complete (only for visit type steps)
  const markVisitComplete = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (step?.type !== 'visit') return; // Only track visits for visit-type steps

    setVisitedSteps((prev) => {
      if (prev.includes(stepId)) return prev;
      const updated = [...prev, stepId];
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Check if a step is completed based on its type
  const isStepCompleted = (stepId: string): boolean => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return false;

    if (step.type === 'action') {
      // Action steps use API data for completion
      if (stepId === 'github') return isGitHubConnected;
      if (stepId === 'rules') return hasRoutingRules;
      return false;
    }
    // Visit steps use localStorage
    return visitedSteps.includes(stepId);
  };

  // Calculate completed count
  const completedCount = steps.filter((step) =>
    isStepCompleted(step.id)
  ).length;
  const totalSteps = steps.length;
  const isDataLoading = githubLoading || rulesLoading;

  return (
    <section className="p-4 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <HelpCircle className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Support Center</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Welcome to GitRouter! This guide will help you understand and navigate
          the application. Explore the sections below to get the most out of
          your PR management workflow.
        </p>
      </div>

      {/* Getting Started */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-xl">Getting Started</CardTitle>
              <span className="text-sm text-muted-foreground">
                {isHydrated && !isDataLoading ? completedCount : 0}/{totalSteps}{' '}
                completed
              </span>
            </div>
            <CardDescription className="text-base mb-4">
              GitRouter helps you automate and optimize your PR review workflow.
              Complete these steps to get started:
            </CardDescription>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{
                  width: `${isHydrated && !isDataLoading ? (completedCount / totalSteps) * 100 : 0}%`,
                }}
              />
            </div>

            <ol className="space-y-4">
              {steps.map((step, index) => {
                const completed =
                  isHydrated && !isDataLoading && isStepCompleted(step.id);
                return (
                  <li key={step.id} className="flex items-start gap-3">
                    <StepIndicator
                      stepNumber={index + 1}
                      completed={completed}
                    />
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <span
                        className={
                          completed ? 'text-muted-foreground line-through' : ''
                        }
                      >
                        <strong>{step.label}</strong> {step.description}
                      </span>
                      <Link
                        href={step.url}
                        onClick={() => markVisitComplete(step.id)}
                      >
                        <Button
                          variant={completed ? 'ghost' : 'outline'}
                          size="sm"
                          className="h-7 gap-1 shrink-0 cursor-pointer"
                        >
                          {completed ? 'Revisit' : 'Go'}{' '}
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </Card>

      {/* Quick Tips */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Quick Tips</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickTips.map((tip) => (
            <Card key={tip.title} className="p-4">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="p-2 rounded-full bg-primary/10">
                  <tip.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-sm">{tip.title}</CardTitle>
                <CardDescription className="text-xs">
                  {tip.description}
                </CardDescription>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Page Guides */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <GitPullRequest className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Page Guide</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {pageGuides.map((page) => (
            <Card
              key={page.title}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <page.icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{page.title}</CardTitle>
                    <Link href={page.url}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 cursor-pointer"
                      >
                        Go <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <CardDescription className="text-sm mt-1 mb-3">
                    {page.description}
                  </CardDescription>
                  <ul className="space-y-1">
                    {page.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        <Card className="p-4">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`}>
                <AccordionTrigger className="text-left cursor-pointer">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </div>
    </section>
  );
}
