'use client';

import Link from 'next/link';
import { IconArrowRight, IconPlayerPlay } from '@tabler/icons-react';

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background with gradient and glow effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-landing-accent/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-landing-accent/20 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Main heading */}
          <h2 className="text-3xl md:text-5xl font-bold text-landing-text mb-6 leading-tight">
            Ready to Stop Wasting Time on{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-landing-accent to-landing-accent-light">
              Reviewer Assignment
            </span>
            ?
          </h2>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-landing-text-muted mb-10 max-w-2xl mx-auto">
            Automate your PR workflows and eliminate review bottlenecks. Get
            started in minutes with our simple setup.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-landing-accent text-white font-semibold rounded-xl transition-all duration-200 hover:bg-landing-accent-light hover:scale-105 shadow-lg shadow-landing-accent/25"
            >
              Get Started Free
              <IconArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="#demo"
              className="group inline-flex items-center gap-2 px-8 py-4 border border-landing-border bg-landing-card text-landing-text font-semibold rounded-xl transition-all duration-200 hover:border-landing-accent/50 hover:bg-landing-card-hover"
            >
              <IconPlayerPlay className="h-5 w-5" />
              Watch Demo
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-8 text-sm text-landing-text-muted">
            No credit card required • Setup in under 5 minutes • Free tier
            available
          </p>
        </div>

        {/* Decorative elements */}
        <div className="mt-16 flex justify-center">
          <div className="flex items-center gap-6 px-6 py-3 rounded-full border border-landing-border bg-landing-card/50 backdrop-blur-sm">
            <div className="flex -space-x-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-landing-skeleton-strong border-2 border-landing-bg flex items-center justify-center text-xs font-medium text-landing-text-muted"
                >
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-landing-text-muted">
              <span className="text-landing-text font-medium">
                Built for teams
              </span>{' '}
              who value their time
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
