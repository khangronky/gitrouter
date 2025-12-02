'use client';

import { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useOrganizationMembers,
  useAddMemberByEmail,
  useUpdateOrganization,
  useUpdateMemberRole,
  useRemoveMember,
} from '@/lib/api/organizations';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TeamSettingsProps {
  orgId: string;
  orgName: string;
}

interface MemberToEdit {
  id: string;
  role: 'member' | 'admin' | 'owner';
  userName: string;
}

export function TeamSettings({ orgId, orgName }: TeamSettingsProps) {
  const [teamName, setTeamName] = useState(orgName);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'admin'>('member');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // Edit member state
  const [editingMember, setEditingMember] = useState<MemberToEdit | null>(null);
  const [editRole, setEditRole] = useState<'member' | 'admin'>('member');
  
  // Delete member state
  const [memberToDelete, setMemberToDelete] = useState<MemberToEdit | null>(null);

  const { data: membersData, isLoading } = useOrganizationMembers(orgId);
  const addMember = useAddMemberByEmail(orgId);
  const updateOrg = useUpdateOrganization(orgId);
  const updateMemberRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);

  const handleUpdateName = async () => {
    try {
      await updateOrg.mutateAsync({ name: teamName });
      setIsEditingName(false);
      toast.success('Team name updated');
    } catch {
      toast.error('Failed to update team name');
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      await addMember.mutateAsync({
        email: newMemberEmail,
        role: newMemberRole,
      });
      setNewMemberEmail('');
      toast.success('Member added successfully');
    } catch (err: unknown) {
      const error = err as { info?: { error?: string } };
      const message = error?.info?.error || 'Failed to add member';
      toast.error(message);
    }
  };

  const handleEditMember = (member: {
    id: string;
    role: string;
    user?: { full_name?: string | null; username?: string | null } | null;
  }) => {
    if (member.role === 'owner') {
      toast.error('Cannot edit owner role');
      return;
    }
    setEditingMember({
      id: member.id,
      role: member.role as 'member' | 'admin' | 'owner',
      userName: member.user?.full_name || member.user?.username || 'Unknown',
    });
    setEditRole(member.role as 'member' | 'admin');
  };

  const handleSaveRole = async () => {
    if (!editingMember) return;

    try {
      await updateMemberRole.mutateAsync({
        member_id: editingMember.id,
        role: editRole,
      });
      setEditingMember(null);
      toast.success('Member role updated');
    } catch (err: unknown) {
      const error = err as { info?: { error?: string } };
      const message = error?.info?.error || 'Failed to update member role';
      toast.error(message);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;

    try {
      await removeMember.mutateAsync(memberToDelete.id);
      setMemberToDelete(null);
      toast.success('Member removed successfully');
    } catch (err: unknown) {
      const error = err as { info?: { error?: string } };
      const message = error?.info?.error || 'Failed to remove member';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Team Name */}
      <div className="space-y-2">
        <Label>
          Team Name <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={!isEditingName}
            className="max-w-xs"
          />
          {isEditingName ? (
            <Button size="sm" onClick={handleUpdateName} disabled={updateOrg.isPending}>
              Save
            </Button>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsEditingName(true)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-2">
        <Label>
          Team Members <span className="text-destructive">*</span>
        </Label>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {membersData?.members?.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    {member.user?.full_name || member.user?.username || 'Unknown'}
                  </TableCell>
                  <TableCell>{member.user?.email}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0"
                        onClick={() => handleEditMember(member)}
                        disabled={member.role === 'owner'}
                      >
                        Edit
                      </Button>
                      {member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => setMemberToDelete({
                            id: member.id,
                            role: member.role as 'member' | 'admin' | 'owner',
                            userName: member.user?.full_name || member.user?.username || 'Unknown',
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!membersData?.members || membersData.members.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add New Member */}
      <div className="space-y-2">
        <Label>
          Add New Member <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground mb-2">
          The user must have an account before they can be added to the team.
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Email:</span>
            <Input
              type="email"
              placeholder="user@example.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">Role:</span>
            <Select
              value={newMemberRole}
              onValueChange={(v) => setNewMemberRole(v as 'member' | 'admin')}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            onClick={handleAddMember}
            disabled={addMember.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {editingMember?.userName}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-role">Role</Label>
            <Select
              value={editRole}
              onValueChange={(v) => setEditRole(v as 'member' | 'admin')}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMember(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRole} disabled={updateMemberRole.isPending}>
              {updateMemberRole.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation */}
      <AlertDialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.userName} from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMember.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
