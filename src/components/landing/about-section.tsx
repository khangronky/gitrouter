'use client';

import {
  IconUsers,
  IconBolt,
  IconTarget,
  IconBrandGithub,
  IconBrandSlack,
  IconTool,
  IconArrowRight,
  IconGitPullRequest,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const values = [
  {
    icon: IconBolt,
    title: 'Automated Assignment',
    description:
      'Eliminate manual reviewer assignment with intelligent automation that matches PRs to the right reviewers.',
  },
  {
    icon: IconTarget,
    title: 'Smart Routing Rules',
    description:
      'Build complex routing logic without code. Route by file patterns, branches, labels, and more.',
  },
  {
    icon: IconUsers,
    title: 'Unified Workflow',
    description:
      'GitHub + Slack + Jira in one seamless experience. No more context switching.',
  },
];

export function AboutSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-landing-accent/5 to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-landing-text mb-4">
            Why Engineering Teams Choose GitRouter
          </h2>
          <p className="text-lg text-landing-text-muted max-w-2xl mx-auto">
            Built by developers, for developers. We understand the pain of
            manual PR assignment because we've lived it. GitRouter is the
            solution we wish we had.
          </p>
        </div>

        {/* Value propositions */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {values.map((value, i) => (
            <div
              key={i}
              className={cn(
                'group relative p-6 rounded-2xl border border-landing-border bg-landing-card',
                'transition-all duration-300 hover:border-landing-accent/30 hover:bg-landing-card-hover',
                'opacity-0 animate-slide-in-up'
              )}
              style={{
                animationDelay: `${i * 100}ms`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Icon */}
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-landing-accent/10 ring-1 ring-landing-accent/20">
                <value.icon className="h-6 w-6 text-landing-accent-light" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-landing-text mb-2">
                {value.title}
              </h3>
              <p className="text-landing-text-muted">{value.description}</p>
            </div>
          ))}
        </div>

        {/* Integrations showcase */}
        <div className="text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-landing-text mb-3">
            Works Where Your Team Already Lives
          </h3>
          <p className="text-landing-text-muted mb-10 text-lg">
            Connect once, automate forever
          </p>

          {/* Integration Flow */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
            {/* GitHub - Source */}
            <div className="group relative">
              <div
                className={cn(
                  'flex flex-col items-center gap-3 px-8 py-6 rounded-2xl border-2 border-landing-border bg-landing-card',
                  'transition-all duration-300 hover:border-landing-accent/50 hover:bg-landing-card-hover hover:scale-105'
                )}
              >
                <div className="h-14 w-14 rounded-xl bg-[#24292e] flex items-center justify-center">
                  <IconBrandGithub className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-landing-text text-lg">
                    GitHub
                  </div>
                  <div className="text-sm text-landing-text-muted">
                    PR Created
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex items-center px-2">
              <div className="w-8 h-px bg-primary-500" />
              <IconArrowRight className="h-5 w-5 text-primary-500 -ml-1" />
            </div>
            <div className="md:hidden py-2">
              <IconArrowRight className="h-5 w-5 text-primary-500 rotate-90" />
            </div>

            {/* GitRouter - Center */}
            <div className="group relative">
              <div
                className={cn(
                  'flex flex-col items-center gap-3 px-10 py-7 rounded-2xl border-2 border-landing-accent/30 bg-gradient-to-br from-landing-accent/10 to-landing-accent/5',
                  'transition-all duration-300 hover:border-landing-accent/60 hover:scale-105',
                  'ring-4 ring-landing-accent/10'
                )}
              >
                <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-landing-accent to-landing-accent-light flex items-center justify-center shadow-lg shadow-landing-accent/30">
                  <IconGitPullRequest className="h-9 w-9 text-white" />
                </div>
                <div>
                  <div className="font-bold text-landing-text text-xl">
                    GitRouter
                  </div>
                  <div className="text-sm text-landing-text-muted">
                    Routes & Assigns
                  </div>
                </div>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex items-center px-2">
              <div className="w-8 h-px bg-primary-500" />
              <IconArrowRight className="h-5 w-5 text-primary-500 -ml-1" />
            </div>
            <div className="md:hidden py-2">
              <IconArrowRight className="h-5 w-5 text-primary-500 rotate-90" />
            </div>

            {/* Outputs - Slack & Jira */}
            <div className="flex flex-col gap-3">
              {/* Slack */}
              <div className="group relative">
                <div
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 rounded-xl border-2 border-landing-border bg-landing-card',
                    'transition-all duration-300 hover:border-landing-accent/50 hover:bg-landing-card-hover hover:scale-105'
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#4A154B] flex items-center justify-center">
                    <IconBrandSlack className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-landing-text">Slack</div>
                    <div className="text-xs text-landing-text-muted">
                      Instant notifications
                    </div>
                  </div>
                </div>
              </div>

              {/* Jira */}
              <div className="group relative">
                <div
                  className={cn(
                    'flex items-center gap-3 px-6 py-4 rounded-xl border-2 border-landing-border bg-landing-card',
                    'transition-all duration-300 hover:border-landing-accent/50 hover:bg-landing-card-hover hover:scale-105'
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-[#0052CC] flex items-center justify-center">
                    <IconTool className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-landing-text">Jira</div>
                    <div className="text-xs text-landing-text-muted">
                      Bidirectional sync
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
