'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { RunLog } from '@/types';

export function RunLogsFeed({ logs }: { logs: RunLog[] }) {
  if (!logs || logs.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm">No log data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800 flex flex-col h-[400px]">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Recent Activity</span>
          <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">Live</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="flex flex-col space-y-1 pb-3 border-b border-zinc-800/50 last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                      log.level === 'WARN' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-xs font-medium text-zinc-300">{log.stage}</span>
                  </div>
                  <span 
                    className="text-[10px] text-zinc-500" 
                    title={new Date(log.created_at).toLocaleString()}
                  >
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
                {log.message && (
                  <p className="text-sm text-zinc-400 break-words">{log.message}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
