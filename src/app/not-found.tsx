'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Background particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/8 left-1/8 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl" />
        <div className="absolute right-1/8 bottom-1/8 h-96 w-96 rounded-full bg-primary-500/10 blur-3xl" />

        {/* Decoration elements */}
        <div className="absolute top-20 left-10 h-3 w-3 rounded-full bg-primary-500/60" />
        <div className="absolute top-40 right-20 h-2 w-2 rounded-full bg-primary-500/40" />
        <div className="absolute bottom-32 left-1/4 h-4 w-4 rounded-full bg-primary-500/30" />
        <div className="absolute right-1/3 bottom-20 h-2 w-2 rounded-full bg-primary-500/50" />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Creative 404 Symbol */}
        <div className="relative mb-8">
          {/* Glitch effect container */}
          <div className="relative inline-block">
            {/* Main 404 */}
            <h1 className="select-none bg-linear-to-b from-primary-500 via-primary-600 to-primary-700 bg-clip-text font-black text-[12rem] text-transparent leading-none tracking-normal md:text-[16rem]">
              404
            </h1>
          </div>
        </div>

        {/* Friendly Messages */}
        <div className="mb-10 space-y-4">
          <h2 className="font-bold text-2xl text-foreground md:text-3xl">
            Oops! Looks like you&apos;re lost in the void
          </h2>
          <p className="mx-auto max-w-lg text-lg text-muted-foreground md:text-xl">
            The page you&apos;re looking for doesn&apos;t exist. Don&apos;t
            worry, even the best explorers take wrong turns sometimes!
          </p>
          <p className="text-muted-foreground/70 text-sm">
            Maybe the link is broken, or perhaps this page never existed. Either
            way, let&apos;s get you back on track.
          </p>
        </div>

        {/* CTA Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-3 rounded-xl bg-primary-500 px-8 py-4 font-semibold text-lg text-white hover:bg-primary-600"
        >
          {/* Arrow icon */}
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>

          <span>Back to Home</span>
        </Link>

        {/* Additional helpful text */}
        <p className="mt-8 text-muted-foreground/50 text-sm">
          If you believe this is an error, please contact support.
        </p>
      </div>
    </div>
  );
}
