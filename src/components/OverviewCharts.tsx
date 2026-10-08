'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface ChartProps {
  uploads?: { published_at: string }[];
  failures?: { created_at: string }[];
  dateField?: 'created_at' | 'published_at' | 'updated_at';
  platformData?: { day: string; platform: string; published: number; failed: number }[];
}

export function OverviewCharts({ uploads, failures, dateField = 'updated_at', platformData }: ChartProps) {
  
  if (platformData) {
    // Platform combined view
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = startOfDay(subDays(new Date(), 13 - i));
      return {
        dateStr: format(d, 'yyyy-MM-dd'),
        displayDate: format(d, 'MMM dd'),
      };
    });

    const chartData = days.map(d => {
      const yt = platformData.find(p => p.day.startsWith(d.dateStr) && p.platform === 'youtube_shorts');
      const ig = platformData.find(p => p.day.startsWith(d.dateStr) && p.platform === 'instagram_reels');
      return {
        date: d.displayDate,
        YouTube: yt?.published || 0,
        Instagram: ig?.published || 0,
      };
    });

    return (
      <Card className="bg-zinc-900 border-zinc-800 w-full">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-100">Published per Day by Platform</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px' }}
                itemStyle={{ color: '#e4e4e7' }}
                cursor={{ fill: '#27272a' }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="YouTube" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Instagram" fill="#ec4899" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Fallback single platform view (original behavior)
  const data = Array.from({ length: 14 }).map((_, i) => {
    const d = startOfDay(subDays(new Date(), 13 - i));
    const dateStr = format(d, 'MMM dd');
    return {
      date: dateStr,
      uploads: 0,
      failures: 0,
      timestamp: d.getTime(),
    };
  });

  (uploads || []).forEach((u: any) => {
    const ts = u.published_at || u.created_at;
    if (ts) {
      const d = format(new Date(ts), 'MMM dd');
      const day = data.find(x => x.date === d);
      if (day) day.uploads++;
    }
  });

  (failures || []).forEach((f: any) => {
    const ts = f[dateField];
    if (ts) {
      const d = format(new Date(ts), 'MMM dd');
      const day = data.find(x => x.date === d);
      if (day) day.failures++;
    }
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-100">Uploads (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px' }}
                itemStyle={{ color: '#e4e4e7' }}
                cursor={{ fill: '#27272a' }}
              />
              <Bar dataKey="uploads" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm text-zinc-100">Failures (Last 14 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px' }}
                itemStyle={{ color: '#e4e4e7' }}
                cursor={{ fill: '#27272a' }}
              />
              <Bar dataKey="failures" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
