## Why

Professional onboarding is only half-built: admins can approve/reject from the dashboard, but **rejection reasons are not captured**, pro notifications are generic, and the professional pending/rejected/resubmit experience is split across `dashboard.html` inline scripts without a cohesive workflow. Stage 4 completes the approval lifecycle so admins can make informed decisions and professionals get clear feedback before discovery (Stage 5) and communication (Stage 6+) begin.

## What Changes

- **Admin reject with reason**: Prompt for optional rejection reason; persist to `professional_profiles.rejection_reason`; include reason in pro notification.
- **Admin approve polish**: Set `approved_at` (exists), send approval notification, refresh admin KPIs and pending lists (already partial in polished admin).
- **Admin notification on new registration**: Insert admin-targeted notification when a professional registers (in addition to existing email/WhatsApp alerts).
- **Professional pending dashboard**: Clear pending state with status copy; block browse/comm until approved.
- **Professional rejected dashboard**: Show rejection reason; resubmit form includes achievements and updated fields; clears reason on resubmit.
- **Admin pending applications UI**: Show full application detail (photo, phone, achievements, bio, skill, location) with Approve / Reject-with-reason actions.

## Capabilities

### New Capabilities

- `pro-approval-workflow`: End-to-end admin approve/reject with reason, pro notifications, pending/rejected/resubmit states, and admin alerts on new applications.

### Modified Capabilities

- _(none — no archived main specs yet)_

## Impact

- **Frontend**: `js/store.js` (`adminReject`, `adminAccept`, `resubmitPro`), `js/admin-dashboard.js` (reject modal, application detail), `dashboard.html` / `js/dashboard.js` (pro status views).
- **Database**: No schema changes — uses Stage 1 `rejection_reason` and `approved_at` columns.
- **Dependencies**: Stage 2 RLS (admin update on `professional_profiles`); Stage 3 profile fields (achievements, photo) visible in admin review.
- **Out of scope**: Communication requests, suspend/deactivate admin tools, bulk approve, email template redesign.
