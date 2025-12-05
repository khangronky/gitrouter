# CRITICAL ISSUES

## 🔴 CRITICAL SECURITY ISSUES

### 1. OPEN REDIRECT VULNERABILITY
**File:** `src/proxy.ts:38-41`
**CWE:** CWE-601

```typescript
const returnUrl = searchParams.get('returnUrl') || '/dashboard';
const decodedReturnUrl = decodeURIComponent(returnUrl);
const protectedUrl = `${reqOrigin}${decodedReturnUrl}`;
const redirectResponse = NextResponse.redirect(protectedUrl);
```

**Issue:** User-controlled returnUrl allows redirect to attacker domains. Example: `?returnUrl=//attacker.com` redirects to attacker site.

**Fix:** Validate returnUrl is same-origin relative path only.

---

### 2. WEAK CRON JOB AUTHENTICATION
**File:** `src/app/api/cron/escalations/route.ts:18-23`
**CWE:** CWE-863

```typescript
const cronSecret = process.env.CRON_SECRET;

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// CRITICAL: If cronSecret not set, ANY request bypasses auth!
```

**Issue:** Authentication is conditional. If env var missing, endpoint is completely open.

**Fix:** Fail fast if CRON_SECRET not configured. Always validate the secret.

---

### 3. NO RATE LIMITING ON AUTH ENDPOINTS
**Files:** 
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/app/api/auth/verify/route.ts`

**Issue:** Unlimited authentication attempts enable brute force, enumeration, DoS attacks.

**Fix:** Implement rate limiting (5 attempts per 15 minutes).

---

### 4. UNSAFE CASCADE DELETE
**File:** `src/app/api/organizations/[id]/route.ts:129-164`
**CWE:** CWE-1384

```typescript
export async function DELETE(_request: Request, { params }: RouteParams) {
  // ... permission check ...
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id);
  // DELETED FOREVER - no soft delete, no confirmation, no recovery
}
```

**Issue:** Single DELETE request permanently erases entire organization:
- No soft delete or grace period
- No confirmation token required
- No audit trail logged
- Cascades to all related data

**Fix:** Implement soft delete with 30-day grace period, audit logging.

---

### 5. MISSING ENVIRONMENT VALIDATION AT STARTUP
**Pattern:** `src/lib/{supabase,github,slack,jira}/client.ts`

**Issue:** Required env vars only checked when functions called, not at startup. If feature not used immediately, app runs but crashes later at runtime.

**Fix:** Validate all required env vars at application startup.

---

## 🟡 HIGH PRIORITY ISSUES

### 6. OAUTH STATE VALIDATION MISSING CSRF PROTECTION
**Files:**
- `src/app/api/slack/oauth/callback/route.ts:42-57`
- `src/app/api/jira/oauth/callback/route.ts:60-69`

```typescript
let orgId: string | null = null;
if (stateBase64) {
  try {
    const state = JSON.parse(Buffer.from(stateBase64, 'base64').toString());
    orgId = state.org_id;
  } catch {
    console.error('Failed to decode state');
    // Silent failure - no error thrown
  }
}
```

**Issue:** No CSRF protection, silent failures, no state comparison, no org_id permission validation.

---

### 7. EXCESSIVE CONSOLE LOGGING
**Pattern:** 50+ instances throughout codebase

**Issue:** Logs may contain sensitive information, adds performance overhead, not structured for audit trail.

**Fix:** Use proper structured logging (Sentry/Winston), never log raw errors.

---

### 8. MISSING INPUT VALIDATION ON DYNAMIC PARAMETERS
**Files:**
- `src/app/api/organizations/[id]/route.ts`
- `src/app/api/organizations/[id]/members/route.ts`
- Multiple others with `[id]`, `[repoId]`

**Issue:** Route parameters like `id` not validated as UUIDs before use in queries.

**Fix:** Validate all route parameters with Zod schemas.

---

### 9. SELECT * QUERIES
**Files:**
- `src/app/api/organizations/[id]/route.ts:29, 43`
- `src/lib/routing/engine.ts:37`

**Issue:** Fetches unnecessary columns, performance hit, potential data exposure, schema change brittleness.

**Fix:** Always explicitly list needed columns.

---

### 10. MANUAL ROLLBACK WITHOUT TRANSACTION
**File:** `src/app/api/organizations/route.ts:138-140`

```typescript
if (memberError) {
  // Manual rollback - NOT atomic
  await supabase.from('organizations').delete().eq('id', org.id);
}
```

**Issue:** Race conditions, not atomic, inconsistent state.

**Fix:** Use database transactions or RPC functions.

---

### 11. OAUTH STATE VALIDATION - SILENT FAILURES
**Files:**
- `src/app/api/slack/oauth/callback/route.ts`
- `src/app/api/jira/oauth/callback/route.ts`

**Issue:** Malformed state is silently ignored instead of rejected. No CSRF nonce validation.

---

### 12. NO PERMISSION CHECK ON OWN PROFILE CHANGES
**File:** `src/app/api/organizations/[id]/members/route.ts`

**Issue:** Code blocks admins from changing OTHER admins, but users might be able to change their own role to owner.

---

## 📊 SUMMARY

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | Open Redirect | 🔴 CRITICAL | Security |
| 2 | Weak Cron Auth | 🔴 CRITICAL | Security |
| 3 | No Auth Rate Limit | 🔴 CRITICAL | Security |
| 4 | Unsafe Delete | 🔴 CRITICAL | Data Loss |
| 5 | Env Validation | 🔴 CRITICAL | Reliability |
| 6 | OAuth State | 🟡 HIGH | Security |
| 7 | Logging | 🟡 HIGH | Security/Perf |
| 8 | Input Validation | 🟡 HIGH | Security |
| 9 | SELECT * | 🟡 HIGH | Perf/Security |
| 10 | Rollback | 🟡 HIGH | Data Consistency |
| 11 | Silent Failures | 🟡 HIGH | Reliability |
| 12 | Permission Check | 🟡 HIGH | Security |

---

## 🚫 CANNOT DEPLOY WITHOUT FIXING

1. Open Redirect (phishing vector)
2. Weak Cron Auth (unauthorized access)
3. Auth Rate Limiting (brute force)
4. Unsafe Delete (data loss)
5. Environment Validation (reliability)

---

**Status:** 🔴 NOT PRODUCTION READY  
**Critical Issues:** 5  
**High Priority Issues:** 7  
**Total Issues:** 12  
**Estimated Fix Time:** 24 hours
