'use client';

import { useState } from 'react';
import {
  Users,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAddMemberByEmail } from '@/lib/api/organizations';
import { toast } from 'sonner';

interface TeamStepProps {
  onNext: () => void;
  onBack: () => void;
  orgId: string;
}

interface PendingInvite {
  email: string;
  role: 'member' | 'admin';
}

export function TeamStep({ onNext, onBack, orgId }: TeamStepProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'member' | 'admin'>('member');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);

  const addMember = useAddMemberByEmail(orgId);

  const handleAddToList = () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (pendingInvites.some((invite) => invite.email === email)) {
      toast.error('This email is already in the list');
      return;
    }

    setPendingInvites([...pendingInvites, { email, role }]);
    setEmail('');
    setRole('member');
  };

  const handleRemoveFromList = (emailToRemove: string) => {
    setPendingInvites(
      pendingInvites.filter((invite) => invite.email !== emailToRemove)
    );
  };

  const handleSendInvites = async () => {
    if (pendingInvites.length === 0) {
      onNext();
      return;
    }

    setIsSending(true);
    const newSentInvites: string[] = [];
    const errors: string[] = [];

    for (const invite of pendingInvites) {
      try {
        await addMember.mutateAsync({
          email: invite.email,
          role: invite.role,
        });
        newSentInvites.push(invite.email);
      } catch (error: unknown) {
        const err = error as { info?: { error?: string } };
        const message = err?.info?.error || `Failed to add ${invite.email}`;
        errors.push(message);
      }
    }

    if (newSentInvites.length > 0) {
      setSentInvites([...sentInvites, ...newSentInvites]);
      setPendingInvites(
        pendingInvites.filter(
          (invite) => !newSentInvites.includes(invite.email)
        )
      );
      toast.success(`Added ${newSentInvites.length} team member(s)`);
    }

    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
    }

    setIsSending(false);

    if (
      pendingInvites.length === 0 ||
      newSentInvites.length === pendingInvites.length
    ) {
      onNext();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddToList();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="size-8" />
        </div>
        <h2 className="text-xl font-bold">Invite Team Members</h2>
        <p className="text-muted-foreground text-sm">
          Add teammates to your organization. They&apos;ll be able to view
          dashboards and manage reviews.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="w-28 space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as 'member' | 'admin')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleAddToList}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        {pendingInvites.length > 0 && (
          <div className="space-y-2">
            <Label>Pending Invites</Label>
            <div className="space-y-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{invite.email}</span>
                    <Badge variant="outline" className="text-xs">
                      {invite.role}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => handleRemoveFromList(invite.email)}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sentInvites.length > 0 && (
          <div className="space-y-2">
            <Label>Added Members</Label>
            <div className="flex flex-wrap gap-2">
              {sentInvites.map((email) => (
                <Badge
                  key={email}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Check className="size-3 text-green-500" />
                  {email}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Note: Users must have an account to be added. They&apos;ll need to
          sign up first if they don&apos;t have one.
        </p>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onNext}>
            Skip
          </Button>
          <Button onClick={handleSendInvites} disabled={isSending}>
            {isSending ? (
              <Loader2 className="size-4 mr-2 animate-spin" />
            ) : pendingInvites.length > 0 ? (
              <>
                <Users className="size-4 mr-2" />
                Add {pendingInvites.length} Member
                {pendingInvites.length > 1 ? 's' : ''}
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="size-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
