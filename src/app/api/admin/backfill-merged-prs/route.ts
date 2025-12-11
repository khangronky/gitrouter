import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/backfill-merged-prs
 * Backfill review assignments for PRs that were merged before the auto-approve logic was added
 * This is a one-time cleanup endpoint
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Find all merged PRs with pending review assignments
    const { data: mergedPRs, error: fetchError } = await supabase
      .from('pull_requests')
      .select(
        `
        id,
        github_pr_number,
        merged_at,
        review_assignments!inner (
          id,
          status
        )
      `
      )
      .eq('status', 'merged')
      .eq('review_assignments.status', 'pending')
      .not('merged_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching merged PRs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch merged PRs', details: fetchError },
        { status: 500 }
      );
    }

    if (!mergedPRs || mergedPRs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No merged PRs with pending assignments found',
        updated: 0,
      });
    }

    // For each merged PR, update its pending review assignments
    let updatedCount = 0;
    const results = [];

    for (const pr of mergedPRs) {
      console.log(`Processing merged PR #${pr.github_pr_number}...`);

      const { error: updateError, data: updated } = await supabase
        .from('review_assignments')
        .update({
          status: 'approved',
          reviewed_at: pr.merged_at,
          updated_at: new Date().toISOString(),
        })
        .eq('pull_request_id', pr.id)
        .eq('status', 'pending')
        .select();

      if (updateError) {
        console.error(
          `Failed to update PR #${pr.github_pr_number}:`,
          updateError
        );
        results.push({
          pr_number: pr.github_pr_number,
          success: false,
          error: updateError.message,
        });
      } else {
        const assignmentCount = updated?.length || 0;
        updatedCount += assignmentCount;
        console.log(
          `✅ Updated ${assignmentCount} assignments for PR #${pr.github_pr_number}`
        );
        results.push({
          pr_number: pr.github_pr_number,
          success: true,
          assignments_updated: assignmentCount,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Backfill completed`,
      total_prs_processed: mergedPRs.length,
      total_assignments_updated: updatedCount,
      results,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

