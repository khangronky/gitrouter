import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createReviewerSchema } from '@/lib/schema/reviewer';
import { requireOrgPermission } from '@/lib/organizations/permissions';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/organizations/[id]/reviewers
 * List all reviewers for an organization
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:view');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const { data: reviewersData, error } = await supabase
      .from('reviewers')
      .select(
        `
        id,
        organization_id,
        is_active,
        created_at,
        updated_at,
        user:users (
          id,
          email,
          full_name,
          github_username,
          slack_user_id
        )
      `
      )
      .eq('organization_id', id)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching reviewers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviewers' },
        { status: 500 }
      );
    }

    // Sort by user.full_name
    const sortedReviewers = reviewersData?.sort((a, b) => {
      const nameA =
        (a.user as { full_name: string | null } | null)?.full_name || '';
      const nameB =
        (b.user as { full_name: string | null } | null)?.full_name || '';
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ reviewers: sortedReviewers });
  } catch (error) {
    console.error('Error in GET /api/organizations/[id]/reviewers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations/[id]/reviewers
 * Create a new reviewer (requires a linked user)
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(supabase, id, 'rules:create');
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    const body = await request.json();
    const validation = createReviewerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { user_id, github_username, slack_user_id, is_active } =
      validation.data;

    // user_id is required to create a reviewer
    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required to create a reviewer' },
        { status: 400 }
      );
    }

    // Verify user exists and get their name
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if reviewer already exists for this user in this org
    const { data: existingReviewer } = await supabase
      .from('reviewers')
      .select('id')
      .eq('organization_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingReviewer) {
      return NextResponse.json(
        {
          error: 'Reviewer already exists for this user',
          reviewer: existingReviewer,
        },
        { status: 409 }
      );
    }

    // Update user with provided integration fields if any
    const userUpdates: Record<string, string> = {};
    if (github_username) userUpdates.github_username = github_username;
    if (slack_user_id) userUpdates.slack_user_id = slack_user_id;

    if (Object.keys(userUpdates).length > 0) {
      await supabase.from('users').update(userUpdates).eq('id', user_id);
    }

    const { data: reviewerData, error: createError } = await supabase
      .from('reviewers')
      .insert({
        organization_id: id,
        user_id,
        name: user.full_name || 'Unknown',
        is_active: is_active ?? true,
      })
      .select(
        `
        id,
        organization_id,
        is_active,
        created_at,
        updated_at,
        user:users (
          id,
          email,
          full_name,
          github_username,
          slack_user_id
        )
      `
      )
      .single();

    if (createError) {
      console.error('Error creating reviewer:', createError);
      return NextResponse.json(
        { error: 'Failed to create reviewer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviewer: reviewerData }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/reviewers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
