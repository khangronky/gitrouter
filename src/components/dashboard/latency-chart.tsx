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
    <Card className="h-full p-4">
      <SectionTitle>First Review Latency (Target: 4 hours)</SectionTitle>
      <div className="mt-4 h-48">
        <ResponsiveContainer>
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
      <p className="text-muted-foreground text-sm">
        Current avg:{' '}
        <span className="font-semibold text-foreground">3.2 hours</span> (within
        target)
      </p>
    </Card>
  );
}
