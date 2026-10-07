## Why

Stage 7 delivered the admin Real-Time Conversations Room with live message append for the **selected** conversation, presence dots, and consent-gated monitoring. Admins still rely on **manual refresh or section navigation** for everything else: conversation list previews do not update when messages arrive in non-selected threads, newly consented conversations do not appear until reload, the Communication request queue and notification bell are poll-only, and guest/pro chat panels still reload on send. Stage 8 completes the admin realtime experience and wires participant-side live chat deferred from Stage 7.

## What Changes

- **Live conversation list sync**: Real-Time list and home Live Connections widget update last-message preview and timestamps when any monitorable conversation receives a message, without re-selecting the thread.
- **Consent eligibility realtime**: When both parties grant monitoring consent, the conversation appears in the admin monitorable list without full page reload.
- **Admin communication queue realtime**: Communication section and home summary table receive new `communication_requests` events (pending guest requests) live.
- **Admin notification realtime**: Topbar bell and Notifications section append new rows when admin-targeted notifications are inserted.
- **Connection health UI**: Real-Time section shows Realtime channel status (connected / reconnecting / error) with graceful recovery.
- **Room search/filter**: Admin can filter the Real-Time conversation list by guest name, pro name, or specialization.
- **Participant live chat**: Guest and professional dashboard chat rooms subscribe to their active conversation for live append (Stage 7 stretch, now required).
- **Extended `js/realtime.js`**: Multi-channel manager for admin dashboard feeds (messages broad listener, conversations UPDATE, communication_requests INSERT, notifications INSERT) with scoped cleanup per admin section.

## Capabilities

### New Capabilities

- `admin-realtime-monitoring`: Extends Stage 7 with live list/widget sync, consent eligibility updates, admin feed subscriptions, connection health, and room search.

### Modified Capabilities

- _(none — `admin-realtime-monitoring` not yet archived to main specs; delta continues in this change)_

## Impact

- **Database**: No schema change required if Stage 7 publication already includes `messages`, `conversations`, `communication_requests`; optionally add `notifications` to `supabase_realtime` publication for admin bell.
- **Frontend**: `js/realtime.js` (channel manager expansion), `js/admin-dashboard.js` (live list/widget/comm/notifications handlers, search UI, status badge), `dashboard.html` (participant subscriptions), `js/store.js` (minimal helpers if needed for dedupe/cache invalidation).
- **Dependencies**: Stage 6 communication + admin approval flow, Stage 7 Realtime publication and Real-Time room baseline.
- **Out of scope**: Typing indicators, read receipts, admin sending messages in monitored chats, email/SMS push, message edit/delete, Realtime on public marketing pages.
