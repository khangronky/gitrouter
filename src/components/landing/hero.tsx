import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconPlayerPlay } from '@tabler/icons-react';

// Decorative floating shapes component
function FloatingShapes() {
  return (
    <>
      {/* Left side decorations */}
      <div className="absolute left-4 top-32 md:left-12 lg:left-24">
        <div className="relative">
          {/* Main character - blue circle with eyes */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-blue-500/30">
            <div className="flex gap-2">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full" />
              <div className="w-2 h-2 md:w-3 md:h-3 bg-white rounded-full" />
            </div>
          </div>
          {/* Small triangle */}
          <div 
            className="absolute -bottom-8 -left-4 w-0 h-0 animate-float"
            style={{ 
              animationDelay: '0.5s',
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '14px solid #f472b6'
            }}
          />
        </div>
      </div>
      
      <div className="absolute left-8 bottom-48 md:left-16 lg:left-32">
        {/* Orange character with cap */}
        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-orange-500/30" style={{ animationDelay: '1s' }}>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 bg-white rounded-full" />
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          {/* Cap */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full" />
        </div>
        {/* Small blue diamond */}
        <div 
          className="absolute -right-6 top-2 w-3 h-3 bg-blue-400 rotate-45 animate-float"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      {/* Right side decorations */}
      <div className="absolute right-4 top-40 md:right-12 lg:right-24">
        <div className="relative">
          {/* Group of characters */}
          <div className="flex -space-x-2">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-green-500/30 z-10">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
            <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-red-500/30 z-20" style={{ animationDelay: '0.3s' }}>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-white rounded-full" />
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
              {/* Cap */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-4 bg-gradient-to-r from-red-600 to-red-700 rounded-t-full" />
            </div>
          </div>
          {/* Pink circle */}
          <div 
            className="absolute -bottom-4 right-0 w-4 h-4 bg-pink-500 rounded-full animate-float"
            style={{ animationDelay: '0.8s' }}
          />
        </div>
      </div>

      <div className="absolute right-8 bottom-56 md:right-20 lg:right-40">
        {/* Another character group */}
        <div className="relative">
          <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-amber-500/30" style={{ animationDelay: '0.6s' }}>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 bg-white rounded-full" />
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
            {/* Sprout/antenna */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-4 bg-green-500 rounded-full">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-green-400 rounded-full" />
            </div>
          </div>
          {/* Diamond shape */}
          <div 
            className="absolute -left-4 bottom-0 w-4 h-4 bg-cyan-400 rotate-45 animate-float"
            style={{ animationDelay: '1.2s' }}
          />
        </div>
      </div>
    </>
  );
}


export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-landing-bg via-landing-bg to-transparent" />
      
      {/* Floating decorative shapes */}
      <div className="hidden md:block">
        <FloatingShapes />
      </div>

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-16 md:pt-24">
        {/* Headline */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-landing-text sm:text-5xl md:text-6xl lg:text-7xl">
            Stop Wasting Time
            <br />
            <span className="text-landing-text/90">Assigning Reviewers</span>
          </h1>
          
          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-landing-text-muted md:text-xl">
            Automatically route pull requests to the right reviewers, track review bottlenecks, and keep your team shipping faster.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group border-landing-border bg-transparent text-landing-text hover:border-landing-text/40 hover:bg-landing-card"
            >
              <Link href="#demo" className="flex items-center gap-2">
                <IconPlayerPlay className="h-4 w-4 transition-transform group-hover:scale-110" />
                Watch Demo
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-landing-accent hover:bg-landing-accent-light shadow-lg shadow-landing-accent/25"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>

        {/* Product Preview */}
        <div className="mt-16 md:mt-24">
          <div className="relative mx-auto max-w-4xl">
            {/* Glow effect behind the preview */}
            <div className="absolute -inset-4 bg-gradient-to-r from-landing-accent/20 via-landing-accent/10 to-landing-accent/20 blur-3xl opacity-50" />
            
            {/* Preview container */}
            <div className="relative overflow-hidden rounded-xl border border-landing-border bg-landing-card shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-landing-border bg-landing-card px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="mx-auto max-w-md rounded-md bg-white/5 px-4 py-1 text-center text-xs text-white/40">
                    app.gitrouter.io
                  </div>
                </div>
              </div>
              
              {/* Dashboard preview content - matches actual dashboard layout */}
              <div className="flex">
                {/* Sidebar skeleton */}
                <div className="hidden md:flex w-48 flex-col border-r border-landing-border bg-landing-skeleton p-3">
                  {/* Workspace switcher */}
                  <div className="mb-4 h-9 w-full rounded-lg bg-landing-skeleton-strong" />
                  
                  {/* Nav items */}
                  <div className="space-y-1">
                    <div className="h-8 w-full rounded-md bg-landing-accent/20" /> {/* Active item */}
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                  </div>
                  
                  {/* Bottom nav */}
                  <div className="mt-auto space-y-1 pt-4">
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                    <div className="h-8 w-full rounded-md bg-landing-skeleton-strong" />
                  </div>
                  
                  {/* User avatar */}
                  <div className="mt-3 flex items-center gap-2 pt-3 border-t border-landing-border">
                    <div className="h-8 w-8 rounded-full bg-landing-skeleton-strong" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-20 rounded bg-landing-skeleton-strong" />
                      <div className="h-2 w-16 rounded bg-landing-skeleton" />
                    </div>
                  </div>
                </div>
                
                {/* Main content area */}
                <div className="flex-1 p-4 space-y-4">
                  {/* Header with title and time range toggle */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-6 w-24 rounded bg-landing-skeleton-strong" />
                      <div className="h-3 w-40 rounded bg-landing-skeleton" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-7 w-20 rounded-md bg-landing-skeleton" />
                      <div className="h-7 w-20 rounded-md bg-landing-skeleton" />
                      <div className="h-7 w-20 rounded-md bg-landing-accent/30" />
                    </div>
                  </div>

                  {/* KPI Row - 4 cards */}
                  <div className="grid grid-cols-4 gap-3">
                    {['Total PRs', 'Pending', 'SLA', 'Approved'].map((_, i) => (
                      <div key={i} className="rounded-lg border border-landing-border bg-landing-skeleton p-3">
                        <div className="h-3 w-16 rounded bg-landing-skeleton-strong mb-2" />
                        <div className="h-6 w-12 rounded bg-landing-skeleton-strong" />
                        <div className="mt-1 flex items-center gap-1">
                          <div className={`h-3 w-8 rounded ${i % 2 === 0 ? 'bg-green-500/30' : 'bg-red-500/30'}`} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row - Latency (2/3) + Workload (1/3) */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* Latency Chart */}
                    <div className="col-span-2 rounded-lg border border-landing-border bg-landing-skeleton p-3">
                      <div className="h-4 w-28 rounded bg-landing-skeleton-strong mb-3" />
                      <div className="flex items-end gap-1 h-20">
                        {[40, 60, 45, 80, 55, 70, 50].map((h, i) => (
                          <div 
                            key={i} 
                            className="flex-1 rounded-t bg-gradient-to-t from-landing-accent/40 to-landing-accent/20"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                          <div key={d} className="h-2 w-6 rounded bg-landing-skeleton" />
                        ))}
                      </div>
                    </div>
                    
                    {/* Workload Chart */}
                    <div className="rounded-lg border border-landing-border bg-landing-skeleton p-3">
                      <div className="h-4 w-24 rounded bg-landing-skeleton-strong mb-3" />
                      <div className="space-y-2">
                        {[75, 60, 45, 30].map((w, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-5 w-5 rounded-full bg-landing-skeleton-strong" />
                            <div className="flex-1 h-3 rounded-full bg-landing-skeleton-strong overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-landing-accent/60 to-landing-accent/30 rounded-full"
                                style={{ width: `${w}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row - Bottlenecks (2/4) + Stale PRs (1/4) + Activity (1/4) */}
                  <div className="grid grid-cols-4 gap-3">
                    {/* Bottlenecks Table */}
                    <div className="col-span-2 rounded-lg border border-landing-border bg-landing-skeleton p-3">
                      <div className="h-4 w-20 rounded bg-landing-skeleton-strong mb-3" />
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-2 py-1 border-b border-landing-border">
                            <div className="h-4 w-24 rounded bg-landing-skeleton-strong" />
                            <div className="flex-1" />
                            <div className="h-4 w-8 rounded bg-orange-500/30" />
                            <div className="h-4 w-12 rounded bg-landing-skeleton" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Stale PRs */}
                    <div className="rounded-lg border border-landing-border bg-landing-skeleton p-3">
                      <div className="h-4 w-16 rounded bg-landing-skeleton-strong mb-3" />
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-yellow-500/20" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 w-full rounded bg-landing-skeleton-strong" />
                              <div className="h-2 w-2/3 rounded bg-landing-skeleton" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Recent Activity */}
                    <div className="rounded-lg border border-landing-border bg-landing-skeleton p-3">
                      <div className="h-4 w-16 rounded bg-landing-skeleton-strong mb-3" />
                      <div className="space-y-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="h-5 w-5 rounded-full bg-blue-500/20" />
                            <div className="flex-1 space-y-1">
                              <div className="h-3 w-full rounded bg-landing-skeleton-strong" />
                              <div className="h-2 w-1/2 rounded bg-landing-skeleton" />
                            </div>
                          </div>
                        ))}
                      </div>
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
