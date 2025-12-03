# File Categorization by Feature Branch

## 📦 **1. Core Infrastructure & Configuration**
```
.gitignore
bun.lock
package.json
components.json
vercel.json
src/app/layout.tsx
src/app/page.tsx
src/app/privacy/page.tsx
src/types/primitives/User.ts
src/types/supabase.ts
```

## 🔐 **2. Authentication & User Management**
```
src/app/register/form.tsx
src/app/api/auth/me/route.ts
src/lib/api/auth/index.ts
src/lib/schema/auth.ts
```

## 🐙 **3. GitHub Integration**
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

## 🎫 **4. Jira Integration**
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

## 💬 **5. Slack Integration**
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

## 📊 **6. Dashboard & UI Components**
```
src/app/(main)/dashboard/page.tsx
src/app/(main)/layout.tsx
src/app/(main)/pull-requests/page.tsx
src/components/dashboard/bottlenecks-table.tsx
src/components/dashboard/delta-badge.tsx
src/components/dashboard/kpi-row.tsx
src/components/dashboard/latency-chart.tsx
src/components/dashboard/recent-activity.tsx
src/components/dashboard/section-title.tsx
src/components/dashboard/stale-pull-requests.tsx
src/components/dashboard/workload-chart.tsx
src/components/ui/dialog.tsx
src/components/side-bar/app-sidebar.tsx
src/components/side-bar/nav-header.tsx
src/components/side-bar/nav-links.tsx
src/components/side-bar/nav-main.tsx
src/components/side-bar/nav-secondary.tsx
src/data/pull-requests.json
```

## ⚙️ **7. Settings & Configuration UI**
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

## 🔀 **8. Routing Rules Engine**
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

## 🏢 **9. Organizations & Team Management**
```
src/lib/api/organizations/index.ts
src/lib/organizations/index.ts
src/lib/organizations/permissions.ts
src/lib/schema/organization.ts
src/app/api/organizations/[id]/members/route.ts
src/app/api/organizations/[id]/route.ts
src/app/api/organizations/route.ts
```

## 📁 **10. Repositories Management**
```
src/lib/api/repositories/index.ts
src/lib/schema/repository.ts
src/app/api/organizations/[id]/repositories/[repoId]/route.ts
src/app/api/organizations/[id]/repositories/route.ts
```

## 👥 **11. Reviewers Management**
```
src/lib/api/reviewers/index.ts
src/lib/schema/reviewer.ts
src/app/api/organizations/[id]/reviewers/route.ts
src/app/api/organizations/[id]/reviewers/sync-github/route.ts
src/app/api/organizations/[id]/reviewers/sync-slack/route.ts
```

## 📢 **12. Notifications & Escalations**
```
src/lib/api/escalations/index.ts
src/lib/escalation/index.ts
src/lib/escalation/processor.ts
src/app/api/cron/escalations/route.ts
src/app/api/organizations/[id]/escalations/route.ts
src/app/api/organizations/[id]/notification-settings/route.ts
```

## 🗄️ **13. Database Migrations**
```
supabase/migrations/20251130000001_add_pr_automation_tables.sql
supabase/migrations/20251130000002_add_auto_create_org_trigger.sql
supabase/migrations/20251202000001_backfill_user_organizations.sql
supabase/migrations/20251202000002_fix_rls_recursion.sql
supabase/migrations/20251202100000_jira_oauth.sql
supabase/migrations/20251202100001_fix_users_rls.sql
supabase/migrations/20251202100002_drop_invitations.sql
supabase/migrations/20251202200000_add_notification_settings.sql
supabase/migrations/20251202300000_add_user_integration_fields.sql
```

## 🧪 **14. Testing & Utilities**
```
src/app/api/test-webhook/route.ts
```

## 📋 **15. Pull Request Schema & Types**
```
src/lib/schema/pull-request.ts
```

---

## 🎯 **Suggested Branch Strategy**

### **Option A: Feature-Based Branches**
1. `feature/github-integration` - All GitHub files
2. `feature/jira-integration` - All Jira files
3. `feature/slack-integration` - All Slack files
4. `feature/routing-engine` - Routing rules engine
5. `feature/dashboard` - Dashboard & UI components
6. `feature/organizations` - Organizations & team management
7. `feature/notifications` - Notifications & escalations
8. `chore/database-migrations` - All migrations
9. `chore/core-infrastructure` - Core config & setup

### **Option B: Integration-Based Branches**
1. `integration/github` - GitHub integration
2. `integration/jira` - Jira integration  
3. `integration/slack` - Slack integration
4. `feature/core-features` - Dashboard, routing, organizations
5. `chore/infrastructure` - Config, migrations, types

### **Option C: Layer-Based Branches**
1. `api/integrations` - All API routes
2. `ui/components` - All UI components
3. `lib/core` - Core libraries & schemas
4. `db/migrations` - Database migrations
5. `config/setup` - Configuration files

