## 1. Discovery helpers

- [x] 1.1 Add client-side search/filter helpers (by name, skill, location) in `js/dashboard.js` or new `js/discovery.js`; verify filter reduces visible cards
- [x] 1.2 Wire `matchForGuest()` to "Recommended for you" section on guest dashboard; verify matches reflect guest specialization

## 2. Guest discovery UI

- [x] 2.1 Build guest directory: search input, specialization dropdown, recommended + all-pro grids; verify only approved pros shown
- [x] 2.2 Professional detail view: photo, skill, location, bio, achievements; hide or disable communication CTA
- [x] 2.3 Verify pending/rejected pros never appear in guest directory

## 3. Professional discovery UI

- [x] 3.1 Build pro peer browse using same card component; verify read-only (no comm button)
- [x] 3.2 Add store guard or UI check preventing pro-to-pro communication request exposure

## 4. Public pages

- [x] 4.1 Update `professionals.html`: approved pros from Supabase with photo, achievements, improved cards; verify no pending pros
- [x] 4.2 Update `index.html` featured professionals section with live approved pros (max 6) or empty state; verify loads without auth

## 5. Verification

- [x] 5.1 E2E: admin approve pro → pro appears on public page, guest directory, and match list
- [x] 5.2 E2E: pro browses peers — no communication action visible
- [x] 5.3 Run `openspec validate stage-5-discovery --strict`
