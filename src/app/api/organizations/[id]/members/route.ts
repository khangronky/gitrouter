import { NextResponse } from 'next/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import {
  addMemberByEmailSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '@/lib/schema/organization';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/members
 * List all members of an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'members:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: members, error } = await supabase
      .from('organization_members')
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        updated_at,
        user:users (
          id,
          email,
          full_name,
          username
        )
      `
      )
      .eq('organization_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/members
 * Add a member to the organization directly by email or user_id
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'members:invite'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();

    // Try to parse as email-based request first
    const emailValidation = addMemberByEmailSchema.safeParse(body);
    const idValidation = addMemberSchema.safeParse(body);

    let user_id: string;
    let role: 'member' | 'admin';

    if (emailValidation.success) {
      // Adding by email
      const { email, role: memberRole } = emailValidation.data;
      role = memberRole;

      // Use admin client to look up user by email
      const adminSupabase = await createAdminClient();
      const { data: user, error: userError } = await adminSupabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          {
            error:
              'User not found. They must sign up first before being added to the team.',
          },
          { status: 404 }
        );
      }

      user_id = user.id;
    } else if (idValidation.success) {
      // Adding by user_id
      user_id = idValidation.data.user_id;
      role = idValidation.data.role;
    } else {
      return NextResponse.json(
        {
          error:
            'Validation failed. Provide either email or user_id with role.',
        },
        { status: 400 }
      );
    }

    // Use admin client for the rest of operations
    const adminSupabase = await createAdminClient();

    // Check if already a member
    const { data: existing } = await adminSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 409 }
      );
    }

    // Add member
    const { data: member, error: memberError } = await adminSupabase
      .from('organization_members')
      .insert({
        organization_id: id,
        user_id,
        role,
      })
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        updated_at,
        user:users (
          id,
          email,
          full_name,
          username
        )
      `
      )
      .single();

    if (memberError) {
      console.error('Error adding member:', memberError);
      return NextResponse.json(
        { error: 'Failed to add member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/organizations/[id]/members
 * Update a member's role
 * Body: { member_id: string, role: OrganizationRole }
 */
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'members:update_role'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const { member_id } = body;

    if (!member_id) {
      return NextResponse.json(
        { error: 'member_id is required' },
        { status: 400 }
      );
    }

    const validation = updateMemberRoleSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { role } = validation.data;

    // Get the member to update
    const { data: targetMember, error: fetchError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('id', member_id)
      .eq('organization_id', id)
      .single();

    if (fetchError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot change owner's role (must transfer ownership)
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role. Use transfer ownership instead.' },
        { status: 400 }
      );
    }

    // Cannot promote to owner
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot promote to owner. Use transfer ownership instead.' },
        { status: 400 }
      );
    }

    // Admins cannot change other admins' roles
    if (permission.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: "Admins cannot change other admins' roles" },
        { status: 403 }
      );
    }

    const { data: member, error: updateError } = await supabase
      .from('organization_members')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', member_id)
      .select(
        `
        id,
        organization_id,
        user_id,
        role,
        created_at,
        updated_at
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error('Error in PATCH /api/organizations/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/members
 * Remove a member from the organization
 * Query: ?member_id=xxx
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'members:remove'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('member_id');

    if (!memberId) {
      return NextResponse.json(
        { error: 'member_id is required' },
        { status: 400 }
      );
    }

    // Get the member to remove
    const { data: targetMember, error: fetchError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('id', memberId)
      .eq('organization_id', id)
      .single();

    if (fetchError || !targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Cannot remove owner
    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove owner from organization' },
        { status: 400 }
      );
    }

    // Admins cannot remove other admins
    if (permission.role === 'admin' && targetMember.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot remove other admins' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error removing member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/organizations/[id]/members:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
