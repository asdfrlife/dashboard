export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export interface CycleCalculation {
  firstRunAt: Date;
  firstRunAtIso: string;
  now: Date;
  periodsPassed: number;
  currentCycleStart: Date;
  currentCycleStartIso: string;
  currentCycleEnd: Date;
  currentCycleEndIso: string;
  msRemaining: number;
  formattedCountdown: string;
  isOverdue: boolean;
}

/**
 * Calculates exact 24-hour cycle boundaries from the initial run timestamp:
 * current_cycle_start = first_run_at + (floor((now - first_run_at) / 24 hours) * 24 hours)
 * current_cycle_end = current_cycle_start + 24 hours
 */
export function calculateCycle(
  firstRunAtInput: string | Date | null | undefined,
  nowInput: Date = new Date()
): CycleCalculation {
  const now = nowInput instanceof Date ? nowInput : new Date(nowInput);
  const nowMs = now.getTime();

  let firstRunDate: Date;
  if (!firstRunAtInput) {
    // Default fallback to 24 hours before now
    firstRunDate = new Date(nowMs - TWENTY_FOUR_HOURS_MS);
  } else {
    firstRunDate = typeof firstRunAtInput === 'string' ? new Date(firstRunAtInput) : firstRunAtInput;
    if (isNaN(firstRunDate.getTime())) {
      firstRunDate = new Date(nowMs - TWENTY_FOUR_HOURS_MS);
    }
  }

  const firstRunMs = firstRunDate.getTime();
  const diffMs = nowMs - firstRunMs;

  // Number of full 24-hour periods since first_run_at
  const periodsPassed = Math.floor(diffMs / TWENTY_FOUR_HOURS_MS);

  const currentCycleStartMs = firstRunMs + (periodsPassed * TWENTY_FOUR_HOURS_MS);
  const currentCycleEndMs = currentCycleStartMs + TWENTY_FOUR_HOURS_MS;

  const currentCycleStart = new Date(currentCycleStartMs);
  const currentCycleEnd = new Date(currentCycleEndMs);

  const rawRemaining = currentCycleEndMs - nowMs;
  const msRemaining = Math.max(0, rawRemaining);
  const isOverdue = rawRemaining <= 0;

  const formattedCountdown = formatTimeRemaining(msRemaining);

  return {
    firstRunAt: firstRunDate,
    firstRunAtIso: firstRunDate.toISOString(),
    now,
    periodsPassed,
    currentCycleStart,
    currentCycleStartIso: currentCycleStart.toISOString(),
    currentCycleEnd,
    currentCycleEndIso: currentCycleEnd.toISOString(),
    msRemaining,
    formattedCountdown,
    isOverdue,
  };
}

/**
 * Formats milliseconds remaining into human-readable countdown string (e.g. "4h 12m")
 */
export function formatTimeRemaining(msRemaining: number): string {
  if (msRemaining <= 0) return '0m';

  const totalMinutes = Math.floor(msRemaining / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0 && minutes === 0) {
    const seconds = Math.floor(msRemaining / 1000);
    return `${Math.max(1, seconds)}s`;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h ${minutes}m`;
}

/**
 * Converts a Date or ISO string to the local 'YYYY-MM-DDTHH:mm' format
 * required by HTML <input type="datetime-local" />.
 */
export function toDateTimeLocalInput(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a datetime-local input string ('YYYY-MM-DDTHH:mm') to ISO 8601 string.
 */
export function fromDateTimeLocalInput(localValue: string): string {
  const d = new Date(localValue);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date/time provided');
  }
  return d.toISOString();
}
