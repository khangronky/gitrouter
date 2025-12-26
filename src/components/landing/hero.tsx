import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconGitPullRequest, IconPlayerPlay } from '@tabler/icons-react';
import {
  ChartColumnIncreasing,
  ChartLine,
  Factory,
  LifeBuoy,
  List,
  Settings,
} from 'lucide-react';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { WorkloadChart } from '@/components/dashboard/workload-chart';
import { BottlenecksTable } from '@/components/dashboard/bottlenecks-table';
import { StalePullRequests } from '@/components/dashboard/stale-pull-requests';
import { RecentActivity } from '@/components/dashboard/recent-activity';

// Dummy data for the dashboard preview
const dummyKpis = {
  totalPRs: { value: 47, delta: 12, note: 'from last period' },
  pending: { value: 8, delta: -15, note: 'from last period' },
  sla: { value: 0.94, delta: 5, note: 'from last period' },
  approved: { value: 39, delta: 18, note: 'from last period' },
};

const dummyLatencySeries = [
  { day: 'Mon', hours: 3.2 },
  { day: 'Tue', hours: 4.8 },
  { day: 'Wed', hours: 2.9 },
  { day: 'Thu', hours: 5.1 },
  { day: 'Fri', hours: 3.5 },
  { day: 'Sat', hours: 1.8 },
  { day: 'Sun', hours: 2.4 },
];

const dummyReviewerWorkload = [
  { name: 'Alice', assigned: 8, capacity: 10 },
  { name: 'Bob', assigned: 6, capacity: 10 },
  { name: 'Charlie', assigned: 4, capacity: 8 },
  { name: 'Diana', assigned: 3, capacity: 6 },
];

const dummyBottlenecks = [
  { repo: 'frontend-app', avg: '6.2h', pending: 5, sla: '78%' },
  { repo: 'api-service', avg: '4.1h', pending: 3, sla: '92%' },
  { repo: 'shared-libs', avg: '8.5h', pending: 7, sla: '65%' },
  { repo: 'infra-ops', avg: '10.2h', pending: 10, sla: '58%' },
  { repo: 'docs', avg: '2.3h', pending: 2, sla: '85%' },
  { repo: 'security', avg: '3.7h', pending: 4, sla: '72%' },
  { repo: 'monitoring', avg: '5.6h', pending: 6, sla: '68%' },
  { repo: 'testing', avg: '7.1h', pending: 8, sla: '63%' },
  { repo: 'deployment', avg: '9.3h', pending: 12, sla: '59%' },
  { repo: 'performance', avg: '11.4h', pending: 14, sla: '55%' },
  { repo: 'ux', avg: '13.5h', pending: 16, sla: '51%' },
  { repo: 'documentation', avg: '15.6h', pending: 18, sla: '47%' },
];

const dummyStalePRs = [
  { id: 1234, title: 'Add user authentication flow', age: '1d 4h' },
  { id: 1189, title: 'Fix pagination in dashboard', age: '18h' },
  { id: 1156, title: 'Update API rate limiting', age: '12h' },
];

const dummyRecentActivity = [
  {
    time: '2m ago',
    id: 1298,
    author: '@sarah',
    snippet: 'Implement dark mode toggle',
    assigned: ['@alice', '@bob'],
  },
  {
    time: '15m ago',
    id: 1297,
    author: '@mike',
    snippet: 'Add export to CSV feature',
    assigned: ['@charlie'],
  },
  {
    time: '1h ago',
    id: 1295,
    author: '@emma',
    snippet: 'Refactor notification system',
    assigned: ['@diana', '@alice'],
  },
];

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
              borderBottom: '14px solid #f472b6',
            }}
          />
        </div>
      </div>

      <div className="absolute left-8 bottom-48 md:left-16 lg:left-32">
        {/* Orange character with cap */}
        <div
          className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-orange-500/30"
          style={{ animationDelay: '1s' }}
        >
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
            <div
              className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-red-500/30 z-20"
              style={{ animationDelay: '0.3s' }}
            >
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
          <div
            className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center animate-float shadow-lg shadow-amber-500/30"
            style={{ animationDelay: '0.6s' }}
          >
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

// Static Sidebar Preview (mimics the real sidebar without hooks/context)
function SidebarPreview() {
  const navItems = [
    { icon: ChartColumnIncreasing, label: 'Dashboard', active: true },
    { icon: List, label: 'List', header: 'Pull Requests' },
    { icon: Factory, label: 'Rules Builder', header: 'Rules' },
    { icon: ChartColumnIncreasing, label: 'Trend', header: 'Analytics' },
    { icon: ChartLine, label: 'Performance' },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings' },
    { icon: LifeBuoy, label: 'Support' },
  ];

  return (
    <div className="w-16 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Logo / Workspace */}
      <div className="px-2 pb-2 pt-4">
        <div className="h-10 w-10 rounded-lg bg-primary-500 flex items-center justify-center mx-auto">
           <IconGitPullRequest className="h-5 w-5 text-white" />
         </div>
      </div>

      {/* Main nav */}
      <div className="flex-1 py-2">
        {navItems.map((item, i) => (
          <div key={i} className="px-2 py-0.5">
            <div
              className={`h-10 w-10 rounded-md flex items-center justify-center mx-auto transition-colors ${
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50'
              }`}
            >
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <div className="py-2 border-t border-sidebar-border">
        {bottomItems.map((item, i) => (
          <div key={i} className="px-2 py-0.5">
            <div className="h-10 w-10 rounded-md flex items-center justify-center mx-auto text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
              <item.icon className="h-5 w-5" />
            </div>
          </div>
        ))}
      </div>

      {/* User avatar */}
      <div className="p-2 border-t border-sidebar-border">
        <div className="h-10 w-10 rounded-lg bg-primary mx-auto flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-sm">JD</span>
        </div>
      </div>
    </div>
  );
}

// Dashboard Preview Component with actual UI components
function DashboardPreview() {
  // Content renders at 1700px, scales down to fit container
  // Actual rendered width: 1700 * 0.62 = 1054px
  const scale = 0.62;
  const contentWidth = 1725;
  const contentHeight = 1100;
  
  return (
    <div 
      className="relative w-full overflow-hidden bg-background rounded-b-xl"
      style={{ height: `${contentHeight * scale}px` }}
    >
      {/* Scaled container */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: `${contentWidth}px`,
          height: `${contentHeight}px`,
          transform: `scale(${scale})`,
        }}
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <SidebarPreview />

          {/* Main content area */}
          <div className="flex-1 p-4 space-y-4 select-none overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
                <p className="text-sm text-muted-foreground">
                  Showing data for the last 7 days
                </p>
              </div>
              <div className="flex gap-1 bg-muted rounded-lg p-1">
                <div className="h-8 px-3 rounded-md text-sm flex items-center text-muted-foreground">
                  Last 3 months
                </div>
                <div className="h-8 px-3 rounded-md text-sm flex items-center text-muted-foreground">
                  Last 30 days
                </div>
                <div className="h-8 px-3 rounded-md bg-background text-sm flex items-center text-foreground font-medium shadow-sm">
                  Last 7 days
                </div>
              </div>
            </div>

            {/* KPI Row */}
            <KpiRow kpis={dummyKpis} />

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-4">
              <LatencyChart latencySeries={dummyLatencySeries} className="col-span-2" />
              <WorkloadChart reviewerWorkload={dummyReviewerWorkload} />
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-4 gap-4">
              <BottlenecksTable bottlenecks={dummyBottlenecks} className="col-span-2" />
              <StalePullRequests stalePRs={dummyStalePRs} className="col-span-1" />
              <RecentActivity recentActivity={dummyRecentActivity} className="col-span-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade gradient - pointer-events-none so it doesn't block interactions */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent pointer-events-none" />
    </div>
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
      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16 md:pt-24">
        {/* Headline */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-landing-text sm:text-5xl md:text-6xl lg:text-7xl">
            Stop Wasting Time
            <br />
            <span className="text-landing-text/90">Assigning Reviewers</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-landing-text-muted md:text-xl">
            Automatically route pull requests to the right reviewers, track
            review bottlenecks, and keep your team shipping faster.
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
              <Link href="/register">Sign Up Now</Link>
            </Button>
          </div>
        </div>

        {/* Product Preview */}
        <div className="mt-16 md:mt-24 pb-8">
          <div className="relative mx-auto max-w-7xl p-4">
            {/* Glow effect behind the preview */}
            <div className="absolute inset-0 bg-gradient-to-r from-landing-accent/20 via-landing-accent/10 to-landing-accent/20 blur-3xl opacity-50" />

            {/* Preview container */}
            <div className="relative overflow-hidden rounded-xl border border-border shadow-2xl">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="mx-auto max-w-md rounded-md bg-background/50 px-4 py-1 text-center text-xs text-muted-foreground border border-border">
                    gitrouter.vercel.app
                  </div>
                </div>
              </div>

              {/* Dashboard preview */}
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
