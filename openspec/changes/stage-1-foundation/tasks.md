## 1. Database migration

- [x] 1.1 Create Supabase migration `stage_1_foundation` with status mapping (`accepted`/`awaiting_payment`/`screenshot_submitted` → `pending`; `active`/`expired` → `approved` with `approved_at = now()`; `rejected`/`pending` unchanged) and verify mapping SQL runs without constraint errors
- [x] 1.2 In the same migration, drop payment columns from `professional_profiles` (`terms_accepted`, `months`, `amount`, `charge`, `total`, `payment_screenshot_url`, `screenshot_submitted_at`, `subscription_valid_until`, `admin_paid_confirm`) and verify they no longer appear in Supabase table editor
- [x] 1.3 Add foundation columns: `guest_profiles.town`, `guest_profiles.area`; `professional_profiles.achievements`, `professional_profiles.rejection_reason`, `professional_profiles.approved_at`; `profiles.account_status` (`active`/`suspended`/`deactivated`, default `active`); replace pro status CHECK to allow only `pending`, `approved`, `rejected`, `suspended`, `deactivated`; verify columns and constraint via `\d` or Supabase schema view
- [x] 1.4 Drop legacy `we-link` table if row count is zero and verify table no longer exists; confirm `profiles`, `guest_profiles`, `professional_profiles`, `connections`, `messages`, `notifications`, `whatsapp_requests` remain intact

## 2. Store layer cleanup

- [x] 2.1 Remove payment constants and functions from `js/store.js` (`MOMO`, `MOMO_DISPLAY`, `MONTHLY_FEE`, `CHARGE_RATE`, `quote`, `subscriptionInfo`, `submitPaymentScreenshot`, `sendSubscriptionWarning`, `adminConfirmPay`, payment-linked `acceptTerms`) and verify `grep -E "MOMO|MONTHLY|submitPayment|adminConfirmPay" js/store.js` returns no matches
- [x] 2.2 Update `mapPro()` and pro status helpers in `js/store.js` to use only `pending`/`approved`/`rejected`/`suspended`/`deactivated` and remove payment field mappings; verify no references to `awaiting_payment`, `screenshot_submitted`, or `active` remain in store
- [x] 2.3 Remove or update any payment-related exports in `js/helpers.js` and `js/dashboard.js` if present and verify imports in HTML pages do not reference removed symbols (browser console shows no ReferenceError on load)

## 3. Professional dashboard

- [x] 3.1 Remove payment modal, MoMo copy, receipt upload, and terms-to-pay flow from `dashboard.html` and verify HTML contains no `MoMo`, `payment`, or `screenshot` strings
- [x] 3.2 Simplify pro onboarding UI to three states only: `pending` (awaiting admin review), `approved` (full access), `rejected` (rejection message); verify each state renders when pro status is set in DB without payment prompts

## 4. Admin dashboard

- [x] 4.1 Remove "Pro receipts" tab, payment preview modal, and grant-payment-access actions from `admin.html` and verify admin tab list excludes payment-related labels
- [x] 4.2 Update admin JS handlers to remove calls to deleted store payment functions and verify pending-pro approve/reject still works for test pro account

## 5. Registration and marketing copy

- [x] 5.1 Update `register.html`, `register-pro.html`, and `index.html` to remove fee, MoMo, subscription, and payment-screenshot language; verify copy mentions admin review only for professionals
- [x] 5.2 Scan remaining HTML pages (`login-pro.html`, `login-guest.html`, `login-admin.html`) for payment references and remove any found; verify `grep -iE "momo|subscription|monthly fee|payment" *.html` returns no user-facing matches

## 6. Smoke test and verification

- [x] 6.1 Start app with `npx serve -l 3000` and sign in as guest, pending pro, and admin; verify each dashboard loads with zero console errors related to payment code
- [x] 6.2 Query `professional_profiles` via Supabase and confirm no payment columns exist and sample rows use only allowed status values
- [x] 6.3 Document Stage 1 schema baseline in migration file comments or a brief note in design.md if migration naming differs from plan; verify `openspec validate stage-1-foundation --strict` passes
