## 1. Guest profile registration

- [x] 1.1 Add town and area fields to `register-seeker.html`; verify form validation
- [x] 1.2 Update `registerGuest()` / `signUpAccount()` to persist `town` and `area` on `guest_profiles`; verify DB rows after signup
- [x] 1.3 Update `mapGuest()` and guest dashboard to display town, area, specialization, skills, photo

## 2. Professional profile registration

- [x] 2.1 Add phone/WhatsApp, achievements (separate textarea), and photo upload to `register-pro.html`; verify form submits all fields
- [x] 2.2 Update `registerPro()` to persist `achievements`, `bio`, `phone`, and `photo_url`; verify `professional_profiles` and `profiles` rows
- [x] 2.3 Ensure pending status and admin notification still fire on pro registration

## 3. Browse directory

- [x] 3.1 Add approved-professionals directory to guest dashboard (grid + detail view); verify only `approved` pros listed
- [x] 3.2 Add approved-professionals browse to professional dashboard (read-only); verify no communication CTA pro→pro
- [x] 3.3 Client-side filter by specialization/skill; verify filter works with search input if present

## 4. Admin and resubmit

- [x] 4.1 Show achievements, photo, and phone in admin pending professionals table; verify fields visible
- [x] 4.2 Verify rejected pro resubmit flow updates achievements/bio and returns to pending

## 5. Verification

- [x] 5.1 End-to-end: guest register with town/area → browse approved pros → view detail
- [x] 5.2 End-to-end: pro register with achievements/photo → admin approve → pro browse directory
- [x] 5.3 Run `openspec validate stage-3-profiles --strict`
