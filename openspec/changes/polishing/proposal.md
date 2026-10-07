## Why

The admin dashboard now follows the **Welink editorial print-directory** design system (off-white canvas, EB Garamond display, ink pills, pastel atmospheric orbs). The **login experience is still fragmented and dated**: `login.html` is a three-link hub, role-specific pages (`login-guest.html`, `login-pro.html`, `login-admin.html`) use generic `app.css` cards, and **`js/login.js` already implements a unified tabbed sign-in flow** but **no page or styles wire it up**. The product owner wants a **single, visually striking login** that matches the provided mockup (soft multi-color gradient atmosphere, centered editorial card, Guest / Professional / Admin role switcher) without changing Supabase auth behavior.

## What Changes

- **Unified login surface**: Rebuild **`login.html`** as the primary sign-in page using **`WeLinkLogin.init()`** from `js/login.js` — one card, role tabs, email/password, remember-me, forgot link, and role-aware signup link.
- **Visual design (mockup-aligned)**: Editorial typography (EB Garamond 300 headline “Log in to WeLink”), WeLink mark + tagline, pill role selector with icons, contextual role hint strip, ink primary **Sign in** CTA, hairline inputs with password reveal — on a **full-viewport pastel gradient glow** behind a white `{rounded.xxl}` card.
- **Marketing chrome (lightweight)**: Optional top promo strip and minimal nav (logo, muted links, outline **Log in** + ink **Sign in**) consistent with mockup; reuse existing header patterns where practical without rebuilding `index.html`.
- **Legacy routes**: **`login-guest.html`**, **`login-pro.html`**, and **`login-admin.html`** SHALL redirect or delegate to `login.html?role=guest|professional|admin` so bookmarks and old links keep working; guest **profile completion** panel stays supported via `login.js` DOM hooks.
- **Responsive**: Desktop centered card (~480px); mobile full-width card with safe padding; role tabs scroll or stack cleanly at ≤375px.
- **Preserve**: `WeLink.login(email, password, role)` role enforcement, redirects (`dashboard.html` / `admin.html`), remember-email localStorage, guest incomplete-profile completion form, `file://` warning — **visual and routing consolidation only**.

## Capabilities

### New Capabilities

- `login-ui`: Unified editorial login page layout, role tabs, form states, gradient atmosphere, and legacy login URL compatibility.

### Modified Capabilities

- `admin-dashboard-ui`: No functional change; login polish **extends the same editorial token set** so public auth and admin surfaces feel cohesive (shared ink, hairlines, EB Garamond + Inter).

## Impact

- **Frontend**: `login.html` (major rewrite), new or extended **`css/login.css`** (or scoped block in `css/app.css`), possible small **`js/ui.js`** header variant for login shell; redirects on legacy login HTML files.
- **Data / auth**: No schema, RLS, or store API changes.
- **Out of scope**: Google/Apple OAuth (shown in mockup mobile kit only — enable only if Supabase OAuth is configured later); rebuilding full marketing homepage; changing registration flows beyond signup link targets already in `ROLE_CONFIG`.

## Non-Goals

- Adding social login providers without existing Supabase OAuth setup.
- Replacing `index.html` dark marketing theme in this change.
- Altering password reset backend (forgot link may remain informational alert as today).
