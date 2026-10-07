## 1. Database migration

- [x] 1.1 Create Stage 6 communication schema: `communication_requests`, `conversations`, status CHECK constraints, indexes on `(guest_id, pro_id)`
- [x] 1.2 Add `messages.conversation_id` FK and migrate legacy connection rows where present
- [x] 1.3 RLS: guests insert requests; guests cancel pending; admin approve/reject; conversations insert admin-only; messages require active conversation
- [x] 1.4 Apply migrations to remote Supabase (`stage_6_communication`, `stage_6_admin_comm_approval`)

## 2. Store communication API

- [x] 2.1 Implement `requestGuestCommunication`, `getCommRequest`, cooldown helper; block duplicate pending, unapproved pro, pro-as-requester, and 24h post-rejection
- [x] 2.2 Implement `adminApproveCommunication`, `adminRejectCommunication`, `cancelCommunication` with status timestamps
- [x] 2.3 Create conversation on admin approve; implement `canPrivateChat`, `getConversationMessages`, `sendPrivateMessage`
- [x] 2.4 Implement `recordMonitoringConsent`; `load()` includes `communicationRequests` and conversations
- [x] 2.5 Gate `requestWhatsApp` on active conversation; stop guest-pro auto-connect via `sendMessage`

## 3. Guest dashboard UI

- [x] 3.1 Replace discovery placeholder with "Request Communication"; show pending/accepted/rejected/cooldown status
- [x] 3.2 Enable chat room only when `canPrivateChat` is true; wire send to `sendPrivateMessage`
- [x] 3.3 Add cancel button for guest pending requests
- [x] 3.4 Keep Request Communication hidden on professional browse of other professionals

## 4. Professional dashboard UI

- [x] 4.1 Show incoming requests as read-only (admin decides); no pro accept/reject actions
- [x] 4.2 Show Open chat only after admin approval
- [x] 4.3 Keep `dashboard.js` stubs aligned with the store API

## 5. Monitoring consent

- [x] 5.1 Consent prompt in the chat room after conversation is active
- [x] 5.2 Admin message read remains blocked until both consents are true (existing RLS)

## 6. Admin management

- [x] 6.1 Wire Communication section to live `communicationRequests`
- [x] 6.2 Admin Approve / Reject buttons on pending requests; approval opens the room

## 7. Notifications

- [x] 7.1 Notify professional and admin on request; notify guest and professional on approve/reject; notify pro on cancel; notify recipient on new message

## 8. Verification

- [x] 8.1 Request → admin approve → conversation created → room messaging path implemented
- [x] 8.2 Reject cooldown and cancel → immediate re-request implemented
- [x] 8.3 Run Supabase security advisor; resolve critical findings
- [x] 8.4 Run `openspec validate stage-6-communication --strict`
