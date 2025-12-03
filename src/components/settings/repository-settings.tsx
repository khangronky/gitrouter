'use client';

import { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { useRepositories, useUpdateRepository, useRemoveRepository } from '@/lib/api/repositories';
import { useAvailableRepositories } from '@/lib/api/github';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { AddRepositoryDialog } from './add-repository-dialog';

interface RepositorySettingsProps {
  orgId: string;
}

export function RepositorySettings({ orgId }: RepositorySettingsProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: reposData, isLoading, refetch } = useRepositories(orgId);
  const { refetch: refetchAvailable } = useAvailableRepositories(orgId);

  const handleSync = async () => {
    try {
      await refetchAvailable();
      await refetch();
      toast.success('Repositories synced');
    } catch {
      toast.error('Failed to sync repositories');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Repository Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reposData?.repositories?.map((repo) => (
            <RepositoryRow key={repo.id} orgId={orgId} repo={repo} />
          ))}
          {(!reposData?.repositories || reposData.repositories.length === 0) && (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No repositories added yet. Click "Add New Repository" to add one.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleSync}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Repositories
        </Button>
        <Button variant="outline" onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Repository
        </Button>
      </div>

      <AddRepositoryDialog
        orgId={orgId}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}

interface RepositoryRowProps {
  orgId: string;
  repo: {
    id: string;
    full_name: string;
    is_active: boolean;
  };
}

function RepositoryRow({ orgId, repo }: RepositoryRowProps) {
  const updateRepo = useUpdateRepository(orgId, repo.id);
  const removeRepo = useRemoveRepository(orgId);

  const handleToggle = async (checked: boolean) => {
    try {
      await updateRepo.mutateAsync({ is_active: checked });
      toast.success(`Repository ${checked ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to update repository');
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${repo.full_name}?`)) return;

    try {
      await removeRepo.mutateAsync(repo.id);
      toast.success('Repository removed');
    } catch {
      toast.error('Failed to remove repository');
    }
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{repo.full_name}</TableCell>
      <TableCell>
        <Switch
          checked={repo.is_active}
          onCheckedChange={handleToggle}
          disabled={updateRepo.isPending}
        />
      </TableCell>
      <TableCell>
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0"
          onClick={handleRemove}
          disabled={removeRepo.isPending}
        >
          Remove
        </Button>
      </TableCell>
    </TableRow>
  );
}

