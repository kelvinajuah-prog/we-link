## Context

WE-LINK is a vanilla HTML/JS static frontend with Supabase (`@supabase/supabase-js` via CDN). Partial integration exists: `profiles`, `guest_profiles`, `professional_profiles`, `connections`, `messages`, `notifications`, `whatsapp_requests`. Payment/subscription flows and immediate guest chat remain and must be removed. See `proposal.md` for motivation and locked product decisions (Option C comm gate, 24h reject cooldown, guest cancel, dual monitoring consent, no payments).

## Goals / Non-Goals

**Goals:**
- Single Supabase backend for auth, profiles, communication, notifications, Realtime
- RLS-enforced three-role model
- Pro-gated communication with admin monitoring (not admin chat approval)
- Admin Real-Time Conversations Room with Realtime + consent-gated access
- Remove all payment-related code and schema

**Non-Goals:**
- Payment, subscription, MoMo, or receipt upload
- Pro-to-pro communication requests
- Native mobile apps (responsive web only)
- Email/SMS push notifications (in-app notifications only for v2)
- Email verification on sign-up (Supabase "Confirm email" disabled; free-tier project)

## Decisions

### 1. Schema: replace connections with communication_requests + conversations

**Decision:** Introduce `communication_requests` and `conversations`; deprecate direct `connections` creation on "Start chat".

**Rationale:** Option C requires explicit pro accept/reject and cooldown tracking on `rejected_at`.

**Alternatives:** Keep `connections` and add status — rejected; chosen separation keeps request lifecycle distinct from active chat.

Key tables:
- `profiles` — add `account_status` (active/suspended/deactivated)
- `guest_profiles` — add `town`, `area`; keep `specialization`
- `professional_profiles` — remove payment columns; add `achievements`, `rejection_reason`, `approved_at`; status enum: `pending|approved|rejected|suspended`
- `communication_requests` — `guest_id`, `pro_id`, `status`, `rejected_at`, `responded_at`
- `conversations` — `communication_request_id`, `guest_id`, `pro_id`, `monitoring_consent_guest`, `monitoring_consent_pro`, `status`
- `messages` — FK to `conversation_id` (migrate from `connection_id`)
- `whatsapp_requests` — unchanged conceptually
- `notifications` — add `type`, optional JSON `payload`
- `admin_activity` — audit log for admin actions

### 2. Communication gate: professional only (Option C)

**Decision:** Pro accepts/rejects; admin notified but does not gate chat.

**Cooldown:** 24h after `rejected`; no cooldown after `cancelled`.

### 3. Monitoring consent

**Decision:** Boolean flags on `conversations`. Admin RLS policy: `SELECT` messages only when both consents true. UI shows consent modal after pro accepts.

### 4. Realtime

**Decision:** Enable Supabase Realtime publication on `messages`, `communication_requests`, `notifications`. Admin room subscribes to `postgres_changes` filtered by RLS. Presence via Supabase Realtime Presence channel `online:{user_id}`.

**Tables to add to `supabase_realtime` publication:** `messages`, `communication_requests`, `notifications`.

### 5. Frontend architecture

**Decision:** Keep vanilla HTML/JS; refactor `js/store.js` into modules or sections: auth, profiles, communication, admin, realtime. No framework migration in v2.

**Alternatives:** Next.js — deferred; current stack works with added Realtime client code.

### 6. Admin signup (manual promotion)

**Decision:** Admin registration page collects name, email, password only. On submit, create auth user + `profiles` row with role `guest` (not `admin`). Platform owner manually sets `profiles.role = 'admin'` in the Supabase dashboard when ready to grant access.

**Rationale:** Owner controls who becomes admin without invite codes or automatic elevation.

**UI:** After admin sign-up, show message that admin access requires manual approval; redirect to admin login (login fails until role is promoted).

**Alternatives:** Automatic admin role on sign-up — rejected per product decision.

### 7. No email verification

**Decision:** Rely on Supabase Auth with "Confirm email" toggled off in project settings. Remove `needsEmailConfirm` branching and "check your email" alerts from all register pages and `store.js`.

**Rationale:** Free-tier Supabase project; email confirm adds friction and can block profile inserts when disabled inconsistently.

### 8. Sign-up RLS policies

**Decision:** Add INSERT policies so newly authenticated users can create their own rows during registration:

- `profiles`: `INSERT` where `id = auth.uid()`
- `guest_profiles`: `INSERT` where `profile_id = auth.uid()`
- `professional_profiles`: `INSERT` where `profile_id = auth.uid()`

Also ensure `SELECT` and `UPDATE` on own profile rows for post-login flows. Existing deny-all or admin-only policies on these tables are the root cause of current sign-up failures.

**Verification:** Register guest and professional test accounts end-to-end after migration `welink_signup_rls`.

### 9. Professional status simplification

**Decision:** Remove `accepted`, `awaiting_payment`, `screenshot_submitted`, `active` payment states. Use `pending → approved | rejected`.

## Risks / Trade-offs

- **[Risk] Vanilla JS Realtime UI complexity** → Mitigation: isolate Realtime in `js/realtime-admin.js`; use single subscription manager
- **[Risk] RLS misconfiguration exposes messages** → Mitigation: security advisor pass; test with three role JWTs
- **[Risk] Sign-up blocked by RLS** → Mitigation: dedicated INSERT policies on `profiles`, `guest_profiles`, `professional_profiles` (see §8)
- **[Risk] Migration breaks existing data** → Mitigation: greenfield acceptable; drop payment columns via migration
- **[Trade-off] No admin comm approval** → Faster UX; admin relies on monitoring + consent instead of pre-approval

## Migration Plan

1. Apply Supabase migrations (add tables/columns, drop payment columns, enable Realtime)
2. Deploy updated RLS policies
3. Remove payment UI from frontend
4. Ship new communication workflow
5. Ship admin Realtime room last (depends on consent + messages migration)
6. Rollback: revert frontend; DB migrations are forward-only (backup before migrate)

## Open Questions

- Search/filter implementation: client-side vs Postgres full-text (defer to Phase 2 admin; client-side sufficient for MVP)
- Automated admin promotion workflow (manual Supabase dashboard edit for v2)
