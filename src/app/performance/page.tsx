import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Eye, ThumbsUp, MessageCircle, Share2, PlaySquare, Camera } from 'lucide-react';

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
                      {post.platform === 'youtube_shorts' ? <PlaySquare className="w-4 h-4 text-red-500" /> : <Camera className="w-4 h-4 text-pink-500" />}
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
