'use client';

import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeRemaining } from '@/lib/cycle';

interface CycleCountdownProps {
  targetDateIso: string;
  className?: string;
  showIcon?: boolean;
}

export function CycleCountdown({
  targetDateIso,
  className = '',
  showIcon = true,
}: CycleCountdownProps) {
  const [msRemaining, setMsRemaining] = useState<number>(() => {
    const target = new Date(targetDateIso).getTime();
    return Math.max(0, target - Date.now());
  });

  useEffect(() => {
    const calculate = () => {
      const target = new Date(targetDateIso).getTime();
      setMsRemaining(Math.max(0, target - Date.now()));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  const countdownText = formatTimeRemaining(msRemaining);

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-zinc-400 ${className}`}>
      {showIcon && <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
      <span>Cycle resets in <strong className="text-zinc-200 font-semibold">{countdownText}</strong></span>
    </span>
  );
}
