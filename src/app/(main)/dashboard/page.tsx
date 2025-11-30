import { BottlenecksTable } from '@/components/dashboard/bottlenecks-table';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { LatencyChart } from '@/components/dashboard/latency-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { StalePullRequests } from '@/components/dashboard/stale-pull-requests';
import { WorkloadChart } from '@/components/dashboard/workload-chart';

// Hardcoded data matching reference image exactly
const kpis = {
  totalPRs: { value: 247, delta: +12, note: 'from last week' },
  pending: { value: 34, delta: -35, note: 'from last week' },
  sla: { value: 0.9, delta: +7, note: 'from last week' },
  approved: { value: 142, delta: +5, note: 'from last week' },
};

const latencySeries = [
  { day: 'Mon', hours: 3.2 },
  { day: 'Tue', hours: 2.7 },
  { day: 'Wed', hours: 3.8 },
  { day: 'Thu', hours: 4.1 },
  { day: 'Fri', hours: 3.0 },
  { day: 'Sat', hours: 2.6 },
  { day: 'Sun', hours: 3.4 },
];

const reviewerWorkload = [
  { name: '@Rin', assigned: 18, capacity: 40 },
  { name: '@Sam', assigned: 12, capacity: 40 },
  { name: '@Bin', assigned: 4, capacity: 40 },
  { name: '@Alex', assigned: 10, capacity: 40 },
  { name: '@Jamie', assigned: 6, capacity: 40 },
  { name: '@Taylor', assigned: 8, capacity: 40 },
];

const bottlenecks = [
  { repo: 'backend', avg: '12.5 hours', pending: 8, sla: '62%' },
  { repo: 'frontend', avg: '8.2 hours', pending: 5, sla: '72%' },
  { repo: 'backend', avg: '7.5 hours', pending: 4, sla: '65%' },
  { repo: 'design', avg: '9.0 hours', pending: 6, sla: '80%' },
  { repo: 'testing', avg: '6.5 hours', pending: 3, sla: '70%' },
  { repo: 'deployment', avg: '5.0 hours', pending: 2, sla: '60%' },
  { repo: 'research', avg: '10.1 hours', pending: 7, sla: '85%' },
  { repo: 'maintenance', avg: '4.8 hours', pending: 2, sla: '55%' },
  { repo: 'documentation', avg: '3.2 hours', pending: 1, sla: '50%' },
  { repo: 'ci/cd', avg: '3.8 hours', pending: 2, sla: '96%' },
];

const stalePRs = [
  { id: 335, title: 'Update API Documentation', age: '24h 15m' },
  { id: 336, title: 'Implement User Authentication', age: '12h 30m' },
  { id: 337, title: 'Fix Bug in Payment Processing', age: '6h 45m' },
  { id: 338, title: 'Design Landing Page', age: '15h 20m' },
  { id: 339, title: 'Conduct User Testing Session', age: '8h 0m' },
  { id: 340, title: 'Optimize Database Queries', age: '10h 10m' },
  { id: 341, title: 'Set Up CI/CD Pipeline', age: '14h 5m' },
  { id: 342, title: 'Create Marketing Strategy', age: '20h 0m' },
  { id: 343, title: 'Develop Mobile App Prototype', age: '18h 50m' },
  { id: 344, title: 'Review Code for Security Vulnerabilities', age: '9h 15m' },
  { id: 345, title: 'Add Unit Tests for Auth Module', age: '11h 25m' },
  { id: 346, title: 'Update Dependencies to Latest Versions', age: '7h 35m' },
  { id: 347, title: 'Refactor Legacy Code in Core Module', age: '16h 40m' },
  { id: 348, title: 'Implement Dark Mode Support', age: '13h 55m' },
  { id: 349, title: 'Add Logging and Monitoring', age: '19h 20m' },
];

const recentActivity = [
  {
    time: '09:45PM',
    id: 342,
    author: '@alice',
    snippet: 'Add authentication module',
    assigned: ['@bob', '@charlie'],
  },
  {
    time: '10:15PM',
    id: 343,
    author: '@david',
    snippet: 'Refactor user service',
    assigned: ['@eve', '@frank'],
  },
  {
    time: '10:30PM',
    id: 344,
    author: '@grace',
    snippet: 'Improve API performance',
    assigned: ['@hank', '@irene'],
  },
  {
    time: '10:45PM',
    id: 345,
    author: '@james',
    snippet: 'Update documentation',
    assigned: ['@hank', '@irene'],
  },
  {
    time: '11:00PM',
    id: 346,
    author: '@dylan',
    snippet: 'Fix bug in payment module',
    assigned: ['@julia', '@kyle'],
  },
  {
    time: '10:45PM',
    id: 343,
    author: '@james',
    snippet: 'Develop Mobile App Prototype',
    assigned: ['@hank', '@irene'],
  },
  {
    time: '10:45PM',
    id: 345,
    author: '@james',
    snippet: 'Update documentation',
    assigned: ['@hank', '@irene'],
  },
  {
    time: '11:00PM',
    id: 346,
    author: '@elena',
    snippet: 'Fix bug in payment module',
    assigned: ['@julia', '@kyle'],
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-background p-6">
      <KpiRow kpis={kpis} />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LatencyChart latencySeries={latencySeries} />
        </div>
        <WorkloadChart reviewerWorkload={reviewerWorkload} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr_1fr]">
        <BottlenecksTable bottlenecks={bottlenecks} />
        <StalePullRequests stalePRs={stalePRs} />
        <RecentActivity recentActivity={recentActivity} />
      </div>
    </div>
  );
}
