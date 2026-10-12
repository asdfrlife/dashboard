import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPipelineSettings, updatePipelineSettings } from '@/lib/settings';

export async function GET() {
  const settings = await getPipelineSettings();
  return NextResponse.json({ success: true, settings });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { daily_cap, first_run_at } = body;

    if (daily_cap === undefined || daily_cap === null) {
      return NextResponse.json(
        { success: false, error: 'daily_cap is required' },
        { status: 400 }
      );
    }

    const numericCap = Number(daily_cap);
    if (isNaN(numericCap) || numericCap < 1) {
      return NextResponse.json(
        { success: false, error: 'daily_cap must be a positive integer' },
        { status: 400 }
      );
    }

    if (!first_run_at) {
      return NextResponse.json(
        { success: false, error: 'first_run_at timestamp is required' },
        { status: 400 }
      );
    }

    const firstRunDate = new Date(first_run_at);
    if (isNaN(firstRunDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid first_run_at date format' },
        { status: 400 }
      );
    }

    const firstRunIso = firstRunDate.toISOString();
    const result = await updatePipelineSettings(numericCap, firstRunIso);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update pipeline settings' },
        { status: 500 }
      );
    }

    // Invalidate cached pages so cycle metrics refresh immediately
    revalidatePath('/');
    revalidatePath('/youtube');

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
      settings: result.data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request payload';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
