import { getDashboardHealth } from '@/lib/health';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2, Clock, Upload, XCircle, RefreshCw } from 'lucide-react';
import { subDays } from 'date-fns';
import { OverviewCharts } from '@/components/OverviewCharts';
import { RunLogsFeed } from '@/components/RunLogsFeed';
import { AccountSummary } from '@/components/AccountSummary';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const health = await getDashboardHealth();

  // Fetch charts data: last 14 days uploads and failures
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
  
  const { data: uploads } = await supabase
    .from('platform_deliveries')
    .select('published_at')
    .eq('status', 'PUBLISHED')
    .gte('published_at', fourteenDaysAgo);

  const { data: failures } = await supabase
    .from('processed_videos')
    .select('updated_at')
    .eq('processing_status', 'FAILED')
    .gte('updated_at', fourteenDaysAgo);

  const { data: recentLogs } = await supabase
    .from('run_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: accounts } = await supabase
    .from('monitored_accounts')
    .select('id, x_username');

  // Account summaries logic will be done in the component by passing the raw account list
  // and we'll fetch stats per account there or here. 
  // Better to fetch here to avoid waterfall if it was client side, but since it's server side we can fetch in the component.

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'WARNING': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'CRITICAL': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OK': return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'WARNING': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'CRITICAL': return <XCircle className="w-6 h-6 text-red-500" />;
      default: return <Activity className="w-6 h-6 text-zinc-500" />;
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pipeline Overview</h1>
          <p className="text-sm text-zinc-400">System health and recent activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-zinc-500 flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Updated just now
          </p>
        </div>
      </div>

      <div className={`p-4 rounded-lg border flex items-center gap-4 ${getStatusColor(health.overall)}`}>
        {getStatusIcon(health.overall)}
        <div>
          <h2 className="font-semibold text-lg">System Status: {health.overall}</h2>
          <p className="text-sm opacity-80">
            {health.overall === 'OK' ? 'All systems operational.' : 'There are issues requiring attention.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Queue Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{health.queue.count}</div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.queue.status)}`}>
              {health.queue.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Upload className="w-3 h-3" /> Uploads (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{health.uploads.count24h} <span className="text-zinc-500 text-sm font-normal">/ 4 max</span></div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.uploads.status)}`}>
              {health.uploads.status}
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
            <div className="text-2xl font-bold text-zinc-100">{health.failed.count24h}</div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.failed.status)}`}>
              {health.failed.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="w-3 h-3" /> Stuck Videos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-100">{health.stuck.count}</div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.stuck.status)}`}>
              {health.stuck.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Clock className="w-3 h-3" /> Scraper Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-zinc-100 truncate">
              {health.scraper.lastRunAgoMinutes !== null ? `${health.scraper.lastRunAgoMinutes}m ago` : 'Never'}
            </div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.scraper.status)}`}>
              {health.scraper.status}
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
              <Activity className="w-3 h-3" /> Pipeline Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-zinc-100 truncate">
              {health.pipeline.lastRunAgoMinutes !== null ? `${health.pipeline.lastRunAgoMinutes}m ago` : 'Never'}
            </div>
            <Badge variant="outline" className={`mt-2 ${getStatusColor(health.pipeline.status)}`}>
              {health.pipeline.status}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts uploads={uploads || []} failures={failures || []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSummary accounts={accounts || []} />
        <RunLogsFeed logs={recentLogs || []} />
      </div>
    </div>
  );
}
