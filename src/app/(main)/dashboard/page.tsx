"use client";

import {
    LineChart,
    Line,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

// Hardcoded data matching reference image exactly
const kpis = {
    totalPRs: { value: 247, delta: +12, note: "from last week" },
    pending: { value: 34, delta: -35, note: "from last week" },
    sla: { value: 0.9, delta: +7, note: "from last week" },
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
    { name: "@Rin", assigned: 18, capacity: 40 },
    { name: "@Sam", assigned: 12, capacity: 40 },
    { name: "@Bin", assigned: 4, capacity: 40 },
    { name: "@Alex", assigned: 10, capacity: 40 },
    { name: "@Jamie", assigned: 6, capacity: 40 },
    { name: "@Taylor", assigned: 8, capacity: 40 },
];

const bottlenecks = [
    { repo: "backend", avg: "12.5 hours", pending: 8, sla: "62%" },
    { repo: "frontend", avg: "8.2 hours", pending: 5, sla: "72%" },
    { repo: "backend", avg: "7.5 hours", pending: 4, sla: "65%" },
    { repo: "design", avg: "9.0 hours", pending: 6, sla: "80%" },
    { repo: "testing", avg: "6.5 hours", pending: 3, sla: "70%" },
    { repo: "deployment", avg: "5.0 hours", pending: 2, sla: "60%" },
    { repo: "research", avg: "10.1 hours", pending: 7, sla: "85%" },
    { repo: "maintenance", avg: "4.8 hours", pending: 2, sla: "55%" },
    { repo: "documentation", avg: "3.2 hours", pending: 1, sla: "50%" },
    { repo: "ci/cd", avg: "3.8 hours", pending: 2, sla: "96%" },
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
    { id: 345, title: "Add Unit Tests for Auth Module", age: "11h 25m" },
    { id: 346, title: "Update Dependencies to Latest Versions", age: "7h 35m" },
    { id: 347, title: "Refactor Legacy Code in Core Module", age: "16h 40m" },
    { id: 348, title: "Implement Dark Mode Support", age: "13h 55m" },
    { id: 349, title: "Add Logging and Monitoring", age: "19h 20m" },
];

const recentActivity = [
    { time: "09:45PM", id: 342, author: "@alice", snippet: "Add authentication module", assigned: ["@bob", "@charlie"] },
    { time: "10:15PM", id: 343, author: "@david", snippet: "Refactor user service", assigned: ["@eve", "@frank"] },
    { time: "10:30PM", id: 344, author: "@grace", snippet: "Improve API performance", assigned: ["@hank", "@irene"] },
    { time: "10:45PM", id: 345, author: "@james", snippet: "Update documentation", assigned: ["@hank", "@irene"] },
    { time: "11:00PM", id: 346, author: "@dylan", snippet: "Fix bug in payment module", assigned: ["@julia", "@kyle"] },
    { time: "10:45PM", id: 343, author: "@james", snippet: "Develop Mobile App Prototype", assigned: ["@hank", "@irene"] },
    { time: "10:45PM", id: 345, author: "@james", snippet: "Update documentation", assigned: ["@hank", "@irene"] },
    { time: "11:00PM", id: 346, author: "@elena", snippet: "Fix bug in payment module", assigned: ["@julia", "@kyle"] },
];

// Helpers
function Card(props: React.HTMLAttributes<HTMLDivElement>) {
    const { className, ...rest } = props;
    return (
        <div
            className={`border border-border bg-card shadow-sm ${className ?? ""}`}
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
            <h3 className="text-sm font-semibold text-foreground">
                {children}
            </h3>
            {right}
        </div>
    );
}

function DeltaBadge({ delta, note }: { delta: number; note?: string }) {
    const isUp = delta >= 0;
    return (
        <span
            title={note}
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium ${
                isUp 
                    ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950" 
                    : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950"
            }`}
        >
            {isUp ? "▲" : "▼"} {Math.abs(delta)}%
            {note ? <span className="ml-0.5 font-normal text-muted-foreground">{note}</span> : null}
        </span>
    );
}

// Sections
function KpiRow() {
    return (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-3.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total PRs
                </div>
                <div className="mt-2 flex items-end justify-between">
                    <div className="text-4xl font-bold text-foreground">
                        {kpis.totalPRs.value}
                    </div>
                    <DeltaBadge delta={kpis.totalPRs.delta} note={kpis.totalPRs.note} />
                </div>
            </Card>

            <Card className="p-3.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Pending Reviews
                </div>
                <div className="mt-2 flex items-end justify-between">
                    <div className="text-4xl font-bold text-foreground">
                        {kpis.pending.value}
                    </div>
                    <DeltaBadge delta={kpis.pending.delta} note={kpis.pending.note} />
                </div>
            </Card>

            <Card className="p-3.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    SLA Compliance
                </div>
                <div className="mt-2 flex items-end justify-between">
                    <div className="text-4xl font-bold text-foreground">
                        {(kpis.sla.value * 100).toFixed(0)}%
                    </div>
                    <DeltaBadge delta={kpis.sla.delta} note={kpis.sla.note} />
                </div>
            </Card>

            <Card className="p-3.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Approved
                </div>
                <div className="mt-2 flex items-end justify-between">
                    <div className="text-4xl font-bold text-foreground">
                        {kpis.approved.value}
                    </div>
                    <DeltaBadge delta={kpis.approved.delta} note={kpis.approved.note} />
                </div>
            </Card>
        </div>
    );
}

function LatencyChart() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    
    return (
        <Card className="p-4">
            <SectionTitle
                right={
                    <span className="text-[11px] text-muted-foreground">
                        Target: 4 hours
                    </span>
                }
            >
                First Review Latency (Target: 4 hours)
            </SectionTitle>
            <div className="mt-2 text-center text-[11px] text-muted-foreground">
                Line Chart: Hours in Vertical and Date in a Week Horizontal
            </div>
            <div className="h-48 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={latencySeries} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <CartesianGrid stroke={isDark ? "#333" : "#E5E5E5"} strokeDasharray="0" />
                        <XAxis 
                            dataKey="day" 
                            tick={{ fill: isDark ? "#999" : "#5E5E5E", fontSize: 11 }}
                            axisLine={{ stroke: isDark ? "#333" : "#E5E5E5" }}
                        />
                        <YAxis 
                            tick={{ fill: isDark ? "#999" : "#5E5E5E", fontSize: 11 }}
                            axisLine={{ stroke: isDark ? "#333" : "#E5E5E5" }}
                        />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: isDark ? '#1f1f1f' : 'white', 
                                border: `1px solid ${isDark ? '#333' : '#E5E5E5'}`,
                                fontSize: '11px',
                                color: isDark ? '#fff' : '#000'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="hours"
                            stroke="#7A1F1C"
                            strokeWidth={2}
                            dot={{ r: 3, fill: "#7A1F1C" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
                Current avg:{" "}
                <span className="font-semibold text-foreground">
                    3.2 hours
                </span>{" "}
                (within target)
            </p>
        </Card>
    );
}

function WorkloadChart() {
    const workloadData = reviewerWorkload.map((r) => {
        const percentage = Math.round((r.assigned / r.capacity) * 100);
        const prCount = r.assigned;
        return {
            name: r.name,
            percentage,
            prCount,
            label: `${percentage}% (${prCount} PRs)`,
        };
    });

    return (
        <Card className="p-4">
            <SectionTitle>Reviewer Workload Distribution</SectionTitle>
            
            <div className="mt-4 space-y-3">
                {workloadData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                        <div className="w-14 text-xs font-medium text-foreground">
                            {item.name}
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 h-5 bg-muted overflow-hidden flex">
                                <div 
                                    className="h-full bg-primary-700" 
                                    style={{ width: `${item.percentage}%` }}
                                />
                                <div 
                                    className="h-full flex-1 bg-primary-200 dark:bg-primary-700/30"
                                />
                            </div>
                            <div className="w-24 text-right text-[11px] text-muted-foreground">
                                {item.label}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary-700" />
                    <span>Assigned</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-primary-200 dark:bg-primary-700/30" />
                    <span>Available capacity</span>
                </div>
            </div>
        </Card>
    );
}

function BottlenecksTable() {
    return (
        <Card className="p-4">
            <SectionTitle>Bottlenecks</SectionTitle>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                    <tr className="text-muted-foreground">
                        <th className="px-3 py-3 text-left font-medium border-b border-border">Repo</th>
                        <th className="px-3 py-3 text-center font-medium border-b border-border">Avg Review Time</th>
                        <th className="px-3 py-3 text-center font-medium border-b border-border">PRs Pending</th>
                        <th className="px-3 py-3 text-center font-medium border-b border-border">SLA%</th>
                    </tr>
                    </thead>
                    <tbody>
                    {bottlenecks.map((b, i) => (
                        <tr key={i} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-3 font-medium text-foreground">
                                {b.repo}
                            </td>
                            <td className="px-3 py-3 text-center text-muted-foreground">
                                {b.avg}
                            </td>
                            <td className="px-3 py-3 text-center text-muted-foreground">
                                {b.pending}
                            </td>
                            <td className="px-3 py-3 text-center text-muted-foreground">
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

            <ul className="space-y-2.5 pr-1 text-xs pb-12">
                {stalePRs.map((p) => (
                    <li key={p.id} className="flex items-start gap-2">
                        <span className="mt-1.5 inline-block h-1 w-1 flex-shrink-0 bg-foreground" />
                        <span className="flex-1 leading-relaxed">
                            <span className="font-semibold text-foreground">
                                #{p.id}
                            </span>
                            {" "}
                            <span className="text-foreground">— {p.title}</span>
                            {" "}
                            <span className="text-muted-foreground">({p.age})</span>
                        </span>
                    </li>
                ))}
            </ul>

            <button
                className="absolute left-4 bottom-4 inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-700 hover:bg-primary-600 transition-colors"
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
            <ul className="space-y-3.5 text-xs">
                {recentActivity.map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                        <div className="w-16 shrink-0 text-[11px] font-medium text-muted-foreground">
                            {a.time}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-start gap-2">
                                <span className="mt-0.5 text-base" aria-label="notification">
                                    🔔
                                </span>
                                <div className="flex-1">
                                    <div className="font-semibold leading-snug text-foreground">
                                        PR #{a.id} created by {a.author}
                                    </div>
                                    <div className="mt-0.5 leading-snug text-muted-foreground">
                                        "{a.snippet}"
                                    </div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
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

// Page
export default function Page() {
    const [lastUpdated, setLastUpdated] = useState(2);

    useEffect(() => {
        const interval = setInterval(() => {
            setLastUpdated((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-background p-6">
            <KpiRow />

            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <LatencyChart />
                </div>
                <WorkloadChart />
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr]">
                <BottlenecksTable />
                <StalePRs />
                <RecentActivity />
            </div>
        </div>
    );
}
