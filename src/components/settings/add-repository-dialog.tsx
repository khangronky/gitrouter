'use client';

import { Link, List, Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAddRepositoriesFromGitHub,
  useAvailableRepositories,
} from '@/lib/api/github';

interface AddRepositoryDialogProps {
  orgId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Parse a GitHub URL to extract owner and repo name
 * Supports formats:
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 * - owner/repo
 */
function parseGitHubUrl(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim();

  // Try owner/repo format first
  const simpleMatch = trimmed.match(
    /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/
  );
  if (simpleMatch) {
    return { owner: simpleMatch[1], repo: simpleMatch[2] };
  }

  // Try HTTPS URL format
  const httpsMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?(?:\/.*)?$/
  );
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // Try SSH format
  const sshMatch = trimmed.match(
    /^git@github\.com:([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+?)(?:\.git)?$/
  );
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

export function AddRepositoryDialog({
  orgId,
  open,
  onOpenChange,
}: AddRepositoryDialogProps) {
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [gitUrl, setGitUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('select');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useAvailableRepositories(orgId);
  const addRepos = useAddRepositoriesFromGitHub(orgId);

  const allRepos = data?.repositories || [];
  const availableRepos = allRepos.filter((r) => !r.already_added);
  const filteredRepos = availableRepos.filter((r) =>
    r.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleRepo = (repoId: number) => {
    setSelectedRepos((prev) => {
      const next = new Set(prev);
      if (next.has(repoId)) {
        next.delete(repoId);
      } else {
        next.add(repoId);
      }
      return next;
    });
  };

  const selectAllRepos = () => {
    setSelectedRepos(new Set(filteredRepos.map((r) => r.id)));
  };

  const deselectAllRepos = () => {
    setSelectedRepos(new Set());
  };

  const allFilteredSelected =
    filteredRepos.length > 0 &&
    filteredRepos.every((r) => selectedRepos.has(r.id));

  const handleAddSelected = async () => {
    if (selectedRepos.size === 0) {
      toast.error('Please select at least one repository');
      return;
    }

    const reposToAdd = availableRepos
      .filter((r) => selectedRepos.has(r.id))
      .map((r) => ({
        github_repo_id: r.id,
        full_name: r.full_name,
        default_branch: r.default_branch,
      }));

    try {
      await addRepos.mutateAsync(reposToAdd);
      toast.success(`${reposToAdd.length} repositories added`);
      setSelectedRepos(new Set());
      onOpenChange(false);
    } catch {
      toast.error('Failed to add repositories');
    }
  };

  const handleAddByUrl = async () => {
    setUrlError(null);

    if (!gitUrl.trim()) {
      setUrlError('Please enter a GitHub URL');
      return;
    }

    const parsed = parseGitHubUrl(gitUrl);
    if (!parsed) {
      setUrlError(
        'Invalid GitHub URL. Use format: owner/repo or https://github.com/owner/repo'
      );
      return;
    }

    const fullName = `${parsed.owner}/${parsed.repo}`;

    // Find the repo in our available repos list
    const matchedRepo = allRepos.find(
      (r) => r.full_name.toLowerCase() === fullName.toLowerCase()
    );

    if (!matchedRepo) {
      setUrlError(
        'Repository not found in your GitHub App installation. Make sure the GitHub App has access to this repository.'
      );
      return;
    }

    if (matchedRepo.already_added) {
      setUrlError('This repository has already been added.');
      return;
    }

    try {
      await addRepos.mutateAsync([
        {
          github_repo_id: matchedRepo.id,
          full_name: matchedRepo.full_name,
          default_branch: matchedRepo.default_branch,
        },
      ]);
      toast.success(`Repository ${matchedRepo.full_name} added`);
      setGitUrl('');
      onOpenChange(false);
    } catch {
      toast.error('Failed to add repository');
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSelectedRepos(new Set());
      setGitUrl('');
      setUrlError(null);
      setActiveTab('select');
      setSearchQuery('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl!">
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
          <DialogDescription>
            Add repositories to track from your GitHub installation.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid h-10 w-full grid-cols-2 gap-1 bg-foreground/10 p-1">
            <TabsTrigger value="select" className="cursor-pointer gap-2 px-3">
              <List className="h-4 w-4" />
              Select
            </TabsTrigger>
            <TabsTrigger value="url" className="cursor-pointer gap-2 px-3">
              <Link className="h-4 w-4" />
              By URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No GitHub installation found.</p>
                <p className="text-sm">Please install the GitHub App first.</p>
              </div>
            ) : availableRepos.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>All available repositories have been added.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search repositories..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={
                      allFilteredSelected ? deselectAllRepos : selectAllRepos
                    }
                    disabled={filteredRepos.length === 0}
                  >
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                <ScrollArea className="h-64">
                  <div className="space-y-2 p-1">
                    {filteredRepos.length === 0 ? (
                      <div className="py-8 text-center text-muted-foreground">
                        <p>No repositories match "{searchQuery}"</p>
                      </div>
                    ) : (
                      filteredRepos.map((repo) => (
                        <label
                          key={repo.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedRepos.has(repo.id)}
                            onCheckedChange={() => toggleRepo(repo.id)}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {repo.full_name}
                            </p>
                            {repo.description && (
                              <p className="line-clamp-1 text-muted-foreground text-sm">
                                {repo.description}
                              </p>
                            )}
                          </div>
                          {repo.private && (
                            <span className="shrink-0 text-muted-foreground text-xs">
                              Private
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSelected}
                disabled={selectedRepos.size === 0 || addRepos.isPending}
              >
                {addRepos.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add {selectedRepos.size > 0 ? `(${selectedRepos.size})` : ''}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="git-url">GitHub Repository URL</Label>
                <Input
                  id="git-url"
                  placeholder="https://github.com/owner/repo or owner/repo"
                  value={gitUrl}
                  onChange={(e) => {
                    setGitUrl(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddByUrl();
                    }
                  }}
                />
                {urlError && (
                  <p className="text-destructive text-sm">{urlError}</p>
                )}
                <p className="text-muted-foreground text-xs">
                  Supported formats: owner/repo, https://github.com/owner/repo,
                  git@github.com:owner/repo.git
                </p>
              </div>

              {!error && (
                <p className="text-muted-foreground text-sm">
                  Note: The repository must be accessible to your GitHub App
                  installation.
                </p>
              )}
            </div>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddByUrl}
                disabled={!gitUrl.trim() || addRepos.isPending || isLoading}
              >
                {addRepos.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Repository
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
