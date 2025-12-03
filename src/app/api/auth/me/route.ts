import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';
import { z } from 'zod';

/**
 * GET /api/auth/me
 * Get current user info
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = await createAdminClient();
    const { data: user, error } = await adminSupabase
      .from('users')
      .select('id, email, username, full_name, github_user_id, github_username, slack_user_id, slack_username, created_at')
      .eq('id', auth.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in GET /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const updateUserSchema = z.object({
  full_name: z.string().max(100).optional(),
  username: z.string().max(50).optional(),
  github_username: z.string().max(39).nullable().optional(),
  slack_user_id: z.string().nullable().optional(),
  slack_username: z.string().max(100).nullable().optional(),
});

/**
 * PATCH /api/auth/me
 * Update current user info
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();
    const { data: user, error } = await adminSupabase
      .from('users')
      .update(validation.data)
      .eq('id', auth.userId)
      .select('id, email, username, full_name, github_user_id, github_username, slack_user_id, slack_username, created_at')
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error in PATCH /api/auth/me:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

