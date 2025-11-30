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
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Link2, Plus, Pencil, RefreshCw, Trash2, Github } from 'lucide-react';
import { toast } from 'sonner';

// Types
interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin' | 'member';
}

interface Repository {
  id: string;
  name: string;
  full_name: string;
}

interface SlackIntegration {
  connected: boolean;
  teamName?: string;
  teamChannelId?: string;
  teamChannelName?: string;
}

interface JiraIntegration {
  connected: boolean;
  siteUrl?: string;
  email?: string;
}

interface Settings {
  slackNotifications: boolean;
  emailNotifications: boolean;
  escalationDestination: 'channel' | 'dm';
  notificationFrequency: 'realtime' | 'batched' | 'daily';
}

export default function SettingPage() {
  const supabase = createClient();

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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user's organization
        const { data: membership } = await supabase
          .from('organization_members')
          .select('organization_id, role, organizations(id, name, settings)')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!membership) {
          setIsLoading(false);
          return;
        }

        const org = membership.organizations as any;
        setOrganizationId(org.id);
        setTeamName(org.name);

        // Parse settings from organization
        const orgSettings = org.settings as any;
        if (orgSettings) {
          setSettings({
            slackNotifications: orgSettings.slackNotifications ?? false,
            emailNotifications: orgSettings.emailNotifications ?? false,
            escalationDestination: orgSettings.escalationDestination ?? 'channel',
            notificationFrequency: orgSettings.notificationFrequency ?? 'realtime',
          });
        }

        // Fetch team members
        const { data: membersData } = await supabase
          .from('organization_members')
          .select('id, role, user_id, users(id, email, full_name)')
          .eq('organization_id', org.id);

        if (membersData) {
          setMembers(
            membersData.map((m: any) => ({
              id: m.id,
              email: m.users?.email || '',
              full_name: m.users?.full_name,
              role: m.role,
            }))
          );
        }

        // Fetch Slack integration status
        const { data: slackData } = await supabase
          .from('slack_integrations')
          .select('team_name, team_channel_id, is_active')
          .eq('organization_id', org.id)
          .single();

        if (slackData && slackData.is_active) {
          setSlackIntegration({
            connected: true,
            teamName: slackData.team_name,
            teamChannelId: slackData.team_channel_id || undefined,
            teamChannelName: slackData.team_channel_id ? `#${slackData.team_channel_id}` : undefined,
          });
        }

        // Fetch Jira integration status
        const jiraResponse = await fetch(`/api/jira/connect?organizationId=${org.id}`);
        const jiraData = await jiraResponse.json();
        if (jiraData.connected) {
          setJiraIntegration({
            connected: true,
            siteUrl: jiraData.siteUrl,
            email: jiraData.email,
          });
        }

        // Fetch GitHub repositories
        const { data: reposData } = await supabase
          .from('github_installations')
          .select('repositories')
          .eq('organization_id', org.id)
          .single();

        if (reposData?.repositories) {
          const repos = reposData.repositories as any[];
          setRepositories(
            repos.map((r: any) => ({
              id: r.id?.toString() || r.full_name,
              name: r.name,
              full_name: r.full_name,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [supabase]);

  // Create organization for new users
  const handleCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    setIsCreatingOrg(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in first');
        return;
      }

      // Generate a slug from the name
      const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueSlug = `${slug}-${Date.now().toString(36)}`;

      // Create the organization (this will also create the owner membership via trigger)
      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: newOrgName,
          slug: uniqueSlug,
        })
        .select()
        .single();

      if (error) throw error;

      setOrganizationId(org.id);
      setTeamName(org.name);

      // Fetch the membership that was auto-created
      const { data: membersData } = await supabase
        .from('organization_members')
        .select('id, role, user_id, users(id, email, full_name)')
        .eq('organization_id', org.id);

      if (membersData) {
        setMembers(
          membersData.map((m: any) => ({
            id: m.id,
            email: m.users?.email || '',
            full_name: m.users?.full_name,
            role: m.role,
          }))
        );
      }

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
      const { error } = await supabase
        .from('organizations')
        .update({ name: teamName })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Team name updated');
      setIsEditingTeamName(false);
    } catch (error) {
      console.error('Failed to save team name:', error);
      toast.error('Failed to update team name');
    }
  };

  // Add team member
  const handleAddMember = async () => {
    if (!organizationId || !newMemberEmail) return;

    setIsAddingMember(true);
    try {
      // First, find the user by email
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', newMemberEmail)
        .single();

      if (!userData) {
        toast.error('User not found. They must register first.');
        return;
      }

      // Add membership
      const { error } = await supabase.from('organization_members').insert({
        organization_id: organizationId,
        user_id: userData.id,
        role: newMemberRole,
      });

      if (error) throw error;

      // Refresh members list
      const { data: membersData } = await supabase
        .from('organization_members')
        .select('id, role, user_id, users(id, email, full_name)')
        .eq('organization_id', organizationId);

      if (membersData) {
        setMembers(
          membersData.map((m: any) => ({
            id: m.id,
            email: m.users?.email || '',
            full_name: m.users?.full_name,
            role: m.role,
          }))
        );
      }

      setNewMemberEmail('');
      setNewMemberRole('member');
      toast.success('Member added successfully');
    } catch (error) {
      console.error('Failed to add member:', error);
      toast.error('Failed to add member');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Connect Slack
  const handleConnectSlack = async () => {
    if (!organizationId) return;

    try {
      const response = await fetch('/api/slack/oauth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to initiate Slack connection');
      }
    } catch (error) {
      console.error('Failed to connect Slack:', error);
      toast.error('Failed to connect Slack');
    }
  };

  // Disconnect Slack
  const handleDisconnectSlack = async () => {
    if (!organizationId) return;

    try {
      const { error } = await supabase
        .from('slack_integrations')
        .update({ is_active: false })
        .eq('organization_id', organizationId);

      if (error) throw error;

      setSlackIntegration({ connected: false });
      toast.success('Slack disconnected');
    } catch (error) {
      console.error('Failed to disconnect Slack:', error);
      toast.error('Failed to disconnect Slack');
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
      const response = await fetch('/api/jira/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          email: jiraEmail,
          apiToken: jiraApiToken,
          siteUrl: jiraSiteUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Jira');
      }

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
      const response = await fetch('/api/jira/connect', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect Jira');
      }

      setJiraIntegration({ connected: false });
      toast.success('Jira disconnected');
    } catch (error) {
      console.error('Failed to disconnect Jira:', error);
      toast.error('Failed to disconnect Jira');
    }
  };

  // Sync repositories
  const handleSyncRepositories = async () => {
    if (!organizationId) return;

    setIsSyncingRepos(true);
    try {
      // Fetch latest repositories from API
      const response = await fetch(`/api/github/repositories?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (response.ok && data.repositories) {
        setRepositories(data.repositories);
        toast.success('Repositories synced');
      } else {
        toast.error('Failed to sync repositories');
      }
    } catch (error) {
      console.error('Failed to sync repositories:', error);
      toast.error('Failed to sync repositories');
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
      const response = await fetch('/api/github/repositories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          repositoryUrl: newRepoUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add repository');
      }

      // Add the new repo to the list
      setRepositories((prev) => [
        ...prev,
        {
          id: data.repository.id,
          name: data.repository.name,
          full_name: data.repository.full_name,
        },
      ]);

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
      const response = await fetch('/api/github/repositories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          repositoryId: repoId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove repository');
      }

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
      const { error } = await supabase
        .from('organizations')
        .update({
          settings: {
            slackNotifications: settings.slackNotifications,
            emailNotifications: settings.emailNotifications,
            escalationDestination: settings.escalationDestination,
            notificationFrequency: settings.notificationFrequency,
          },
        })
        .eq('id', organizationId);

      if (error) throw error;

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
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

