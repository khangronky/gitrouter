import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { trendQuerySchema, type TrendTimeRange } from '@/lib/schema/trend';
import {
  getAuthenticatedUser,
  requireOrgPermission,
} from '@/lib/organizations/permissions';
import { fetchTrendData } from './service';

/**
 * GET /api/trend
 * Fetch trend data for the authenticated user's organization
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
          message: 'You must be logged in to access trend data',
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
    const validation = trendQuerySchema.safeParse(queryParams);
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

    const { timeRange = '6w', organizationId } = validation.data;

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

    // Fetch trend data
    const trendData = await fetchTrendData({
      supabase,
      organizationId: resolvedOrgId,
      timeRange: timeRange as TrendTimeRange,
    });

    return NextResponse.json({
      success: true,
      data: trendData,
      timestamp,
      timeRange,
    });
  } catch (error) {
    console.error('Error in GET /api/trend:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred while fetching trend data',
        timestamp,
      },
      { status: 500 }
    );
  }
}

