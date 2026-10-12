'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings2, Save, CheckCircle2, AlertCircle, RotateCcw, Clock, Calendar, ShieldCheck } from 'lucide-react';
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

  // Compute cycle in real-time based on form state
  const computedCycle = (() => {
    try {
      if (!firstRunLocal) return null;
      const iso = fromDateTimeLocalInput(firstRunLocal);
      return calculateCycle(iso);
    } catch {
      return null;
    }
  })();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (!dailyCap || dailyCap < 1) {
        throw new Error('Daily cap must be at least 1 video');
      }

      if (!firstRunLocal) {
        throw new Error('Please specify the first run timestamp');
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
        message: 'Settings saved and 24-hour cycle updated successfully!',
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
                Pipeline Settings & 24h Cycle Tracker
              </CardTitle>
              <CardDescription className="text-xs text-zinc-400 mt-0.5">
                Configure YouTube daily upload quota and exact cron job cycle origin.
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="w-fit bg-zinc-800 text-zinc-300 border-zinc-700 text-xs">
            Target: pipeline_settings (id=1)
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
                YouTube Daily Cap (Videos)
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
                Maximum videos permitted per exact 24-hour cycle before pausing uploads.
              </p>
            </div>

            {/* First Run At Input */}
            <div className="space-y-2">
              <label htmlFor="first_run_at" className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-zinc-400" />
                Cron First Run (Origin Date & Time)
              </label>
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
                Exact start time of the first cron run. 24-hour cycles compound continuously from this anchor.
              </p>
            </div>
          </div>

          {/* Computed Cycle Preview */}
          {computedCycle && (
            <div className="p-4 rounded-lg bg-zinc-950 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Clock className="w-3.5 h-3.5 text-red-400" />
                  <span>Calculated Cycle Preview</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">
                  Cycle #{computedCycle.periodsPassed + 1} ({computedCycle.periodsPassed} periods elapsed)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-zinc-500 block text-[11px]">Current Cycle Start:</span>
                  <span className="text-zinc-200 font-medium">
                    {computedCycle.currentCycleStart.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Current Cycle End:</span>
                  <span className="text-zinc-200 font-medium">
                    {computedCycle.currentCycleEnd.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[11px]">Next Reset In:</span>
                  <span className="text-red-400 font-semibold">
                    {computedCycle.formattedCountdown}
                  </span>
                </div>
              </div>
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
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
