import { NextResponse } from 'next/server';
import { createDynamicClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getOrgSlackClient, lookupUserByEmail, listWorkspaceMembers } from '@/lib/slack/client';
import { searchUserByEmail as searchGitHubUserByEmail } from '@/lib/github/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/reviewers/sync-slack
 * Auto-lookup Slack users by email/name and link them to reviewers
 */
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createDynamicClient();

    const permission = await requireOrgPermission(supabase, id, 'reviewers:manage');
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

    // Fetch all reviewers that need syncing
    const { data: reviewers, error: fetchError } = await supabase
      .from('reviewers')
      .select('id, name, email, slack_user_id, github_username')
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
      if (!reviewer.email) {
        continue;
      }

      const updates: { slack_user_id?: string; github_username?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };
      let hasUpdates = false;

      // Lookup Slack user if not already linked
      if (!reviewer.slack_user_id) {
        let slackUserId: string | null = null;

        // Try email lookup first (most accurate)
        if (reviewer.email) {
          try {
            slackUserId = await lookupUserByEmail(slackClient, reviewer.email);
          } catch (error) {
            console.error(`Error looking up Slack user by email for ${reviewer.name}:`, error);
          }
        }

        // If no email match, try matching by name/display_name
        if (!slackUserId && reviewer.name) {
          const nameLower = reviewer.name.toLowerCase();
          const matchedMember = slackMembers.find(
            (m) =>
              m.display_name.toLowerCase() === nameLower ||
              m.real_name.toLowerCase() === nameLower ||
              m.name.toLowerCase() === nameLower
          );
          if (matchedMember) {
            slackUserId = matchedMember.id;
            console.log(`Matched reviewer ${reviewer.name} to Slack user ${matchedMember.display_name || matchedMember.name} by name`);
          }
        }

        if (slackUserId) {
          updates.slack_user_id = slackUserId;
          hasUpdates = true;
          results.slack_synced++;
        }
      } else {
        results.already_linked++;
      }

      // Lookup GitHub username if not already set and GitHub is connected
      if (!reviewer.github_username && installation?.installation_id) {
        try {
          const githubUsername = await searchGitHubUserByEmail(
            installation.installation_id,
            reviewer.email
          );
          if (githubUsername) {
            updates.github_username = githubUsername;
            hasUpdates = true;
            results.github_synced++;
          }
        } catch (error) {
          console.error(`Error looking up GitHub user for ${reviewer.name}:`, error);
        }
      }

      // Apply updates if any
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('reviewers')
          .update(updates)
          .eq('id', reviewer.id);

        if (updateError) {
          console.error(`Error updating reviewer ${reviewer.name}:`, updateError);
          results.errors.push(reviewer.name);
        }
      } else if (!reviewer.slack_user_id) {
        results.not_found.push(reviewer.name);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/reviewers/sync-slack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

