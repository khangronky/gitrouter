import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateOrganizationSchema } from '@/lib/schema/organization';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]
 * Get organization details
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: org, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get member count
    const { count } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', id);

    return NextResponse.json({
      organization: {
        ...org,
        role: permission.role,
        member_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]
 * Update organization details
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:update');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = updateOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updateData = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    const { data: org, error } = await supabase
      .from('organizations')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]
 * Delete organization (owner only)
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'org:delete');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Delete organization (cascades to members, repos, etc.)
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting organization:', error);
      return NextResponse.json(
        { error: 'Failed to delete organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
