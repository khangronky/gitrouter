'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/lib/api/organizations';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { NotificationSettings as NotificationSettingsType } from '@/lib/schema/organization';

interface NotificationSettingsProps {
  orgId: string;
}

export function NotificationSettings({ orgId }: NotificationSettingsProps) {
  const { data, isLoading, error } = useNotificationSettings(orgId);
  const updateSettings = useUpdateNotificationSettings(orgId);

  const [localSettings, setLocalSettings] = useState<NotificationSettingsType>({
    slack_notifications: true,
    email_notifications: false,
    escalation_destination: 'channel',
    notification_frequency: 'realtime',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with fetched data
  useEffect(() => {
    if (data?.notification_settings) {
      setLocalSettings(data.notification_settings);
      setHasChanges(false);
    }
  }, [data?.notification_settings]);

  const handleChange = <K extends keyof NotificationSettingsType>(
    key: K,
    value: NotificationSettingsType[K]
  ) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(localSettings);
      setHasChanges(false);
      toast.success('Notification settings saved');
    } catch {
      toast.error('Failed to save notification settings');
    }
  };

  const handleCancel = () => {
    if (data?.notification_settings) {
      setLocalSettings(data.notification_settings);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load notification settings
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable Slack Notifications */}
      <div className="space-y-3">
        <Label>
          Slack Notifications <span className="text-destructive">*</span>
        </Label>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={localSettings.slack_notifications}
              onCheckedChange={(checked) =>
                handleChange('slack_notifications', checked as boolean)
              }
            />
            <span className="text-sm">
              Enable Slack notifications for PR reviews
            </span>
          </label>
        </div>
      </div>

      {/* Notification Destination */}
      <div className="space-y-3">
        <Label>
          Notification Destination <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={localSettings.escalation_destination}
          onValueChange={(value) =>
            handleChange('escalation_destination', value as 'channel' | 'dm')
          }
          className="space-y-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="channel" />
            <span className="text-sm">
              Post to channel (public)
            </span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="dm" />
            <span className="text-sm">
              Send DM to reviewers (private)
            </span>
          </label>
        </RadioGroup>
      </div>

      {/* Notification Frequency */}
      <div className="space-y-3">
        <Label>
          Notification Frequency <span className="text-destructive">*</span>
        </Label>
        <RadioGroup
          value={localSettings.notification_frequency}
          onValueChange={(value) =>
            handleChange(
              'notification_frequency',
              value as 'realtime' | 'batched' | 'daily'
            )
          }
          className="space-y-2"
        >
          <label className="flex items-center gap-2">
            <RadioGroupItem value="realtime" />
            <span className="text-sm">Real-time (send immediately)</span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="batched" />
            <span className="text-sm">Batched (send once per hour)</span>
          </label>
          <label className="flex items-center gap-2">
            <RadioGroupItem value="daily" />
            <span className="text-sm">Daily digest (send once per day)</span>
          </label>
        </RadioGroup>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateSettings.isPending}
        >
          Save All Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={!hasChanges || updateSettings.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
