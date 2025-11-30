'use client';

import { useTheme } from 'next-themes';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { SectionTitle } from './section-title';

interface LatencySeries {
  day: string;
  hours: number;
}

export function LatencyChart({
  latencySeries,
}: {
  latencySeries: LatencySeries[];
}) {
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
      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={latencySeries}
            margin={{ top: 5, right: 10, bottom: 5, left: -20 }}
          >
            <CartesianGrid
              stroke={isDark ? '#333' : '#E5E5E5'}
              strokeDasharray="0"
            />
            <XAxis
              dataKey="day"
              tick={{ fill: isDark ? '#999' : '#5E5E5E', fontSize: 11 }}
              axisLine={{ stroke: isDark ? '#333' : '#E5E5E5' }}
            />
            <YAxis
              tick={{ fill: isDark ? '#999' : '#5E5E5E', fontSize: 11 }}
              axisLine={{ stroke: isDark ? '#333' : '#E5E5E5' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDark ? '#1f1f1f' : 'white',
                border: `1px solid ${isDark ? '#333' : '#E5E5E5'}`,
                fontSize: '11px',
                color: isDark ? '#fff' : '#000',
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="#7A1F1C"
              strokeWidth={2}
              dot={{ r: 3, fill: '#7A1F1C' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Current avg:{' '}
        <span className="font-semibold text-foreground">3.2 hours</span> (within
        target)
      </p>
    </Card>
  );
}
