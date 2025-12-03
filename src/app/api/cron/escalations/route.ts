import { NextResponse } from 'next/server';
import { processEscalations } from '@/lib/escalation';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/escalations
 * Process escalations for stale PR reviews
 *
 * This endpoint is called by Vercel Cron every hour.
 * It checks for:
 * - 24h overdue: Send reminder to reviewer
 * - 48h overdue: Alert team leads
 */
export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting escalation processing...');
    const startTime = Date.now();

    const supabase = await createAdminClient();

    const stats = await processEscalations(supabase);

    const duration = Date.now() - startTime;

    console.log('Escalation processing complete:', {
      ...stats,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      ...stats,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Escalation cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Escalation processing failed',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/escalations
 * Manual trigger for escalation processing (for testing)
 */
export async function POST(request: Request) {
  // For manual triggers, require authentication
  const supabase = await createAdminClient();

  // Check for admin authorization (you could add more checks here)
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Manual escalation trigger...');
  const startTime = Date.now();

  const stats = await processEscalations(supabase);

  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    ...stats,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    triggered_by: 'manual',
  });
}
