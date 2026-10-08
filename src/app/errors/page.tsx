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
