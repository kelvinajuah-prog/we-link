## 1. Database migration

- [x] 1.1 Create `supabase/migrations/20260919180000_stage_2_auth_rls.sql` with `is_admin()` helper; verify function exists after apply
- [x] 1.2 Drop and replace all RLS policies on `profiles`, `guest_profiles`, `professional_profiles` per design matrix; verify signup INSERT still works
- [x] 1.3 Add/replace RLS policies on `connections`, `messages`, `notifications`, `whatsapp_requests`; verify participant isolation
- [x] 1.4 Apply migration to remote Supabase via MCP; verify policies match local file

## 2. Application auth guards

- [x] 2.1 Harden `store.js` login: reject role mismatch per login page (guest vs pro vs admin); verify wrong-role sign-in fails
- [x] 2.2 Verify `WeLinkUI.requireRole()` on `admin.html`, `dashboard.html`; verify redirects work
- [x] 2.3 Gate professional dashboard: pending/rejected/suspended pros see limited UI, cannot browse/message; verify approved pro has full access
- [x] 2.4 Handle `account_status` suspended/deactivated on login with clear error message

## 3. Verification

- [x] 3.1 End-to-end test: register guest, pro, admin (promote manually); login each role; verify expected access
- [x] 3.2 Run Supabase `get_advisors` security check; resolve any critical RLS findings
- [x] 3.3 Run `openspec validate stage-2-auth-rls --strict`
