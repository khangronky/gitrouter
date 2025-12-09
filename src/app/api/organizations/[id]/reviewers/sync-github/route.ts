import { NextResponse } from 'next/server';
import { getRepositoryCollaborators } from '@/lib/github/client';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/reviewers/sync-github
 * Sync reviewers from GitHub repository collaborators
 * Creates/updates users with GitHub info and links them as reviewers
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

    // Get GitHub installation for this org
    const { data: installation, error: installError } = await supabase
      .from('github_installations')
      .select('installation_id')
      .eq('organization_id', id)
      .single();

    if (installError || !installation) {
      return NextResponse.json(
        { error: 'GitHub is not connected for this organization' },
        { status: 400 }
      );
    }

    // Get all repositories for this org
    const { data: repos, error: reposError } = await supabase
      .from('repositories')
      .select('github_repo_id, full_name')
      .eq('organization_id', id)
      .eq('is_active', true);

    if (reposError || !repos || repos.length === 0) {
      return NextResponse.json(
        { error: 'No active repositories found' },
        { status: 400 }
      );
    }

    // Get existing reviewers with their linked users
    const { data: existingReviewers } = await supabase
      .from('reviewers')
      .select(
        `
        id,
        name,
        user_id,
        user:users (
          id,
          email,
          github_user_id,
          github_username
        )
      `
      )
      .eq('organization_id', id);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      collaborators_found: 0,
    };

    // Collect all unique collaborators from all repos
    const allCollaborators = new Map<
      string,
      {
        github_username: string;
        github_id: number;
        name: string | null;
        email: string | null;
      }
    >();

    for (const repo of repos) {
      const [owner, repoName] = repo.full_name.split('/');

      try {
        const collaborators = await getRepositoryCollaborators(
          installation.installation_id,
          owner,
          repoName
        );

        for (const collab of collaborators) {
          // Use GitHub username as key to dedupe
          if (!allCollaborators.has(collab.github_username.toLowerCase())) {
            allCollaborators.set(collab.github_username.toLowerCase(), {
              github_username: collab.github_username,
              github_id: collab.github_id,
              name: collab.name,
              email: collab.email,
            });
          }
        }
      } catch (error) {
        console.error(
          `Failed to get collaborators for ${repo.full_name}:`,
          error
        );
      }
    }

    results.collaborators_found = allCollaborators.size;

    // Process each collaborator
    for (const collab of allCollaborators.values()) {
      // Check if reviewer already exists by checking linked user's github_username
      const existingByUsername = existingReviewers?.find((r) => {
        const user = r.user as {
          github_username: string | null;
          github_user_id: number | null;
        } | null;
        return (
          user?.github_username?.toLowerCase() ===
            collab.github_username.toLowerCase() ||
          user?.github_user_id === collab.github_id
        );
      });

      if (existingByUsername) {
        results.skipped++;
        continue;
      }

      // Check if reviewer exists by linked user's email
      const existingByEmail = collab.email
        ? existingReviewers?.find((r) => {
            const user = r.user as { email: string | null } | null;
            return user?.email?.toLowerCase() === collab.email?.toLowerCase();
          })
        : null;

      if (existingByEmail) {
        // Update the linked user with GitHub info
        const user = existingByEmail.user as { id: string } | null;
        if (user?.id) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              github_username: collab.github_username,
              github_user_id: collab.github_id,
            })
            .eq('id', user.id);

          if (!updateError) {
            results.updated++;
          }
        }
        continue;
      }

      // Check if reviewer exists by name (fuzzy match) without GitHub info
      const existingByName = collab.name
        ? existingReviewers?.find((r) => {
            const user = r.user as { github_username: string | null } | null;
            return (
              r.name.toLowerCase() === collab.name?.toLowerCase() &&
              !user?.github_username
            );
          })
        : null;

      if (existingByName) {
        // Update the linked user with GitHub info if they have one
        const user = existingByName.user as { id: string } | null;
        if (user?.id) {
          const { error: updateError } = await supabase
            .from('users')
            .update({
              github_username: collab.github_username,
              github_user_id: collab.github_id,
            })
            .eq('id', user.id);

          if (!updateError) {
            results.updated++;
          }
        }
        continue;
      }

      // Check if a user already exists with this GitHub ID or username
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(
          `github_user_id.eq.${collab.github_id},github_username.eq.${collab.github_username}`
        )
        .limit(1)
        .single();

      let userId: string;

      if (existingUser) {
        // User exists, use their ID
        userId = existingUser.id;

        // Update their GitHub info just in case
        await supabase
          .from('users')
          .update({
            github_username: collab.github_username,
            github_user_id: collab.github_id,
          })
          .eq('id', userId);
      } else {
        // Create new user with GitHub info
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({
            email:
              collab.email || `${collab.github_username}@github.placeholder`,
            full_name: collab.name,
            github_username: collab.github_username,
            github_user_id: collab.github_id,
          })
          .select('id')
          .single();

        if (userError || !newUser) {
          console.error(
            `Failed to create user for ${collab.github_username}:`,
            userError
          );
          continue;
        }

        userId = newUser.id;
      }

      // Check if reviewer already exists for this user in this org
      const { data: existingReviewer } = await supabase
        .from('reviewers')
        .select('id')
        .eq('organization_id', id)
        .eq('user_id', userId)
        .single();

      if (existingReviewer) {
        results.skipped++;
        continue;
      }

      // Create new reviewer linked to the user
      const { error: createError } = await supabase.from('reviewers').insert({
        organization_id: id,
        user_id: userId,
        is_active: true,
      });

      if (!createError) {
        results.created++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      'Error in POST /api/organizations/[id]/reviewers/sync-github:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
