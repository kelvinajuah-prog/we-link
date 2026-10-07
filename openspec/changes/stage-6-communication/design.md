## Context

Product decision: only guests request communication; admin approves or rejects; professional is notified but cannot mutate status. Stage 6 schema and Stage 7 Realtime already exist. This change wires the store API and UI to that admin-gated room.

## Goals / Non-Goals

**Goals:**
- Guest-only request API with notifications to the professional and all admins
- Admin approve creates an active conversation; reject records cooldown
- Guest and professional chat in the dashboard room only after approval
- Admin Communication section lists live requests with Approve / Reject

**Non-Goals:**
- Pro-to-pro or guest-to-guest chat
- Email/SMS notifications
- Dropping the legacy `connections` table

## Decisions

### 1. Admin is the only approver

`communication_requests` UPDATE: admin may change any status; guest may set `cancelled` on their own pending row. Professionals have SELECT only.

`conversations` INSERT: admin only. Conversation is created when admin approves.

### 2. Store API

| Function | Role |
|----------|------|
| `requestGuestCommunication(guestId, proId)` | Guest only |
| `cancelCommunication(requestId, guestId)` | Guest only, pending only |
| `adminApproveCommunication(requestId)` | Admin only; creates conversation |
| `adminRejectCommunication(requestId)` | Admin only |
| `getCommRequest` / `canPrivateChat` / `getActiveConversation` | Lookups |
| `sendPrivateMessage` | Requires active conversation |

### 3. Notifications

- Request: pro + all admins
- Approve: guest + pro
- Reject: guest + pro
- Cancel: pro
- New message: recipient
