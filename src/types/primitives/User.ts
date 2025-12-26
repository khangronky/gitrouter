export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  // Integration identities (may differ from each other)
  github_user_id?: number | null;
  github_username?: string | null;
  slack_user_id?: string | null;
  slack_username?: string | null;
  jira_account_id?: string | null;
  jira_email?: string | null;
  // Onboarding status
  onboarding_completed?: boolean;
}
