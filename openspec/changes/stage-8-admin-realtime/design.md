## Context

See `proposal.md` — Why. Stage 7 baseline (observed in codebase):

| Component | Stage 7 behavior | Stage 8 gap |
|-----------|------------------|-------------|
| `js/realtime.js` | Single `messageChannel` + `presenceChannel`; `disposeAll()` only drops messages | No admin feed channels; no reconnect/status |
| `admin-dashboard.js` → `renderRealtime()` | Live append for **selected** thread only | List preview static until re-render |
| `renderLiveConversations()` | Poll via `renderAll()` / `WeLink.onChange` | Snippets stale between polls |
| `renderCommunication()` | Static table from `load()` | No live pending rows |
| Admin bell / notifications | Poll via `load()` | No Realtime INSERT |
| `dashboard.html` chat | Sends then full re-render | No participant subscription |
| Realtime publication | `messages`, `conversations`, `communication_requests` | `notifications` not published |

Stage 6 admin approval + dual consent remain the gate for monitorable conversations.

## Goals / Non-Goals

**Goals:**
- Extend `WeLinkRealtime` into a small channel registry with named feeds and idempotent subscribe/unsubscribe
- Live-update list previews, Live Connections widget, Communication queue, and admin notifications
- React to `conversations` UPDATE when consent flags flip to eligible
- Add Real-Time room search (client-side filter over loaded monitorable set)
- Wire guest/pro chat panels to participant message subscription when open
- Surface Realtime connection status in admin Real-Time section

**Non-Goals:**
- Typing indicators, read receipts, message edit/delete
- Admin sending messages in monitored chats
- Realtime on public/marketing pages
- Replacing all `WeLink.onChange` polling globally (only admin realtime surfaces)
- Server-side full-text search for conversations

## Decisions

### 1. Channel registry in `js/realtime.js`

Refactor to track channels by key:

```js
WeLinkRealtime = {
  // existing
  subscribeMessages(conversationId, onInsert),
  unsubscribeMessages(),
  trackPresence(...),
  subscribePresence(onSync),
  // new
  subscribeAdminFeeds({ onMessageInsert, onConversationUpdate, onCommRequest, onAdminNotification }),
  unsubscribeAdminFeeds(),
  subscribeParticipantMessages(conversationId, onInsert),
  unsubscribeParticipantMessages(),
  getConnectionStatus(),
  onConnectionStatusChange(cb),
  disposeAll()
};
```

**Rationale:** Stage 7's single global `messageChannel` cannot hold admin broad listeners alongside selected-thread subscription without collision. Registry keyed by purpose prevents leaks.

**Alternatives:** Separate `realtime-admin.js` file — rejected; keep one module, split internal helpers.

### 2. Admin message INSERT listener (list preview)

One admin channel `admin-feed:messages` without `conversation_id` filter:

- Event: `INSERT` on `messages`
- Handler: if `conversation_id` is in current monitorable set (dual consent), patch list row + Live Connections snippet by id
- RLS ensures admin only receives consented rows

Selected-thread subscription remains separate (`admin-messages:{id}`) for viewer append (Stage 7 pattern).

**Alternatives:** Per-conversation channels for all monitorable threads — rejected; exceeds free-tier connection budget.

### 3. Conversation eligibility listener

Channel filter: `postgres_changes` `UPDATE` on `conversations` where both consent flags become true.

Handler:
1. If newly eligible → fetch metadata via `getAdminMonitorableConversations()` for that id OR merge from payload
2. Insert row into Real-Time list + Live Connections if under limit
3. If consent revoked (edge) → remove from list

**Rationale:** Satisfies MODIFIED consent scenario without polling.

### 4. Communication requests + notifications

- `communication_requests` INSERT/UPDATE → patch Communication section + home summary table (status badges)
- Optional migration `stage_8_admin_realtime.sql`: `ALTER PUBLICATION supabase_realtime ADD TABLE notifications;`
- Admin notification handler filters `owner_id === session.id` OR admin role broadcast rows

**Alternatives:** Keep notifications poll-only — rejected; spec requires live bell.

### 5. Connection status

Use Supabase channel `.subscribe((status) => ...)` on the primary admin feed channel:
- `SUBSCRIBED` → connected
- `CHANNEL_ERROR` / `TIMED_OUT` → error/reconnecting
- Expose badge in Real-Time header; auto-resubscribe once on disconnect

### 6. Real-Time search

Client-side filter on `getAdminMonitorableConversations()` result:
- Input `#realtime-search` above list
- Match guest name, pro name, guest specialization, pro skill (case-insensitive)
- Does not affect subscriptions; hidden rows remain subscribed only if selected id still visible

### 7. Participant chat subscription

When guest/pro opens chat view with active `conversationId`:
- Call `subscribeParticipantMessages(conversationId, appendBubble)`
- Unsubscribe on navigate away (reuse `leaveChat()` in `dashboard.html`)
- Same INSERT filter as admin per-conversation channel; RLS scopes to participant

**Rationale:** Completes Stage 7 stretch; reuses message channel pattern.

### 8. Cleanup lifecycle

| Event | Action |
|-------|--------|
| Admin leaves Real-Time section | `unsubscribeMessages()` + keep admin feeds if home still visible |
| Admin leaves dashboard | `disposeAll()` including admin feeds + presence listen |
| Admin on home only | Subscribe admin feeds + presence; no per-conversation message channel |
| Participant leaves chat | `unsubscribeParticipantMessages()` |

`init()` in admin-dashboard: start admin feeds after session confirmed; tie presence sync to existing flow.

## Risks / Trade-offs

- **[Risk] Duplicate events on reconnect** → Mitigation: dedupe handlers by message/request/notification id before DOM patch
- **[Risk] Broad messages listener volume** → Mitigation: RLS + client-side filter to monitorable ids only; acceptable at current scale
- **[Risk] Notification publication exposes all inserts to subscribed admins** → Mitigation: handler filters by `owner_id`; RLS already restricts SELECT
- **[Risk] Two message channels (admin feed + selected thread) double-fire on selected conversation** → Mitigation: dedupe by message id in viewer append path
- **[Trade-off] List reorder on new message** → Move conversation to top on INSERT; acceptable UX
- **[Trade-off] Communication status UPDATE may arrive before `load()` cache refresh** → Patch DOM optimistically + call `emitChange()` for consistency

## Migration Plan

1. Verify Stage 7 publication applied
2. Add optional migration for `notifications` Realtime publication
3. Extend `js/realtime.js` registry + status API
4. Wire admin-dashboard feed handlers + search UI + status badge
5. Wire dashboard participant chat subscriptions
6. E2E: message in non-selected thread updates list; consent grant adds row; guest request appears in Communication; admin bell updates
7. Run `openspec validate stage-8-admin-realtime --strict`

Rollback: revert frontend; remove `notifications` from publication if added — no data loss.

## Open Questions

- None blocking. Whether to reorder Live Connections on every message (recommended: yes) is an implementation default.
