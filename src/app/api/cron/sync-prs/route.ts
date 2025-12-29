import { NextResponse } from 'next/server';
import { syncAllPullRequests } from '@/lib/github/sync';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/cron/sync-prs
 * Sync pull requests from GitHub for all active repositories
 *
 * This endpoint is called by Vercel Cron every 12 hours.
 * It fetches PRs from the last 90 days for all repositories.
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

    console.log('🔄 Starting PR sync cron job...');
    const startTime = Date.now();

    const supabase = await createAdminClient();

    const stats = await syncAllPullRequests(supabase);

    const duration = Date.now() - startTime;

    console.log('PR sync cron complete:', {
      ...stats,
      duration_ms: duration,
    });

    return NextResponse.json({
      success: true,
      totalRepositories: stats.totalRepositories,
      successCount: stats.successCount,
      failureCount: stats.failureCount,
      totalPRsProcessed: stats.totalPRsProcessed,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('PR sync cron error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'PR sync failed',
        message: String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sync-prs
 * Manual trigger for PR sync (for testing)
 */
export async function POST(request: Request) {
  // For manual triggers, require authentication
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('📥 Manual PR sync trigger...');
  const startTime = Date.now();

  const supabase = await createAdminClient();

  const stats = await syncAllPullRequests(supabase);

  const duration = Date.now() - startTime;

  return NextResponse.json({
    success: true,
    totalRepositories: stats.totalRepositories,
    successCount: stats.successCount,
    failureCount: stats.failureCount,
    totalPRsProcessed: stats.totalPRsProcessed,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
    triggered_by: 'manual',
  });
}
