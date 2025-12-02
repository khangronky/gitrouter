'use client';

import { useState, useEffect } from 'react';
import { Edit2, User, Github, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrentUser, useUpdateCurrentUser } from '@/lib/api/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export function AccountSettings() {
  const { data, isLoading } = useCurrentUser();
  const updateUser = useUpdateCurrentUser();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    github_username: '',
    slack_user_id: '',
    slack_username: '',
  });

  const user = data?.user;

  // Populate form when user data loads or dialog opens
  useEffect(() => {
    if (user && isEditDialogOpen) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        github_username: user.github_username || '',
        slack_user_id: user.slack_user_id || '',
        slack_username: user.slack_username || '',
      });
    }
  }, [user, isEditDialogOpen]);

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        full_name: formData.full_name || undefined,
        username: formData.username || undefined,
        github_username: formData.github_username || null,
        slack_user_id: formData.slack_user_id || null,
        slack_username: formData.slack_username || null,
      });
      toast.success('Account updated successfully');
      setIsEditDialogOpen(false);
    } catch {
      toast.error('Failed to update account');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Unable to load account information
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          {/* Basic Info */}
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{user.full_name || user.username || 'Not set'}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-3">
            <div className="h-4 w-4" /> {/* Spacer */}
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          {/* GitHub */}
          <div className="flex items-center gap-3">
            <Github className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">GitHub Username</p>
              <p className="font-medium">{user.github_username || 'Not linked'}</p>
            </div>
          </div>

          {/* Slack */}
          <div className="flex items-center gap-3">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Slack</p>
              <p className="font-medium">
                {user.slack_username 
                  ? `${user.slack_username}${user.slack_user_id ? ` (${user.slack_user_id})` : ''}`
                  : user.slack_user_id || 'Not linked'}
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditDialogOpen(true)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
            <DialogDescription>
              Update your account information and linked integrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Your username"
              />
            </div>

            {/* GitHub Username */}
            <div className="space-y-2">
              <Label htmlFor="github_username" className="flex items-center gap-2">
                <Github className="h-4 w-4" />
                GitHub Username
              </Label>
              <Input
                id="github_username"
                value={formData.github_username}
                onChange={(e) => setFormData({ ...formData, github_username: e.target.value })}
                placeholder="e.g., octocat"
              />
              <p className="text-xs text-muted-foreground">
                Your GitHub username for PR assignments
              </p>
            </div>

            {/* Slack User ID */}
            <div className="space-y-2">
              <Label htmlFor="slack_user_id" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Slack User ID
              </Label>
              <Input
                id="slack_user_id"
                value={formData.slack_user_id}
                onChange={(e) => setFormData({ ...formData, slack_user_id: e.target.value })}
                placeholder="e.g., U12345678"
              />
              <p className="text-xs text-muted-foreground">
                Your Slack user ID for mentions (starts with U)
              </p>
            </div>

            {/* Slack Username */}
            <div className="space-y-2">
              <Label htmlFor="slack_username">Slack Display Name</Label>
              <Input
                id="slack_username"
                value={formData.slack_username}
                onChange={(e) => setFormData({ ...formData, slack_username: e.target.value })}
                placeholder="Your Slack display name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateUser.isPending}>
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

