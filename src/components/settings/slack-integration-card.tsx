'use client';

import { useState } from 'react';
import {
  Link2,
  Link2Off,
  CheckCircle,
  XCircle,
  Pencil,
  RefreshCw,
  Users,
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
  useSlackIntegration,
  useGetSlackOAuthUrl,
  useDisconnectSlack,
  useTestSlackConnection,
  useSlackChannels,
  useUpdateSlackIntegration,
} from '@/lib/api/slack';
import { useSyncReviewersSlack } from '@/lib/api/reviewers';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

interface SlackIntegrationCardProps {
  orgId: string;
}

export function SlackIntegrationCard({ orgId }: SlackIntegrationCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const { data: slackData, isLoading, error } = useSlackIntegration(orgId);
  const { data: channelsData } = useSlackChannels(orgId);
  const getOAuthUrl = useGetSlackOAuthUrl();
  const disconnect = useDisconnectSlack(orgId);
  const testConnection = useTestSlackConnection(orgId);
  const updateIntegration = useUpdateSlackIntegration(orgId);
  const syncReviewers = useSyncReviewersSlack(orgId);

  const isConnected = !!slackData?.integration && !error;

  const handleConnect = async () => {
    try {
      const result = await getOAuthUrl.mutateAsync(orgId);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error('Failed to get Slack OAuth URL');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect Slack?')) return;

    try {
      await disconnect.mutateAsync();
      toast.success('Slack disconnected');
    } catch {
      toast.error('Failed to disconnect Slack');
    }
  };

  const handleTest = async () => {
    try {
      await testConnection.mutateAsync();
      toast.success('Slack connection test successful!');
    } catch {
      toast.error('Slack connection test failed');
    }
  };

  const handleChannelChange = async (channelId: string) => {
    try {
      await updateIntegration.mutateAsync({ default_channel_id: channelId });
      setIsEditing(false);
      toast.success('Default channel updated');
    } catch {
      toast.error('Failed to update channel');
    }
  };

  const handleSyncReviewers = async () => {
    try {
      const result = await syncReviewers.mutateAsync();
      const messages: string[] = [];

      if (result.slack_synced > 0) {
        messages.push(`${result.slack_synced} Slack`);
      }
      if (result.github_synced > 0) {
        messages.push(`${result.github_synced} GitHub`);
      }

      if (messages.length > 0) {
        toast.success(`Synced reviewers: ${messages.join(', ')}`);
      } else if (result.already_linked > 0 && result.not_found.length === 0) {
        toast.info('All reviewers are already linked');
      } else if (result.not_found.length > 0) {
        toast.warning(
          `${result.not_found.length} reviewer(s) not found: ${result.not_found.join(', ')}`
        );
      } else {
        toast.info('No reviewers with email addresses to sync');
      }
    } catch {
      toast.error('Failed to sync reviewers');
    }
  };

  if (isLoading) {
    return (
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle>Slack</CardTitle>
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
        <CardTitle>Slack</CardTitle>
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

        {/* Channel (only if connected) */}
        {isConnected && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Channel:</span>
            {isEditing ? (
              <Select
                value={slackData.integration.default_channel_id || ''}
                onValueChange={handleChannelChange}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select channel" />
                </SelectTrigger>
                <SelectContent>
                  {channelsData?.channels?.map((channel) => (
                    <SelectItem key={channel.id} value={channel.id}>
                      #{channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm font-medium">
                {channelsData?.channels?.find(
                  (c) => c.id === slackData.integration.default_channel_id
                )?.name
                  ? `#${
                      channelsData.channels.find(
                        (c) => c.id === slackData.integration.default_channel_id
                      )?.name
                    }`
                  : 'Not set'}
              </span>
            )}
          </div>
        )}

        {/* Workspace name if connected */}
        {isConnected && slackData.integration.team_name && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Workspace:</span>
            <span className="text-sm font-medium">
              {slackData.integration.team_name}
            </span>
          </div>
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
                    disabled={disconnect.isPending}
                    className="text-destructive"
                  >
                    <Link2Off className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disconnect Slack</TooltipContent>
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
                <TooltipContent>Edit Slack channel</TooltipContent>
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
                <TooltipContent>Test Slack connection</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSyncReviewers}
                    disabled={syncReviewers.isPending}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync reviewers with Slack</TooltipContent>
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
