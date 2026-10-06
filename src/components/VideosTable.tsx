'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export type VideoData = {
  tweet_id: string;
  source_text: string | null;
  duration_seconds: number | null;
  processing_status: string;
  created_at: string;
  source_tweet_url: string | null;
  error_message: string | null;
  transcript: string | null;
  monitored_accounts?: { x_username: string } | null;
  platform_deliveries?: { status: string; platform_post_url: string; platform?: string }[] | null;
};

export function VideosTable({ initialData }: { initialData: VideoData[] }) {
  const [search, setSearch] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);

  const filtered = initialData.filter(v => 
    v.tweet_id?.includes(search) || 
    v.source_text?.toLowerCase().includes(search.toLowerCase()) ||
    v.monitored_accounts?.x_username?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case 'QUEUED': return 'bg-zinc-500/10 text-zinc-400 hover:bg-zinc-500/20';
      default: return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
        <Input 
          placeholder="Search by ID, text, or account..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 w-full max-w-sm"
        />
      </div>

      <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-x-auto">
        <Table>
          <TableHeader className="bg-zinc-900/50">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Account</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Duration</TableHead>
              <TableHead className="text-zinc-400">Created</TableHead>
              <TableHead className="text-zinc-400">Links</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-zinc-800">
                <TableCell colSpan={5} className="text-center text-zinc-500 h-24">
                  No videos found.
                </TableCell>
              </TableRow>
            ) : filtered.map((video) => (
              <TableRow 
                key={video.tweet_id} 
                className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                onClick={() => setSelectedVideo(video)}
              >
                <TableCell className="font-medium text-zinc-300">
                  @{video.monitored_accounts?.x_username || 'unknown'}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={getStatusColor(video.processing_status)}>
                    {video.processing_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-zinc-400">
                  {video.duration_seconds ? `${Math.round(video.duration_seconds)}s` : '-'}
                </TableCell>
                <TableCell className="text-zinc-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    {video.source_tweet_url && (
                      <a href={video.source_tweet_url} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-300">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {video.platform_deliveries?.some((d) => d.status === 'PUBLISHED') && (
                      <a 
                        href={video.platform_deliveries.find((d) => d.status === 'PUBLISHED')?.platform_post_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-red-500 hover:text-red-400"
                        title="View on YouTube"
                      >
                        <PlayCircleIcon className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Drawer open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DrawerContent className="bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[85vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>Video Details</DrawerTitle>
              <DrawerDescription className="text-zinc-400">
                Tweet ID: {selectedVideo?.tweet_id}
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4 pt-0">
              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-6">
                  {selectedVideo?.error_message && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-red-400 flex items-center gap-2">
                        <AlertCircleIcon className="h-4 w-4" /> Error Message
                      </h4>
                      <pre className="bg-red-500/10 text-red-500 p-3 rounded-md text-xs whitespace-pre-wrap font-mono border border-red-500/20">
                        {selectedVideo.error_message.replace(/([a-zA-Z0-9_-]{20,})/g, '[REDACTED]')}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                      <FileText className="h-4 w-4" /> Source Text
                    </h4>
                    <p className="text-sm text-zinc-400 bg-zinc-900 p-3 rounded-md border border-zinc-800">
                      {selectedVideo?.source_text || 'No source text'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                      <FileText className="h-4 w-4" /> Transcript
                    </h4>
                    <p className="text-sm text-zinc-400 bg-zinc-900 p-3 rounded-md border border-zinc-800 whitespace-pre-wrap">
                      {selectedVideo?.transcript || 'No transcript available'}
                    </p>
                  </div>

                  {selectedVideo?.platform_deliveries && selectedVideo.platform_deliveries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2 text-zinc-300">
                        <ExternalLink className="h-4 w-4" /> Deliveries
                      </h4>
                      <div className="space-y-2">
                        {selectedVideo.platform_deliveries?.map((d, i: number) => (
                          <div key={i} className="flex items-center justify-between bg-zinc-900 p-3 rounded-md border border-zinc-800">
                            <span className="text-sm font-medium capitalize">{d.platform || 'YouTube Shorts'}</span>
                            <Badge variant="outline" className={
                              d.status === 'PUBLISHED' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10' :
                              d.status === 'FAILED' ? 'text-red-500 border-red-500/20 bg-red-500/10' :
                              'text-zinc-400 border-zinc-700 bg-zinc-800'
                            }>
                              {d.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => setSelectedVideo(null)} className="border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100">
                Close
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Icons workaround to not import unused ones at the top if they are only used here
function PlayCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
}

function AlertCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}
