## Why

Stage 1 added foundation columns (`guest_profiles.town`, `guest_profiles.area`, `professional_profiles.achievements`, `approved_at`) but the UI still collects legacy fields only (age/skills for guests; bio-only for pros). Guests cannot browse approved professionals in a structured directory, and professionals cannot discover peers without requesting communication. Stage 3 wires the profile product surface on top of Stage 2's secure RLS baseline.

## What Changes

- **Guest registration & profile**: Add town and area fields; persist to `guest_profiles`; show on guest dashboard.
- **Professional registration & profile**: Separate achievements from biography; add profile photo upload; persist `achievements`, `bio`, photo URL; WhatsApp/phone field on pro form.
- **Guest browse directory**: Approved professionals listed with photo, skill, location, bio preview; tap to view detail — no messaging yet (Stage 4+).
- **Professional discovery**: Approved pros browse other approved pros (read-only); hide "Request Communication" when viewer is a professional viewing another pro.
- **Dashboard profile display**: Show complete profile cards using foundation columns.
- **Admin visibility**: Pending applications table already shows pros; ensure new fields appear in admin Professionals section.

## Capabilities

### New Capabilities

- `guest-profiles`: Guest registration fields (town, area, specialization, photo), profile display, browse approved professionals.
- `professional-profiles`: Pro registration fields (achievements, bio, photo, WhatsApp), pending/approved lifecycle display, pro-to-pro browse-only directory.

### Modified Capabilities

- _(none — no archived main specs yet)_

## Impact

- **Frontend**: `register-seeker.html`, `register-pro.html`, `js/store.js` (`registerGuest`, `registerPro`, `mapGuest`, `mapPro`), `js/dashboard.js`, optional `css/app.css` profile cards.
- **Database**: No new columns (Stage 1 added them); optional index on `professional_profiles.status` if browse queries slow.
- **Dependencies**: Requires Stage 2 RLS (public approved-pro SELECT policies) complete.
- **Out of scope**: Communication requests, messaging UI, payments, editorial design system on public pages (separate from admin polishing).
