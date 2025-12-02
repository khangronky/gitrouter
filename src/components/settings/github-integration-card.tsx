"use client";

import { useState } from "react";
import {
  Github,
  Link2,
  Link2Off,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGitHubInstallation, useGetInstallUrl } from "@/lib/api/github";
import { useSyncReviewersGitHub } from "@/lib/api/reviewers";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

interface GitHubInstallationInfo {
  id: number;
  account_login: string;
  account_type: string;
  repository_selection: string;
  html_url: string;
}

interface GitHubIntegrationCardProps {
  orgId: string;
}

export function GitHubIntegrationCard({ orgId }: GitHubIntegrationCardProps) {
  const [showManualLink, setShowManualLink] = useState(false);
  const [manualInstallationId, setManualInstallationId] = useState("");
  const [isLinking, setIsLinking] = useState(false);
  const [foundInstallations, setFoundInstallations] = useState<
    GitHubInstallationInfo[] | null
  >(null);
  const [isFindingInstallations, setIsFindingInstallations] = useState(false);

  const {
    data: installationData,
    isLoading,
    error,
    refetch,
  } = useGitHubInstallation(orgId);
  const getInstallUrl = useGetInstallUrl();
  const syncReviewers = useSyncReviewersGitHub(orgId);

  const isConnected = !!installationData?.installation && !error;

  const handleConnect = async () => {
    try {
      const result = await getInstallUrl.mutateAsync(orgId);
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get GitHub install URL";
      // If org already has installation, offer to refresh
      if (errorMessage.includes("already has")) {
        toast.error(
          "Organization already has a GitHub installation. Try refreshing."
        );
        refetch();
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleManualLink = async () => {
    const installationId = parseInt(manualInstallationId.trim(), 10);
    if (isNaN(installationId) || installationId <= 0) {
      toast.error("Please enter a valid installation ID (number)");
      return;
    }

    setIsLinking(true);
    try {
      const response = await fetch(`/api/github/install/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: orgId,
          installation_id: installationId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to link installation");
      }

      toast.success("GitHub installation linked successfully!");
      setShowManualLink(false);
      setManualInstallationId("");
      setFoundInstallations(null);
      refetch();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to link installation";
      toast.error(errorMessage);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFindInstallations = async () => {
    setIsFindingInstallations(true);
    try {
      const response = await fetch("/api/github/installations");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to find installations");
      }

      if (data.installations.length === 0) {
        toast.info(
          "No installations found. Please install the GitHub App first."
        );
      } else {
        setFoundInstallations(data.installations);
        toast.success(`Found ${data.installations.length} installation(s)`);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to find installations";
      toast.error(errorMessage);
    } finally {
      setIsFindingInstallations(false);
    }
  };

  const handleSelectInstallation = (installation: GitHubInstallationInfo) => {
    setManualInstallationId(installation.id.toString());
    setFoundInstallations(null);
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect GitHub? This will remove all repository tracking."
      )
    )
      return;

    try {
      const response = await fetch(
        `/api/organizations/${orgId}/github-installation`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      toast.success("GitHub disconnected");
      refetch();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect GitHub";
      toast.error(errorMessage);
    }
  };

  const handleSyncReviewers = async () => {
    try {
      const result = await syncReviewers.mutateAsync();
      if (result.created > 0 || result.updated > 0) {
        const messages: string[] = [];
        if (result.created > 0) messages.push(`${result.created} created`);
        if (result.updated > 0) messages.push(`${result.updated} updated`);
        toast.success(`Reviewers synced: ${messages.join(", ")}`);
      } else if (result.skipped > 0) {
        toast.info(`All ${result.skipped} collaborators already exist as reviewers`);
      } else {
        toast.info("No collaborators found in repositories");
      }
    } catch {
      toast.error("Failed to sync reviewers from GitHub");
    }
  };

  if (isLoading) {
    return (
      <Card className='flex flex-col'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Github className='h-5 w-5' />
            GitHub
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className='h-24 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='flex flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Github className='h-5 w-5' />
          GitHub
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col flex-1 space-y-4'>
        {/* Status */}
        <div className='flex items-center gap-2'>
          <span className='text-sm text-muted-foreground'>Status:</span>
          {isConnected ? (
            <Badge
              variant='outline'
              className='bg-green-50 text-green-700 border-green-200'
            >
              <CheckCircle className='mr-1 h-3 w-3' />
              Connected
            </Badge>
          ) : (
            <Badge
              variant='outline'
              className='bg-red-50 text-red-700 border-red-200'
            >
              <XCircle className='mr-1 h-3 w-3' />
              Not Connected
            </Badge>
          )}
        </div>

        {/* Account info if connected */}
        {isConnected && installationData.installation && (
          <>
            <div className='flex items-center gap-2'>
              <span className='text-sm text-muted-foreground'>Account:</span>
              <span className='text-sm font-medium'>
                {installationData.installation.account_login}
              </span>
              <Badge variant='secondary' className='text-xs'>
                {installationData.installation.account_type}
              </Badge>
            </div>
          </>
        )}

        {/* Manual Link Form */}
        {showManualLink && !isConnected && (
          <div className='space-y-3 p-3 border rounded-lg bg-muted/50'>
            {/* Found Installations List */}
            {foundInstallations && foundInstallations.length > 0 && (
              <div className='space-y-2'>
                <Label>Select an Installation</Label>
                <div className='space-y-2 max-h-40 overflow-y-auto'>
                  {foundInstallations.map((inst) => (
                    <button
                      key={inst.id}
                      type='button'
                      onClick={() => handleSelectInstallation(inst)}
                      className='w-full text-left p-2 border rounded hover:bg-muted transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>
                          {inst.account_login}
                        </span>
                        <Badge variant='secondary' className='text-xs'>
                          {inst.account_type}
                        </Badge>
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        ID: {inst.id} • {inst.repository_selection} repos
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='installation-id'>Installation ID</Label>
              <div className='flex gap-2'>
                <Input
                  id='installation-id'
                  type='text'
                  placeholder='e.g., 12345678'
                  value={manualInstallationId}
                  onChange={(e) => setManualInstallationId(e.target.value)}
                  className='flex-1'
                />
                <Button
                  size='sm'
                  variant='outline'
                  onClick={handleFindInstallations}
                  disabled={isFindingInstallations}
                  title='Find installations of your GitHub App'
                >
                  <Search className='h-4 w-4' />
                </Button>
              </div>
              <p className='text-xs text-muted-foreground'>
                Click the search icon to find available installations, or enter
                the ID manually.
              </p>
            </div>
            <div className='flex gap-2'>
              <Button
                size='sm'
                onClick={handleManualLink}
                disabled={isLinking || !manualInstallationId.trim()}
              >
                {isLinking ? "Linking..." : "Link Installation"}
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => {
                  setShowManualLink(false);
                  setManualInstallationId("");
                  setFoundInstallations(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isConnected && !showManualLink && (
          <p className='text-xs text-muted-foreground'>
            Install the GitHub App to enable PR tracking and reviewer
            assignment.
          </p>
        )}

        {/* Actions */}
        <div className='flex flex-wrap gap-2 pt-2 mt-auto'>
          {isConnected ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleDisconnect}
                    className='text-destructive'
                  >
                    <Link2Off className=' h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Disconnect GitHub</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={() => refetch()}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh GitHub installations</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant='outline'
                    size='icon'
                    onClick={handleSyncReviewers}
                    disabled={syncReviewers.isPending}
                  >
                    <Users className='h-4 w-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Sync reviewers from GitHub</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={handleConnect}
                disabled={getInstallUrl.isPending}
              >
                <Link2 className='mr-2 h-4 w-4' />
                Install GitHub App
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setShowManualLink(true)}
                disabled={showManualLink}
              >
                Link Existing
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
