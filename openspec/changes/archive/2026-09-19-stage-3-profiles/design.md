## Context

Stage 1 added DB columns: `guest_profiles.town`, `guest_profiles.area`, `professional_profiles.achievements`, `approved_at`. Current UI:

| Surface | Current | Gap |
|---------|---------|-----|
| `register-seeker.html` | name, age, email, password, specialization, skills, photo | Missing town, area |
| `register-pro.html` | name, email, password, skill, location, bio | Missing achievements (separate), photo, phone/WhatsApp |
| `store.js` registerGuest | inserts age, specialization, skills | No town/area |
| `store.js` registerPro | inserts skill, location, bio | No achievements, photo, phone |
| `dashboard.js` | role-based views, some matching | No structured pro directory browse |

Stage 2 must be complete so public approved-pro SELECT policies work for guest browse.

## Goals / Non-Goals

**Goals:**
- Wire foundation columns into registration and dashboard
- Guest directory: grid/list of approved pros with detail view
- Pro directory: same data, read-only, no comm CTA pro→pro
- Admin pending table shows new fields
- Photo upload via existing Storage bucket pattern

**Non-Goals:**
- Communication request workflow (Stage 4)
- Editorial design system on public pages
- Postgres full-text search (client-side filter sufficient)
- Pro-to-pro messaging

## Decisions

### 1. Guest registration form

**Fields:** name, email, password, age, **town**, **area**, specialization (select), skills, photo.

**Persistence:**
```js
guest_profiles.insert({
  profile_id, age, town, area, specialization, skills
})
```

Replace city-only mental model — town + area are Cameroon-local (e.g. town: "Yaoundé", area: "Bastos").

### 2. Professional registration form

**Fields:** name, email, password, phone/WhatsApp, skill (select), location, **bio** (textarea), **achievements** (textarea), photo (file).

**Persistence:**
```js
profiles.insert/update({ phone, photo_url })
professional_profiles.insert({
  profile_id, skill, location, bio, achievements, status: 'pending'
})
```

Split copy: bio = narrative; achievements = bullet-style accomplishments (plain text).

### 3. Browse directory (guest + approved pro)

**Decision:** Add `WeLink.activeProfessionals()` (exists) + render in `dashboard.js`:

- **Guest view:** Card grid with avatar, name, skill, location, bio snippet; click → detail panel with achievements + "Request Communication" placeholder disabled until Stage 4 (or hidden with "Coming soon").
- **Pro view:** Same grid/detail but **no** communication CTA when viewing another pro.

**Filtering:** Client-side filter by skill/specialization match (reuse `matchForGuest` logic or simple list).

### 4. mapGuest / mapPro updates

Add `town`, `area`, `achievements` to mapped objects in `store.js` for dashboard/admin display.

### 5. Admin dashboard

Update `admin-dashboard.js` pending table columns: show achievements snippet, phone if available. No backend change.

### 6. File structure

Minimal changes — no new pages unless needed:
- Option A: directory inline in `dashboard.html` sections (preferred)
- Option B: `browse.html` — rejected to avoid scope creep

## Risks / Trade-offs

- **[Risk] Browse without Stage 4 comm button confuses users** → Mitigation: hide button or show "Communication coming soon" label
- **[Risk] Photo upload fails RLS on storage** → Verify bucket policies allow authenticated upload to own folder
- **[Trade-off] Client-side directory only** → Fine for MVP member counts

## Migration Plan

1. Update store registration functions
2. Update register HTML forms
3. Update dashboard browse UI
4. Update admin pending display
5. Manual test: guest register → browse pros; pro register → pending → admin approve → pro browse

## Open Questions

- WhatsApp field: store in `profiles.phone` (existing column) — assumed yes.
