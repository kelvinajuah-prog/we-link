## Why

Stages 1–5 established foundation, auth, profiles, pro approval, and discovery — but guests could still start chat immediately. Communication must be requested by guests only, then reviewed by admin. Professionals and admins are notified; the room opens only after admin approval.

## What Changes

- **Database**: `communication_requests` + `conversations`; `messages.conversation_id`; RLS so only guests insert requests and only admin accepts/rejects (guests may cancel pending).
- **Guest request**: "Request Communication" on discovery (guest → approved pro only). Professionals cannot request.
- **Notifications**: Professional and admin are notified on each new request; guest and professional are notified on approve/reject.
- **Admin decision**: Admin Communication section lists requests with Approve / Reject. Approval creates an active conversation.
- **Room messaging**: Guest and professional chat in the platform room only after admin approval.
- **Guest cancel + cooldown**: Guest may cancel pending requests; 24h cooldown after admin rejection.
- **Monitoring consent**: Both parties can acknowledge admin monitoring so Stage 7 Realtime visibility still works.

## Capabilities

### New Capabilities

- `guest-communication`: Guest-to-professional communication requests, admin approve/reject, guest cancel, rejection cooldown, conversations, consent-gated admin message visibility, and in-app notifications.

### Modified Capabilities

- _(none — no archived main specs yet; deltas live in this change until archive)_

## Impact

- **Database**: Stage 6 schema + admin-only request UPDATE / conversation INSERT policies.
- **Frontend**: `js/store.js` communication API, `dashboard.html` request + chat room, `js/admin-dashboard.js` approve/reject, `js/discovery.js` CTAs.
- **Dependencies**: Stage 2 RLS, Stage 4 approved pros, Stage 5 discovery.
- **Out of scope**: WhatsApp rule overhaul, email/SMS push, pro-to-pro communication, payment flows.
