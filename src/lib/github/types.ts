// GitHub Webhook Event Types

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  type: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubUser;
  html_url: string;
  default_branch: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  html_url: string;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged: boolean;
  draft: boolean;
  additions: number;
  deletions: number;
  changed_files: number;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
}

export interface GitHubPullRequestFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface GitHubInstallation {
  id: number;
  account: GitHubUser;
}

// Webhook Events

export interface PullRequestEvent {
  action:
    | 'opened'
    | 'closed'
    | 'reopened'
    | 'edited'
    | 'synchronize'
    | 'assigned'
    | 'unassigned'
    | 'review_requested'
    | 'review_request_removed'
    | 'labeled'
    | 'unlabeled'
    | 'ready_for_review'
    | 'converted_to_draft';
  number: number;
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
  sender: GitHubUser;
  installation?: GitHubInstallation;
}

export interface PullRequestReviewEvent {
  action: 'submitted' | 'edited' | 'dismissed';
  review: {
    id: number;
    user: GitHubUser;
    body: string | null;
    state: 'approved' | 'changes_requested' | 'commented' | 'dismissed' | 'pending';
    submitted_at: string;
  };
  pull_request: GitHubPullRequest;
  repository: GitHubRepository;
  sender: GitHubUser;
  installation?: GitHubInstallation;
}

export interface InstallationEvent {
  action: 'created' | 'deleted' | 'suspend' | 'unsuspend' | 'new_permissions_accepted';
  installation: {
    id: number;
    account: GitHubUser;
    repository_selection: 'all' | 'selected';
    app_id: number;
    target_type: 'Organization' | 'User';
  };
  repositories?: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  sender: GitHubUser;
}

export interface InstallationRepositoriesEvent {
  action: 'added' | 'removed';
  installation: GitHubInstallation;
  repository_selection: 'all' | 'selected';
  repositories_added: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  repositories_removed: Array<{
    id: number;
    name: string;
    full_name: string;
    private: boolean;
  }>;
  sender: GitHubUser;
}

// Processed PR data for internal use
export interface ProcessedPullRequest {
  githubPrId: number;
  githubPrNumber: number;
  repository: string;
  title: string;
  body: string | null;
  author: string;
  authorAvatarUrl: string;
  filesChanged: string[];
  additions: number;
  deletions: number;
  htmlUrl: string;
  status: 'open' | 'merged' | 'closed';
  mergedAt: string | null;
  closedAt: string | null;
  jiraTicketId: string | null;
}

// Webhook event type discriminator
export type WebhookEvent =
  | { type: 'pull_request'; payload: PullRequestEvent }
  | { type: 'pull_request_review'; payload: PullRequestReviewEvent }
  | { type: 'installation'; payload: InstallationEvent }
  | { type: 'installation_repositories'; payload: InstallationRepositoriesEvent };

// GitHub App Installation Token
export interface InstallationAccessToken {
  token: string;
  expires_at: string;
  permissions: Record<string, string>;
  repository_selection: 'all' | 'selected';
}

