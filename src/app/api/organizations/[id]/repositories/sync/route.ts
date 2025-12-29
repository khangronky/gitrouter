import { NextResponse } from 'next/server';
import { syncOrganizationPullRequests } from '@/lib/github/sync';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { createClient, createAdminClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/repositories/sync
 * Trigger a manual sync of all PRs for the organization's repositories
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'repos:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    console.log(`🔄 Manual PR sync triggered for organization: ${id}`);

    // Use admin client for sync (needs INSERT permission on pull_requests)
    const adminSupabase = await createAdminClient();

    // Run the sync with admin client
    const results = await syncOrganizationPullRequests(adminSupabase, id);

    // Calculate totals
    const totalPRsProcessed = results.reduce(
      (sum, r) => sum + r.prsProcessed,
      0
    );
    const totalPRsInserted = results.reduce((sum, r) => sum + r.prsInserted, 0);
    const totalPRsUpdated = results.reduce((sum, r) => sum + r.prsUpdated, 0);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    console.log(
      `✅ Manual sync complete: ${successCount}/${results.length} repos succeeded, ${totalPRsProcessed} PRs processed`
    );

    return NextResponse.json({
      success: true,
      summary: {
        repositoriesTotal: results.length,
        repositoriesSucceeded: successCount,
        repositoriesFailed: failureCount,
        prsProcessed: totalPRsProcessed,
        prsInserted: totalPRsInserted,
        prsUpdated: totalPRsUpdated,
      },
      results,
    });
  } catch (error) {
    console.error(
      'Error in POST /api/organizations/[id]/repositories/sync:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
