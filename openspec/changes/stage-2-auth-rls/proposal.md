## Why

Stage 1 removed payment schema and added foundation columns, but database access still relies on a mix of legacy and partial RLS policies. Sign-up INSERT policies were added (task 1.5), yet **full three-role enforcement** across `profiles`, `connections`, `messages`, `notifications`, and `whatsapp_requests` is incomplete. Without a coherent Auth/RLS layer, guests may over-read data, unapproved professionals may bypass restrictions, and admin operations may fail silently.

Stage 2 lands the security baseline before profile UX (Stage 3) and communication (later stages).

## What Changes

- **Complete RLS rewrite** for all WE-LINK tables using a consistent three-role model (`guest`, `professional`, `admin`) with `is_admin()` helper.
- **Harden application auth guards**: role-specific login pages reject wrong roles; `requireRole()` used on protected routes; pending/rejected pros blocked from pro-only actions.
- **Consolidate sign-up auth decisions** already implemented (no email verify, admin manual promotion) into tested, documented behavior — no new product decisions.
- **Security verification**: Supabase security advisor pass; manual JWT tests for guest, approved pro, pending pro, and admin.
- **Migration**: single `stage_2_auth_rls` SQL migration replacing conflicting policies.

## Capabilities

### New Capabilities

- `auth-and-roles`: Role assignment rules, separate sign-in/sign-up entry points, route guards, pending-pro restrictions, admin manual promotion flow.
- `database-rls`: Row-level security policies for all public tables enforcing least-privilege per role.

### Modified Capabilities

- _(none — no archived main specs yet; deltas live in this change until archive)_

## Impact

- **Database**: New migration `stage_2_auth_rls`; drop/replace policies on `profiles`, `guest_profiles`, `professional_profiles`, `connections`, `messages`, `notifications`, `whatsapp_requests`.
- **Frontend**: `js/store.js` (login role checks, guard helpers), `js/ui.js` (`requireRole`), login pages (`login.html`, `login-admin.html`, role-specific flows).
- **Supabase**: RLS only — no schema column changes.
- **Dependencies**: Requires Stage 1 foundation complete; blocks Stage 3 profile browse (needs safe public pro SELECT policies).
- **Out of scope**: Communication requests (Stage 4+), Realtime admin room, consent-gated monitoring, new auth providers.
