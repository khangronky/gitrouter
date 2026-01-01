import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/organizations/permissions';

/**
 * GET /api/github/install
 * Redirect user to GitHub App installation page
 * Query: ?org_id=xxx
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const auth = await getAuthenticatedUser(supabase);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get('org_id');
    const onboarding = searchParams.get('onboarding') === 'true';

    if (!orgId) {
      return NextResponse.json(
        { error: 'org_id is required' },
        { status: 400 }
      );
    }

    // Verify user has permission to manage this org
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', auth.userId)
      .single();

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        {
          error:
            'You do not have permission to install GitHub App for this organization',
        },
        { status: 403 }
      );
    }

    // Check if already has an active installation (not soft-deleted)
    const { data: existingInstallation } = await supabase
      .from('github_installations')
      .select('id')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (existingInstallation) {
      return NextResponse.json(
        { error: 'Organization already has a GitHub App installation' },
        { status: 409 }
      );
    }

    // Get GitHub App slug/name from env
    const appSlug = process.env.GITHUB_APP_SLUG;
    if (!appSlug) {
      return NextResponse.json(
        { error: 'GitHub App is not configured' },
        { status: 500 }
      );
    }

    // Create state parameter with org_id and onboarding flag for callback
    const stateData: { org_id: string; onboarding?: boolean } = {
      org_id: orgId,
    };
    if (onboarding) {
      stateData.onboarding = true;
    }
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Build GitHub App installation URL
    const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${state}`;

    return NextResponse.json({ url: installUrl });
  } catch (error) {
    console.error('Error in GET /api/github/install:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
