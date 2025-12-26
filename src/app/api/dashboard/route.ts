import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { dashboardQuerySchema, type TimeRange } from '@/lib/schema/dashboard';
import {
  getAuthenticatedUser,
  requireOrgPermission,
} from '@/lib/organizations/permissions';
import { fetchDashboardData } from './service';

/**
 * GET /api/dashboard
 * Fetch dashboard data for the authenticated user's organization
 */
export async function GET(request: Request) {
  const timestamp = new Date().toISOString();

  try {
    const supabase = await createClient();

    // Check authentication
    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'You must be logged in to access the dashboard',
          timestamp,
        },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const queryParams = {
      timeRange: url.searchParams.get('timeRange') || undefined,
      organizationId: url.searchParams.get('organizationId') || undefined,
      repositoryId: url.searchParams.get('repositoryId') || undefined,
    };

    // Validate query parameters
    const validation = dashboardQuerySchema.safeParse(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.issues.map((e) => e.message).join(', '),
          timestamp,
        },
        { status: 400 }
      );
    }

    const { timeRange = '7d', organizationId, repositoryId } = validation.data;

    // Resolve organization ID
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
      // Get user's first organization as default
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', auth.userId)
        .limit(1)
        .single();

      if (membershipError || !memberships) {
        return NextResponse.json(
          {
            success: false,
            error: 'No organization found',
            message: 'You are not a member of any organization',
            timestamp,
          },
          { status: 404 }
        );
      }

      resolvedOrgId = memberships.organization_id;
    }

    // Check permissions for the organization
    const permission = await requireOrgPermission(
      supabase,
      resolvedOrgId,
      'org:view'
    );
    if (!permission.success) {
      return NextResponse.json(
        {
          success: false,
          error: permission.error,
          timestamp,
        },
        { status: permission.status }
      );
    }

    // If repositoryId is provided, verify it belongs to the organization
    if (repositoryId) {
      const { data: repo, error: repoError } = await supabase
        .from('repositories')
        .select('id, organization_id')
        .eq('id', repositoryId)
        .eq('organization_id', resolvedOrgId)
        .single();

      if (repoError || !repo) {
        return NextResponse.json(
          {
            success: false,
            error: 'Repository not found',
            message:
              'The specified repository does not exist or does not belong to your organization',
            timestamp,
          },
          { status: 404 }
        );
      }
    }

    // Fetch dashboard data
    const dashboardData = await fetchDashboardData({
      supabase,
      organizationId: resolvedOrgId,
      repositoryId,
      timeRange: timeRange as TimeRange,
    });

    return NextResponse.json({
      success: true,
      data: dashboardData,
      timestamp,
      timeRange,
    });
  } catch (error) {
    console.error('Error in GET /api/dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching dashboard data',
        timestamp,
      },
      { status: 500 }
    );
  }
}
