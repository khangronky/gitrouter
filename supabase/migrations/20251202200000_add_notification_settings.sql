-- Add notification_settings column to organizations table
ALTER TABLE "public"."organizations" 
ADD COLUMN IF NOT EXISTS "notification_settings" jsonb NOT NULL DEFAULT '{
  "slack_notifications": true,
  "email_notifications": false,
  "escalation_destination": "channel",
  "notification_frequency": "realtime"
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN "public"."organizations"."notification_settings" IS 'Notification preferences: slack_notifications, email_notifications, escalation_destination (channel/dm), notification_frequency (realtime/batched/daily)';

