import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createInvitationSchema } from '@/lib/schema/organization';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import crypto from 'crypto';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/invitations
 * List all pending invitations for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
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

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select(
        `
        id,
        organization_id,
        email,
        role,
        status,
        expires_at,
        created_at,
        inviter:users!invited_by (
          id,
          email,
          full_name
        )
      `
      )
      .eq('organization_id', id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/invitations
 * Create a new invitation
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
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { email, role } = validation.data;

    // Cannot invite as owner
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot invite as owner' },
        { status: 400 }
      );
    }

    // Check if user is already a member
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const { data: existingMember } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: 'User is already a member of this organization' },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('organization_id', id)
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email' },
        { status: 409 }
      );
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert({
        organization_id: id,
        email,
        role,
        token,
        invited_by: permission.userId,
        expires_at: expiresAt.toISOString(),
      })
      .select(
        `
        id,
        organization_id,
        email,
        role,
        token,
        status,
        expires_at,
        created_at
      `
      )
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      );
    }

    // TODO: Send invitation email

    return NextResponse.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/invitations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id]/invitations
 * Cancel an invitation
 * Query: ?invitation_id=xxx
 */
export async function DELETE(request: Request, { params }: RouteParams) {
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

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('invitation_id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'invitation_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('organization_id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling invitation:', error);
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error(
      'Error in DELETE /api/organizations/[id]/invitations:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
