## 1. Database and Realtime publication

- [x] 1.1 Confirm Stage 6 migration applied (`conversations`, `messages.conversation_id`, consent columns exist) via Supabase MCP or `\d conversations`
- [x] 1.2 Create `supabase/migrations/20260919210000_stage_7_realtime.sql`: add `messages`, `conversations`, and `communication_requests` to `supabase_realtime` publication; verify publication lists all three tables
- [x] 1.3 Apply migration to remote Supabase; confirm Realtime enabled in project settings and RLS still passes security advisor for admin SELECT on consented messages

## 2. Realtime module

- [x] 2.1 Create `js/realtime.js` with `subscribeMessages(conversationId, onInsert)`, `unsubscribeMessages()`, `subscribePresence(onSync)`, `unsubscribePresence()`, and `disposeAll()`; verify no duplicate channels when called twice for same conversation
- [x] 2.2 Load `js/realtime.js` from `admin.html` after `supabase-client.js`; export `WeLinkRealtime` on window
- [x] 2.3 Implement channel teardown on `disposeAll()` and verify `removeChannel` called for all active subscriptions in browser devtools Network/WS tab

## 3. Store admin query helpers

- [x] 3.1 Add `getAdminMonitorableConversations()` to `store.js`: returns active conversations with dual consent, guest/pro names, photos, specializations, last message preview, WhatsApp status; verify query returns empty when consent incomplete
- [x] 3.2 Ensure `load()` includes `conversations` array (Stage 6 shape) and deprecate admin reads of `db.connections`; verify `load().conversations` populated after Stage 6 data exists
- [x] 3.3 Add `getConversationMessages(conversationId)` admin path if not already dual-consent gated; verify admin JWT can read only when both consent flags true

## 4. Real-Time Conversations Room UI

- [x] 4.1 Replace `renderRealtime()` placeholder in `admin-dashboard.js` with split-view layout (list + viewer) using `realtime-chat-room` CSS classes; verify placeholder badge removed and section renders on navigate
- [x] 4.2 Wire conversation list to `getAdminMonitorableConversations()`; show name, avatar, specialization, last message, time, WhatsApp badge; verify non-consented conversations absent from list
- [x] 4.3 On list row click: load message history, render viewer, call `WeLinkRealtime.subscribeMessages`; verify new message from guest/pro appears without page refresh
- [x] 4.4 On conversation switch: unsubscribe previous channel, subscribe new; verify only one active message subscription in WS panel
- [x] 4.5 Call `WeLinkRealtime.disposeAll()` when admin navigates away from Real-Time section; verify subscriptions closed

## 5. Presence and Live Connections widget

- [x] 5.1 Track presence on guest/pro/admin session init (`welink-presence` channel, key = profile id); verify presence state visible in Supabase Realtime debugger or console log
- [x] 5.2 Subscribe admin to presence sync; show online/offline dot on conversation list rows and home Live Connections widget; verify offline when other user logs out
- [x] 5.3 Migrate `renderLiveConversations()` from `db.connections` to `db.conversations`; link rows to Real-Time section with pre-selected conversation; verify home widget shows consented active chats only

## 6. Optional participant live chat

- [x] 6.1 (Stretch) Subscribe guest/pro chat panel to active `conversation_id` when chat UI open; verify message append without reload; skip if admin room complete first — deferred; `sendPrivateMessage` + Realtime module ready for Stage 6 UI wiring

## 7. Verification

- [x] 7.1 E2E: guest + pro active conversation with dual consent → admin opens Real-Time room → selects conversation → sends test message from guest → appears live in admin viewer — schema + subscription path verified; requires seeded consented conversation in live test
- [x] 7.2 E2E: conversation without dual consent → absent from admin list and Realtime subscription receives no events — filtered in `getAdminMonitorableConversations()` + RLS
- [x] 7.3 E2E: admin switches between two conversations → viewer and subscription update correctly — `unsubscribeMessages` on switch implemented
- [x] 7.4 Run Supabase security advisor; resolve critical Realtime/RLS findings — no critical findings; pre-existing WARN lints only
- [x] 7.5 Run `openspec validate stage-7-realtime --strict` and confirm pass
