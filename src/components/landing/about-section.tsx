'use client';

import {
  IconUsers,
  IconBolt,
  IconTarget,
  IconBrandGithub,
  IconBrandSlack,
  IconTool,
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

const integrations = [
  {
    icon: IconBrandGithub,
    name: 'GitHub',
    description: 'One-click installation',
  },
  { icon: IconBrandSlack, name: 'Slack', description: 'Instant notifications' },
  { icon: IconTool, name: 'Jira', description: 'Bidirectional sync' },
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
          <h3 className="text-xl font-semibold text-landing-text mb-6">
            Works Where Your Team Already Lives
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {integrations.map((integration, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 px-6 py-3 rounded-xl border border-landing-border bg-landing-card',
                  'transition-all duration-200 hover:border-landing-accent/30 hover:scale-105'
                )}
              >
                <integration.icon className="h-6 w-6 text-landing-text" />
                <div className="text-left">
                  <div className="font-medium text-landing-text">
                    {integration.name}
                  </div>
                  <div className="text-xs text-landing-text-muted">
                    {integration.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
