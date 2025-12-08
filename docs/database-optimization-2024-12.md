# Database Schema Optimization (December 2024)

## Overview

This document summarizes the database schema optimization performed to reduce data redundancy, improve query performance, and ensure data integrity.

---

## Changes Summary

### 1. Reviewers Table Normalization

**Problem:** The `reviewers` table duplicated fields that already existed on the `users` table:
- `github_username`
- `slack_user_id`
- `email`

This caused:
- Data inconsistency risks (same data in two places)
- Extra storage overhead
- Complex sync logic to keep both tables in sync

**Solution:** Removed duplicate columns from `reviewers`. These fields are now accessed via the `user_id` foreign key relationship to the `users` table.

#### Before
```
reviewers
├── id
├── organization_id
├── user_id (FK → users)
├── name
├── github_username    ← REMOVED
├── slack_user_id      ← REMOVED  
├── email              ← REMOVED
├── is_active
└── timestamps
```

#### After
```
reviewers                     users
├── id                        ├── id
├── organization_id           ├── email
├── user_id (FK) ──────────► ├── github_username
├── name                      ├── github_user_id
├── is_active                 ├── slack_user_id
└── timestamps                ├── slack_username
                              └── full_name
```

### 2. New Indexes Added

| Index | Table | Columns | Purpose |
|-------|-------|---------|---------|
| `review_assignments_reviewer_status_idx` | review_assignments | (reviewer_id, status) | Speed up reviewer workload queries |
| `reviewers_user_id_idx` | reviewers | (user_id) WHERE NOT NULL | Speed up user→reviewer lookups |
| `notifications_org_status_idx` | notifications | (organization_id, status) | Speed up notification queries |
| `pull_requests_author_login_idx` | pull_requests | (author_login) | Speed up PR author filtering |

### 3. New Unique Constraints

| Constraint | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `reviewers_org_user_key` | reviewers | (organization_id, user_id) WHERE user_id NOT NULL | Prevent duplicate reviewers per org for the same user |

### 4. Dropped Unused Table

- **`processed_events`** - Was not used anywhere in the codebase. Webhook idempotency is handled by the `webhook_events` table.

---

## Code Changes

The following files were updated to join with the `users` table instead of reading directly from `reviewers`:

### Query Updates
- `src/lib/routing/engine.ts` - `getReviewers()` function
- `src/lib/slack/notifications.ts` - `sendReviewReminder()`, `sendEscalationAlert()`
- `src/lib/dashboard/service.ts` - `fetchReviewerWorkload()`, `fetchRecentActivity()`
- `src/app/api/organizations/[id]/reviewers/route.ts` - GET and POST handlers
- `src/app/api/organizations/[id]/rules/route.ts` - Reviewer detail fetching
- `src/app/api/organizations/[id]/rules/[ruleId]/route.ts` - Reviewer detail fetching

### Sync Route Refactors
- `src/app/api/organizations/[id]/reviewers/sync-github/route.ts` - Now creates/updates users and links to reviewers
- `src/app/api/organizations/[id]/reviewers/sync-slack/route.ts` - Now updates users table with Slack info

### Type Updates
- `src/lib/schema/reviewer.ts` - Updated interfaces
- `src/types/supabase.ts` - Removed dropped columns from types

---

## Migration

**File:** `supabase/migrations/20251208132342_optimize_schema.sql`

```sql
-- Add indexes
CREATE INDEX review_assignments_reviewer_status_idx ON review_assignments(reviewer_id, status);
CREATE INDEX reviewers_user_id_idx ON reviewers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX notifications_org_status_idx ON notifications(organization_id, status);
CREATE INDEX pull_requests_author_login_idx ON pull_requests(author_login);

-- Add unique constraint
CREATE UNIQUE INDEX reviewers_org_user_key ON reviewers(organization_id, user_id) WHERE user_id IS NOT NULL;

-- Drop duplicate columns
ALTER TABLE reviewers DROP COLUMN github_username;
ALTER TABLE reviewers DROP COLUMN slack_user_id;
ALTER TABLE reviewers DROP COLUMN email;

-- Drop unused table
DROP TABLE IF EXISTS processed_events;
```

---

## API Response Structure

User-related fields (`github_username`, `slack_user_id`, `email`) are in the nested `user` object. The `name` field is kept as a fallback for reviewers without linked users.

```json
{
  "reviewer": {
    "id": "...",
    "organization_id": "...",
    "name": "John Doe",
    "is_active": true,
    "created_at": "...",
    "updated_at": "...",
    "user": {
      "id": "...",
      "email": "john@example.com",
      "full_name": "John Doe",
      "github_username": "johndoe",
      "slack_user_id": "U12345"
    }
  }
}
```

**Note:** If a reviewer doesn't have a linked user, the `user` field will be `null` and the `name` field should be used for display.
```

---

## Future Considerations

### Array Columns (Deferred)
The following array columns could be converted to junction tables for better FK enforcement:
- `routing_rules.reviewer_ids` → `routing_rule_reviewers` junction table
- `escalations.notified_user_ids` → `escalation_notifications` junction table

This was deferred as it requires more significant refactoring and the current implementation works correctly.

