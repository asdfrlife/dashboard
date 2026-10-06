import { supabase } from './supabase';
import { getGithubRuns } from './github';
import { differenceInMinutes, subHours } from 'date-fns';

export type HealthStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface DashboardHealth {
  overall: HealthStatus;
  scraper: {
    status: HealthStatus;
    lastRunAgoMinutes: number | null;
  };
  pipeline: {
    status: HealthStatus;
    lastRunConclusion: string | null;
    lastRunAgoMinutes: number | null;
  };
  queue: {
    status: HealthStatus;
    count: number;
  };
  stuck: {
    status: HealthStatus;
    count: number;
  };
  uploads: {
    status: HealthStatus;
    count24h: number;
  };
  failed: {
    status: HealthStatus;
    count24h: number;
  };
}

function getWorstStatus(statuses: HealthStatus[]): HealthStatus {
  if (statuses.includes('CRITICAL')) return 'CRITICAL';
  if (statuses.includes('WARNING')) return 'WARNING';
  if (statuses.includes('OK')) return 'OK';
  return 'UNKNOWN';
}

export async function getDashboardHealth(): Promise<DashboardHealth> {
  const now = new Date();
  const twentyFourHoursAgo = subHours(now, 24).toISOString();

  // 1. Scraper Health
  const { data: scraperLogs } = await supabase
    .from('run_logs')
    .select('created_at')
    .eq('stage', 'scraper_run')
    .order('created_at', { ascending: false })
    .limit(1);

  let scraperStatus: HealthStatus = 'CRITICAL';
  let scraperAgo: number | null = null;
  if (scraperLogs && scraperLogs.length > 0) {
    scraperAgo = differenceInMinutes(now, new Date(scraperLogs[0].created_at));
    if (scraperAgo < 90) scraperStatus = 'OK';
    else if (scraperAgo <= 180) scraperStatus = 'WARNING';
  }

  // 2. Pipeline (GitHub Actions)
  const githubRuns = await getGithubRuns();
  let pipelineStatus: HealthStatus = 'UNKNOWN';
  let pipelineAgo: number | null = null;
  let pipelineConclusion: string | null = null;

  if (githubRuns.length > 0) {
    const latestRun = githubRuns[0];
    pipelineAgo = differenceInMinutes(now, new Date(latestRun.run_started_at || latestRun.created_at));
    pipelineConclusion = latestRun.conclusion;

    if (pipelineAgo > 90) {
      pipelineStatus = 'WARNING';
    } else if (latestRun.conclusion === 'success') {
      pipelineStatus = 'OK';
    }

    // Check if last 2 runs failed
    const lastTwo = githubRuns.slice(0, 2);
    if (lastTwo.length === 2 && lastTwo.every((r) => r.conclusion === 'failure')) {
      pipelineStatus = 'CRITICAL';
    }
    
    // If the latest run failed but it's the only one or previous succeeded, maybe just warning?
    // The prompt says: "CRITICAL if the last 2 runs failed; WARNING if no run in 90+ min."
    // Let's assume OK if success, WARNING if 1 failure, CRITICAL if 2 failures, WARNING if >90m.
    if (pipelineStatus === 'UNKNOWN' && latestRun.conclusion === 'failure') {
        pipelineStatus = 'WARNING';
    }
  } else {
    pipelineStatus = 'WARNING'; // no runs found
  }

  // 3. Queue Size
  const { count: queueCount } = await supabase
    .from('processed_videos')
    .select('*', { count: 'exact', head: true })
    .eq('processing_status', 'QUEUED');

  const qCount = queueCount || 0;
  const queueStatus: HealthStatus = qCount > 20 ? 'WARNING' : 'OK';

  // 4. Stuck Videos
  const thirtyMinsAgo = new Date(now.getTime() - 30 * 60000).toISOString();
  const { count: stuckCount } = await supabase
    .from('processed_videos')
    .select('*', { count: 'exact', head: true })
    .in('processing_status', ['DOWNLOADING', 'RENDERING'])
    .lt('updated_at', thirtyMinsAgo);

  const sCount = stuckCount || 0;
  const stuckStatus: HealthStatus = sCount > 0 ? 'WARNING' : 'OK'; // Prompt doesn't specify status for stuck, but having stuck is bad.

  // 5. Uploads
  const { count: uploadsCount } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED')
    .gte('created_at', twentyFourHoursAgo);

  const uCount = uploadsCount || 0;
  // Prompt: "Uploads: PUBLISHED deliveries in the last 24h vs the cap of 4." 
  // It's mostly informational, but if it's over 4, could be an issue? Or maybe just OK.
  const uploadsStatus: HealthStatus = 'OK';

  // 6. Failed Videos
  const { count: failedCount } = await supabase
    .from('processed_videos')
    .select('*', { count: 'exact', head: true })
    .eq('processing_status', 'FAILED')
    .gte('updated_at', twentyFourHoursAgo);
    
  const fCount = failedCount || 0;
  const failedStatus: HealthStatus = fCount > 0 ? 'WARNING' : 'OK';

  const overall = getWorstStatus([
    scraperStatus,
    pipelineStatus,
    queueStatus,
    stuckStatus,
    failedStatus,
  ]);

  return {
    overall,
    scraper: { status: scraperStatus, lastRunAgoMinutes: scraperAgo },
    pipeline: { status: pipelineStatus, lastRunConclusion: pipelineConclusion, lastRunAgoMinutes: pipelineAgo },
    queue: { status: queueStatus, count: qCount },
    stuck: { status: stuckStatus, count: sCount },
    uploads: { status: uploadsStatus, count24h: uCount },
    failed: { status: failedStatus, count24h: fCount },
  };
}
