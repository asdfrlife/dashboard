import { getDashboardHealth } from '@/lib/health';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle2, Clock, Upload, XCircle, RefreshCw, PlaySquare, Camera, Database, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { subDays, differenceInDays } from 'date-fns';
import { OverviewCharts } from '@/components/OverviewCharts';
import { RunLogsFeed } from '@/components/RunLogsFeed';
import { AccountSummary } from '@/components/AccountSummary';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const health = await getDashboardHealth();

  // Fetch charts data: last 14 days uploads per platform
  const fourteenDaysAgo = subDays(new Date(), 14).toISOString();
  
  const { data: platformData } = await supabase
    .from('v_daily_platform_stats')
    .select('*')
    .gte('day', fourteenDaysAgo);

  const { data: recentLogs } = await supabase
    .from('run_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: accounts } = await supabase
    .from('monitored_accounts')
    .select('id, x_username');

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

  const dailyCap = process.env.DAILY_CAP || '8';
  const tokenExpiresStr = process.env.TRIGGER_TOKEN_EXPIRES || '2026-11-05';
  const tokenDaysLeft = differenceInDays(new Date(tokenExpiresStr), new Date());
  
  let tokenColor = 'text-emerald-500';
  if (tokenDaysLeft <= 7) tokenColor = 'text-red-500 font-bold';
  else if (tokenDaysLeft <= 14) tokenColor = 'text-amber-500 font-bold';

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

      <details className="group border border-zinc-800 bg-zinc-900 rounded-lg open:shadow-lg transition-all">
        <summary className="flex cursor-pointer items-center justify-between p-4 font-semibold text-zinc-100">
          <div className="flex items-center gap-2">
             <Settings className="w-4 h-4 text-zinc-400" />
             Environment & Schedule Status
          </div>
          <span className="transition group-open:rotate-180">
            <ChevronDown className="w-5 h-5 text-zinc-400" />
          </span>
        </summary>
        <div className="border-t border-zinc-800 p-4 pt-4 bg-zinc-950/50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Schedule</p>
              <p className="text-sm text-zinc-300 mt-1">Every 3 hours at :12 (Africa/Addis_Ababa)</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">YouTube Daily Cap</p>
              <p className="text-sm text-zinc-300 mt-1">{dailyCap} videos</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">GitHub Trigger Token</p>
              <p className={`text-sm mt-1 ${tokenColor}`}>
                Expires: {tokenExpiresStr} ({tokenDaysLeft} days left)
              </p>
              {tokenDaysLeft <= 14 && (
                <p className="text-xs text-amber-500 mt-1">
                  Renew the GitHub workflow-trigger token in cron-job.org
                </p>
              )}
            </div>
          </div>
        </div>
      </details>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <PlaySquare className="w-4 h-4 text-red-500" /> YouTube
            </CardTitle>
            <div className={`w-2 h-2 rounded-full ${health.youtube.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mt-2">
               <div>
                 <p className="text-xs text-zinc-500">Published (24h)</p>
                 <p className="text-xl font-bold text-zinc-100">{health.youtube.count24h}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-zinc-500">Failed (24h)</p>
                 <p className="text-xl font-bold text-red-400">0</p>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <Camera className="w-4 h-4 text-pink-500" /> Instagram
            </CardTitle>
            <div className={`w-2 h-2 rounded-full ${health.instagram.status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          </CardHeader>
          <CardContent>
             <div className="flex justify-between items-end mt-2">
               <div>
                 <p className="text-xs text-zinc-500">Published (24h)</p>
                 <p className="text-xl font-bold text-zinc-100">{health.instagram.count24h}</p>
               </div>
               <div className="text-right">
                 <p className="text-xs text-zinc-500">Failed (24h)</p>
                 <p className="text-xl font-bold text-red-400">0</p>
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" /> Scraper
            </CardTitle>
            <div className={`w-2 h-2 rounded-full ${health.scraper.status === 'OK' ? 'bg-emerald-500' : health.scraper.status === 'WARNING' ? 'bg-amber-500' : health.scraper.status === 'CRITICAL' ? 'bg-red-500' : 'bg-zinc-500'}`} />
          </CardHeader>
          <CardContent>
             <div className="mt-2">
               <p className="text-xs text-zinc-500">Last Scrape</p>
               <p className="text-xl font-bold text-zinc-100">{health.scraper.lastRunAgoMinutes !== null ? `${health.scraper.lastRunAgoMinutes}m ago` : 'Never'}</p>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-500" /> Pipeline
            </CardTitle>
            <div className={`w-2 h-2 rounded-full ${health.pipeline.status === 'OK' ? 'bg-emerald-500' : health.pipeline.status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'}`} />
          </CardHeader>
          <CardContent>
             <div className="mt-2">
               <p className="text-xs text-zinc-500">Last Run</p>
               <p className="text-xl font-bold text-zinc-100">{health.pipeline.lastRunAgoMinutes !== null ? `${health.pipeline.lastRunAgoMinutes}m ago` : 'Never'}</p>
             </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-950 border-zinc-800/50">
          <CardContent className="p-4 flex flex-col justify-center items-center">
            <p className="text-xs text-zinc-500 mb-1">Queue Size</p>
            <div className="text-2xl font-bold text-zinc-100">{health.queue.count}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-950 border-zinc-800/50">
          <CardContent className="p-4 flex flex-col justify-center items-center">
            <p className="text-xs text-zinc-500 mb-1">Stuck Videos</p>
            <div className="text-2xl font-bold text-zinc-100">{health.stuck.count}</div>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts platformData={platformData || []} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AccountSummary accounts={accounts || []} />
        <RunLogsFeed logs={recentLogs || []} />
      </div>
    </div>
  );
}
