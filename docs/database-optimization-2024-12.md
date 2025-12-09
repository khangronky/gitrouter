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
- `name` (redundant with `users.full_name`)

This caused:
- Data inconsistency risks (same data in two places)
- Extra storage overhead
- Complex sync logic to keep both tables in sync

**Solution:** 
1. Removed duplicate columns from `reviewers`
2. Made `user_id` required (NOT NULL) - every reviewer must have a linked user
3. All reviewer info now comes from the linked `users` table

#### Before
```
reviewers
├── id
├── organization_id
├── user_id (FK → users, nullable)
├── name                  ← REMOVED
├── github_username       ← REMOVED
├── slack_user_id         ← REMOVED  
├── email                 ← REMOVED
├── is_active
└── timestamps
```

#### After
```
reviewers                     users
├── id                        ├── id
├── organization_id           ├── email
├── user_id (FK, NOT NULL) ─► ├── full_name
├── is_active                 ├── github_username
└── timestamps                ├── github_user_id
                              ├── slack_user_id
                              └── slack_username
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
| `reviewers_org_user_key` | reviewers | (organization_id, user_id) | Prevent duplicate reviewers per org for the same user |

### 4. Dropped Unused Table

- **`processed_events`** - Was not used anywhere in the codebase. Webhook idempotency is handled by the `webhook_events` table.

---

## Code Changes

The following files were updated to use `users` table instead of reading directly from `reviewers`:

### Query Updates
- `src/lib/routing/engine.ts` - `getReviewers()` function
- `src/lib/slack/notifications.ts` - `sendReviewReminder()`, `sendEscalationAlert()`
- `src/lib/dashboard/service.ts` - `fetchReviewerWorkload()`, `fetchRecentActivity()`
- `src/lib/escalation/processor.ts` - `getEscalationSummary()`
- `src/app/api/organizations/[id]/reviewers/route.ts` - GET and POST handlers
- `src/app/api/organizations/[id]/rules/route.ts` - Reviewer detail fetching
- `src/app/api/organizations/[id]/rules/[ruleId]/route.ts` - Reviewer detail fetching

### Sync Route Refactors
- `src/app/api/organizations/[id]/reviewers/sync-github/route.ts` - Creates/updates users and links to reviewers
- `src/app/api/organizations/[id]/reviewers/sync-slack/route.ts` - Updates users table with Slack info

### Frontend Updates
- `src/app/(main)/rules-builder/columns.tsx` - Display reviewer name from user
- `src/app/(main)/rules-builder/create-rule-dialog.tsx` - Display reviewer name from user
- `src/app/(main)/rules-builder/edit-rule-dialog.tsx` - Display reviewer name from user

### Type Updates
- `src/lib/schema/reviewer.ts` - Updated interfaces, `user_id` now required
- `src/types/supabase.ts` - Removed dropped columns, `user_id` NOT NULL

---

## Migrations

### Migration 1: `20251208132342_optimize_schema.sql`
Initial optimization - removes duplicate columns (github_username, slack_user_id, email) and adds indexes.

### Migration 2: `20251209000001_consolidate_reviewer_name.sql`
Consolidates name field - makes `user_id` NOT NULL and drops `name` column.

```sql
-- Ensure all reviewers have linked users
-- Make user_id NOT NULL
ALTER TABLE reviewers ALTER COLUMN user_id SET NOT NULL;

-- Drop the name column (now redundant with users.full_name)
ALTER TABLE reviewers DROP COLUMN name;
```

---

## API Response Structure

All reviewer data comes from the linked `user` object. Every reviewer must have a linked user.

```json
{
  "reviewer": {
    "id": "...",
    "organization_id": "...",
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

**Notes:**
- The `name` field has been removed from reviewers - use `user.full_name` for display
- The `user_id` is now required (NOT NULL)
- Creating a reviewer requires a valid `user_id`

---

## Future Considerations

### Array Columns (Deferred)
The following array columns could be converted to junction tables for better FK enforcement:
- `routing_rules.reviewer_ids` → `routing_rule_reviewers` junction table
- `escalations.notified_user_ids` → `escalation_notifications` junction table

This was deferred as it requires more significant refactoring and the current implementation works correctly.
