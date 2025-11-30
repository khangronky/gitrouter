import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/invitations/[token]/accept
 * Accept an invitation and join the organization
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', auth.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select(
        `
        id,
        organization_id,
        email,
        role,
        status,
        expires_at,
        organization:organizations (
          id,
          name,
          slug
        )
      `
      )
      .eq('token', token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invitation is no longer valid' },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Verify email matches (case-insensitive)
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', invitation.organization_id)
      .eq('user_id', auth.userId)
      .single();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabase
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 409 }
      );
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from('organization_members')
      .insert({
        organization_id: invitation.organization_id,
        user_id: auth.userId,
        role: invitation.role,
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
      return NextResponse.json(
        { error: 'Failed to join organization' },
        { status: 500 }
      );
    }

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id);

    return NextResponse.json({
      message: 'Successfully joined organization',
      organization: invitation.organization,
    });
  } catch (error) {
    console.error('Error in POST /api/invitations/[token]/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invitations/[token]/accept
 * Get invitation details (for showing on accept page)
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(
        `
        id,
        email,
        role,
        status,
        expires_at,
        created_at,
        organization:organizations (
          id,
          name,
          slug
        ),
        inviter:users!invited_by (
          id,
          full_name,
          email
        )
      `
      )
      .eq('token', token)
      .single();

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Check status
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Invitation is no longer valid',
          status: invitation.status,
        },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Don't include token in response for security
    const { ...invitationWithoutToken } = invitation;
    return NextResponse.json({ invitation: invitationWithoutToken });
  } catch (error) {
    console.error('Error in GET /api/invitations/[token]/accept:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
