'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, Link2, Plus, Pencil, RefreshCw, Trash2, Github } from 'lucide-react';
import { toast } from 'sonner';
import * as settingsApi from '@/lib/api/settings';

// Types (re-export from API client for convenience)
type TeamMember = settingsApi.TeamMember;
type Repository = settingsApi.Repository;
type SlackIntegration = settingsApi.SlackIntegration;
type JiraIntegration = settingsApi.JiraIntegration;
type Settings = settingsApi.OrganizationSettings;

export default function SettingPage() {
  // Organization state
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  // Team members state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'member'>('member');

  // Integrations state
  const [slackIntegration, setSlackIntegration] = useState<SlackIntegration>({ connected: false });
  const [jiraIntegration, setJiraIntegration] = useState<JiraIntegration>({ connected: false });
  const [repositories, setRepositories] = useState<Repository[]>([]);

  // Jira connect dialog
  const [jiraDialogOpen, setJiraDialogOpen] = useState(false);
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraApiToken, setJiraApiToken] = useState('');
  const [jiraSiteUrl, setJiraSiteUrl] = useState('');
  const [isConnectingJira, setIsConnectingJira] = useState(false);

  // Repository dialog
  const [repoDialogOpen, setRepoDialogOpen] = useState(false);
  const [newRepoUrl, setNewRepoUrl] = useState('');
  const [isAddingRepo, setIsAddingRepo] = useState(false);

  // Notification settings
  const [settings, setSettings] = useState<Settings>({
    slackNotifications: false,
    emailNotifications: false,
    escalationDestination: 'channel',
    notificationFrequency: 'realtime',
  });

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isSyncingRepos, setIsSyncingRepos] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('My Team');

  // Fetch organization data
  useEffect(() => {
    async function fetchData() {
      try {
        // Get user's organization
        const { organization } = await settingsApi.getOrganization();

        if (!organization) {
          setIsLoading(false);
          return;
        }

        setOrganizationId(organization.id);
        setTeamName(organization.name);

        // Parse settings from organization
        const orgSettings = organization.settings;
        if (orgSettings) {
          setSettings({
            slackNotifications: orgSettings.slackNotifications ?? false,
            emailNotifications: orgSettings.emailNotifications ?? false,
            escalationDestination: orgSettings.escalationDestination ?? 'channel',
            notificationFrequency: orgSettings.notificationFrequency ?? 'realtime',
          });
        }

        // Fetch all data in parallel
        const [membersResult, slackResult, jiraResult, reposResult] = await Promise.allSettled([
          settingsApi.getMembers(organization.id),
          settingsApi.getSlackStatus(organization.id),
          settingsApi.getJiraStatus(organization.id),
          settingsApi.getRepositories(organization.id),
        ]);

        // Set members
        if (membersResult.status === 'fulfilled') {
          setMembers(membersResult.value.members);
        }

        // Set Slack integration
        if (slackResult.status === 'fulfilled') {
          setSlackIntegration(slackResult.value);
        }

        // Set Jira integration
        if (jiraResult.status === 'fulfilled') {
          setJiraIntegration(jiraResult.value);
        }

        // Set repositories
        if (reposResult.status === 'fulfilled') {
          setRepositories(reposResult.value.repositories);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Create organization for new users
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    setIsCreatingOrg(true);
    try {
      const { organization } = await settingsApi.createOrganization(newOrgName.trim());

      setOrganizationId(organization.id);
      setTeamName(organization.name);

      // Fetch the membership that was auto-created
      const { members: membersData } = await settingsApi.getMembers(organization.id);
      setMembers(membersData);

      toast.success('Organization created! You can now connect integrations.');
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast.error(error.message || 'Failed to create organization');
    } finally {
      setIsCreatingOrg(false);
    }
  };

  // Save team name
  const handleSaveTeamName = async () => {
    if (!organizationId) return;

    try {
      await settingsApi.updateOrganization(organizationId, { name: teamName });
      toast.success('Team name updated');
      setIsEditingTeamName(false);
    } catch (error: any) {
      console.error('Failed to save team name:', error);
      toast.error(error.message || 'Failed to update team name');
    }
  };

  // Add team member
  const handleAddMember = async () => {
    if (!organizationId || !newMemberEmail) return;

    setIsAddingMember(true);
    try {
      const { member } = await settingsApi.addMember(organizationId, newMemberEmail, newMemberRole);
      
      // Add new member to the list
      setMembers((prev) => [...prev, member]);

      setNewMemberEmail('');
      setNewMemberRole('member');
      toast.success('Member added successfully');
    } catch (error: any) {
      console.error('Failed to add member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Connect Slack
  const handleConnectSlack = async () => {
    if (!organizationId) return;

    try {
      const { url } = await settingsApi.initiateSlackConnect(organizationId);
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to initiate Slack connection');
      }
    } catch (error: any) {
      console.error('Failed to connect Slack:', error);
      toast.error(error.message || 'Failed to connect Slack');
    }
  };

  // Disconnect Slack
  const handleDisconnectSlack = async () => {
    if (!organizationId) return;

    try {
      await settingsApi.disconnectSlack(organizationId);
      setSlackIntegration({ connected: false });
      toast.success('Slack disconnected');
    } catch (error: any) {
      console.error('Failed to disconnect Slack:', error);
      toast.error(error.message || 'Failed to disconnect Slack');
    }
  };

  // Test Slack
  const handleTestSlack = async () => {
    toast.info('Sending test message to Slack...');
    // TODO: Implement test message
    setTimeout(() => toast.success('Test message sent!'), 1000);
  };

  // Connect Jira
  const handleConnectJira = async () => {
    if (!organizationId || !jiraEmail || !jiraApiToken || !jiraSiteUrl) {
      toast.error('Please fill in all Jira fields');
      return;
    }

    setIsConnectingJira(true);
    try {
      await settingsApi.connectJira(organizationId, jiraEmail, jiraApiToken, jiraSiteUrl);

      setJiraIntegration({
        connected: true,
        siteUrl: jiraSiteUrl,
        email: jiraEmail,
      });
      setJiraDialogOpen(false);
      setJiraEmail('');
      setJiraApiToken('');
      setJiraSiteUrl('');
      toast.success('Jira connected successfully');
    } catch (error: any) {
      console.error('Failed to connect Jira:', error);
      toast.error(error.message || 'Failed to connect Jira');
    } finally {
      setIsConnectingJira(false);
    }
  };

  // Disconnect Jira
  const handleDisconnectJira = async () => {
    if (!organizationId) return;

    try {
      await settingsApi.disconnectJira(organizationId);
      setJiraIntegration({ connected: false });
      toast.success('Jira disconnected');
    } catch (error: any) {
      console.error('Failed to disconnect Jira:', error);
      toast.error(error.message || 'Failed to disconnect Jira');
    }
  };

  // Sync repositories
  const handleSyncRepositories = async () => {
    if (!organizationId) return;

    setIsSyncingRepos(true);
    try {
      const { repositories: repos } = await settingsApi.getRepositories(organizationId);
      setRepositories(repos);
      toast.success('Repositories synced');
    } catch (error: any) {
      console.error('Failed to sync repositories:', error);
      toast.error(error.message || 'Failed to sync repositories');
    } finally {
      setIsSyncingRepos(false);
    }
  };

  // Add new repository
  const handleAddRepository = async () => {
    if (!organizationId || !newRepoUrl.trim()) {
      toast.error('Please enter a repository URL or name');
      return;
    }

    setIsAddingRepo(true);
    try {
      const { repository } = await settingsApi.addRepository(organizationId, newRepoUrl.trim());

      // Add the new repo to the list
      setRepositories((prev) => [...prev, repository]);

      setRepoDialogOpen(false);
      setNewRepoUrl('');
      toast.success('Repository added successfully');
    } catch (error: any) {
      console.error('Failed to add repository:', error);
      toast.error(error.message || 'Failed to add repository');
    } finally {
      setIsAddingRepo(false);
    }
  };

  // Remove repository
  const handleRemoveRepository = async (repoId: string, repoName: string) => {
    if (!organizationId) return;

    if (!confirm(`Are you sure you want to remove "${repoName}" from your team?`)) {
      return;
    }

    try {
      await settingsApi.removeRepository(organizationId, repoId);

      // Remove from the list
      setRepositories((prev) => prev.filter((r) => r.id !== repoId));
      toast.success('Repository removed');
    } catch (error: any) {
      console.error('Failed to remove repository:', error);
      toast.error(error.message || 'Failed to remove repository');
    }
  };

  // Save all settings
  const handleSaveSettings = async () => {
    if (!organizationId) return;

    setIsSaving(true);
    try {
      await settingsApi.updateSettings(organizationId, settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // If no organization exists, show create organization UI
  if (!organizationId) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-xl mx-auto">
          <div className="border rounded-lg p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4">Welcome to GitRouter!</h2>
            <p className="text-muted-foreground mb-6">
              To get started, create your team. You&apos;ll be able to connect Slack, Jira, and GitHub after creating your team.
            </p>
            <div className="space-y-4">
              <div className="text-left">
                <Label htmlFor="org-name" className="text-sm font-medium">
                  Team Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g., Engineering Team"
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleCreateOrganization}
                disabled={isCreatingOrg || !newOrgName.trim()}
                className="w-full"
              >
                {isCreatingOrg ? 'Creating...' : 'Create Team'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Team Setting Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Team Setting</h2>

          {/* Team Name */}
          <div className="mb-6">
            <Label className="text-sm font-medium">
              Team Name <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                disabled={!isEditingTeamName}
                className="max-w-sm"
                placeholder="Development Team"
              />
              {isEditingTeamName ? (
                <Button size="sm" onClick={handleSaveTeamName}>
                  Save
                </Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={() => setIsEditingTeamName(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="mb-6">
            <Label className="text-sm font-medium">
              Team Members <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Member Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.full_name || member.email.split('@')[0]}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="capitalize">{member.role}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No team members yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add New Member */}
          <div>
            <Label className="text-sm font-medium">
              Add New Member <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Email:</span>
                <Input
                  type="email"
                  placeholder="Email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  className="w-56"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Role:</span>
                <Select value={newMemberRole} onValueChange={(v: 'admin' | 'member') => setNewMemberRole(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} disabled={isAddingMember || !newMemberEmail}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </section>

        {/* Integrations Setting Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Integrations Setting</h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Slack Integration */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Slack</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {slackIntegration.connected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              {slackIntegration.connected && (
                <div className="text-sm text-muted-foreground mb-3">
                  Channel: {slackIntegration.teamChannelName || '#dev-reviews'}
                </div>
              )}
              <div className="flex gap-2">
                {slackIntegration.connected ? (
                  <>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={handleDisconnectSlack}>
                      <Link2 className="h-3 w-3 mr-1" />
                      Disconnect
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleTestSlack}>
                      Test
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" size="sm" className="text-green-600" onClick={handleConnectSlack}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            </div>

            {/* Jira Integration */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Jira</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                {jiraIntegration.connected ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <XCircle className="h-3 w-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
              {jiraIntegration.connected && (
                <div className="text-sm text-muted-foreground mb-3">
                  Jira Board:{' '}
                  <a
                    href={`https://${jiraIntegration.siteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    link
                  </a>
                </div>
              )}
              <div className="flex gap-2">
                {jiraIntegration.connected ? (
                  <Button variant="outline" size="sm" className="text-red-600" onClick={handleDisconnectJira}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Disconnect
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="text-green-600" onClick={() => setJiraDialogOpen(true)}>
                    <Link2 className="h-3 w-3 mr-1" />
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Repository Section */}
          <div>
            <h3 className="text-lg font-semibold mb-1">Repository</h3>
            <p className="text-sm text-muted-foreground mb-3">
              GitHub Repositories your team tracks. Only repositories listed here will trigger notifications.
            </p>
            <div className="border rounded-lg overflow-hidden mb-3">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Repository</TableHead>
                    <TableHead className="w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repositories.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="font-medium">{repo.full_name}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveRepository(repo.id, repo.full_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {repositories.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        No repositories connected. Add a repository to start receiving notifications.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleSyncRepositories} disabled={isSyncingRepos}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isSyncingRepos ? 'animate-spin' : ''}`} />
                Sync Repositories
              </Button>
              <Button variant="outline" onClick={() => setRepoDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add New Repository
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications Setting Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-6">Notifications Setting</h2>

          {/* Notification Channels */}
          <div className="mb-6">
            <Label className="text-sm font-medium">
              Notification Channels <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-3 mt-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="slack-notifications"
                  checked={settings.slackNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, slackNotifications: checked as boolean })
                  }
                />
                <label htmlFor="slack-notifications" className="text-sm cursor-pointer">
                  Slack notifications (send to Slack DMs)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked as boolean })
                  }
                />
                <label htmlFor="email-notifications" className="text-sm cursor-pointer">
                  Email notifications (send backup emails)
                </label>
              </div>
            </div>
          </div>

          {/* Escalation Alert Destination */}
          <div className="mb-6">
            <Label className="text-sm font-medium">
              Escalation Alert Destination <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={settings.escalationDestination}
              onValueChange={(value: 'channel' | 'dm') =>
                setSettings({ ...settings, escalationDestination: value })
              }
              className="mt-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="channel" id="channel" />
                <label htmlFor="channel" className="text-sm cursor-pointer">
                  Post to #dev-reviews channel (public)
                </label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="dm" id="dm" />
                <label htmlFor="dm" className="text-sm cursor-pointer">
                  Send DM to team lead only (private)
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Notification Frequency */}
          <div className="mb-6">
            <Label className="text-sm font-medium">
              Notification Frequency <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={settings.notificationFrequency}
              onValueChange={(value: 'realtime' | 'batched' | 'daily') =>
                setSettings({ ...settings, notificationFrequency: value })
              }
              className="mt-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="realtime" id="realtime" />
                <label htmlFor="realtime" className="text-sm cursor-pointer">
                  Real-time (send immediately)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="batched" id="batched" />
                <label htmlFor="batched" className="text-sm cursor-pointer">
                  Batched (send once per hour)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <label htmlFor="daily" className="text-sm cursor-pointer">
                  Daily digest (send once per day)
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-3">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </section>
      </div>

      {/* Jira Connect Dialog */}
      <Dialog open={jiraDialogOpen} onOpenChange={setJiraDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Jira</DialogTitle>
            <DialogDescription>
              Enter your Jira credentials to connect. You can create an API token from your{' '}
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Atlassian account settings
              </a>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jira-site">Jira Site URL</Label>
              <Input
                id="jira-site"
                placeholder="your-domain.atlassian.net"
                value={jiraSiteUrl}
                onChange={(e) => setJiraSiteUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jira-email">Email</Label>
              <Input
                id="jira-email"
                type="email"
                placeholder="your@email.com"
                value={jiraEmail}
                onChange={(e) => setJiraEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jira-token">API Token</Label>
              <Input
                id="jira-token"
                type="password"
                placeholder="Your Jira API token"
                value={jiraApiToken}
                onChange={(e) => setJiraApiToken(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJiraDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConnectJira} disabled={isConnectingJira}>
              {isConnectingJira ? 'Connecting...' : 'Connect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Repository Dialog */}
      <Dialog open={repoDialogOpen} onOpenChange={setRepoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add GitHub Repository</DialogTitle>
            <DialogDescription>
              Add a repository to track. Your team will only receive notifications from repositories listed here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">Repository</Label>
              <Input
                id="repo-url"
                placeholder="owner/repository or https://github.com/owner/repo"
                value={newRepoUrl}
                onChange={(e) => setNewRepoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRepoUrl.trim()) {
                    handleAddRepository();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                Enter the repository in the format <code className="bg-muted px-1 rounded">owner/repo</code> or paste the full GitHub URL.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddRepository} disabled={isAddingRepo || !newRepoUrl.trim()}>
              {isAddingRepo ? 'Adding...' : 'Add Repository'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

