## Why

Stages 1–6 established foundation, auth, profiles, pro approval, discovery, and consent-gated guest–pro communication. Admin oversight today is **poll-based**: `admin-dashboard.js` loads conversations from `WeLink.load()` and shows a **placeholder** in the Real-Time Conversations section (`renderRealtime()` — "Coming in marketplace v2"). Admins cannot see new messages without refreshing, and the dashboard home "Live conversations" widget still reads legacy `connections` data instead of Stage 6 `conversations`. Stage 7 delivers the deferred **Supabase Realtime** layer so admins monitor active, dual-consented chats live.

## What Changes

- **Enable Supabase Realtime** on `messages`, `conversations`, and `communication_requests` (publication + RLS-compatible filters).
- **Real-Time Conversations Room**: Replace placeholder with split-view UI — conversation list (guest/pro metadata, last message, WhatsApp status) + selected conversation message viewer with live append.
- **Live subscriptions**: Admin client subscribes to `INSERT` on `messages` for the selected `conversation_id`; unsubscribes/resubscribes on conversation switch; cleans up on section leave.
- **Presence / Live Connections**: Track online status for conversation participants (Supabase Realtime Presence channel keyed by profile id); show online/offline in conversation list and dashboard home widget.
- **Consent enforcement**: Realtime events and admin SELECT remain gated on `monitoring_consent_guest` AND `monitoring_consent_pro`; non-consented conversations excluded from list and subscriptions.
- **Upgrade dashboard widgets**: Migrate `renderLiveConversations()` from `db.connections` to Stage 6 `conversations`; link home widget rows to Real-Time room.
- **Guest/pro chat refresh (optional)**: Subscribe participants to their own active conversation for live message append without full page reload (same channel pattern, scoped to participant RLS).
- **BREAKING**: Admin Real-Time room requires Stage 6 schema (`conversations`, `messages.conversation_id`); deploy Stage 6 migration before Stage 7.

## Capabilities

### New Capabilities

- `admin-realtime-monitoring`: Real-Time Conversations Room layout, live message subscriptions, presence indicators, consent-gated admin monitoring, and conversation switching for administrators.

### Modified Capabilities

- _(none — no archived main specs yet; delta lives in this change until archive)_

## Impact

- **Database**: Migration `stage_7_realtime` — enable Realtime publication on relevant tables; optional `conversation_presence` view or rely on Realtime Presence only (no new tables required).
- **Frontend**: New `js/realtime.js` (or module in `admin-dashboard.js`), `js/admin-dashboard.js` (`renderRealtime`, `renderLiveConversations`), `js/store.js` (conversation query helpers for admin list metadata); guest/pro dashboard chat panels may add lightweight subscription hooks.
- **Supabase**: Realtime enabled on project; RLS policies verified for Realtime `postgres_changes` with admin + consent filter.
- **Dependencies**: Stage 2 RLS (`is_admin()`), Stage 6 communication schema, dual monitoring consent flags, `polishing` editorial styling for realtime room (`realtime-chat-room` token).
- **Out of scope**: WhatsApp exchange workflow changes, email/SMS push, pro-to-pro communication, full public-site Realtime, typing indicators, message editing/deletion, admin ability to send messages in monitored chats.
