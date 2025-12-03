import { NextResponse } from 'next/server';
import { createDynamicClient } from '@/lib/supabase/server';
import { requireOrgPermission } from '@/lib/organizations/permissions';
import { getRepositoryCollaborators } from '@/lib/github/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/organizations/[id]/reviewers/sync-github
 * Sync reviewers from GitHub repository collaborators
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

    // Get existing reviewers
    const { data: existingReviewers } = await supabase
      .from('reviewers')
      .select('id, name, email, github_username')
      .eq('organization_id', id);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      collaborators_found: 0,
    };

    // Collect all unique collaborators from all repos
    const allCollaborators = new Map<string, {
      github_username: string;
      github_id: number;
      name: string | null;
      email: string | null;
    }>();

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
        console.error(`Failed to get collaborators for ${repo.full_name}:`, error);
      }
    }

    results.collaborators_found = allCollaborators.size;

    // Process each collaborator
    for (const collab of allCollaborators.values()) {
      // Check if reviewer already exists by GitHub username
      const existingByUsername = existingReviewers?.find(
        (r) => r.github_username?.toLowerCase() === collab.github_username.toLowerCase()
      );

      if (existingByUsername) {
        results.skipped++;
        continue;
      }

      // Check if reviewer exists by email
      const existingByEmail = collab.email
        ? existingReviewers?.find(
            (r) => r.email?.toLowerCase() === collab.email?.toLowerCase()
          )
        : null;

      if (existingByEmail) {
        // Update existing reviewer with GitHub username
        const { error: updateError } = await supabase
          .from('reviewers')
          .update({
            github_username: collab.github_username,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByEmail.id);

        if (!updateError) {
          results.updated++;
        }
        continue;
      }

      // Check if reviewer exists by name (fuzzy match)
      const existingByName = collab.name
        ? existingReviewers?.find(
            (r) => r.name.toLowerCase() === collab.name?.toLowerCase()
          )
        : null;

      if (existingByName && !existingByName.github_username) {
        // Update existing reviewer with GitHub username
        const { error: updateError } = await supabase
          .from('reviewers')
          .update({
            github_username: collab.github_username,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingByName.id);

        if (!updateError) {
          results.updated++;
        }
        continue;
      }

      // Create new reviewer
      const { error: createError } = await supabase
        .from('reviewers')
        .insert({
          organization_id: id,
          name: collab.name || collab.github_username,
          github_username: collab.github_username,
          email: collab.email,
          is_active: true,
        });

      if (!createError) {
        results.created++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error in POST /api/organizations/[id]/reviewers/sync-github:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

