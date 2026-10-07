## Why

WE-LINK's Supabase schema and frontend still carry payment/subscription flows (MoMo, receipts, multi-step pro onboarding) from an earlier prototype. Stage 1 aligns the database and codebase with the marketplace product direction: no payments, simplified professional status, and schema fields needed by later stages—before auth, communication, and admin realtime work begins.

## What Changes

- **BREAKING**: Remove all payment, subscription, MoMo, and payment-screenshot columns from `professional_profiles` and related frontend code.
- **BREAKING**: Replace multi-step pro status (`accepted`, `awaiting_payment`, `screenshot_submitted`, `active`) with `pending | approved | rejected | suspended | deactivated`.
- Add foundation columns: `achievements`, `rejection_reason`, `approved_at` on professionals; `town`, `area` on guests; `account_status` on profiles.
- Drop unused legacy `we-link` table if empty.
- Remove payment UI from `dashboard.html`, `admin.html`, `js/store.js`, and related copy in register/login pages.
- Simplify professional dashboard onboarding to pending/approved/rejected states only (no payment steps).
- Document schema baseline for Stages 2–8 without implementing those features yet.

## Capabilities

### New Capabilities

- `database-foundation`: Supabase migration to remove payment schema, simplify pro status enum, add profile columns, drop legacy table, and establish indexes/constraints for upcoming stages.
- `payment-removal`: Remove all payment-related constants, functions, UI, and user-facing copy from the vanilla HTML/JS frontend.

### Modified Capabilities

- _(none — no archived main specs exist yet)_

## Impact

- **Database**: `professional_profiles`, `guest_profiles`, `profiles`; drop payment columns; migrate existing `active`/`screenshot_submitted` rows to `approved` or `pending` as appropriate.
- **Frontend**: `js/store.js`, `js/helpers.js`, `js/dashboard.js`, `dashboard.html`, `admin.html`, `register.html`, `register-pro.html`, `index.html`.
- **Out of scope for Stage 1**: communication_requests, Realtime admin room, RLS rewrite (Stage 2), new auth flows beyond cleanup, WhatsApp changes, notifications expansion.
