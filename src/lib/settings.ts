import { supabase } from './supabase';
import { PipelineSettings } from '@/types';

export const DEFAULT_DAILY_CAP = parseInt(process.env.DAILY_CAP || '8', 10);

/**
 * Returns a sensible default timestamp for first_run_at when nothing is stored in DB.
 * Default is 24 hours before now.
 */
export function getDefaultFirstRunAt(): string {
  const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return d.toISOString();
}

/**
 * Fetches the singleton pipeline_settings row (id = 1).
 * Falls back safely to default settings if no row exists or if the table is empty.
 */
export async function getPipelineSettings(): Promise<PipelineSettings> {
  try {
    const { data, error } = await supabase
      .from('pipeline_settings')
      .select('id, daily_cap, first_run_at')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('Could not fetch pipeline_settings from Supabase (using defaults):', error.message);
      return {
        id: 1,
        daily_cap: DEFAULT_DAILY_CAP,
        first_run_at: getDefaultFirstRunAt(),
      };
    }

    if (data) {
      return {
        id: 1,
        daily_cap: typeof data.daily_cap === 'number' ? data.daily_cap : DEFAULT_DAILY_CAP,
        first_run_at: data.first_run_at || getDefaultFirstRunAt(),
      };
    }
  } catch (err) {
    console.warn('Error reading pipeline_settings:', err);
  }

  return {
    id: 1,
    daily_cap: DEFAULT_DAILY_CAP,
    first_run_at: getDefaultFirstRunAt(),
  };
}

/**
 * Saves or updates pipeline_settings where id = 1.
 */
export async function updatePipelineSettings(
  dailyCap: number,
  firstRunAtIso: string
): Promise<{ success: boolean; data?: PipelineSettings; error?: string }> {
  try {
    const payload = {
      id: 1,
      daily_cap: Math.max(1, Math.round(dailyCap)),
      first_run_at: firstRunAtIso,
    };

    const { data, error } = await supabase
      .from('pipeline_settings')
      .upsert(payload, { onConflict: 'id' })
      .select('id, daily_cap, first_run_at')
      .single();

    if (error) {
      console.error('Failed to update pipeline_settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as PipelineSettings };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
    return { success: false, error: errorMsg };
  }
}
