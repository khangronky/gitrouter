import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/github-installation
 * Get GitHub installation for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:view'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: installation, error } = await supabase
      .from('github_installations')
      .select(
        'id, installation_id, account_login, account_type, created_at, updated_at'
      )
      .eq('organization_id', id)
      .is('deleted_at', null)
      .single();

    if (error || !installation) {
      return NextResponse.json({ installation: null });
    }

    return NextResponse.json({ installation });
  } catch (error) {
    console.error(
      'Error in GET /api/organizations/[id]/github-installation:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/github-installation
 * Remove GitHub installation from organization
 */
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'integrations:manage'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient();

    // Soft delete the installation
    const { error } = await adminSupabase
      .from('github_installations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('organization_id', id)
      .is('deleted_at', null);

    if (error) {
      console.error('Error soft-deleting GitHub installation:', error);
      return NextResponse.json(
        { error: 'Failed to delete installation' },
        { status: 500 }
      );
    }

    // Soft delete all repositories linked to this org
    await adminSupabase
      .from('repositories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('organization_id', id)
      .is('deleted_at', null);

    return NextResponse.json({ message: 'GitHub installation removed' });
  } catch (error) {
    console.error(
      'Error in DELETE /api/organizations/[id]/github-installation:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
