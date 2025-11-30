import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';

interface MemberResponse {
  id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'member';
}

/**
 * Get organization members
 * GET /api/organizations/members?organizationId=xxx
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch members
    const { data: members, error } = await supabase
      .from('organization_members')
      .select('id, role, user_id, users(id, email, full_name)')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Failed to fetch members:', error);
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      );
    }

    const formattedMembers: MemberResponse[] = members.map((m: any) => ({
      id: m.id,
      email: m.users?.email || '',
      full_name: m.users?.full_name,
      role: m.role,
    }));

    return NextResponse.json({
      members: formattedMembers,
    });
  } catch (error) {
    console.error('Get members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Add a member to organization
 * POST /api/organizations/members
 * Body: { organizationId: string, email: string, role: 'admin' | 'member' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, email, role = 'member' } = body;

    if (!organizationId || !email) {
      return NextResponse.json(
        { error: 'Organization ID and email are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has admin/owner access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the user by email
    const { data: targetUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found. They must register first.' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', targetUser.id)
      .single();

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Add membership
    const { data: newMember, error: insertError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: organizationId,
        user_id: targetUser.id,
        role,
      })
      .select('id, role, users(id, email, full_name)')
      .single();

    if (insertError) {
      console.error('Failed to add member:', insertError);
      return NextResponse.json(
        { error: 'Failed to add member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        email: (newMember.users as any)?.email || '',
        full_name: (newMember.users as any)?.full_name,
        role: newMember.role,
      },
    });
  } catch (error) {
    console.error('Add member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Update a member's role
 * PATCH /api/organizations/members
 * Body: { organizationId: string, memberId: string, role: 'admin' | 'member' }
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, memberId, role } = body;

    if (!organizationId || !memberId || !role) {
      return NextResponse.json(
        { error: 'Organization ID, member ID, and role are required' },
        { status: 400 }
      );
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be admin or member' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has owner access (only owners can change roles)
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json(
        { error: 'Only owners can change member roles' },
        { status: 403 }
      );
    }

    // Check if target is the owner (can't change owner's role)
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      );
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role })
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.error('Failed to update member role:', updateError);
      return NextResponse.json(
        { error: 'Failed to update member role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Update member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Remove a member from organization
 * DELETE /api/organizations/members
 * Body: { organizationId: string, memberId: string }
 */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { organizationId, memberId } = body;

    if (!organizationId || !memberId) {
      return NextResponse.json(
        { error: 'Organization ID and member ID are required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const userSupabase = await createClient();
    const { data: { user } } = await userSupabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createAdminClient();

    // Verify user has admin/owner access
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if target is the owner (can't remove owner)
    const { data: targetMember } = await supabase
      .from('organization_members')
      .select('role')
      .eq('id', memberId)
      .eq('organization_id', organizationId)
      .single();

    if (!targetMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    if (targetMember.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove the organization owner' },
        { status: 400 }
      );
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId)
      .eq('organization_id', organizationId);

    if (deleteError) {
      console.error('Failed to remove member:', deleteError);
      return NextResponse.json(
        { error: 'Failed to remove member' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

