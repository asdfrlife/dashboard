import os

base_dir = r"c:\Users\Dell\Documents\New\dashboard"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write(content.strip() + '\n')

# 1. Update Navigation
write_file(r"src\components\Navigation.tsx", """
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Video, AlertCircle, PlayCircle, Youtube, Instagram, Database, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/youtube', label: 'YouTube', icon: Youtube },
  { href: '/instagram', label: 'Instagram', icon: Instagram },
  { href: '/scraping', label: 'Scraping', icon: Database },
  { href: '/performance', label: 'Metrics', icon: BarChart2 },
  { href: '/videos', label: 'Videos', icon: Video },
  { href: '/errors', label: 'Errors', icon: AlertCircle },
  { href: '/runs', label: 'Runs', icon: PlayCircle },
];

export function Navigation() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md md:relative md:border-t-0 md:border-b md:flex md:items-center md:px-6 md:h-16 overflow-x-auto">
      <div className="flex items-center h-16 md:h-auto md:justify-start space-x-4 md:space-x-8 px-4 w-max md:w-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors md:flex-row md:space-y-0 md:space-x-2 md:text-sm whitespace-nowrap",
                isActive ? "text-zinc-50" : "text-zinc-400 hover:text-zinc-300"
              )}
            >
              <Icon className="h-5 w-5 md:h-4 md:w-4" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
""")

# 2. Update .env.example
write_file(r".env.example", """
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

GITHUB_TOKEN=your_github_token
GITHUB_OWNER=your_github_username
GITHUB_REPO=your_github_repo
GITHUB_WORKFLOW_ID=your_workflow_id

ADMIN_PASSWORD=your_admin_password

# Fixed facts for dashboard
DAILY_CAP=8
TRIGGER_TOKEN_EXPIRES=2026-11-05
""")

# 3. Create YouTube Page
write_file(r"src\app\youtube\page.tsx", """
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Youtube, Upload, XCircle, Activity, AlertCircle } from 'lucide-react';
import { subDays } from 'date-fns';
import { OverviewCharts } from '@/components/OverviewCharts';

export const dynamic = 'force-dynamic';

export default async function YouTubePage() {
  const twentyFourHoursAgo = subDays(new Date(), 1).toISOString();
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
  
  const dailyCap = parseInt(process.env.DAILY_CAP || '8');

  // KPIs
  const { count: published24h } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED')
    .gte('published_at', twentyFourHoursAgo);

  const { count: failed24h } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'FAILED')
    .gte('created_at', twentyFourHoursAgo);

  const { count: totalPublished } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED');

  // Chart data
  const { data: uploads } = await supabase
    .from('platform_deliveries')
    .select('published_at')
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED')
    .gte('published_at', fourteenDaysAgo);

  const { data: failures } = await supabase
    .from('platform_deliveries')
    .select('created_at')
    .eq('platform', 'youtube_shorts')
    .eq('status', 'FAILED')
    .gte('created_at', fourteenDaysAgo);

  // Deliveries list
  const { data: deliveries } = await supabase
    .from('platform_deliveries')
    .select('*, processed_videos(tweet_id)')
    .eq('platform', 'youtube_shorts')
    .order('created_at', { ascending: false })
    .limit(50);

  const pubCount = published24h || 0;
  const isCapped = pubCount >= dailyCap;

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-red-500 flex items-center gap-2">
          <Youtube className="w-6 h-6" /> YouTube Delivery
        </h1>
        <p className="text-sm text-zinc-400">YouTube Shorts publishing metrics and history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Upload className="w-3 h-3" /> Published (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">
              {pubCount} <span className="text-zinc-500 text-sm font-normal">/ {dailyCap} max</span>
            </div>
            <Badge variant="outline" className={`mt-2 ${isCapped ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {isCapped ? 'CAPPED' : 'OK'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <XCircle className="w-3 h-3" /> Failed (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{failed24h || 0}</div>
            <Badge variant="outline" className={`mt-2 ${(failed24h || 0) > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {(failed24h || 0) > 0 ? 'WARNING' : 'OK'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Total Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{totalPublished || 0}</div>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts uploads={uploads || []} failures={failures || []} dateField="created_at" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {!deliveries?.length ? (
               <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                 <p>No recent deliveries</p>
               </div>
            ) : deliveries.map((del) => (
              <div key={del.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={
                      del.status === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-400' :
                      del.status === 'FAILED' ? 'border-red-500/30 text-red-400' :
                      'border-amber-500/30 text-amber-400'
                    }>
                      {del.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">{new Date(del.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">Tweet ID: {del.tweet_id}</p>
                  {del.last_error && <p className="text-xs text-red-400 mt-1 max-w-lg truncate">{del.last_error.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                  {del.platform_post_url ? (
                    <a href={del.platform_post_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
                      Watch Video
                    </a>
                  ) : (
                    <span className="text-zinc-500">No URL</span>
                  )}
                  <span className="text-zinc-500 text-xs">Retries: {del.retry_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
""")

# 4. Create Instagram Page
write_file(r"src\app\instagram\page.tsx", """
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Instagram, Upload, XCircle, Activity, Info } from 'lucide-react';
import { subDays } from 'date-fns';
import { OverviewCharts } from '@/components/OverviewCharts';

export const dynamic = 'force-dynamic';

export default async function InstagramPage() {
  const twentyFourHoursAgo = subDays(new Date(), 1).toISOString();
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  // KPIs
  const { count: published24h } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram_reels')
    .eq('status', 'PUBLISHED')
    .gte('published_at', twentyFourHoursAgo);

  const { count: failed24h } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram_reels')
    .eq('status', 'FAILED')
    .gte('created_at', twentyFourHoursAgo);

  const { count: totalPublished } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram_reels')
    .eq('status', 'PUBLISHED');

  const { count: skippedLong } = await supabase
    .from('processed_videos')
    .select('*', { count: 'exact', head: true })
    .gt('duration_seconds', 90)
    .gte('created_at', sevenDaysAgo);

  // Chart data
  const { data: uploads } = await supabase
    .from('platform_deliveries')
    .select('published_at')
    .eq('platform', 'instagram_reels')
    .eq('status', 'PUBLISHED')
    .gte('published_at', fourteenDaysAgo);

  const { data: failures } = await supabase
    .from('platform_deliveries')
    .select('created_at')
    .eq('platform', 'instagram_reels')
    .eq('status', 'FAILED')
    .gte('created_at', fourteenDaysAgo);

  // Deliveries list
  const { data: deliveries } = await supabase
    .from('platform_deliveries')
    .select('*, processed_videos(tweet_id)')
    .eq('platform', 'instagram_reels')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 flex items-center justify-center text-white">
            <Instagram className="w-4 h-4" />
          </div>
          Instagram Delivery
        </h1>
        <p className="text-sm text-zinc-400">Instagram Reels publishing metrics and history.</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 p-4 rounded-lg flex items-start gap-3">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm space-y-1">
          <p className="font-medium text-blue-300">Reels Duration Limit</p>
          <p>Instagram APIs only support Reels up to 90 seconds. Videos longer than this are automatically skipped for Instagram delivery.</p>
          <p className="pt-1 text-xs text-blue-400/80">You have {skippedLong || 0} processed videos &gt; 90s in the last 7 days.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Upload className="w-3 h-3" /> Published (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{published24h || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <XCircle className="w-3 h-3" /> Failed (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{failed24h || 0}</div>
            <Badge variant="outline" className={`mt-2 ${(failed24h || 0) > 0 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
              {(failed24h || 0) > 0 ? 'WARNING' : 'OK'}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Total Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{totalPublished || 0}</div>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts uploads={uploads || []} failures={failures || []} dateField="created_at" />

      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {!deliveries?.length ? (
               <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
                 <p>No recent deliveries</p>
               </div>
            ) : deliveries.map((del) => (
              <div key={del.id} className="p-4 rounded-lg border border-zinc-800 bg-zinc-950 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={
                      del.status === 'PUBLISHED' ? 'border-emerald-500/30 text-emerald-400' :
                      del.status === 'FAILED' ? 'border-red-500/30 text-red-400' :
                      'border-amber-500/30 text-amber-400'
                    }>
                      {del.status}
                    </Badge>
                    <span className="text-xs text-zinc-500">{new Date(del.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-zinc-300 font-medium">Tweet ID: {del.tweet_id}</p>
                  {del.last_error && <p className="text-xs text-red-400 mt-1 max-w-lg truncate">{del.last_error.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 text-sm">
                  {del.platform_post_id ? (
                    <span className="text-zinc-500 text-xs font-mono">ID: {del.platform_post_id}</span>
                  ) : (
                    <span className="text-zinc-500">No ID</span>
                  )}
                  <span className="text-zinc-500 text-xs">Retries: {del.retry_count || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
""")

print("Done generating simple pages.")
