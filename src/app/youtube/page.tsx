import { supabase } from '@/lib/supabase';
import { getPipelineSettings } from '@/lib/settings';
import { calculateCycle } from '@/lib/cycle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlaySquare, Upload, XCircle, Activity } from 'lucide-react';
import { subDays } from 'date-fns';
import { OverviewCharts } from '@/components/OverviewCharts';
import { CycleProgressTracker } from '@/components/CycleProgressTracker';

export const dynamic = 'force-dynamic';

export default async function YouTubePage() {
  // Fetch dynamic pipeline settings
  const settings = await getPipelineSettings();
  const dailyCap = settings.daily_cap;

  // Calculate current exact 24-hour cycle window
  const cycle = calculateCycle(settings.first_run_at);

  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();

  // KPIs: Count published YouTube videos in current 24-hour cycle
  const { count: cycleUploadsCount } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED')
    .gte('published_at', cycle.currentCycleStartIso);

  const cycleUploads = cycleUploadsCount || 0;

  // Count failed deliveries in current cycle
  const { count: failedCycleCount } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'FAILED')
    .gte('created_at', cycle.currentCycleStartIso);

  const failedCycle = failedCycleCount || 0;

  // Lifetime total published YouTube videos
  const { count: totalPublished } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED');

  // Chart data: 14 days uploads and failures
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

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-red-500 flex items-center gap-2">
          <PlaySquare className="w-6 h-6" /> YouTube Delivery
        </h1>
        <p className="text-sm text-zinc-400">
          YouTube Shorts publishing metrics, precision 24-hour cycle tracker, and delivery history.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Cycle Uploads with Progress Bar & Countdown */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-red-500" /> Current Cycle Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CycleProgressTracker
              cycleUploads={cycleUploads}
              dailyCap={dailyCap}
              currentCycleStartIso={cycle.currentCycleStartIso}
              currentCycleEndIso={cycle.currentCycleEndIso}
            />
          </CardContent>
        </Card>

        {/* Failed in Current Cycle */}
        <Card className="bg-zinc-900 border-zinc-800 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <XCircle className="w-3.5 h-3.5 text-red-400" /> Failed (Cycle)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-zinc-100">{failedCycle}</div>
            <div className="flex items-center justify-between">
              <Badge
                variant="outline"
                className={
                  failedCycle > 0
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                }
              >
                {failedCycle > 0 ? 'WARNING' : 'OK'}
              </Badge>
              <span className="text-[11px] text-zinc-500">Since cycle reset</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Published */}
        <Card className="bg-zinc-900 border-zinc-800 flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-zinc-400" /> Total Published
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-2xl font-bold text-zinc-100">{totalPublished || 0}</div>
            <p className="text-xs text-zinc-500">All-time successful uploads</p>
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
