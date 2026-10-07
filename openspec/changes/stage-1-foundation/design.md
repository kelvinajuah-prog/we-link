## Context

WE-LINK uses vanilla HTML/JS with Supabase (`js/store.js`, `js/supabase-client.js`). The remote database already has `profiles`, `guest_profiles`, `professional_profiles`, `connections`, `messages`, `notifications`, and `whatsapp_requests`, but `professional_profiles` still includes payment columns and a multi-step status machine. The frontend mirrors this with MoMo flows in `dashboard.html`, `admin.html`, and `store.js`. See `proposal.md` for why Stage 1 must land before Stages 2–8.

Current `professional_profiles` payment columns (to remove): `terms_accepted`, `months`, `amount`, `charge`, `total`, `payment_screenshot_url`, `screenshot_submitted_at`, `subscription_valid_until`, `admin_paid_confirm`.

Current pro statuses in code (to replace): `pending`, `accepted`, `rejected`, `awaiting_payment`, `screenshot_submitted`, `active`, `expired`.

## Goals / Non-Goals

**Goals:**
- Apply one Supabase migration that cleans schema and adds foundation columns
- Map legacy statuses to the new enum without data loss for real users
- Remove all payment UI and store logic from the frontend
- Leave auth, connections, messages, and WhatsApp tables intact for Stage 2+
- Verify app loads and basic dashboards work for guest, pro (pending/approved/rejected), and admin

**Non-Goals:**
- `communication_requests`, `conversations`, Realtime publications (Stage 6–8)
- Full RLS rewrite (Stage 2)
- Guest town/area registration UI (Stage 3 — columns added now only)
- Achievements field on pro registration form (Stage 3)
- Auth fixes in Stage 2: signup RLS, no email verify, admin manual promotion in Supabase

## Decisions

### 1. Single migration file for schema changes

**Decision:** One migration `stage_1_foundation` via Supabase MCP/`apply_migration`.

**Rationale:** Atomic deploy; easier rollback documentation.

**Alternatives:** Multiple migrations — rejected for Stage 1 simplicity.

### 2. Status migration mapping

**Decision:**

| Old status | New status |
|------------|------------|
| `pending` | `pending` |
| `accepted`, `awaiting_payment`, `screenshot_submitted` | `pending` |
| `active`, `expired` | `approved` |
| `rejected` | `rejected` |

Set `approved_at = now()` when migrating to `approved`.

**Rationale:** Payment-intermediate states have no meaning without payments; previously "active" pros stay approved.

### 3. Drop payment columns after data migration

**Decision:** Run UPDATE for status mapping first, then `ALTER TABLE ... DROP COLUMN` for all payment fields.

**Rationale:** Avoids CHECK constraint violations during transition.

### 4. Add columns with defaults, no app UI yet

**Decision:** Add `town`, `area`, `achievements`, `rejection_reason`, `approved_at`, `account_status` as nullable or with safe defaults; do not require UI in Stage 1.

**Rationale:** Unblocks Stage 3 without scope creep.

### 5. Frontend store simplification

**Decision:** Remove from `js/store.js`:
- Constants: `MOMO`, `MOMO_DISPLAY`, `MONTHLY_FEE`, `CHARGE_RATE`
- Functions: `quote`, `subscriptionInfo`, `submitPaymentScreenshot`, `sendSubscriptionWarning`, `adminConfirmPay`, `acceptTerms` (payment-linked)
- Map pro fields: drop payment-related keys from `mapPro()`

Replace pro onboarding branches in `dashboard.html` with: `pending`, `approved`, `rejected` only.

**Alternatives:** Keep dead code behind flags — rejected; full removal reduces confusion.

### 6. Admin dashboard tab structure

**Decision:** Remove `payments` tab and receipt modal entirely; keep pending pros, members, WhatsApp, messages tabs unchanged for Stage 1.

### 7. Legacy `we-link` table

**Decision:** `DROP TABLE IF EXISTS "we-link"` after confirming zero rows.

**Rationale:** Unused stub from early experiment.

## Risks / Trade-offs

- **[Risk] Existing test users in payment-intermediate states lose payment progress** → Acceptable; product removes payments entirely
- **[Risk] Frontend references removed store exports** → Mitigation: grep for `MONTHLY`, `MOMO`, `submitPayment`, `acceptTerms`, `adminConfirmPay` after edit
- **[Risk] CHECK constraint on old status values blocks migration** → Mitigation: drop/recreate status check in same migration
- **[Trade-off] Foundation columns added but unused in UI** → Stage 3 will wire them; avoids double migration

## Migration Plan

1. Backup Supabase project (dashboard snapshot) before migration
2. Apply SQL migration (status map → drop columns → add columns → drop we-link)
3. Deploy frontend changes (store, dashboard, admin, register copy)
4. Smoke test: guest login, pro pending login, admin login, professionals.html
5. Rollback: restore DB snapshot; revert frontend git commit — no automatic down migration

## Open Questions

- None blocking Stage 1. Achievements/town UI deferred to Stage 3 per non-goals.
