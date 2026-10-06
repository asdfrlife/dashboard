'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { GithubRun } from '@/types';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { ExternalLink, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export function RunsTable({ initialData }: { initialData: GithubRun[] }) {
  const getStatusIcon = (status: string | null, conclusion: string | null) => {
    if (status === 'in_progress' || status === 'queued') {
      return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
    }
    if (conclusion === 'success') {
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
    if (conclusion === 'failure') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    return <AlertCircle className="w-4 h-4 text-zinc-500" />;
  };

  const getStatusText = (status: string | null, conclusion: string | null) => {
    if (status === 'completed') return conclusion;
    return status;
  };

  const getStatusColor = (conclusion: string | null) => {
    if (conclusion === 'success') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    if (conclusion === 'failure') return 'bg-red-500/10 text-red-500 border-red-500/20';
    return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  };

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900 overflow-x-auto">
      <Table>
        <TableHeader className="bg-zinc-900/50">
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="text-zinc-400">Run</TableHead>
            <TableHead className="text-zinc-400">Status</TableHead>
            <TableHead className="text-zinc-400">Duration</TableHead>
            <TableHead className="text-zinc-400">Started</TableHead>
            <TableHead className="text-zinc-400">Link</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.length === 0 ? (
            <TableRow className="border-zinc-800">
              <TableCell colSpan={5} className="text-center text-zinc-500 h-24">
                No runs found or GitHub token is not configured.
              </TableCell>
            </TableRow>
          ) : initialData.map((run) => (
            <TableRow key={run.id} className="border-zinc-800 hover:bg-zinc-800/50 transition-colors">
              <TableCell className="font-medium text-zinc-300">
                <div className="flex items-center gap-2">
                  {getStatusIcon(run.status, run.conclusion)}
                  {run.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={`capitalize ${getStatusColor(run.conclusion)}`}>
                  {getStatusText(run.status, run.conclusion)}
                </Badge>
              </TableCell>
              <TableCell className="text-zinc-400">
                {run.status === 'completed' 
                  ? `${differenceInSeconds(new Date(run.updated_at), new Date(run.run_started_at))}s`
                  : '-'}
              </TableCell>
              <TableCell className="text-zinc-400 whitespace-nowrap">
                {formatDistanceToNow(new Date(run.run_started_at), { addSuffix: true })}
              </TableCell>
              <TableCell>
                <a 
                  href={run.html_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
                >
                  <span className="text-xs">View</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
