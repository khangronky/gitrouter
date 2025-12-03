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

    const { data: reviewers, error } = await supabase
      .from('reviewers')
      .select(
        `
        id,
        organization_id,
        user_id,
        name,
        github_username,
        slack_user_id,
        email,
        is_active,
        created_at,
        updated_at,
        user:users (
          id,
          email,
          full_name
        )
      `
      )
      .eq('organization_id', id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching reviewers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch reviewers' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviewers });
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
 * Create a new reviewer
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

    const { name, user_id, github_username, slack_user_id, email, is_active } =
      validation.data;

    // If user_id provided, verify user exists
    if (user_id) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
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
    }

    const { data: reviewer, error: createError } = await supabase
      .from('reviewers')
      .insert({
        organization_id: id,
        name,
        user_id: user_id || null,
        github_username: github_username || null,
        slack_user_id: slack_user_id || null,
        email: email || null,
        is_active: is_active ?? true,
      })
      .select(
        `
        id,
        organization_id,
        user_id,
        name,
        github_username,
        slack_user_id,
        email,
        is_active,
        created_at,
        updated_at
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

    return NextResponse.json({ reviewer }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/reviewers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
