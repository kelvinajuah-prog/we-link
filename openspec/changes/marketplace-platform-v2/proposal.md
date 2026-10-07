## Why

WE-LINK needs a production-grade professional marketplace backed by Supabase, with clear role separation (guest, professional, admin), approval-gated professional onboarding, pro-gated guest communication, admin-controlled WhatsApp exchange, and real-time conversation monitoring. The current codebase mixes payment/subscription flows with partial Supabase integration and immediate guest-to-pro chat, which does not match the intended product.

## What Changes

- **BREAKING**: Remove all payment, subscription, MoMo, and payment-screenshot flows from frontend and database.
- Implement three secure account types with separate sign-up/sign-in: guest, professional, admin (admin role granted manually in Supabase after sign-up).
- Fix RLS policies so guest and professional registration inserts succeed.
- Remove email-verification UI; Supabase "Confirm email" disabled on free-tier project.
- Professional registration stored in Supabase as `pending`; admin approves or rejects with optional reason.
- Guest-to-professional communication gated by **professional accept/reject** (Option C); admin monitors but does not approve chat.
- Guest may **cancel** pending communication requests; **24-hour cooldown** before re-requesting the same pro after rejection; immediate re-request allowed after guest cancel.
- Dual **monitoring consent** required before admin can view conversation messages in the Real-Time Conversations Room.
- WhatsApp number exchange remains **admin-controlled**; numbers not revealed without approval.
- Professionals can browse/search other approved professionals (discovery only); **no pro-to-pro communication requests**.
- Admin dashboard v2: statistics, member management, pending applications, communication oversight, WhatsApp queue, live connections, Real-Time Conversations Room via Supabase Realtime.
- Notification system for guests, professionals, and admins on all key lifecycle events.
- Supabase Realtime enabled for messages, requests, notifications, and presence where required.
- RLS policies enforcing role permissions across all tables.

## Capabilities

### New Capabilities

- `auth-and-roles`: Supabase Auth, three roles, separate sign-up/sign-in pages, role-based route guards.
- `guest-profiles`: Guest registration, profile (name, town/area, specialization, photo), browse approved professionals.
- `professional-profiles`: Pro registration, pending approval, admin approve/reject, achievements, discovery of other pros.
- `communication`: Guest communication requests, pro accept/reject, guest cancel, 24h reject cooldown, conversations, messaging, consent.
- `whatsapp-exchange`: Admin-controlled WhatsApp number reveal between guest and pro.
- `notifications`: In-app notifications for guests, professionals, and admins.
- `admin-dashboard`: Stats, member management, pro approval, communication/WhatsApp oversight, live connections.
- `admin-realtime-monitoring`: Real-Time Conversations Room, Supabase Realtime subscriptions, presence, admin-only RLS.

### Modified Capabilities

- _(none — greenfield specs)_

## Impact

- **Database**: Migrate `professional_profiles` (remove payment columns); add `achievements`, `rejection_reason`, `town`/`area` on guests; add `communication_requests`, refactor `connections` → `conversations`; add `admin_activity`; enable Realtime publications.
- **Frontend**: `js/store.js`, `dashboard.html`, `admin.html`, all auth/register pages; remove payment UI entirely.
- **Supabase**: RLS policy rewrite; Realtime on `messages`, `communication_requests`, `notifications`; Storage for profile photos.
- **Security**: Role enforcement via RLS and route guards; admin role assigned manually in Supabase; no service role key in frontend; consent-gated admin message access.
