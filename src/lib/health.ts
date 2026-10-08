import { supabase } from './supabase';
import { getGithubRuns } from './github';
import { differenceInMinutes, subHours, differenceInDays } from 'date-fns';

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
  youtube: {
    status: HealthStatus;
    count24h: number;
  };
  instagram: {
    status: HealthStatus;
    count24h: number;
  };
  token: {
    status: HealthStatus;
    daysLeft: number | null;
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
  const { data: scraperRuns } = await supabase
    .from('scrape_runs')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  let scraperStatus: HealthStatus = 'CRITICAL';
  let scraperAgo: number | null = null;
  if (scraperRuns && scraperRuns.length > 0) {
    scraperAgo = differenceInMinutes(now, new Date(scraperRuns[0].created_at));
    if (scraperAgo < 90) scraperStatus = 'OK';
    else if (scraperAgo <= 180) scraperStatus = 'WARNING';
    else scraperStatus = 'CRITICAL';
  } else {
    // Prompt says: "If there are no scrape_runs rows at all, show 'Scraper has never reported' with a short explanation, not an error."
    // Let's set it to UNKNOWN so it doesn't trigger a CRITICAL overall status.
    scraperStatus = 'UNKNOWN';
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

    const lastTwo = githubRuns.slice(0, 2);
    if (lastTwo.length === 2 && lastTwo.every((r) => r.conclusion === 'failure')) {
      pipelineStatus = 'CRITICAL';
    }
    
    if (pipelineStatus === 'UNKNOWN' && latestRun.conclusion === 'failure') {
        pipelineStatus = 'WARNING';
    }
  } else {
    pipelineStatus = 'WARNING';
  }

  // 3. Queue Size
  const { count: queueCount } = await supabase
    .from('processed_videos')
    .select('*', { count: 'exact', head: true })
    .eq('processing_status', 'QUEUED');

  const qCount = queueCount || 0;
  const queueStatus: HealthStatus = qCount > 20 ? 'WARNING' : 'OK';

  // 4. Stuck Videos
  const { count: stuckCount } = await supabase
    .from('v_stuck_videos')
    .select('*', { count: 'exact', head: true });

  const sCount = stuckCount || 0;
  const stuckStatus: HealthStatus = sCount > 0 ? 'WARNING' : 'OK';

  // 5. YouTube Uploads
  const { count: youtubeCount } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'youtube_shorts')
    .eq('status', 'PUBLISHED')
    .gte('created_at', twentyFourHoursAgo);

  const ytCount = youtubeCount || 0;
  const ytStatus: HealthStatus = 'OK';

  // 6. Instagram Uploads
  const { count: instagramCount } = await supabase
    .from('platform_deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'instagram_reels')
    .eq('status', 'PUBLISHED')
    .gte('created_at', twentyFourHoursAgo);

  const igCount = instagramCount || 0;
  const igStatus: HealthStatus = 'OK';

  // 7. Token Expiry
  const tokenExpiryStr = process.env.TRIGGER_TOKEN_EXPIRES || '2026-11-05';
  const tokenExpiryDate = new Date(tokenExpiryStr);
  const daysLeft = differenceInDays(tokenExpiryDate, now);
  
  let tokenStatus: HealthStatus = 'OK';
  if (daysLeft <= 7) tokenStatus = 'CRITICAL';
  else if (daysLeft <= 14) tokenStatus = 'WARNING';

  const overallStatuses = [
    scraperStatus !== 'UNKNOWN' ? scraperStatus : 'OK',
    pipelineStatus,
    queueStatus,
    stuckStatus,
    ytStatus,
    igStatus,
    tokenStatus
  ];

  const overall = getWorstStatus(overallStatuses);

  return {
    overall,
    scraper: { status: scraperStatus, lastRunAgoMinutes: scraperAgo },
    pipeline: { status: pipelineStatus, lastRunConclusion: pipelineConclusion, lastRunAgoMinutes: pipelineAgo },
    queue: { status: queueStatus, count: qCount },
    stuck: { status: stuckStatus, count: sCount },
    youtube: { status: ytStatus, count24h: ytCount },
    instagram: { status: igStatus, count24h: igCount },
    token: { status: tokenStatus, daysLeft }
  };
}
