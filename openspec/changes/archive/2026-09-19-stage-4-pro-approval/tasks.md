## 1. Store layer

- [x] 1.1 Update `adminReject(id, reason)` to persist `rejection_reason` and include reason in notification message; verify DB column after reject
- [x] 1.2 Add `notifyAdminsOfPendingPro(pro)` to insert notifications for all admin profiles on new registration; call from `registerPro()` success path
- [x] 1.3 Update `resubmitPro()` to accept and persist `achievements`; verify resubmit clears `rejection_reason` and sets `pending`

## 2. Admin UI

- [x] 2.1 Add rejection-reason prompt/modal on Reject in admin Professionals section; verify reason saved
- [x] 2.2 Expand pending applications table: photo, phone, achievements, bio, submitted date; verify all fields render
- [x] 2.3 Verify Approve still sets `approved_at` and refreshes KPI/pending lists

## 3. Professional dashboard

- [x] 3.1 Gate pending pros: show waiting message, hide approved-only actions; verify pending user cannot browse as pro
- [x] 3.2 Rejected state: display `rejectionReason`, show resubmit form with achievements field; verify resubmit flow
- [x] 3.3 Approved state: allow transition to discovery features (Stage 5); verify no regression

## 4. Verification

- [x] 4.1 E2E: register pro → admin notification → approve → pro approved notification → pro sees approved dashboard
- [x] 4.2 E2E: register pro → reject with reason → pro sees reason → resubmit → pending again
- [x] 4.3 Run `openspec validate stage-4-pro-approval --strict`
