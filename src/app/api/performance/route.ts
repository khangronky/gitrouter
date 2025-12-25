import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  performanceQuerySchema,
  type PerformanceTimeRange,
} from '@/lib/schema/performance';
import {
  getAuthenticatedUser,
  requireOrgPermission,
} from '@/lib/organizations/permissions';
import { fetchPerformanceData } from './service';

/**
 * GET /api/performance
 * Fetch performance data for the authenticated user's organization
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
          message: 'You must be logged in to access performance data',
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
    };

    // Validate query parameters
    const validation = performanceQuerySchema.safeParse(queryParams);
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

    const { timeRange = '7d', organizationId } = validation.data;

    // Resolve organization ID
    let resolvedOrgId = organizationId;
    if (!resolvedOrgId) {
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

    // Fetch performance data
    const performanceData = await fetchPerformanceData({
      supabase,
      organizationId: resolvedOrgId,
      timeRange: timeRange as PerformanceTimeRange,
    });

    return NextResponse.json({
      success: true,
      data: performanceData,
      timestamp,
      timeRange,
    });
  } catch (error) {
    console.error('Error in GET /api/performance:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching performance data',
        timestamp,
      },
      { status: 500 }
    );
  }
}
