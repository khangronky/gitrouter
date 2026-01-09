'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import {
  Github,
  GitMerge,
  GitPullRequest,
  MessageSquare,
  Ticket,
  Zap,
} from 'lucide-react';
import { useRef } from 'react';

export default function AuthBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prCardRef = useRef<HTMLDivElement>(null);
  const logicCardRef = useRef<HTMLDivElement>(null);
  const jiraCardRef = useRef<HTMLDivElement>(null);
  const slackCardRef = useRef<HTMLDivElement>(null);

  const line1Ref = useRef<HTMLDivElement>(null);
  const line2Ref = useRef<HTMLDivElement>(null);
  const line3Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const timeline = gsap.timeline();

      // Initial state setup
      gsap.set(
        [
          prCardRef.current,
          logicCardRef.current,
          jiraCardRef.current,
          slackCardRef.current,
        ],
        { opacity: 0, y: 20 }
      );
      gsap.set([line1Ref.current, line2Ref.current, line3Ref.current], {
        width: 0,
        opacity: 0.5,
      });

      // Animation sequence
      timeline
        // 1. GitHub PR Card appears
        .to(prCardRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'back.out(1.7)',
        })

        // 2. Line draws to Logic Core
        .to(line1Ref.current, {
          width: '80px',
          duration: 0.8,
          ease: 'power2.inOut',
        })

        // 3. Logic Core appears and pulses
        .to(
          logicCardRef.current,
          { opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' },
          '-=0.2'
        )
        .to(logicCardRef.current, {
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)',
          duration: 0.4,
          yoyo: true,
          repeat: 1,
        })

        // 4. Lines draw to destinations
        .to([line2Ref.current, line3Ref.current], {
          width: '80px',
          duration: 0.8,
          ease: 'power2.inOut',
        })

        // 5. Destination cards appear
        .to(
          [jiraCardRef.current, slackCardRef.current],
          {
            opacity: 1,
            y: 0,
            stagger: 0.2,
            duration: 0.6,
            ease: 'back.out(1.7)',
          },
          '-=0.4'
        );
    },
    { scope: containerRef }
  );

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-between bg-linear-to-br from-primary-100 via-primary-200 to-primary-100 px-6 py-12 dark:from-primary-700 dark:via-primary-600 dark:to-primary-700">
      {/* Background Gradients */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary-500/10 blur-[100px] dark:bg-white/10" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[40%] w-[40%] rounded-full bg-primary-500/10 blur-[100px] dark:bg-black/20" />
      </div>

      {/* Top Slogan */}
      <div className="z-10 mt-10 space-y-4 text-center">
        <h1 className="font-bold text-4xl text-foreground">
          Automate your workflow
        </h1>
        <p className="font-normal text-foreground/80 text-xl">
          From Code to Ticket, seamlessly.
        </p>
      </div>

      {/* Animation Canvas - Container Query Wrapper */}
      <div className="@container flex w-full flex-1 items-center justify-center overflow-hidden py-8">
        <div
          ref={containerRef}
          className="relative flex origin-center @2xl:scale-[1.0] @lg:scale-[0.8] @md:scale-[0.7] @xl:scale-[0.9] scale-[0.6] items-center justify-center"
        >
          {/* Step 1: GitHub PR */}
          <div
            ref={prCardRef}
            className="flex w-40 flex-col gap-3 rounded-xl border border-primary-500/20 bg-white/60 p-4 shadow-xl backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
          >
            <div className="flex items-center gap-2 text-foreground/80 text-sm">
              <Github className="h-4 w-4" />
              <span>gitrouter/core</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-500/20 p-2 text-green-600 dark:text-green-300">
                <GitPullRequest className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <div className="font-medium text-foreground">New Feature</div>
                <div className="text-muted-foreground">PR #124</div>
              </div>
            </div>
          </div>

          {/* Connector 1 */}
          <div
            ref={line1Ref}
            className="relative h-0.5 bg-primary-500/30 dark:bg-white/30"
          >
            <div className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(121,34,31,0.8)] dark:bg-white dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
          </div>

          {/* Step 2: Logic Core */}
          <div
            ref={logicCardRef}
            className="relative w-48 rounded-2xl bg-linear-to-br from-primary-500/30 to-primary-600/30 p-px dark:from-white/20 dark:to-white/5"
          >
            <div className="flex h-full w-full flex-col items-center rounded-2xl border border-primary-500/20 bg-white/60 p-5 text-center shadow-2xl backdrop-blur-md dark:border-white/20 dark:bg-white/10">
              <div className="mb-3 rounded-full bg-primary-500/20 p-3 text-primary-500 shadow-[0_0_15px_rgba(121,34,31,0.3)] dark:bg-white/20 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <GitMerge className="h-6 w-6" />
              </div>
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between rounded border border-primary-500/10 bg-primary-100/50 p-2 text-xs dark:border-white/10 dark:bg-black/20">
                  <span className="text-foreground">If</span>
                  <span className="font-medium text-green-600 dark:text-green-300">
                    PR Merged
                  </span>
                </div>
                <div className="flex justify-center text-foreground/50">
                  <Zap className="h-3 w-3" />
                </div>
                <div className="flex items-center justify-between rounded border border-primary-500/10 bg-primary-100/50 p-2 text-xs dark:border-white/10 dark:bg-black/20">
                  <span className="text-foreground">Then</span>
                  <span className="font-medium text-purple-600 dark:text-purple-300">
                    Auto-Sync
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Connectors Branching */}
          <div className="flex flex-col justify-center gap-16">
            {/* Top Branch */}
            <div className="flex items-center">
              <div
                ref={line2Ref}
                className="relative h-0.5 origin-left bg-primary-500/30 dark:bg-white/30"
                style={{
                  transform: 'rotate(-10deg)',
                  transformOrigin: '0 50%',
                  marginTop: '-20px',
                }}
              >
                <div className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(121,34,31,0.8)] dark:bg-white dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
            {/* Bottom Branch */}
            <div className="flex items-center">
              <div
                ref={line3Ref}
                className="relative h-0.5 origin-left bg-primary-500/30 dark:bg-white/30"
                style={{
                  transform: 'rotate(10deg)',
                  transformOrigin: '0 50%',
                  marginBottom: '-20px',
                }}
              >
                <div className="absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full bg-primary-500 shadow-[0_0_10px_rgba(121,34,31,0.8)] dark:bg-white dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
              </div>
            </div>
          </div>

          {/* Step 3: Destinations */}
          <div className="ml-4 flex flex-col gap-10">
            {/* Jira */}
            <div
              ref={jiraCardRef}
              className="flex w-44 items-center gap-3 rounded-lg border border-primary-500/20 bg-white/60 p-3 backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
            >
              <div className="rounded bg-[#0052CC] p-2 text-white">
                <Ticket className="h-5 w-5" />
              </div>
              <div>
                <div className="text-foreground text-xs">Jira Ticket</div>
                <div className="font-bold text-foreground text-sm">
                  Moved to Done
                </div>
              </div>
            </div>

            {/* Slack */}
            <div
              ref={slackCardRef}
              className="flex w-44 items-center gap-3 rounded-lg border border-primary-500/20 bg-white/60 p-3 backdrop-blur-sm dark:border-white/20 dark:bg-white/10"
            >
              <div className="rounded bg-[#4A154B] p-2 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <div className="text-foreground text-xs">Slack</div>
                <div className="font-bold text-foreground text-sm">
                  Team Notified
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
