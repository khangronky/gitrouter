export function IntroSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden" id="intro">
      {/* Subtle background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-landing-accent/[0.02] to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main statement */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-landing-text leading-tight tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-landing-accent to-landing-accent-light">
              GitRouter
            </span>{' '}
            eliminates the chaos of manual code review assignment.
          </h2>

          {/* Supporting copy */}
          <div className="mt-8 md:mt-10 space-y-6">
            <p className="text-xl md:text-2xl text-landing-text-muted leading-relaxed font-light">
              We built this because every engineering team deserves to{' '}
              <span className="text-landing-text font-medium">
                ship faster
              </span>{' '}
              without the overhead of coordinating reviewers. No more Slack
              messages asking "who can review this?" No more pull requests
              sitting idle for days.
            </p>

            <p className="text-xl md:text-2xl text-landing-text-muted leading-relaxed font-light">
              GitRouter intelligently matches every PR to the{' '}
              <span className="text-landing-text font-medium">
                right reviewer
              </span>{' '}
              based on expertise, workload, and availability—automatically. Your
              rules, your workflow, zero manual effort.
            </p>

            <p className="text-lg md:text-xl text-landing-text-muted leading-relaxed">
              Our goal:{' '}
              <span className="text-landing-text font-semibold">
                let your code flow
              </span>
              , not your time. Because the best engineering teams aren't slowed
              down by process—they're{' '}
              <span className="text-landing-text font-medium">
                accelerated by it
              </span>
              .
            </p>
          </div>

          {/* Visual separator */}
          <div className="mt-12 md:mt-16 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-landing-border to-transparent" />
            <div className="h-2 w-2 rounded-full bg-landing-accent/50" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-landing-border to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

