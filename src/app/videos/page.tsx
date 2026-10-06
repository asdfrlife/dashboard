import { supabase } from '@/lib/supabase';
import { VideosTable } from '@/components/VideosTable';

export const revalidate = 60;

export default async function VideosPage() {
  const query = supabase
    .from('processed_videos')
    .select('*, monitored_accounts(x_username), platform_deliveries(status, platform_post_url)')
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: videos, error } = await query;

  if (error) {
    console.error('Error fetching videos:', error);
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Videos</h1>
        <p className="text-sm text-zinc-400">View and filter processed videos in the pipeline.</p>
      </div>

      <VideosTable initialData={videos || []} />
    </div>
  );
}
