## 1. Editorial design tokens and shell

- [x] 1.1 Replace `:root` tokens in `css/admin-dashboard.css` with editorial palette (`#f5f5f5` canvas, `#0c0a09` ink, `#292524` primary, hairlines, pastel gradient orb stops); remove dark glass / neon token set from superseded revision
- [x] 1.2 Update `admin.html` font links: **EB Garamond** (300) + **Inter**; remove Inter-only assumption
- [x] 1.3 Restyle admin shell: editorial light sidebar + off-white main canvas, hairline borders; active nav with ink/hairline emphasis — not navy/emerald neon panel
- [x] 1.4 Remove `backdrop-filter` glass treatment from standard admin cards; apply hairline + soft drop shadow per elevation spec

## 2. Editorial components and buttons

- [x] 2.1 Restyle `glass-card` → white `{colors.surface-card}` cards with 1px `{colors.hairline}`; restyle tables, feeds, modals to editorial surfaces
- [x] 2.2 Revert quick-action buttons to `{component.button-primary}` ink pill and `{component.button-outline}` — remove `.qa-emerald`, `.qa-blue`, `.qa-purple`, `.qa-orange` saturated stacks
- [x] 2.3 Restyle KPI row to **eight** `{component.gradient-orb-card}` cards with pastel atmospheric orbs (sky, mint, rose, peach, lavender) — not neon-tinted dark glass backgrounds
- [x] 2.4 Restyle search input (`{component.text-input}`), clock (muted ink), notification badge (`{component.badge-pill}`), status pills (`{colors.surface-strong}` + caption-uppercase)

## 3. Dashboard home widgets

- [x] 3.1 Update welcome block to `{typography.display-lg}` EB Garamond 300 on editorial canvas
- [x] 3.2 Update Chart.js config: white card, hairline-soft grid, muted orb-adjacent series — remove dark grid and neon glow
- [x] 3.3 Restyle Professional Applications, Recent Activities, Live Conversations, Communication/WhatsApp tables to editorial white cards; preserve data wiring and eight KPI stats
- [x] 3.4 Update sidebar LIVE badge and notification count to `{component.badge-pill}` editorial styling — no emerald/rose neon glow

## 4. Section pages (editorial restyle)

- [x] 4.1 Restyle Professionals, Guests, Members (filters, table, profile modal), WhatsApp, Communication, Notifications, Settings to editorial tokens; preserve all member-management actions
- [x] 4.2 Restyle Real-Time Conversations: apply `{component.realtime-chat-room}` 340px + 1fr split; **optional** `{colors.canvas-deep}` dark exception for viewer only
- [x] 4.3 Verify search filter, Ctrl+K, logout, section router, live KPI patching, and Stage 8 realtime feeds unchanged functionally

## 5. Responsive and verification

- [x] 5.1 Responsive pass at 375px, 768px, and 1280px: sidebar toggle, KPI horizontal scroll, no overflow
- [x] 5.2 Visual QA against editorial design system (off-white canvas, EB Garamond 300 display, ink pills, pastel orb KPIs — no neon)
- [x] 5.3 Run `openspec validate polishing --strict`; smoke-test admin approve/reject, member suspend/deactivate, comm queue, realtime preview

## 6. Prior dark-glass pass (superseded — do not re-apply)

The following tasks implemented the **superseded dark glassmorphism / neon theme**. They are complete in code but visually superseded by sections 1–5 above:

<details>
<summary>Completed dark-glass tasks (archived)</summary>

- [x] Dark 1.1–1.3 Shell + tokens (navy canvas, glass blur)
- [x] Dark 2.1–2.4 Components (neon KPIs, saturated quick actions)
- [x] Dark 3.1–3.4 Dashboard widgets (glowing charts on dark)
- [x] Dark 4.1–4.3 Section pages (dark glass)
- [x] Dark 5.1–5.3 Verification (dark mockup QA)

</details>

## 8. Unified editorial login page (mockup)

- [x] 8.1 Add `css/login.css` with editorial tokens, gradient atmosphere layer, login card, role pill tabs, role hint strip, inputs, and ink **Sign in** CTA (align with mockup + `design.md` login section)
- [x] 8.2 Rebuild `login.html`: EB Garamond + Inter, minimal promo/nav chrome, card DOM matching `js/login.js` hooks, `#complete-panel` / `#complete-form` for guest completion, load `WeLinkLogin.init()`
- [x] 8.3 Implement dynamic role hint copy on tab change (guest / professional / admin) and verify `#signup-link` targets per `ROLE_CONFIG`
- [x] 8.4 Redirect `login-guest.html`, `login-pro.html`, and `login-admin.html` to `login.html?role=guest|professional|admin` (remove duplicate inline login forms where safe)
- [x] 8.5 Update site links (e.g. `index.html`, register/login cross-links, `js/ui.js` header) to point at unified `login.html`
- [x] 8.6 Responsive + reduced-motion pass at 375px / 768px / 1280px; smoke-test sign-in, remember-me, forgot, incomplete guest completion, admin redirect, and `file://` warning

## 9. Login visual fidelity (mockup match)

- [x] 9.1 Restyle `login.html` chrome to match the approved kit: black promo bar, full-width white nav (logo, muted links, text Log in + ink Sign in pill), card logo + serif headline without extra tagline
- [x] 9.2 Restyle `css/login.css` for white canvas, blue/violet/pink glow, standalone role pills (active = black), placeholder-only fields, lavender hint strip
- [x] 9.3 Preserve `WeLinkLogin` hooks and guest completion; verify desktop layout in the browser

## 7. Prior editorial pass (original baseline — reference only)

The first editorial implementation predated the dark-glass detour. Sections 1–5 above restore and extend that direction with the authoritative token spec (eight KPIs, member management, realtime dark exception):

<details>
<summary>Original editorial-theme tasks (reference)</summary>

- [x] Editorial 1.1–1.3 Shell + tokens (off-white canvas) — partial baseline
- [x] Editorial 2.1–2.4 Components (ink pills, white cards) — partial baseline
- [x] Editorial 3.1–3.4 Dashboard widgets — partial baseline
- [x] Editorial 4.1–4.3 Section pages — partial baseline

</details>
