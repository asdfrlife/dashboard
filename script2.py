import os

base_dir = r"c:\Users\Dell\Documents\New\dashboard"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')


# 5. Create Scraping Page
write_file(r"src\app\scraping\page.tsx", """
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { differenceInMinutes } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function ScrapingPage() {
  const { data: accounts } = await supabase.from('v_account_stats').select('*');
  const { data: latestScrapes } = await supabase.from('scrape_runs').select('*').order('created_at', { ascending: false }).limit(100);
  
  const now = new Date();

  // Scraper Health
  let scraperStatus = 'UNKNOWN';
  let scraperAgo = null;
  if (latestScrapes && latestScrapes.length > 0) {
    scraperAgo = differenceInMinutes(now, new Date(latestScrapes[0].created_at));
    if (scraperAgo < 90) scraperStatus = 'OK';
    else if (scraperAgo <= 180) scraperStatus = 'WARNING';
    else scraperStatus = 'CRITICAL';
  }

  // Errors grouped by message
  const { data: errorsList } = await supabase
    .from('scrape_runs')
    .select('error_message, created_at')
    .eq('status', 'ERROR')
    .order('created_at', { ascending: false })
    .limit(50);

  // Queue freshness
  const { data: queueItems } = await supabase
    .from('v_queue_items')
    .select('*')
    .order('tweet_posted_at', { ascending: true });

  const queueSize = queueItems?.length || 0;
  const oldestTweet = queueSize > 0 ? new Date(queueItems![0].tweet_posted_at) : null;
  const oldestTweetAgeHours = oldestTweet ? differenceInMinutes(now, oldestTweet) / 60 : 0;
  
  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-blue-500 flex items-center gap-2">
          <Database className="w-6 h-6" /> Scraping Health
        </h1>
        <p className="text-sm text-zinc-400">Scraper status, per-account metrics, and queue freshness.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Scraper Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scraperStatus === 'UNKNOWN' ? (
              <div className="text-lg font-bold text-zinc-400">Never reported</div>
            ) : (
              <div className="text-2xl font-bold text-zinc-100">{scraperAgo}m ago</div>
            )}
            <Badge variant="outline" className={`mt-2 ${
              scraperStatus === 'OK' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
              scraperStatus === 'WARNING' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
              scraperStatus === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
              'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
            }`}>
              {scraperStatus === 'UNKNOWN' ? 'Awaiting First Run' : scraperStatus}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Database className="w-3 h-3" /> Queue Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{queueSize}</div>
            <Badge variant="outline" className={`mt-2 ${queueSize > 20 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {queueSize > 20 ? 'WARNING' : 'OK'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> Oldest Queued Item
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {oldestTweetAgeHours > 0 ? `${oldestTweetAgeHours.toFixed(1)}h old` : 'None'}
            </div>
            <Badge variant="outline" className={`mt-2 ${oldestTweetAgeHours > 72 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {oldestTweetAgeHours > 72 ? 'STALE' : 'FRESH'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400">
                  <th className="pb-2 font-medium">Account</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Queued</th>
                  <th className="pb-2 font-medium">Completed</th>
                  <th className="pb-2 font-medium">Failed</th>
                  <th className="pb-2 font-medium">Last Scraped</th>
                  <th className="pb-2 font-medium">Latest Scrape Status</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {accounts?.map(acc => {
                   const accScrape = latestScrapes?.find(s => s.account_handle === acc.x_username);
                   return (
                  <tr key={acc.x_username} className="border-b border-zinc-800/50">
                    <td className="py-3">{acc.x_username}</td>
                    <td className="py-3">
                      {acc.is_active ? 
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">Active</Badge> : 
                        <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-xs">Inactive</Badge>}
                    </td>
                    <td className="py-3">{acc.queued}</td>
                    <td className="py-3 text-emerald-400">{acc.completed}</td>
                    <td className="py-3 text-red-400">{acc.failed}</td>
                    <td className="py-3 text-xs text-zinc-500">{accScrape ? new Date(accScrape.created_at).toLocaleString() : 'Never'}</td>
                    <td className="py-3 text-xs">
                      {accScrape ? (
                        <div className="flex flex-col gap-1">
                           <span className={accScrape.status === 'OK' ? 'text-emerald-400' : 'text-red-400'}>{accScrape.status}</span>
                           <span className="text-zinc-500">Queued: {accScrape.new_queued} | Skipped: {accScrape.skipped_old}</span>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Recent Scrape Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {!errorsList?.length ? (
               <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                 <p>No recent scrape errors</p>
               </div>
            ) : errorsList.map((err, i) => {
              const msg = err.error_message || '';
              const isCookie = msg.toLowerCase().includes('cookie') || msg.toLowerCase().includes('login');
              const isCloudflare = msg.toLowerCase().includes('cloudflare') || msg.toLowerCase().includes('403');
              const isRateLimit = msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('429');
              
              return (
              <div key={i} className="p-3 rounded-md border border-red-500/20 bg-red-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="border-red-500/30 text-red-400">ERROR</Badge>
                  <span className="text-xs text-zinc-500">{new Date(err.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-zinc-300 font-mono break-words whitespace-pre-wrap">
                  {msg.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')}
                </p>
                {(isCookie || isCloudflare || isRateLimit) && (
                  <div className="pt-2">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">
                      Hint: {isCookie ? 'Cookies expired. Update them on your PC.' : isCloudflare ? 'Cloudflare blocked the request.' : 'Rate limited by Twitter/X.'}
                    </Badge>
                  </div>
                )}
              </div>
            )})}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
""")

# 6. Create Performance Page
write_file(r"src\app\performance\page.tsx", """
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Eye, ThumbsUp, MessageCircle, Share2, Youtube, Instagram } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const { data: metrics } = await supabase
    .from('post_metrics')
    .select('*, processed_videos(tweet_id, x_username)')
    .order('captured_at', { ascending: false });

  if (!metrics || metrics.length === 0) {
    return (
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
            <BarChart2 className="w-8 h-8 text-zinc-500" />
          </div>
          <h2 className="text-xl font-bold">Metrics Not Setup</h2>
          <p className="text-zinc-400 max-w-md">
            Metrics collection has not been set up or no metrics have been captured yet. 
            Once your scraper starts pulling post metrics, they will appear here.
          </p>
        </div>
      </div>
    );
  }

  // Deduplicate to get latest snapshot per post
  const latestMetrics = Object.values(
    metrics.reduce((acc: any, curr) => {
      if (!acc[curr.platform_post_id]) {
        acc[curr.platform_post_id] = curr;
      }
      return acc;
    }, {})
  ) as any[];

  // Top 10 by views
  const top10 = [...latestMetrics].sort((a, b) => b.views - a.views).slice(0, 10);

  // Aggregated views by account
  const viewsByAccount = latestMetrics.reduce((acc: any, curr) => {
    const username = curr.processed_videos?.x_username || 'Unknown';
    if (!acc[username]) acc[username] = 0;
    acc[username] += curr.views || 0;
    return acc;
  }, {});

  const topAccounts = Object.entries(viewsByAccount).sort((a: any, b: any) => b[1] - a[1]);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-indigo-400 flex items-center gap-2">
          <BarChart2 className="w-6 h-6" /> Performance Metrics
        </h1>
        <p className="text-sm text-zinc-400">Latest engagement metrics across all platforms.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Top 10 Performing Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {top10.map((post, i) => (
                <div key={post.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-zinc-700 w-6 text-center">{i + 1}</span>
                    <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      {post.platform === 'youtube_shorts' ? <Youtube className="w-4 h-4 text-red-500" /> : <Instagram className="w-4 h-4 text-pink-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-mono text-zinc-400">ID: {post.platform_post_id}</p>
                      <p className="text-xs text-zinc-500">{post.processed_videos?.x_username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="flex items-center gap-1 text-zinc-300">
                      <Eye className="w-3 h-3 text-zinc-500" /> {post.views?.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-zinc-300">
                      <ThumbsUp className="w-3 h-3 text-zinc-500" /> {post.likes?.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm">Total Views by Source Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAccounts.map(([username, views], i) => (
                <div key={username} className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/50 bg-zinc-950/50">
                  <span className="text-sm font-medium text-zinc-300">{username}</span>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-zinc-500" />
                    <span className="font-mono text-emerald-400">{(views as number).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
""")

# 7. Update Overview Charts to support multiple platform series
write_file(r"src\components\OverviewCharts.tsx", """
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
""")

# 8. Update Errors Dashboard (Add platform filter, source col, keyword categories)
write_file(r"src\components\ErrorsDashboard.tsx", """
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
""")

# 9. Update Errors Page (Include scraper errors and platforms)
write_file(r"src\app\errors\page.tsx", """
import { supabase } from '@/lib/supabase';
import { ErrorsDashboard } from '@/components/ErrorsDashboard';
import { subDays } from 'date-fns';

export const revalidate = 60;

export default async function ErrorsPage() {
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  // 1. Fetch errors from processed_videos
  const { data: videoErrors } = await supabase
    .from('processed_videos')
    .select('tweet_id, error_message, updated_at')
    .not('error_message', 'is', null)
    .gte('updated_at', sevenDaysAgo);

  // 2. Fetch errors from platform_deliveries
  const { data: deliveryErrors } = await supabase
    .from('platform_deliveries')
    .select('tweet_id, last_error, created_at, platform')
    .not('last_error', 'is', null)
    .gte('created_at', sevenDaysAgo);

  // 3. Fetch errors from run_logs
  const { data: logErrors } = await supabase
    .from('run_logs')
    .select('message, created_at')
    .eq('level', 'ERROR')
    .gte('created_at', sevenDaysAgo);

  // 4. Fetch errors from scrape_runs
  const { data: scrapeErrors } = await supabase
    .from('scrape_runs')
    .select('error_message, created_at')
    .eq('status', 'ERROR')
    .gte('created_at', sevenDaysAgo);

  // Merge and normalize errors
  const allErrors: { message: string; timestamp: string; source: string; platform?: string; id?: string }[] = [];

  videoErrors?.forEach(e => {
    if (e.error_message) {
      allErrors.push({ message: e.error_message, timestamp: e.updated_at, source: 'Pipeline', id: e.tweet_id });
    }
  });

  deliveryErrors?.forEach(e => {
    if (e.last_error) {
      allErrors.push({ message: e.last_error, timestamp: e.created_at, source: 'Delivery', platform: e.platform, id: e.tweet_id || undefined });
    }
  });

  logErrors?.forEach(e => {
    if (e.message) {
      allErrors.push({ message: e.message, timestamp: e.created_at, source: 'System Log' });
    }
  });

  scrapeErrors?.forEach(e => {
    if (e.error_message) {
      allErrors.push({ message: e.error_message, timestamp: e.created_at, source: 'Scraper' });
    }
  });

  // Sort descending by timestamp
  allErrors.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Error Analysis</h1>
        <p className="text-sm text-zinc-400">Aggregated errors across all pipeline stages (Last 7 Days).</p>
      </div>

      <ErrorsDashboard errors={allErrors} />
    </div>
  );
}
""")

print("Done updating complex pages.")
