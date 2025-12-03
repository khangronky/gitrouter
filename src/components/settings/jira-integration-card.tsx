'use client';

import { useState } from 'react';
import {
  Link2,
  Link2Off,
  CheckCircle,
  XCircle,
  ExternalLink,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useJiraIntegration,
  useGetJiraOAuthUrl,
  useTestJiraConnection,
  useRemoveJiraIntegration,
  useJiraProjects,
  useJiraStatuses,
  useUpdateJiraIntegration,
} from '@/lib/api/jira';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface JiraIntegrationCardProps {
  orgId: string;
}

export function JiraIntegrationCard({ orgId }: JiraIntegrationCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { data: jiraData, isLoading, error } = useJiraIntegration(orgId);
  const { data: projectsData } = useJiraProjects(orgId);
  const { data: statusesData } = useJiraStatuses(orgId);
  const getOAuthUrl = useGetJiraOAuthUrl();
  const testConnection = useTestJiraConnection(orgId);
  const removeIntegration = useRemoveJiraIntegration(orgId);
  const updateIntegration = useUpdateJiraIntegration(orgId);

  const isConnected = !!jiraData?.integration && !error;

  const handleConnect = async () => {
    try {
      const result = await getOAuthUrl.mutateAsync(orgId);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Failed to get Jira OAuth URL');
    }
  };

  const handleTest = async () => {
    try {
      const result = await testConnection.mutateAsync();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Jira connection test failed');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Jira?')) return;

    try {
      await removeIntegration.mutateAsync();
      toast.success('Jira disconnected');
    } catch {
      toast.error('Failed to disconnect Jira');
    }
  };

  const handleProjectChange = async (projectKey: string) => {
    try {
      const value = projectKey === '__none__' ? null : projectKey;
      await updateIntegration.mutateAsync({ default_project_key: value });
      toast.success('Default project updated');
    } catch {
      toast.error('Failed to update default project');
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const value = status === '__none__' ? null : status;
      await updateIntegration.mutateAsync({ status_on_merge: value });
      toast.success('Status on merge updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Jira</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Jira</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {isConnected ? (
            <Badge
              variant="outline"
              className="bg-green-50 text-green-700 border-green-200"
            >
              <CheckCircle className="mr-1 h-3 w-3" />
              Online
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200"
            >
              <XCircle className="mr-1 h-3 w-3" />
              Offline
            </Badge>
          )}
        </div>

        {/* Site info (only if connected) */}
        {isConnected && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Site:</span>
              <a
                href={jiraData.integration.site_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                {jiraData.integration.site_name ||
                  jiraData.integration.site_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Default Project */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Default Project:
              </span>
              {isEditing ? (
                <Select
                  value={jiraData.integration.default_project_key || '__none__'}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {projectsData?.projects?.map((project) => (
                      <SelectItem key={project.key} value={project.key}>
                        {project.name} ({project.key})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm font-medium">
                  {jiraData.integration.default_project_key || 'Not set'}
                </span>
              )}
            </div>

            {/* Status on Merge */}
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                Status on Merge:
              </span>
              {isEditing ? (
                <Select
                  value={jiraData.integration.status_on_merge || '__none__'}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {statusesData?.statuses?.map((status) => (
                      <SelectItem key={status.id} value={status.name}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm font-medium">
                  {jiraData.integration.status_on_merge || 'Not set'}
                </span>
              )}
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 mt-auto">
          {isConnected ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDisconnect}
                    disabled={removeIntegration.isPending}
                    className="text-destructive"
                  >
                    <Link2Off className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disconnect Jira</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isEditing ? 'Done editing' : 'Edit settings'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleTest}
                    disabled={testConnection.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test Jira connection</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnect}
              disabled={getOAuthUrl.isPending}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
