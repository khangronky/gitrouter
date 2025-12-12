# GitRouter Project Structure

## Overview

GitRouter is an intelligent pull request routing and management platform that automates reviewer assignments based on customizable rules. It integrates with GitHub, Slack, and Jira to streamline code review workflows.

## Root Directory Structure

```
gitrouter/
├── README.md                          # Project overview and setup instructions
├── package.json                       # Dependencies and scripts (Bun runtime)
├── bun.lock                          # Bun lockfile
├── next.config.ts                    # Next.js configuration
├── tsconfig.json                     # TypeScript configuration
├── vercel.json                       # Vercel deployment config (cron jobs)
├── biome.json                        # Biome formatter/linter config
├── components.json                   # shadcn/ui component config
├── postcss.config.mjs                # PostCSS config for Tailwind
├── next-env.d.ts                     # Next.js TypeScript declarations
│
├── supabase/                         # Supabase local development
│   ├── config.toml                   # Supabase local config
│   ├── seed.sql                      # Database seed data
│   ├── migrations/                   # Database migrations
│   │   ├── 20251126185709_add_users_table.sql
│   │   ├── 20251126192054_add_trigger_for_auth_users.sql
│   │   ├── 20251130000001_add_pr_automation_tables.sql
│   │   ├── 20251208132342_optimize_schema.sql
│   │   ├── 20251209000001_consolidate_reviewer_name.sql
│   │   └── ... (more migrations)
│   └── templates/                    # Email templates
│       ├── confirmation.html
│       ├── recovery.html
│       └── password_changed_notification.html
│
├── public/                           # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── docs/                             # Documentation
│   └── database-optimization-2024-12.md
│
├── certificates/                     # SSL certificates (if any)
│
└── src/                             # Source code
    ├── app/                         # Next.js App Router
    ├── components/                   # React components
    ├── lib/                         # Core business logic
    ├── providers/                    # React context providers
    ├── stores/                      # Zustand state stores
    ├── types/                       # TypeScript type definitions
    ├── hooks/                       # React hooks
    └── constants/                   # Constants
```

## Source Code Structure (`src/`)

### Frontend Application (`src/app/`)

#### Public Pages
```
src/app/
├── layout.tsx                       # Root layout with providers
├── page.tsx                         # Landing/home page
├── globals.css                      # Global styles
├── favicon.ico
│
├── login/                           # Authentication pages
│   ├── page.tsx
│   └── form.tsx
├── register/
│   ├── page.tsx
│   └── form.tsx
├── forgot-password/
│   ├── page.tsx
│   └── form.tsx
└── privacy/
    └── page.tsx
```

#### Authenticated App (`src/app/(main)/`)
```
src/app/(main)/
├── layout.tsx                       # Main app layout (sidebar, auth check)
│
├── dashboard/                       # Analytics dashboard
│   └── page.tsx                     # Dashboard with KPIs, charts, metrics
│
├── pull-requests/                   # PR management
│   ├── page.tsx                     # PR list view
│   ├── client.tsx                   # Client component for PR table
│   ├── columns.tsx                  # Table column definitions
│   └── pull-request-table.tsx       # PR table component
│
├── rules-builder/                   # Routing rules configuration
│   ├── page.tsx                     # Rules list and management
│   ├── create-rule-dialog.tsx       # Create new rule dialog
│   ├── edit-rule-dialog.tsx         # Edit existing rule dialog
│   └── columns.tsx                  # Rules table columns
│
└── settings/                        # Organization settings
    └── page.tsx                     # Settings page (account, team, integrations)
```

#### API Routes (`src/app/api/`)
```
src/app/api/
│
├── auth/                            # Authentication endpoints
│   ├── login/route.ts
│   ├── register/route.ts
│   ├── me/route.ts
│   ├── otp/
│   │   ├── verify/route.ts
│   │   └── resend/route.ts
│   └── password-reset/
│       ├── route.ts
│       ├── update/route.ts
│       └── verify/route.ts
│
├── admin/                           # Admin endpoints
│   └── route.ts
│
├── dashboard/                       # Dashboard data API
│   └── route.ts                     # GET /api/dashboard
│
├── cron/                            # Scheduled jobs
│   └── escalations/route.ts         # Hourly escalation processing
│
├── github/                          # GitHub integration
│   ├── webhook/route.ts             # GitHub webhook handler (PR events)
│   ├── install/                     # GitHub App installation
│   │   ├── route.ts
│   │   ├── link/route.ts
│   │   └── callback/route.ts
│   ├── installations/route.ts        # List installations
│   └── available-repos/route.ts    # List available repos
│
├── jira/                            # Jira integration
│   └── oauth/
│       ├── route.ts                 # Initiate OAuth
│       └── callback/route.ts        # OAuth callback
│
├── slack/                           # Slack integration
│   ├── oauth/
│   │   ├── route.ts                 # Initiate OAuth
│   │   └── callback/route.ts        # OAuth callback
│   └── interactions/route.ts       # Slack interactive components
│
├── organizations/                   # Organization management
│   ├── route.ts                     # List/create organizations
│   └── [id]/                        # Organization-scoped endpoints
│       ├── route.ts                 # GET/PATCH/DELETE org
│       ├── members/route.ts         # Member management
│       ├── repositories/            # Repository management
│       │   ├── route.ts            # List/add repos
│       │   └── [repoId]/route.ts   # Update/delete repo
│       ├── reviewers/               # Reviewer management
│       │   ├── route.ts            # List/create reviewers
│       │   ├── sync-github/route.ts # Sync from GitHub
│       │   └── sync-slack/route.ts # Sync from Slack
│       ├── rules/                   # Routing rules
│       │   ├── route.ts            # List/create rules
│       │   ├── reorder/route.ts    # Reorder rule priorities
│       │   └── [ruleId]/route.ts   # Update/delete rule
│       ├── slack/                   # Slack integration config
│       │   ├── route.ts            # GET/PATCH/DELETE Slack
│       │   ├── channels/route.ts   # List Slack channels
│       │   ├── members/route.ts    # List Slack members
│       │   └── test/route.ts       # Test Slack connection
│       ├── jira/                    # Jira integration config
│       │   ├── route.ts            # GET/PATCH/DELETE Jira
│       │   ├── projects/route.ts   # List Jira projects
│       │   ├── statuses/route.ts   # List Jira statuses
│       │   └── test/route.ts       # Test Jira connection
│       ├── notification-settings/route.ts  # Notification preferences
│       ├── escalations/route.ts     # Escalation summary
│       └── github-installation/route.ts   # GitHub App installation
│
└── test-webhook/                    # Webhook testing endpoint
    └── route.ts
```

### Components (`src/components/`)

```
src/components/
│
├── ui/                              # shadcn/ui components (55+ components)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   ├── form.tsx
│   └── ... (many more)
│
├── dashboard/                       # Dashboard-specific components
│   ├── bottlenecks-table.tsx       # Repository bottlenecks table
│   ├── dashboard-skeleton.tsx      # Loading skeleton
│   ├── delta-badge.tsx             # Delta indicator badge
│   ├── kpi-row.tsx                 # KPI metrics row
│   ├── latency-chart.tsx            # Review latency chart
│   ├── recent-activity.tsx          # Recent PR activity
│   ├── section-title.tsx            # Section headers
│   ├── stale-pull-requests.tsx     # Stale PRs list
│   └── workload-chart.tsx           # Reviewer workload chart
│
├── settings/                        # Settings page components
│   ├── account-settings.tsx        # User account settings
│   ├── add-repository-dialog.tsx    # Add repo dialog
│   ├── github-integration-card.tsx # GitHub integration UI
│   ├── integrations-settings.tsx   # Integrations overview
│   ├── jira-integration-card.tsx   # Jira integration UI
│   ├── notification-settings.tsx   # Notification preferences
│   ├── repository-settings.tsx     # Repository management
│   ├── slack-integration-card.tsx  # Slack integration UI
│   ├── team-settings.tsx           # Team/member management
│   └── index.ts                    # Exports
│
└── side-bar/                        # Sidebar navigation
    ├── app-sidebar.tsx             # Main sidebar component
    ├── nav-header.tsx              # Sidebar header
    ├── nav-links.tsx               # Navigation links
    ├── nav-main.tsx                # Main nav section
    ├── nav-secondary.tsx           # Secondary nav section
    └── nav-user.tsx                # User menu
```

### Core Business Logic (`src/lib/`)

```
src/lib/
│
├── api/                             # API client functions
│   ├── index.ts                     # Shared fetcher/axios instance
│   ├── auth/index.ts               # Auth API hooks
│   ├── dashboard/index.ts          # Dashboard API hooks
│   ├── escalations/index.ts        # Escalation API hooks
│   ├── github/index.ts             # GitHub API hooks
│   ├── jira/index.ts              # Jira API hooks
│   ├── organizations/index.ts      # Organization API hooks
│   ├── repositories/index.ts       # Repository API hooks
│   ├── reviewers/index.ts         # Reviewer API hooks
│   ├── rules/index.ts             # Rules API hooks
│   └── slack/index.ts             # Slack API hooks
│
├── routing/                         # PR routing engine
│   ├── index.ts                     # Public exports
│   ├── engine.ts                    # Core routing logic
│   ├── matchers.ts                  # Condition matching functions
│   └── types.ts                     # Routing type definitions
│
├── github/                          # GitHub integration
│   ├── index.ts                     # Exports
│   ├── client.ts                    # Octokit client & API functions
│   └── signature.ts                # Webhook signature verification
│
├── slack/                           # Slack integration
│   ├── index.ts                     # Exports
│   ├── client.ts                    # Slack Web API client
│   ├── messages.ts                  # Message block builders
│   └── notifications.ts             # Notification sending logic
│
├── jira/                            # Jira integration
│   ├── index.ts                     # Exports
│   ├── client.ts                    # Jira API client
│   ├── pr-sync.ts                   # PR ↔ Jira ticket sync logic
│   └── ticket-parser.ts             # Extract Jira ticket IDs from PRs
│
├── escalation/                      # Escalation processing
│   ├── index.ts                     # Exports
│   └── processor.ts                # Escalation logic (24h/48h)
│
├── dashboard/                       # Dashboard data aggregation
│   ├── index.ts                     # Exports
│   └── service.ts                   # Dashboard query functions
│
├── organizations/                   # Organization management
│   ├── index.ts                     # Exports
│   └── permissions.ts               # Permission checking logic
│
├── supabase/                        # Supabase client utilities
│   ├── client.ts                    # Browser client
│   ├── server.ts                    # Server client (user/admin)
│   ├── common.ts                    # Shared utilities
│   └── proxy.ts                     # Proxy client (if needed)
│
└── schema/                          # Zod schemas & types
    ├── index.ts                     # Exports
    ├── auth.ts                      # Auth schemas
    ├── dashboard.ts                  # Dashboard schemas
    ├── github.ts                    # GitHub webhook schemas
    ├── jira.ts                      # Jira schemas
    ├── organization.ts              # Organization schemas
    ├── pull-request.ts              # PR schemas
    ├── repository.ts                # Repository schemas
    ├── reviewer.ts                  # Reviewer schemas
    ├── routing-rule.ts              # Routing rule schemas
    └── slack.ts                     # Slack schemas
```

### Supporting Code

```
src/
│
├── providers/                        # React context providers
│   ├── providers.tsx                # Root provider wrapper
│   ├── client-providers.tsx         # Client-side providers (TanStack Query, etc.)
│   └── user-provider.tsx            # User context provider
│
├── stores/                          # Zustand state stores
│   └── user-store.ts                # User state management
│
├── types/                           # TypeScript type definitions
│   ├── supabase.ts                  # Generated Supabase types
│   └── primitives/
│       └── User.ts                  # User type definitions
│
├── hooks/                           # Custom React hooks
│   └── use-mobile.ts                # Mobile detection hook
│
├── constants/                        # Constants
│   └── common.ts                    # Shared constants
│
└── utils.ts                         # Utility functions
```

## Key Files & Their Purposes

### Configuration Files

- **`package.json`**: Dependencies, scripts (dev, build, Supabase commands)
- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript compiler options
- **`vercel.json`**: Vercel deployment config (cron schedule for escalations)
- **`biome.json`**: Code formatter/linter configuration
- **`supabase/config.toml`**: Local Supabase instance configuration

### Core Application Files

- **`src/app/api/github/webhook/route.ts`**: Main webhook handler - processes PR events, triggers routing, sends notifications
- **`src/lib/routing/engine.ts`**: Core routing algorithm - evaluates rules and assigns reviewers
- **`src/lib/escalation/processor.ts`**: Escalation logic - sends reminders/alerts for stale PRs
- **`src/lib/dashboard/service.ts`**: Dashboard data aggregation - KPIs, charts, metrics

### Database Schema

Key tables (from migrations):
- `users` - User accounts
- `organizations` - Organizations/teams
- `organization_members` - User-org relationships with roles
- `repositories` - GitHub repositories
- `pull_requests` - PR records
- `reviewers` - Reviewer definitions (linked to users)
- `routing_rules` - Routing rule configurations
- `review_assignments` - PR-reviewer assignments
- `escalations` - Escalation records
- `github_installations` - GitHub App installations
- `slack_integrations` - Slack workspace integrations
- `jira_integrations` - Jira site integrations
- `webhook_events` - Webhook idempotency tracking

## Data Flow

1. **GitHub Webhook** → `src/app/api/github/webhook/route.ts`
   - Verifies signature, checks idempotency
   - Upserts PR to database
   - Calls routing engine
   - Requests GitHub reviews
   - Sends Slack notifications
   - Syncs Jira tickets

2. **Routing Engine** → `src/lib/routing/engine.ts`
   - Fetches active rules for organization
   - Evaluates conditions (file patterns, branches, authors, labels, time windows)
   - Selects reviewers (excludes PR author)
   - Creates review assignments

3. **Escalation Cron** → `src/app/api/cron/escalations/route.ts`
   - Runs hourly (Vercel cron)
   - Finds pending assignments >24h → sends reminders
   - Finds pending assignments >48h → sends alerts

4. **Dashboard** → `src/app/api/dashboard/route.ts`
   - Aggregates PR metrics
   - Calculates KPIs, latency, workload, bottlenecks
   - Returns data for frontend visualization

## Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **Runtime**: Bun
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI + shadcn/ui
- **State Management**: Zustand + TanStack Query
- **Form Handling**: React Hook Form + Zod
- **API Client**: Axios
- **Charts**: Recharts
- **Icons**: Lucide React + Tabler Icons

## Development Commands

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun sb:start` - Start local Supabase
- `bun sb:reset` - Reset database (runs migrations)
- `bun sb:typegen` - Generate TypeScript types from schema
- `bun format-and-lint:fix` - Format and lint code


