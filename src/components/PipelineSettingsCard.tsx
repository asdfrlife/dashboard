'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, CheckCircle2, AlertCircle, RotateCcw, Clock, Calendar, ShieldCheck, Zap } from 'lucide-react';
import { PipelineSettings } from '@/types';
import { calculateCycle, toDateTimeLocalInput, fromDateTimeLocalInput } from '@/lib/cycle';

interface PipelineSettingsCardProps {
  initialSettings: PipelineSettings;
}

export function PipelineSettingsCard({ initialSettings }: PipelineSettingsCardProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [dailyCap, setDailyCap] = useState<number>(initialSettings.daily_cap);
  const [firstRunLocal, setFirstRunLocal] = useState<string>(() =>
    toDateTimeLocalInput(initialSettings.first_run_at)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Compute cycle in real-time based on the configured start time
  const computedCycle = (() => {
    try {
      if (!firstRunLocal) return null;
      const iso = fromDateTimeLocalInput(firstRunLocal);
      return calculateCycle(iso);
    } catch {
      return null;
    }
  })();

  const handleSetToNow = () => {
    const nowIso = new Date().toISOString();
    setFirstRunLocal(toDateTimeLocalInput(nowIso));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (!dailyCap || dailyCap < 1) {
        throw new Error('Daily cap must be at least 1 video');
      }

      if (!firstRunLocal) {
        throw new Error('Please specify when the cycle started');
      }

      const isoFirstRun = fromDateTimeLocalInput(firstRunLocal);

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          daily_cap: dailyCap,
          first_run_at: isoFirstRun,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }

      setFeedback({
        type: 'success',
        message: 'Cycle settings saved! End time and reset countdown have been updated.',
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setDailyCap(initialSettings.daily_cap);
    setFirstRunLocal(toDateTimeLocalInput(initialSettings.first_run_at));
    setFeedback(null);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-zinc-100">
                Cycle Configuration & Daily Cap
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Set when your cycle started. The dashboard will automatically calculate when it ends and resets.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="w-fit bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
            Auto-calculated 24h Window
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Cap Input */}
            <div className="space-y-2">
              <label htmlFor="daily_cap" className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                Daily Upload Cap
              </label>
              <Input
                id="daily_cap"
                type="number"
                min="1"
                step="1"
                required
                value={dailyCap}
                onChange={(e) => setDailyCap(parseInt(e.target.value, 10) || 1)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-red-500 focus:ring-red-500/20 text-sm h-10"
                placeholder="e.g. 8"
              />
              <p className="text-[11px] text-zinc-500">
                Maximum videos allowed per 24-hour cycle before pausing uploads.
              </p>
            </div>

            {/* Cycle Start Time Input */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="first_run_at" className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-zinc-400" />
                  When the Cycle Started
                </label>
                <button
                  type="button"
                  onClick={handleSetToNow}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  title="Set cycle start to right now"
                >
                  <Zap className="w-3 h-3" /> Start Now
                </button>
              </div>
              <Input
                id="first_run_at"
                type="datetime-local"
                step="60"
                required
                value={firstRunLocal}
                onChange={(e) => setFirstRunLocal(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-red-500 focus:ring-red-500/20 text-sm h-10 [color-scheme:dark]"
              />
              <p className="text-[11px] text-zinc-500">
                Customize the exact date & time your cycle began. We calculate when it ends 24 hours later.
              </p>
            </div>
          </div>

          {/* Real-time Calculation Result */}
          {computedCycle && (
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                  <Clock className="w-4 h-4 text-red-400" />
                  <span>Calculated Cycle Schedule</span>
                </div>
                <Badge variant="outline" className="text-[11px] bg-red-500/10 text-red-400 border-red-500/20 font-mono">
                  Reset in {computedCycle.formattedCountdown}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/50">
                  <span className="text-zinc-500 block text-[11px] mb-0.5">Cycle Started:</span>
                  <span className="text-zinc-200 font-semibold text-sm">
                    {computedCycle.currentCycleStart.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/50">
                  <span className="text-zinc-500 block text-[11px] mb-0.5">Calculated Cycle End:</span>
                  <span className="text-emerald-400 font-semibold text-sm">
                    {computedCycle.currentCycleEnd.toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800/50">
                  <span className="text-zinc-500 block text-[11px] mb-0.5">Time Remaining:</span>
                  <span className="text-zinc-100 font-semibold text-sm">
                    {computedCycle.formattedCountdown}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-500 pt-1">
                YouTube videos published after <strong className="text-zinc-400">{computedCycle.currentCycleStart.toLocaleTimeString()}</strong> count against the {dailyCap}-video daily cap until <strong className="text-zinc-400">{computedCycle.currentCycleEnd.toLocaleTimeString()}</strong>.
              </p>
            </div>
          )}

          {/* Feedback Messages */}
          {feedback && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border-red-500/20'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isSaving}
              className="text-zinc-400 hover:text-zinc-200 border-zinc-800 hover:bg-zinc-800"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Reset
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-500 text-white font-medium"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              {isSaving ? 'Saving...' : 'Save & Calculate'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
