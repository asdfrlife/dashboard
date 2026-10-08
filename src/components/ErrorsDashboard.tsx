'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { AlertCircle, Filter } from 'lucide-react';

const CATEGORIES = [
  { id: 'auth', label: 'Cookies/Login', keywords: ['cookie', 'login', 'auth', 'session expired'] },
  { id: 'cloudflare', label: 'Cloudflare/403', keywords: ['cloudflare', '403', 'forbidden', 'captcha'] },
  { id: 'youtube', label: 'YouTube Quota', keywords: ['quota', 'youtube', 'limit exceeded'] },
  { id: 'instagram_api', label: 'Instagram API', keywords: ['instagram api', 'ig api', 'meta graph'] },
  { id: 'token_expired', label: 'Token Expired', keywords: ['token expired', 'invalid token', 'oauth'] },
  { id: 'media_processing', label: 'Media Processing', keywords: ['ffmpeg', 'render', 'codec', 'corrupt', 'probe'] },
  { id: 'supabase', label: 'Supabase', keywords: ['supabase', 'postgres', 'relation'] },
  { id: 'network', label: 'Network/Timeout', keywords: ['timeout', 'network', 'econnreset', 'socket'] },
  { id: 'other', label: 'Other', keywords: [] }
];

export function ErrorsDashboard({ errors }: { errors: { message: string; timestamp: string; source: string; platform?: string; id?: string }[] }) {
  const [filterPlatform, setFilterPlatform] = useState<string>('All');

  const filteredErrors = errors.filter(e => {
    if (filterPlatform === 'All') return true;
    if (filterPlatform === 'Scraper') return e.source === 'Scraper';
    if (filterPlatform === 'Pipeline') return e.source === 'Pipeline';
    if (filterPlatform === 'YouTube') return e.platform === 'youtube_shorts';
    if (filterPlatform === 'Instagram') return e.platform === 'instagram_reels';
    return true;
  });

  const categorized = filteredErrors.map(err => {
    const msg = err.message.toLowerCase();
    const cat = CATEGORIES.find(c => c.keywords.some(k => msg.includes(k)));
    return { ...err, category: cat?.id || 'other', categoryLabel: cat?.label || 'Other' };
  });

  const counts = CATEGORIES.map(cat => ({
    name: cat.label,
    count: categorized.filter(e => e.category === cat.id).length,
    id: cat.id
  })).sort((a, b) => b.count - a.count);

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#3b82f6', '#8b5cf6', '#d946ef', '#64748b', '#71717a'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 bg-zinc-900 p-2 rounded-lg border border-zinc-800 overflow-x-auto w-max md:w-auto">
        <Filter className="w-4 h-4 text-zinc-500 ml-2" />
        {['All', 'YouTube', 'Instagram', 'Scraper', 'Pipeline'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPlatform(p)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${filterPlatform === p ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-sm">Error Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={counts} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={true} vertical={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '6px' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {counts.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Grouped Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={counts[0]?.id || 'other'}>
              <ScrollArea className="w-full whitespace-nowrap pb-2">
                <TabsList className="bg-zinc-800">
                  {counts.map(c => (
                    <TabsTrigger key={c.id} value={c.id} className="data-[state=active]:bg-zinc-950">
                      {c.name} <Badge variant="secondary" className="ml-2 bg-zinc-700">{c.count}</Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>

              {counts.map(c => (
                <TabsContent key={c.id} value={c.id} className="mt-4">
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {categorized.filter(e => e.category === c.id).map((err, i) => (
                      <div key={i} className="p-3 rounded-md border border-red-500/20 bg-red-500/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="border-red-500/30 text-red-400">
                              {err.source}
                            </Badge>
                            {err.platform && (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                                {err.platform.replace('_', ' ')}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(err.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-300 font-mono break-words whitespace-pre-wrap">
                          {err.message.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')}
                        </p>
                        {err.id && <p className="text-xs text-zinc-500">ID: {err.id}</p>}
                      </div>
                    ))}
                    {categorized.filter(e => e.category === c.id).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <p>No errors in this category for {filterPlatform}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
