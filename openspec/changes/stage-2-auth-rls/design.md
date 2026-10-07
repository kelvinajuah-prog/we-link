## Context

WE-LINK uses Supabase Auth + vanilla JS. Stage 1 migrated schema (no payments, foundation columns). Partial sign-up RLS exists in `welink_signup_rls` migration. Current policies (observed on remote):

| Table | Policies |
|-------|----------|
| profiles | insert_own, select_authenticated, public_active, update_own, delete_admin |
| guest_profiles | insert, select, update |
| professional_profiles | insert, select, update, public_active |
| connections | insert, select |
| messages | insert, select |
| notifications | insert, select, update |
| whatsapp_requests | insert, select, update |

Legacy policies may allow over-broad SELECT (e.g. authenticated users reading all profiles). Stage 2 replaces them with a coherent model aligned to `marketplace-platform-v2` auth decisions (already partially implemented in frontend).

## Goals / Non-Goals

**Goals:**
- Single migration `stage_2_auth_rls` replacing all public-table policies
- `is_admin()` helper function (SECURITY DEFINER or inline subquery)
- Frontend login role validation matches RLS
- Pending/rejected pro UI gates in dashboard
- Security advisor verification

**Non-Goals:**
- Communication requests table (later stage)
- Realtime publications
- Consent-gated admin message monitoring
- OAuth/social login
- Service role key in frontend

## Decisions

### 1. is_admin() helper

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;
```

Used in all admin-override policies.

### 2. Policy matrix (summary)

| Table | Guest | Professional (approved) | Professional (pending) | Admin |
|-------|-------|-------------------------|------------------------|-------|
| profiles | R/U own | R/U own | R/U own | R/U/D all |
| guest_profiles | R/U own | R own (participants) | — | R/U all |
| professional_profiles | R approved public | R/U own | R/U own | R/U all |
| connections | R/C own | R/C own | — | R all |
| messages | R/C own threads | R/C own threads | — | R all |
| notifications | R/U own | R/U own | R/U own | R/U all |
| whatsapp_requests | R/C own | R involved | — | R/U all |

**Public discovery:** Keep `pro_public_active` + `profiles_public_active` for approved pros only (anon + authenticated).

### 3. Login role checks (frontend)

**Decision:** After `signInWithPassword`, load profile and compare role to page intent:

| Page | Expected role |
|------|---------------|
| login.html / guest flow | `guest` |
| login-pro (if separate) | `professional` |
| login-admin.html | `admin` |

On mismatch: sign out immediately, show error. Implement in `store.js` `login()` or page handlers.

### 4. Pending professional gate

**Decision:** `dashboard.js` checks `professional_profiles.status` before rendering browse/message UI. Pending shows status message + resubmit link (existing). RLS denies connection/message insert for pending pros.

### 5. Migration strategy

1. DROP all existing policies on scoped tables (by name from pg_policies)
2. CREATE `is_admin()` if not exists
3. CREATE policies in dependency order: profiles → guest/pro → connections → messages → notifications → whatsapp
4. Apply via Supabase MCP + local file `supabase/migrations/20260919180000_stage_2_auth_rls.sql`

### 6. Verification plan

1. Register test guest, pro, admin-promoted user
2. JWT test: guest cannot SELECT unrelated messages
3. Pending pro cannot INSERT connection
4. Admin can SELECT all profiles, approve pro
5. Run `get_advisors` — zero critical on RLS

## Risks / Trade-offs

- **[Risk] Policy too restrictive breaks dashboard** → Mitigation: test all three roles after migration; keep signup INSERT policies unchanged
- **[Risk] is_admin() recursion** → Use SECURITY DEFINER with fixed search_path
- **[Trade-off] Authenticated users cannot list all guests** → Admin-only; guests browse pros not guests

## Migration Plan

1. Write and review SQL migration locally
2. Apply to Supabase remote via MCP
3. Update `store.js` login role checks if gaps found
4. Smoke test registration + login for all roles
5. Document manual admin promotion steps in README or design (no code)

## Open Questions

- None blocking — admin promotion remains manual in Supabase dashboard per product decision.
