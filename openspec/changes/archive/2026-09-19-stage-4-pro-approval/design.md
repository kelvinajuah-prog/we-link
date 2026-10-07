## Context

Current implementation (observed):

| Piece | State |
|-------|--------|
| `adminAccept()` | Sets `approved`, `approved_at`, generic notification ✓ |
| `adminReject()` | Sets `rejected` only — **no `rejection_reason`** ✗ |
| Admin UI | Approve/Reject buttons, no reason prompt ✗ |
| `dashboard.html` | Shows rejection reason if present; resubmit form exists ✓ |
| `resubmitPro()` | Clears `rejection_reason`, sets `pending` ✓ — missing achievements field |
| Admin notify on register | `emailAdmin()` + WhatsApp only — no in-app admin notification ✗ |

Stage 3 adds achievements/photo to registration; Stage 4 surfaces them in admin review.

## Goals / Non-Goals

**Goals:**
- Rejection reason end-to-end (admin → DB → pro UI → notification)
- Admin in-app notification on new pro registration
- Cohesive pro pending/rejected/resubmit UX in dashboard
- Admin pending table shows full application detail

**Non-Goals:**
- Suspend/deactivate workflow (later)
- Bulk approve
- Communication or discovery features
- Rejection reason required (optional per spec)

## Decisions

### 1. Admin reject UX

**Decision:** On Reject click, show `prompt()` or inline modal for optional reason (MVP: `prompt` acceptable; preferred: small modal in admin-dashboard.js).

```js
async function adminReject(id, reason) {
  await client.from("professional_profiles").update({
    status: "rejected",
    rejection_reason: (reason || "").trim() || null
  }).eq("profile_id", id);
  const msg = reason
    ? `Your request was rejected. Reason: ${reason}. You may re-upload your information.`
    : "Your request was rejected. You may re-upload your information.";
  await notifyUser(id, msg);
}
```

### 2. Admin notification on registration

**Decision:** After successful `registerPro`, call `notifyAdminPendingPro(account)` inserting into `notifications` for each admin profile (`role = 'admin'`).

Fallback if no admin row: keep existing `emailAdmin` / WhatsApp.

### 3. Pro dashboard states

| Status | Dashboard behavior |
|--------|-------------------|
| pending | Status message only; hide pro directory / comm buttons |
| rejected | Reason + resubmit form (include achievements textarea) |
| approved | Full pro dashboard (Stage 5 discovery) |

Implement in `js/dashboard.js` — consolidate logic from inline `dashboard.html` scripts if duplicated.

### 4. Admin pending table columns

Extend admin Professionals section: avatar, name, skill, location, phone, bio snippet, achievements snippet, submitted date, Approve / Reject.

### 5. Resubmit achievements

Update `resubmitPro()` and resubmit form to include `achievements` field alongside bio.

## Risks / Trade-offs

- **[Risk] prompt() poor UX on mobile** → Prefer lightweight modal in admin-dashboard.js
- **[Trade-off] notify all admins vs single owner** → Notify all `profiles.role = admin` rows

## Migration Plan

1. Update `store.js` adminReject + notifyAdmin helper
2. Update admin-dashboard.js reject handler + table columns
3. Update dashboard pro pending/rejected/resubmit views
4. Manual E2E: register pro → admin notified → reject with reason → pro sees reason → resubmit → admin sees pending again

## Open Questions

- None blocking.
