import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createOrganizationSchema } from '@/lib/schema/organization';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';

/**
 * GET /api/organizations
 * List all organizations the user belongs to
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all organizations where user is a member (exclude soft-deleted)
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select(
        `
        role,
        organization:organizations (
          id,
          name,
          slug,
          created_by,
          default_reviewer_id,
          settings,
          created_at,
          updated_at,
          deleted_at
        )
      `
      )
      .eq('user_id', auth.userId)
      .is('deleted_at', null);

    if (membershipError) {
      console.error('Error fetching organizations:', membershipError);
      return NextResponse.json(
        { error: 'Failed to fetch organizations' },
        { status: 500 }
      );
    }

    // Transform the data to include role with organization (filter out soft-deleted orgs)
    const organizations = memberships
      .filter(
        (m) => m.organization !== null && !(m.organization as any).deleted_at
      )
      .map((m) => {
        const { deleted_at, ...org } = m.organization as any;
        return {
          ...org,
          role: m.role,
        };
      });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('Error in GET /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * Create a new organization
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createOrganizationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, slug } = validation.data;

    // Generate slug if not provided or empty
    const orgSlug =
      slug && slug.length > 0
        ? slug
        : name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim() +
          '-' +
          Math.random().toString(36).substring(2, 8);

    // Use admin client to bypass RLS for org creation
    // (auth is already validated above)
    const adminClient = await createAdminClient();

    // Create the organization
    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name,
        slug: orgSlug,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (orgError) {
      if (orgError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'Organization slug already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating organization:', orgError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    // Add user as owner
    const { error: memberError } = await adminClient
      .from('organization_members')
      .insert({
        organization_id: org.id,
        user_id: auth.userId,
        role: 'owner',
      });

    if (memberError) {
      // Rollback: delete the organization
      await adminClient.from('organizations').delete().eq('id', org.id);
      console.error('Error adding owner membership:', memberError);
      return NextResponse.json(
        { error: 'Failed to create organization' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { organization: { ...org, role: 'owner' } },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/organizations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
