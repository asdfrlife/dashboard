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
