## Context

See `proposal.md` — Why. Current state (observed in codebase):

| Component | Behavior | Gap |
|-----------|----------|-----|
| `admin-dashboard.js` → `renderRealtime()` | Static placeholder ("Coming in marketplace v2") | No live room |
| `renderLiveConversations()` | Reads `db.connections` + `messages.connectionId` | Stage 6 uses `conversations` + `messages.conversation_id` |
| `store.js` → `load()` | Poll-only cache via `onChange` / manual refresh | No Realtime subscriptions |
| Stage 6 schema | `conversations.monitoring_consent_guest/pro` | RLS gates admin SELECT; Realtime publication not enabled |
| `supabase-client.js` | Standard `createClient` | Realtime works once publications + channel helpers added |

Stage 6 defers Realtime; consent flags and admin read-only transcript path are prerequisites. `polishing` change defines `realtime-chat-room` editorial styling for this section.

## Goals / Non-Goals

**Goals:**
- Enable Supabase Realtime on `messages`, `conversations`, `communication_requests`
- Build admin Real-Time Conversations Room (list + viewer + live append)
- Presence channel for participant online/offline in list + home widget
- Consent-filtered conversation list (dual consent required)
- Clean subscribe/unsubscribe lifecycle on section navigation
- Migrate dashboard home widget from legacy `connections` to `conversations`

**Non-Goals:**
- Admin sending messages in monitored chats
- Typing indicators, read receipts, message edit/delete
- WhatsApp exchange workflow changes
- Full Realtime on public/marketing pages
- Pro-to-pro or guest-to-guest presence
- Replacing in-app notification bell with Realtime (optional future)
- Supabase Realtime on `notifications` table in this stage

## Decisions

### 1. Realtime module: `js/realtime.js`

Centralize channel management:

```js
WeLinkRealtime = {
  subscribeMessages(conversationId, onInsert, onError),
  unsubscribeMessages(),
  subscribePresence(profileIds, onSync, onJoin, onLeave),
  unsubscribePresence(),
  disposeAll()
};
```

**Rationale:** Prevents duplicate channels when admin switches conversations; reusable for optional guest/pro chat panels.

**Alternatives:** Inline subscriptions in `admin-dashboard.js` only — rejected; harder to test and leak channels.

### 2. Database: Realtime publication only (no new tables)

Migration `stage_7_realtime.sql`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.communication_requests;
```

Verify RLS allows Realtime `postgres_changes` for admin role on consented rows. No schema change to consent columns — Stage 6 already has them.

**Rationale:** Presence uses Realtime Presence API (ephemeral), not Postgres tables.

**Alternatives:** `conversation_presence` table with heartbeat — rejected; unnecessary complexity.

### 3. Admin conversation list query

New store helper `getAdminMonitorableConversations()`:

- JOIN `conversations` → guest profile + guest_profiles + pro profile + professional_profiles
- WHERE `status = 'active'` AND `monitoring_consent_guest = true` AND `monitoring_consent_pro = true`
- Subquery or lateral join for last message (body, created_at, sender role)
- LEFT JOIN latest WhatsApp request status for badge

Initial load via PostgREST; list refresh on `conversations` UPDATE (consent granted) via lightweight Realtime listener on `conversations` filtered to admin-visible rows.

### 4. Message subscription pattern

When admin selects conversation `C`:

1. Load history via `getConversationMessages(C)` (existing Stage 6 API)
2. Subscribe: `channel('admin-messages:' + C).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'conversation_id=eq.' + C }, handler)`
3. Handler appends row if not already in DOM (dedupe by message id)
4. On switch: `removeChannel` previous, repeat for new `C`

**Rationale:** Filter by `conversation_id` minimizes event volume; RLS ensures admin only receives consented rows.

### 5. Presence channel

Single presence channel `welink-presence` keyed by `profile_id`:

- Guest/pro dashboards call `track({ profile_id, role })` on session init
- Admin subscribes to `presence` sync; map `profile_id` → online for list avatars
- Untrack on logout / `beforeunload`

**Rationale:** One channel scales to dozens of concurrent users on free tier; avoids per-conversation presence rooms.

**Alternatives:** Per-conversation presence — rejected for MVP complexity.

### 6. UI: Real-Time Conversations Room

Replace `renderRealtime()` placeholder with split layout using existing `realtime-chat-room` CSS token from `polishing`:

```
┌─────────────────────┬──────────────────────────────┐
│ Conversation list   │ Selected conversation header │
│ (avatar, names,     │ (guest + pro, specializations)│
│  last msg, time,    ├──────────────────────────────┤
│  presence dot,      │ Message thread (scrollable)  │
│  WA badge)          │                              │
└─────────────────────┴──────────────────────────────┘
```

Click list row → set `selectedConversationId`, re-render viewer, resubscribe.

Link from home `live-conversations` widget row → navigate to Real-Time section with pre-selected conversation.

### 7. Participant optional Realtime (stretch)

If time permits in same stage: guest/pro chat panel calls `WeLinkRealtime.subscribeMessages(activeConversationId, appendMessage)` when chat UI open. Not required for Stage 7 acceptance if admin room works.

### 8. Legacy `connections` cleanup

- `renderLiveConversations()` reads `db.conversations` (from Stage 6 `load()` shape)
- Stop referencing `db.connections` in admin dashboard
- Keep `connections` table in DB (Stage 6 decision); remove from admin UI only

## Risks / Trade-offs

- **[Risk] Realtime RLS misconfiguration leaks messages** → Mitigation: integration test with admin JWT; verify non-consented INSERT events not received; run security advisor
- **[Risk] Channel leaks on SPA navigation** → Mitigation: `disposeAll()` on section change and page unload; single module owns channels
- **[Risk] Free-tier Realtime connection limits** → Mitigation: one message channel + one presence channel per admin session; unsubscribe on deselect
- **[Risk] Stage 6 not deployed** → Mitigation: document dependency; migration fails gracefully if `conversations` missing
- **[Trade-off] List metadata not live-updated for last-message preview** → Acceptable; refresh list on conversation switch or periodic 30s poll; full live preview is Stage 7+ polish
- **[Trade-off] Presence is best-effort** → Tab close may lag offline status; acceptable for admin oversight

## Migration Plan

1. Apply Stage 6 migration if not already applied
2. Write and apply `stage_7_realtime.sql` (publication only)
3. Enable Realtime in Supabase project settings if disabled
4. Implement `js/realtime.js` + store admin query helpers
5. Replace `renderRealtime()` and update `renderLiveConversations()`
6. Wire presence track on guest/pro/admin session init
7. E2E: dual consent conversation → admin sees live message without refresh
8. Run `openspec validate stage-7-realtime --strict`

Rollback: revert frontend; remove tables from publication (Realtime disable) — no data loss.

## Open Questions

- None blocking. Participant-side Realtime is optional stretch within this stage.
