'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CycleCountdown } from './CycleCountdown';
import { cn } from '@/lib/utils';

interface CycleProgressTrackerProps {
  cycleUploads: number;
  dailyCap: number;
  currentCycleStartIso: string;
  currentCycleEndIso: string;
  className?: string;
  compact?: boolean;
}

export function CycleProgressTracker({
  cycleUploads,
  dailyCap,
  currentCycleStartIso,
  currentCycleEndIso,
  className,
  compact = false,
}: CycleProgressTrackerProps) {
  const isCapped = cycleUploads >= dailyCap;
  const percentage = Math.min(100, Math.round((cycleUploads / (dailyCap || 1)) * 100));

  // Determine indicator color based on cap usage
  const getProgressColor = () => {
    if (isCapped) return 'bg-amber-500';
    if (percentage >= 75) return 'bg-amber-400';
    return 'bg-red-500';
  };

  const formattedStart = new Date(currentCycleStartIso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedEnd = new Date(currentCycleEndIso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (compact) {
    return (
      <div className={cn("space-y-2 mt-2", className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">
            Progress: <strong className="text-zinc-200">{percentage}%</strong>
          </span>
          <Badge
            variant="outline"
            className={
              isCapped
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] px-1.5 py-0'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] px-1.5 py-0'
            }
          >
            {isCapped ? 'CAPPED' : 'OK'}
          </Badge>
        </div>

        <Progress
          value={cycleUploads}
          max={dailyCap}
          className="h-2 bg-zinc-800"
          indicatorClassName={getProgressColor()}
        />

        <div className="flex items-center justify-between pt-0.5">
          <CycleCountdown targetDateIso={currentCycleEndIso} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold text-zinc-100 flex items-baseline gap-1.5">
            {cycleUploads}
            <span className="text-zinc-500 text-sm font-normal">/ {dailyCap} max</span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            {percentage}% of 24h daily quota used
          </p>
        </div>
        <Badge
          variant="outline"
          className={
            isCapped
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium'
          }
        >
          {isCapped ? 'CAPPED' : 'OK'}
        </Badge>
      </div>

      <Progress
        value={cycleUploads}
        max={dailyCap}
        className="h-2.5 bg-zinc-800"
        indicatorClassName={getProgressColor()}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-zinc-400 pt-1">
        <CycleCountdown targetDateIso={currentCycleEndIso} />
        <span className="text-[11px] text-zinc-500" title={`Cycle from ${formattedStart} to ${formattedEnd}`}>
          Window: {formattedStart} → {formattedEnd}
        </span>
      </div>
    </div>
  );
}
