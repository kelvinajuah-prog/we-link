## 1. Realtime module expansion

- [x] 1.1 Refactor `js/realtime.js` to a channel registry (named keys, idempotent subscribe/unsubscribe); verify duplicate subscribe calls replace rather than stack channels
- [x] 1.2 Add `subscribeAdminFeeds` handlers for message INSERT, conversation UPDATE, communication_requests INSERT/UPDATE; verify events logged in devtools WS when admin dashboard open
- [x] 1.3 Add `getConnectionStatus` / `onConnectionStatusChange` and extend `disposeAll()` to tear down admin feed + participant channels; verify zero active channels after admin logout

## 2. Database publication

- [x] 2.1 Create optional migration `stage_8_admin_realtime.sql` adding `notifications` to `supabase_realtime` publication if not already present; verify `\dRp+` or MCP lists table
- [x] 2.2 Apply migration to remote Supabase; run security advisor and confirm no critical Realtime/RLS regressions

## 3. Live conversation list and widget

- [x] 3.1 On admin message INSERT for monitorable conversations, patch Real-Time list row preview + timestamp without re-selecting thread; verify with message sent to non-selected conversation
- [x] 3.2 On same INSERT, patch home Live Connections widget snippet + time; verify widget updates while admin stays on dashboard home
- [x] 3.3 On conversation UPDATE when dual consent becomes true, insert row into Real-Time list and Live Connections; verify conversation appears without page reload after second consent

## 4. Admin Communication and notifications feeds

- [x] 4.1 Wire Communication section + home comm summary to live `communication_requests` INSERT/UPDATE; verify new guest request row appears without refresh
- [x] 4.2 Wire admin bell dropdown and Notifications section to notification INSERT filtered by admin `owner_id`; verify unread count increments live

## 5. Real-Time room UX

- [x] 5.1 Add search/filter input above Real-Time conversation list (guest name, pro name, specialization); verify non-matching rows hidden and clear restores full list
- [x] 5.2 Add connection status badge in Real-Time header (connected / reconnecting / error); verify badge changes when WS disconnect simulated

## 6. Participant live chat

- [x] 6.1 Subscribe guest dashboard chat room to active `conversation_id` on open; verify incoming pro message appends without reload
- [x] 6.2 Subscribe pro dashboard chat room similarly; verify incoming guest message appends; unsubscribe on navigate away

## 7. Verification

- [x] 7.1 E2E: dual-consented conversation → admin on Real-Time → message in thread B while A selected → list preview for B updates
- [x] 7.2 E2E: guest submits comm request → admin Communication table updates live
- [x] 7.3 E2E: guest chat open → pro sends → message appears live for guest
- [x] 7.4 Run `openspec validate stage-8-admin-realtime --strict` and confirm pass
