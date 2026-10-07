## 1. Database migration and cleanup

- [ ] 1.1 Create Supabase migration: add `communication_requests`, `conversations`, `admin_activity`; add `town`, `area`, `achievements`, `rejection_reason`, `account_status`; verify tables exist via Supabase dashboard
- [ ] 1.2 Create migration: remove payment columns from `professional_profiles` (`months`, `amount`, `charge`, `total`, `payment_screenshot_url`, `subscription_valid_until`, `terms_accepted`, `admin_paid_confirm`); verify columns dropped
- [ ] 1.3 Migrate `messages.connection_id` to `conversation_id` and deprecate `connections` table; verify FK integrity
- [ ] 1.4 Enable Realtime publication on `messages`, `communication_requests`, `notifications`; verify in Supabase Realtime settings
- [x] 1.5 Add sign-up RLS INSERT policies on `profiles`, `guest_profiles`, and `professional_profiles` (`id` / `profile_id = auth.uid()`); verify guest and professional registration succeed without RLS errors
- [ ] 1.6 Rewrite remaining RLS policies for all tables per design.md three-role model; verify with Supabase security advisor (zero critical issues)

## 2. Remove payment system

- [ ] 2.1 Remove MoMo, subscription, payment modal, and receipt UI from `dashboard.html`, `admin.html`, `js/store.js`; verify no payment strings remain via repo search
- [ ] 2.2 Remove payment-related constants and functions from `js/store.js` and `js/helpers.js`; verify app loads without payment references
- [ ] 2.3 Update professional onboarding to `pending → approved/rejected` only; verify rejected and approved flows in dashboard

## 3. Auth and profiles

- [ ] 3.1 Update guest registration for town/area fields and Supabase profile insert; verify guest profile saved in database
- [ ] 3.2 Update professional registration for achievements and WhatsApp; verify pending status on insert
- [x] 3.3 Admin registration: name/email/password only; create profile with role `guest` (not `admin`); show manual-approval message; verify login-admin works only after owner sets `profiles.role = admin` in Supabase
- [x] 3.4 Remove email-verification UI (`needsEmailConfirm` branches, "check your email" alerts) from all register pages and `js/store.js`; verify sign-up redirects immediately when Supabase confirm email is off
- [ ] 3.5 Enforce role guards on all pages via `js/ui.js`; verify guest cannot reach admin.html

## 4. Communication workflow (Option C)

- [ ] 4.1 Implement `requestCommunication`, `acceptCommunication`, `rejectCommunication`, `cancelCommunication` in store; verify status transitions in DB
- [ ] 4.2 Enforce 24h cooldown after rejection and immediate re-request after cancel; verify blocked/allowed cases manually
- [ ] 4.3 Replace "Start chat" with "Request Communication" on guest pro browse; verify pro cannot create requests
- [ ] 4.4 Add pro dashboard pending requests panel with Accept/Reject; verify guest notified on decision
- [ ] 4.5 Create conversation on accept and implement monitoring consent UI for both parties; verify consent flags in DB
- [ ] 4.6 Wire messaging to active conversations only; verify messages blocked without accepted request

## 5. Professional discovery

- [ ] 5.1 Build approved-pro directory with category/specialization filter for guests and pros; verify pending pros hidden
- [ ] 5.2 Pro browse view: read-only, no Request Communication button; verify pro-to-pro request API returns error

## 6. WhatsApp exchange

- [ ] 6.1 Ensure WhatsApp hidden until admin approval; verify guest sees request button not number pre-approval
- [ ] 6.2 Admin approve/reject WhatsApp in dashboard; verify both parties notified and link appears only after approve

## 7. Notifications

- [ ] 7.1 Implement notification inserts for all events in specs/notifications; verify each role receives correct notification type
- [ ] 7.2 Wire notification bell in header with read/unread state; verify mark-as-read works

## 8. Admin dashboard v2

- [ ] 8.1 Build overview stats section with live refresh; verify counts match database
- [ ] 8.2 Build pending applications section with approve/reject and rejection reason; verify pro status and notification update
- [ ] 8.3 Build member management with search/filter and delete/suspend; verify actions persist
- [ ] 8.4 Build communication oversight (requests + active connections, no admin approve on comm); verify read-only comm request list
- [ ] 8.5 Responsive layout for all admin sections; verify usable at 375px viewport width

## 9. Real-Time Conversations Room

- [ ] 9.1 Create `js/realtime-admin.js` with Supabase Realtime subscription on messages; verify new message appears without refresh
- [ ] 9.2 Build split-pane UI: conversation list + message viewer; verify switch between conversations works
- [ ] 9.3 Implement presence indicators in Live Connections section; verify online/offline updates
- [ ] 9.4 Enforce consent-gated admin message access in RLS and UI; verify non-consented threads hidden from admin room

## 10. Integration and polish

- [ ] 10.1 Update `index.html` and `professionals.html` for approved-only public listing; verify landing page shows live pros
- [ ] 10.2 End-to-end test: guest register → pro register → admin approve → guest request → pro accept → consent → chat → admin monitor; verify full flow
- [ ] 10.3 Run `openspec validate marketplace-platform-v2 --strict` and fix any issues; verify validation passes
