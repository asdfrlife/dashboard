import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';

export async function AccountSummary({ accounts }: { accounts: { id: string; x_username: string }[] }) {
  // Fetch stats per account
  const stats = await Promise.all(
    accounts.map(async (acc) => {
      const { count: queued } = await supabase
        .from('processed_videos')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', acc.id)
        .eq('processing_status', 'QUEUED');

      const { count: published } = await supabase
        .from('processed_videos')
        .select('*, platform_deliveries!inner(*)', { count: 'exact', head: true })
        .eq('account_id', acc.id)
        .eq('platform_deliveries.status', 'PUBLISHED');

      const { count: failed } = await supabase
        .from('processed_videos')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', acc.id)
        .eq('processing_status', 'FAILED');

      return {
        ...acc,
        queued: queued || 0,
        published: published || 0,
        failed: failed || 0,
      };
    })
  );

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm">Account Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length === 0 ? (
          <p className="text-sm text-zinc-500">No accounts monitored</p>
        ) : (
          <div className="space-y-4">
            {stats.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-200">@{s.x_username}</span>
                <div className="flex gap-4 text-xs">
                  <div className="flex flex-col items-end">
                    <span className="text-zinc-500">Queued</span>
                    <span className="font-medium text-zinc-300">{s.queued}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-zinc-500">Published</span>
                    <span className="font-medium text-emerald-500">{s.published}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-zinc-500">Failed</span>
                    <span className="font-medium text-red-500">{s.failed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
