import { NextResponse } from 'next/server';
import { searchUserByEmail as searchGitHubUserByEmail } from '@/lib/github/client';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import {
  getOrgSlackClient,
  listWorkspaceMembers,
  lookupUserByEmail,
} from '@/lib/slack/client';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/reviewers/sync-slack
 * Auto-lookup Slack users by email/name and update linked users with Slack/GitHub info
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const permission = await requireOrgPermission(
      supabase,
      id,
      'reviewers:manage'
    );
    if (!permission.success) {
      return NextResponse.json(
        { error: permission.error },
        { status: permission.status }
      );
    }

    // Get Slack client for this org
    const slackClient = await getOrgSlackClient(supabase, id);
    if (!slackClient) {
      return NextResponse.json(
        { error: 'Slack is not connected for this organization' },
        { status: 400 }
      );
    }

    // Get GitHub installation for this org (optional - for GitHub username lookup)
    const { data: installation } = await supabase
      .from('github_installations')
      .select('installation_id')
      .eq('organization_id', id)
      .single();

    // Get all Slack workspace members for name matching
    const slackMembers = await listWorkspaceMembers(slackClient);

    // Fetch all reviewers with their linked users
    const { data: reviewers, error: fetchError } = await supabase
      .from('reviewers')
      .select(
        `
        id,
        user:users (
          id,
          email,
          full_name,
          slack_user_id,
          github_username
        )
      `
      )
      .eq('organization_id', id)
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching reviewers:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch reviewers' },
        { status: 500 }
      );
    }

    const results = {
      slack_synced: 0,
      github_synced: 0,
      already_linked: 0,
      not_found: [] as string[],
      errors: [] as string[],
    };

    // Process each reviewer
    for (const reviewer of reviewers || []) {
      // Get user info
      const user = reviewer.user as {
        id: string;
        email: string | null;
        full_name: string | null;
        slack_user_id: string | null;
        github_username: string | null;
      } | null;

      const displayName = user?.full_name || 'Unknown';

      if (!user?.id || !user.email) {
        results.not_found.push(displayName);
        continue;
      }

      const userUpdates: {
        slack_user_id?: string;
        github_username?: string;
      } = {};
      let hasUpdates = false;

      // Lookup Slack user if not already linked
      if (!user.slack_user_id) {
        let slackUserId: string | null = null;

        // Try email lookup first (most accurate)
        try {
          slackUserId = await lookupUserByEmail(slackClient, user.email);
        } catch (error) {
          console.error(
            `Error looking up Slack user by email for ${displayName}:`,
            error
          );
        }

        // If no email match, try matching by name/display_name
        if (!slackUserId && user.full_name) {
          const nameLower = user.full_name.toLowerCase();
          const matchedMember = slackMembers.find(
            (m) =>
              m.display_name.toLowerCase() === nameLower ||
              m.real_name.toLowerCase() === nameLower ||
              m.name.toLowerCase() === nameLower
          );
          if (matchedMember) {
            slackUserId = matchedMember.id;
            console.log(
              `Matched reviewer ${displayName} to Slack user ${matchedMember.display_name || matchedMember.name} by name`
            );
          }
        }

        if (slackUserId) {
          userUpdates.slack_user_id = slackUserId;
          hasUpdates = true;
          results.slack_synced++;
        }
      } else {
        results.already_linked++;
      }

      // Lookup GitHub username if not already set and GitHub is connected
      if (!user.github_username && installation?.installation_id) {
        try {
          const githubUsername = await searchGitHubUserByEmail(
            installation.installation_id,
            user.email
          );
          if (githubUsername) {
            userUpdates.github_username = githubUsername;
            hasUpdates = true;
            results.github_synced++;
          }
        } catch (error) {
          console.error(`Error looking up GitHub user for ${displayName}:`, error);
        }
      }

      // Apply updates to the user if any
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);

        if (updateError) {
          console.error(
            `Error updating user for reviewer ${displayName}:`,
            updateError
          );
          results.errors.push(displayName);
        }
      } else if (!user.slack_user_id) {
        results.not_found.push(displayName);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      'Error in POST /api/organizations/[id]/reviewers/sync-slack:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
