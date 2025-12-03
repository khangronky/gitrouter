# Integration-Based Branch Plan (Option B)

## Branch Structure

### 🌿 **Branch 1: `integration/github`**
**Purpose:** All GitHub integration functionality

**Files (12 files):**
```
src/app/api/github/available-repos/route.ts
src/app/api/github/install/callback/route.ts
src/app/api/github/install/link/route.ts
src/app/api/github/install/route.ts
src/app/api/github/installations/route.ts
src/app/api/github/webhook/route.ts
src/lib/api/github/index.ts
src/lib/github/client.ts
src/lib/github/index.ts
src/lib/github/signature.ts
src/lib/schema/github.ts
src/components/settings/github-integration-card.tsx
src/app/api/organizations/[id]/github-installation/route.ts
```

---

### 🌿 **Branch 2: `integration/jira`**
**Purpose:** All Jira integration functionality

**Files (15 files):**
```
src/app/api/jira/oauth/callback/route.ts
src/app/api/jira/oauth/route.ts
src/lib/api/jira/index.ts
src/lib/jira/client.ts
src/lib/jira/index.ts
src/lib/jira/pr-sync.ts
src/lib/jira/ticket-parser.ts
src/lib/schema/jira.ts
src/components/settings/jira-integration-card.tsx
src/app/api/organizations/[id]/jira/projects/route.ts
src/app/api/organizations/[id]/jira/route.ts
src/app/api/organizations/[id]/jira/statuses/route.ts
src/app/api/organizations/[id]/jira/test/route.ts
supabase/migrations/20251202100000_jira_oauth.sql
```

---

### 🌿 **Branch 3: `integration/slack`**
**Purpose:** All Slack integration functionality

**Files (13 files):**
```
src/app/api/slack/interactions/route.ts
src/app/api/slack/oauth/callback/route.ts
src/app/api/slack/oauth/route.ts
src/lib/api/slack/index.ts
src/lib/slack/client.ts
src/lib/slack/index.ts
src/lib/slack/messages.ts
src/lib/slack/notifications.ts
src/lib/schema/slack.ts
src/components/settings/slack-integration-card.tsx
src/app/api/organizations/[id]/slack/channels/route.ts
src/app/api/organizations/[id]/slack/members/route.ts
src/app/api/organizations/[id]/slack/route.ts
src/app/api/organizations/[id]/slack/test/route.ts
```

---

### 🌿 **Branch 4: `feature/core-features/rules-builder`**
**Purpose:** Routing rules engine and rules builder UI

**Files (9 files):**
```
src/app/(main)/rules-builder/page.tsx
src/lib/api/rules/index.ts
src/lib/routing/engine.ts
src/lib/routing/index.ts
src/lib/routing/matchers.ts
src/lib/routing/types.ts
src/lib/schema/routing-rule.ts
src/app/api/organizations/[id]/rules/[ruleId]/route.ts
src/app/api/organizations/[id]/rules/reorder/route.ts
src/app/api/organizations/[id]/rules/route.ts
```

---

### 🌿 **Branch 5: `feature/core-features/dashboard`**
**Purpose:** Dashboard UI, charts, and pull requests page

**Files (12 files):**
```
src/app/(main)/dashboard/page.tsx
src/app/(main)/pull-requests/page.tsx
src/components/dashboard/bottlenecks-table.tsx
src/components/dashboard/delta-badge.tsx
src/components/dashboard/kpi-row.tsx
src/components/dashboard/latency-chart.tsx
src/components/dashboard/recent-activity.tsx
src/components/dashboard/section-title.tsx
src/components/dashboard/stale-pull-requests.tsx
src/components/dashboard/workload-chart.tsx
src/data/pull-requests.json
src/lib/schema/pull-request.ts
```

---

### 🌿 **Branch 6: `feature/core-features/layout`**
**Purpose:** Main layout, sidebar navigation, and shared UI components

**Files (8 files):**
```
src/app/(main)/layout.tsx
src/components/ui/dialog.tsx
src/components/side-bar/app-sidebar.tsx
src/components/side-bar/nav-header.tsx
src/components/side-bar/nav-links.tsx
src/components/side-bar/nav-main.tsx
src/components/side-bar/nav-secondary.tsx
```

---

### 🌿 **Branch 7: `feature/core-features/settings`**
**Purpose:** Settings page and all settings-related components

**Files (8 files):**
```
src/app/(main)/settings/page.tsx
src/components/settings/account-settings.tsx
src/components/settings/add-repository-dialog.tsx
src/components/settings/index.ts
src/components/settings/integrations-settings.tsx
src/components/settings/notification-settings.tsx
src/components/settings/repository-settings.tsx
src/components/settings/team-settings.tsx
```

---

### 🌿 **Branch 8: `feature/core-features/organizations`**
**Purpose:** Organizations and team management

**Files (7 files):**
```
src/lib/api/organizations/index.ts
src/lib/organizations/index.ts
src/lib/organizations/permissions.ts
src/lib/schema/organization.ts
src/app/api/organizations/[id]/members/route.ts
src/app/api/organizations/[id]/route.ts
src/app/api/organizations/route.ts
```

---

### 🌿 **Branch 9: `feature/core-features/repositories`**
**Purpose:** Repository management

**Files (4 files):**
```
src/lib/api/repositories/index.ts
src/lib/schema/repository.ts
src/app/api/organizations/[id]/repositories/[repoId]/route.ts
src/app/api/organizations/[id]/repositories/route.ts
```

---

### 🌿 **Branch 10: `feature/core-features/reviewers`**
**Purpose:** Reviewer management and sync functionality

**Files (5 files):**
```
src/lib/api/reviewers/index.ts
src/lib/schema/reviewer.ts
src/app/api/organizations/[id]/reviewers/route.ts
src/app/api/organizations/[id]/reviewers/sync-github/route.ts
src/app/api/organizations/[id]/reviewers/sync-slack/route.ts
```

---

### 🌿 **Branch 11: `feature/core-features/notifications`**
**Purpose:** Notifications, escalations, and notification settings

**Files (6 files):**
```
src/lib/api/escalations/index.ts
src/lib/escalation/index.ts
src/lib/escalation/processor.ts
src/app/api/cron/escalations/route.ts
src/app/api/organizations/[id]/escalations/route.ts
src/app/api/organizations/[id]/notification-settings/route.ts
```

---

### 🌿 **Branch 12: `feature/core-features/auth`**
**Purpose:** Authentication and user registration

**Files (4 files):**
```
src/app/register/form.tsx
src/app/api/auth/me/route.ts
src/lib/api/auth/index.ts
src/lib/schema/auth.ts
```

---

### 🌿 **Branch 13: `chore/testing`**
**Purpose:** Testing utilities

**Files (1 file):**
```
src/app/api/test-webhook/route.ts
```

---

### 🌿 **Branch 14: `chore/infrastructure`**
**Purpose:** Core infrastructure, configuration, types, and database migrations

**Files (18 files):**

#### Configuration:
```
.gitignore
bun.lock
package.json
components.json
vercel.json
```

#### Core App Structure:
```
src/app/layout.tsx
src/app/page.tsx
src/app/privacy/page.tsx
```

#### Types:
```
src/types/primitives/User.ts
src/types/supabase.ts
```

#### Database Migrations:
```
supabase/migrations/20251130000001_add_pr_automation_tables.sql
supabase/migrations/20251130000002_add_auto_create_org_trigger.sql
supabase/migrations/20251202000001_backfill_user_organizations.sql
supabase/migrations/20251202000002_fix_rls_recursion.sql
supabase/migrations/20251202100001_fix_users_rls.sql
supabase/migrations/20251202100002_drop_invitations.sql
supabase/migrations/20251202200000_add_notification_settings.sql
supabase/migrations/20251202300000_add_user_integration_fields.sql
```

**Note:** `20251202100000_jira_oauth.sql` is included in `integration/jira` branch

---

## 📊 Summary

| Branch | File Count | Description |
|--------|------------|-------------|
| `integration/github` | 12 | GitHub integration |
| `integration/jira` | 15 | Jira integration |
| `integration/slack` | 13 | Slack integration |
| `feature/core-features/rules-builder` | 9 | Routing rules engine |
| `feature/core-features/dashboard` | 12 | Dashboard UI & charts |
| `feature/core-features/layout` | 8 | Layout & sidebar |
| `feature/core-features/settings` | 8 | Settings UI |
| `feature/core-features/organizations` | 7 | Organizations management |
| `feature/core-features/repositories` | 4 | Repositories management |
| `feature/core-features/reviewers` | 5 | Reviewers management |
| `feature/core-features/notifications` | 6 | Notifications & escalations |
| `feature/core-features/auth` | 4 | Authentication |
| `chore/testing` | 1 | Testing utilities |
| `chore/infrastructure` | 18 | Infrastructure & config |
| **Total** | **106** | All files categorized |

---

## 🚀 Git Commands to Create Branches

```bash
# Create integration branches
git checkout -b integration/github
git checkout -b integration/jira
git checkout -b integration/slack

# Create core-features sub-branches
git checkout -b feature/core-features/rules-builder
git checkout -b feature/core-features/dashboard
git checkout -b feature/core-features/layout
git checkout -b feature/core-features/settings
git checkout -b feature/core-features/organizations
git checkout -b feature/core-features/repositories
git checkout -b feature/core-features/reviewers
git checkout -b feature/core-features/notifications
git checkout -b feature/core-features/auth

# Create utility branches
git checkout -b chore/testing
git checkout -b chore/infrastructure

# Or create from main/master
git checkout main  # or master
# Then run the same commands above
```

---

## 📝 Notes

1. **Dependencies:** Some files may have dependencies across branches. Review carefully when merging.

2. **Shared Files:** Files like `src/app/(main)/layout.tsx` and shared components may need to be in multiple branches or handled carefully.

3. **Migration Order:** Database migrations should be applied in chronological order. The Jira OAuth migration is in the Jira branch, but other migrations are in infrastructure.

4. **Integration Cards:** The integration cards in settings (`github-integration-card.tsx`, `jira-integration-card.tsx`, `slack-integration-card.tsx`) are in their respective integration branches, but `integrations-settings.tsx` is in core-features.

5. **Reviewer Sync:** The reviewer sync endpoints (`sync-github`, `sync-slack`) are in `feature/core-features/reviewers` but depend on the integration branches.

6. **Layout Dependencies:** The `feature/core-features/layout` branch contains shared UI components that other feature branches may depend on.

7. **Settings Integration Cards:** The integration cards (`github-integration-card.tsx`, `jira-integration-card.tsx`, `slack-integration-card.tsx`) are in their respective integration branches, but `integrations-settings.tsx` is in `feature/core-features/settings`.

