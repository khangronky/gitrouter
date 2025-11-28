"use client";

import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import { useMemo } from "react";

// Figma colors
const COLOR = {
    neutral: {
        1000: "#191919",
        900: "#303030",
        800: "#474747",
        700: "#5E5E5E",
        600: "#757575",
        500: "#8C8C8C",
        200: "#D1D1D1",
    },
    primary: {
        700: "#491413",
        600: "#611B19",
        500: "#79221F",
        200: "#C9A7A5",
        100: "#E4D3D2",
    },
    success: { 500: "#67C76F", 100: "#E1F4E2" },
    danger: { 600: "#99413E", 500: "#FF6C68", 200: "#FFC4C3" },
};

//Test data
const kpis = {
    totalPRs: { value: 247, delta: +12, note: "from last week" },
    pending: { value: 34, delta: -35, note: "from last week" },
    sla: { value: 0.9, delta: +7, note: "from last week" }, // 0–1
    approved: { value: 142, delta: +5, note: "from last week" },
};

const latencySeries = [
    { day: "Mon", hours: 3.2 },
    { day: "Tue", hours: 2.7 },
    { day: "Wed", hours: 3.8 },
    { day: "Thu", hours: 4.1 },
    { day: "Fri", hours: 3.0 },
    { day: "Sat", hours: 2.6 },
    { day: "Sun", hours: 3.4 },
];

const reviewerWorkload = [
    { name: "@Rin", assigned: 18, capacity: 22 },
    { name: "@Sam", assigned: 12, capacity: 18 },
    { name: "@Nin", assigned: 4, capacity: 10 },
    { name: "@Alex", assigned: 10, capacity: 14 },
    { name: "@Jamie", assigned: 6, capacity: 12 },
    { name: "@Taylor", assigned: 8, capacity: 16 },
].map((r) => ({ ...r, available: Math.max(r.capacity - r.assigned, 0) }));

const bottlenecks = [
    { repo: "backend", avg: "12.5 h", pending: 8, sla: "62%" },
    { repo: "frontend", avg: "8.2 h", pending: 5, sla: "72%" },
    { repo: "backend", avg: "7.5 h", pending: 4, sla: "65%" },
    { repo: "design", avg: "9.0 h", pending: 6, sla: "80%" },
    { repo: "testing", avg: "6.5 h", pending: 3, sla: "70%" },
    { repo: "deployment", avg: "5.0 h", pending: 2, sla: "60%" },
    { repo: "research", avg: "10.1 h", pending: 7, sla: "85%" },
    { repo: "maintenance", avg: "4.8 h", pending: 2, sla: "55%" },
    { repo: "documentation", avg: "3.2 h", pending: 1, sla: "50%" },
    { repo: "ci/cd", avg: "3.8 h", pending: 2, sla: "96%" },
];

const stalePRs = [
    { id: 335, title: "Update API Documentation", age: "24h 15m" },
    { id: 336, title: "Implement User Authentication", age: "12h 30m" },
    { id: 337, title: "Fix Bug in Payment Processing", age: "6h 45m" },
    { id: 338, title: "Design Landing Page", age: "15h 20m" },
    { id: 339, title: "Conduct User Testing Session", age: "8h 0m" },
    { id: 340, title: "Optimize Database Queries", age: "10h 10m" },
    { id: 341, title: "Set Up CI/CD Pipeline", age: "14h 5m" },
    { id: 342, title: "Create Marketing Strategy", age: "20h 0m" },
    { id: 343, title: "Develop Mobile App Prototype", age: "18h 50m" },
    { id: 344, title: "Review Code for Security Vulnerabilities", age: "9h 15m" },
];

const recentActivity = [
    { time: "09:45 PM", id: 342, author: "@alice", snippet: "Add authentication module", assigned: ["@bob", "@charlie"] },
    { time: "10:15 PM", id: 343, author: "@david", snippet: "Refactor user service", assigned: ["@eve", "@frank"] },
    { time: "10:30 PM", id: 344, author: "@grace", snippet: "Improve API performance", assigned: ["@hank", "@irene"] },
    { time: "10:45 PM", id: 345, author: "@james", snippet: "Update documentation", assigned: ["@julia", "@lena"] },
    { time: "11:00 PM", id: 346, author: "@dylan", snippet: "Fix bug in payment module", assigned: ["@mike", "@nora"] },
];

//Helpers
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
    const { className, ...rest } = props;
    return (
        <div
            className={`rounded-xl border border-[#E8E8E8] bg-white shadow-sm ${className ?? ""}`}
            {...rest}
        />
    );
}

function SectionTitle({
                          children,
                          right,
                      }: {
    children: React.ReactNode;
    right?: React.ReactNode;
}) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold" style={{ color: COLOR.neutral[900] }}>
                {children}
            </h3>
            {right}
        </div>
    );
}

function DeltaBadge({ delta, note }: { delta: number; note?: string }) {
    const isUp = delta >= 0;
    const style = isUp
        ? { color: COLOR.success[500], backgroundColor: COLOR.success[100] }
        : { color: COLOR.danger[600], backgroundColor: COLOR.danger[200] };
    const sign = isUp ? "▲" : "▼";
    return (
        <span
            title={note}
            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs"
            style={style}
        >
      {sign} {Math.abs(delta)}%{note ? <span style={{ color: COLOR.neutral[600] }}> {note}</span> : null}
    </span>
    );
}

//Sections
function KpiRow() {
    const label = { color: COLOR.neutral[600] };
    const value = { color: COLOR.neutral[1000] };
    return (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
                <div className="text-xs" style={label}>
                    Total PRs
                </div>
                <div className="mt-1 flex items-end justify-between">
                    <div className="text-3xl font-semibold" style={value}>
                        {kpis.totalPRs.value}
                    </div>
                    <DeltaBadge delta={kpis.totalPRs.delta} note={kpis.totalPRs.note} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="text-xs" style={label}>
                    Pending Reviews
                </div>
                <div className="mt-1 flex items-end justify-between">
                    <div className="text-3xl font-semibold" style={value}>
                        {kpis.pending.value}
                    </div>
                    <DeltaBadge delta={kpis.pending.delta} note={kpis.pending.note} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="text-xs" style={label}>
                    SLA Compliance
                </div>
                <div className="mt-1 flex items-end justify-between">
                    <div className="text-3xl font-semibold" style={value}>
                        {(kpis.sla.value * 100).toFixed(0)}%
                    </div>
                    <DeltaBadge delta={kpis.sla.delta} note={kpis.sla.note} />
                </div>
            </Card>

            <Card className="p-4">
                <div className="text-xs" style={label}>
                    Approved
                </div>
                <div className="mt-1 flex items-end justify-between">
                    <div className="text-3xl font-semibold" style={value}>
                        {kpis.approved.value}
                    </div>
                    <DeltaBadge delta={kpis.approved.delta} note={kpis.approved.note} />
                </div>
            </Card>
        </div>
    );
}

function LatencyChart() {
    return (
        <Card className="p-4 lg:col-span-2">
            <SectionTitle
                right={
                    <span className="text-xs" style={{ color: COLOR.neutral[600] }}>
            Target: ≤ 4 hours
          </span>
                }
            >
                First Review Latency
            </SectionTitle>
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencySeries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                        <CartesianGrid stroke={COLOR.neutral[200]} />
                        <XAxis dataKey="day" tick={{ fill: COLOR.neutral[700], fontSize: 12 }} />
                        <YAxis unit="h" tick={{ fill: COLOR.neutral[700], fontSize: 12 }} />
                        <Tooltip />
                        <Line
                            type="monotone"
                            dataKey="hours"
                            stroke={COLOR.primary[700]}
                            strokeWidth={2}
                            dot={{ r: 3, stroke: COLOR.primary[700], fill: COLOR.primary[700] }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-3 text-xs" style={{ color: COLOR.neutral[600] }}>
                Current average:{" "}
                <span className="font-medium" style={{ color: COLOR.neutral[900] }}>
          3.2 hours
        </span>{" "}
                (within target)
            </p>
        </Card>
    );
}

function WorkloadChart() {
    const rows = reviewerWorkload
        .map((r) => ({
            name: r.name,
            Assigned: r.assigned,
            Available: Math.max(r.capacity - r.assigned, 0),
            total: r.capacity,
        }))
        .sort((a, b) => b.Assigned - a.Assigned);

    const maxCap = Math.max(...rows.map((r) => r.total));

    return (
        <Card className="p-4">
            <SectionTitle>Reviewer Workload Distribution</SectionTitle>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={rows} layout="vertical" margin={{ top: 8, left: 8, right: 16, bottom: 8 }}>
                        <CartesianGrid stroke={COLOR.neutral[200]} />
                        <XAxis type="number" domain={[0, maxCap]} allowDecimals={false} tick={{ fill: COLOR.neutral[700] }} />
                        <YAxis type="category" dataKey="name" width={84} tick={{ fill: COLOR.neutral[700] }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12, color: COLOR.neutral[700] }} />
                        <Bar dataKey="Assigned" name="Assigned" stackId="a" fill={COLOR.primary[500]} barSize={18} />
                        <Bar dataKey="Available" name="Available" stackId="a" fill={COLOR.primary[200]} barSize={18} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

function BottlenecksTable() {
    return (
        <Card className="p-4">
            <SectionTitle>Bottlenecks</SectionTitle>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                    <tr className="text-xs" style={{ color: COLOR.neutral[600] }}>
                        <th className="px-2 py-2">Repo</th>
                        <th className="px-2 py-2 text-right">Avg Review Time</th>
                        <th className="px-2 py-2 text-right">PRs Pending</th>
                        <th className="px-2 py-2 text-right">SLA%</th>
                    </tr>
                    </thead>
                    <tbody>
                    {bottlenecks.map((b, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "#F1F1F1" }}>
                            <td className="px-2 py-2 font-medium" style={{ color: COLOR.neutral[900] }}>
                                {b.repo}
                            </td>
                            <td className="px-2 py-2 text-right" style={{ color: COLOR.neutral[800] }}>
                                {b.avg}
                            </td>
                            <td className="px-2 py-2 text-right" style={{ color: COLOR.neutral[800] }}>
                                {b.pending}
                            </td>
                            <td className="px-2 py-2 text-right font-semibold" style={{ color: COLOR.neutral[800] }}>
                                {b.sla}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}

function StalePRs() {
    return (
        <Card className="relative p-4 overflow-hidden">
            <SectionTitle>Stale PRs</SectionTitle>

            <ul className="space-y-2 pr-1 text-sm pb-14">
                {stalePRs.map((p) => (
                    <li key={p.id} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLOR.neutral[1000] }} />
                        <span className="flex-1">
              <span className="font-medium" style={{ color: COLOR.neutral[1000] }}>
                #{p.id}
              </span>{" "}
                            <span style={{ color: COLOR.neutral[900] }}>— {p.title}</span>{" "}
                            <span style={{ color: COLOR.neutral[600] }}>({p.age})</span>
            </span>
                    </li>
                ))}
            </ul>

            <button
                className="absolute left-4 bottom-4 inline-flex items-center rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                    backgroundColor: COLOR.primary[700],
                    boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLOR.primary[700])}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLOR.primary[500])}
                onMouseDown={(e) => (e.currentTarget.style.backgroundColor = COLOR.primary[500])}
                onMouseUp={(e) => (e.currentTarget.style.backgroundColor = COLOR.primary[600])}
            >
                View All Stale PRs
            </button>
        </Card>
    );
}

function RecentActivity() {
    return (
        <Card className="p-4">
            <SectionTitle>Recent Activity</SectionTitle>
            <ul className="space-y-3 text-sm">
                {recentActivity.map((a, i) => (
                    <li key={i} className="flex gap-3">
                        <div className="w-20 shrink-0 text-xs" style={{ color: COLOR.neutral[600] }}>
                            {a.time}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start gap-2">
                <span
                    className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ color: COLOR.primary[700] }}
                    aria-label="notification"
                >
                  🔔
                </span>

                                <div className="flex-1">
                                    <div className="font-medium" style={{ color: COLOR.neutral[900] }}>
                                        PR #{a.id} created by <span style={{ color: COLOR.neutral[900] }}>{a.author}</span>
                                    </div>
                                    <div style={{ color: COLOR.neutral[800] }}>“{a.snippet}”</div>
                                    <div className="text-xs" style={{ color: COLOR.neutral[600] }}>
                                        → Assigned to: {a.assigned.join(", ")}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </Card>
    );
}

//Page
export default function Page() {
    return (
        <div className="p-6">
            <KpiRow />

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <LatencyChart />
                <WorkloadChart />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.75fr_1.25fr_1fr]">
                <BottlenecksTable />
                <StalePRs />
                <RecentActivity />
            </div>
        </div>
    );
}
