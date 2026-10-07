## Why

Stage 3 wires basic profile fields and a simple approved-pro list on the guest dashboard. Stage 5 delivers the **discovery product**: searchable/filterable professional directory, skill-based matching for guests, public marketing pages showing live approved pros, and read-only pro-to-pro browse — without enabling communication yet (Stage 6+).

## What Changes

- **Guest discovery dashboard**: Filter/search approved professionals by specialization/skill/location; skill-based matches from guest profile (`matchForGuest`); profile detail view with achievements.
- **Professional discovery dashboard**: Browse other approved pros read-only; no "Request Communication" when viewer is a professional.
- **Public directory**: Update `professionals.html` and `index.html` to list only approved professionals from Supabase (not samples-only); card layout with photo, skill, location, bio preview.
- **Hide pending pros everywhere**: Directory queries use `status = 'approved'` only (RLS + client filter).
- **No communication CTA yet**: "Request Communication" hidden or labeled coming soon until communication stage — discovery is browse-only.

## Capabilities

### New Capabilities

- `professional-discovery`: Search, filter, and browse approved professionals for guests, pros, and anonymous visitors on public pages.

### Modified Capabilities

- _(none — no archived main specs yet)_

## Impact

- **Frontend**: `js/dashboard.js`, `js/store.js` (`activeProfessionals`, `matchForGuest`, `publicProProfiles`), `professionals.html`, `index.html` (featured pros section).
- **Database**: No schema changes; relies on Stage 2 public SELECT policies and Stage 4 approved status.
- **Dependencies**: Stage 3 profile fields (photo, achievements, town/area); Stage 4 approval workflow (only approved pros listed).
- **Out of scope**: Communication requests, messaging, WhatsApp, pro-to-pro comm attempts, editorial design system on public pages.
