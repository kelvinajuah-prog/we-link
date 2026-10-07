## Context

See `proposal.md`. The admin shell structure is implemented (`admin.html`, `js/admin-dashboard.js`, `css/admin-dashboard.css`) with **editorial print-directory** styling applied. **`js/login.js`** already implements unified tabbed sign-in (`WeLinkLogin.init`) expecting DOM hooks (`.login-tab`, `.login-card`, `#login-form`, guest completion panel), but **`login.html` still routes users to three separate legacy pages** and **no login-specific CSS** exists. This extension adds a **mockup-aligned unified login** using the same editorial tokens as admin.

Stage 6–8 features and Supabase auth flows must remain functional after login restyle.

## Overview

Welink reads like a quietly editorial print directory that happens to be a professional connection platform. The base canvas is off-white `{colors.canvas}` (#f5f5f5) holding warm near-black ink `{colors.ink}` (#0c0a09). The brand voltage is **photographic, not chromatic**: soft pastel atmospheric gradient orbs (mint, peach, lavender, sky, rose) drift through the page as the only "color" moments. There is no neon accent, no saturated CTA color, no dark-canvas dev-tools atmosphere on the main admin shell.

Type pairs **EB Garamond** (display serif at weight 300) with **Inter** for body, navigation, captions. The display weight at 300 is the editorial signature — never bold, never heavy.

CTAs are subtle: a near-black ink pill (`{component.button-primary}`) is the primary; a transparent outline (`{component.button-outline}`) is the secondary. The brand trusts atmospheric photography and modest type weights to carry brand work.

**Key characteristics (admin):**

* Off-white canvas, warm near-black ink. No saturated CTA color.
* Single primary action: ink pill at `{rounded.pill}`. Atmospheric gradients carry visual brand voltage.
* Display runs EB Garamond at weight 300 — editorial magazine voice.
* Body runs Inter at 400 with subtle letter-spacing (+0.15–0.18px).
* Pastel gradient orbs (5 tokens) used as atmospheric brand decoration only.
* Soft pill geometry (`{rounded.pill}` for CTAs, `{rounded.xl}` for cards).
* 96px section rhythm where applicable; admin dashboard uses tighter band spacing inside the shell (32–48px) while honoring token scale.

## Goals / Non-Goals

**Goals:**

- Apply editorial design tokens across the admin shell (sidebar, top bar, KPIs, cards, tables, modals, member management).
- **Unified login**: Rebuild `login.html` + `css/login.css` to match the approved login mockup and wire `WeLinkLogin.init()`.
- Preserve all admin workflows and DOM hooks used by `admin-dashboard.js`.
- Preserve all login DOM hooks and behavior in `js/login.js` (role tabs, remember-me, completion panel, redirects).
- Responsive layout ≥375px (sidebar overlay, KPI horizontal scroll; login card padding and tab row).
- Chart.js series using muted orb-adjacent tones on white cards — not neon glow on dark grid.
- Real-Time Monitoring Room may use `{colors.canvas-deep}` as the documented dark exception.

**Non-Goals:**

- Rebuilding layout or adding new admin features beyond existing member-management scope.
- Google/Apple OAuth on login (mockup mobile kit only — defer until Supabase OAuth is configured).
- Saturated multi-color quick-action stacks from the superseded dark mockup.
- Framework migration.
- Full rebuild of `index.html` dark marketing homepage in this change.

## Colors

### Brand & Accent

| Token | Value | Use |
|-------|-------|-----|
| `{colors.primary}` | #292524 | Primary action — warm near-black ink pill |
| `{colors.primary-active}` | #0c0a09 | Press state |

### Surface

| Token | Value | Use |
|-------|-------|-----|
| `{colors.canvas}` | #f5f5f5 | Off-white page floor — admin main canvas |
| `{colors.canvas-soft}` | #fafafa | Lighter band, realtime viewer background option |
| `{colors.canvas-deep}` | #0c0a09 | Rare dark hero / **Admin Real-Time Monitoring Room** |
| `{colors.surface-card}` | #ffffff | Pure white card |
| `{colors.surface-strong}` | #f0efed | Badges, avatar plates, status pills |
| `{colors.surface-dark}` | #0c0a09 | Dark admin nav exception (realtime room sidebar only) |
| `{colors.surface-dark-elevated}` | #1c1917 | Cards on dark canvas |

### Hairlines

| Token | Value | Use |
|-------|-------|-----|
| `{colors.hairline}` | #e7e5e4 | Default 1px divider |
| `{colors.hairline-soft}` | #f0efed | Lighter divider |
| `{colors.hairline-strong}` | #d6d3d1 | Stronger panel outline, input borders |

### Text

| Token | Value | Use |
|-------|-------|-----|
| `{colors.ink}` | #0c0a09 | Display, primary text |
| `{colors.body}` | #4e4e4e | Default running text |
| `{colors.body-strong}` | #292524 | Emphasis |
| `{colors.muted}` | #777169 | Sub-titles |
| `{colors.muted-soft}` | #a8a29e | Disabled text |
| `{colors.on-primary}` | #ffffff | White on ink pill |
| `{colors.on-dark}` | #ffffff | White on dark hero / realtime room |
| `{colors.on-dark-soft}` | #a8a29e | Muted on dark |

### Atmospheric gradient stops (signature — decoration only)

| Token | Value | Typical placement |
|-------|-------|-------------------|
| `{colors.gradient-mint}` | #a7e5d3 | Verified / approved KPI orb |
| `{colors.gradient-peach}` | #f4c5a8 | Pending / biography-adjacent orb |
| `{colors.gradient-lavender}` | #c8b8e0 | Communication / connection orb |
| `{colors.gradient-sky}` | #a8c8e8 | Directory / members orb |
| `{colors.gradient-rose}` | #e8b8c4 | Rejected / guest orb |

These appear ONLY as soft radial-gradient atmospheric orbs inside `{component.gradient-orb-card}` and behind hero copy. **Never** as button fills or text colors.

### Semantic

| Token | Value | Use |
|-------|-------|-----|
| `{colors.semantic-success}` | #16a34a | Approval confirmations, online indicators |
| `{colors.semantic-error}` | #dc2626 | Rejections, validation errors |

## Typography

**EB Garamond** (weight 300) display; **Inter** (400/500/600) body, nav, captions, buttons. Fallback: `'Times New Roman', serif` / `sans-serif`.

| Token | Size | Weight | Line Height | Letter Spacing | Use |
|-------|------|--------|-------------|----------------|-----|
| `{typography.display-lg}` | 36px | 300 | 1.17 | -0.36px | Section heads (Members, Dashboard welcome) |
| `{typography.display-md}` | 32px | 300 | 1.13 | -0.32px | Modal headers |
| `{typography.display-sm}` | 24px | 300 | 1.2 | 0 | Card group titles |
| `{typography.title-md}` | 20px | 500 | 1.35 | 0 | Component titles — Inter |
| `{typography.title-sm}` | 18px | 500 | 1.44 | 0.18px | List labels |
| `{typography.body-md}` | 16px | 400 | 1.5 | 0.16px | Default body |
| `{typography.caption}` | 14px | 400 | 1.5 | 0 | Metadata, table secondary |
| `{typography.caption-uppercase}` | 12px | 600 | 1.4 | 0.96px | `{component.badge-pill}` status tags |
| `{typography.button}` | 15px | 500 | 1.0 | 0 | CTA pill |
| `{typography.nav-link}` | 15px | 500 | 1.4 | 0 | Sidebar nav |

**Principles:** Display stays at 300 — never bold display. Body Inter at +0.15–0.18px tracking. Negative tracking on display sizes.

## Layout

- **Base unit:** 4px.
- **Spacing tokens:** xxs 4 · xs 8 · sm 12 · base 16 · md 20 · lg 24 · xl 32 · xxl 48 · section 96.
- **Admin shell:** Sidebar ~280px fixed; main flexible. Realtime split: **340px** list + 1fr viewer (per platform spec).
- **Max content width:** ~1200px inside main canvas.
- **Whitespace:** Generous editorial pacing; cards inside bands at 16–24px gap.

## Elevation & Depth

Hairline + soft drop — no glass blur on editorial cards.

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat canvas | `{colors.canvas}` | Body, sidebar background |
| Card | `{colors.surface-card}` + 1px `{colors.hairline}` | KPI, tables, member lists |
| Soft drop | `0 4px 16px rgba(0,0,0,0.04)` | Hovered cards (single tier) |
| Gradient orb | Radial `{colors.gradient-*}` | Atmospheric depth inside orb cards only |

Remove `backdrop-filter` glass treatment from superseded dark revision on standard admin cards.

## Shapes

| Token | Value | Use |
|-------|-------|-----|
| `{rounded.md}` | 8px | Form inputs |
| `{rounded.lg}` | 12px | Compact cards |
| `{rounded.xl}` | 16px | Professional / request cards |
| `{rounded.xxl}` | 24px | Gradient orb cards |
| `{rounded.pill}` | 9999px | CTAs, status badges |
| `{rounded.full}` | 9999px | Avatars |

## Components (admin mapping)

| Component | Editorial treatment |
|-----------|---------------------|
| `{component.top-nav}` / admin top bar | `{colors.canvas}` bg, `{colors.ink}` text, 64px height, search + bell + profile |
| `{component.button-primary}` | Ink pill `#292524`, white text, `{rounded.pill}`, 40px height |
| `{component.button-outline}` | Transparent, 1px `{colors.hairline-strong}`, ink text |
| `{component.badge-pill}` | `{colors.surface-strong}` bg, `{typography.caption-uppercase}` |
| `{component.gradient-orb-card}` | White card + soft radial orb (mint/peach/lavender/sky/rose) — KPI row |
| `{component.avatar-circular}` | `{colors.surface-strong}`, 48px |
| `{component.text-input}` | White bg, `{rounded.md}`, 1px strong hairline, 2px ink on focus |
| `{component.realtime-chat-room}` | `{colors.canvas-soft}` or `{colors.canvas-deep}` for viewer; `{rounded.xl}`, hairline border; 340px + 1fr split |
| Member profile modal | `{typography.display-md}` title (EB Garamond 300), white card, hairline |

### KPI orb assignment (8 stats)

| Stat | Orb token |
|------|-----------|
| Registered Members | sky |
| Active Members | mint |
| Professionals | mint |
| Guests | rose |
| Pending Applications | peach |
| Approved Professionals | mint |
| Rejected Applications | rose |
| Active Connections | lavender |

## Login page (unified sign-in)

### Visual intent (mockup)

- **Canvas**: `{colors.canvas}` or white page floor with a **large centered radial gradient blob** (stacked soft stops: `{colors.gradient-sky}`, `{colors.gradient-lavender}`, `{colors.gradient-peach}`, `{colors.gradient-rose}`) at ~40–60% viewport height, heavily blurred (`filter: blur(80–120px)`), low opacity — card stays crisp white on top.
- **Chrome**: Thin optional **promo bar** (ink `#0c0a09` bg, white text) + **minimal nav** (logo left, muted links center, outline Log in + ink Sign in right) — may reuse simplified markup rather than full `WeLinkUI.renderHeader` if header competes with mockup.
- **Card** (~max-width 480px): centered vertically in viewport; `{colors.surface-card}`, 1px `{colors.hairline}`, `{rounded.xxl}` (24px), padding 32–40px; soft shadow `0 24px 64px rgba(0,0,0,0.08)`.
- **Card head**: WeLink SVG/wordmark, `{typography.display-md}` “Log in to WeLink”, `{typography.body-md}` muted lede.
- **Role tabs**: `{rounded.pill}` segmented control; three equal segments with icon + label (Guest / Professional / Admin); active segment ink fill `{colors.primary}` + `{colors.on-primary}`; inactive transparent + hairline.
- **Role hint**: Full-width strip below tabs — `{colors.surface-strong}` or very light lavender wash, `{typography.caption}` — copy from `ROLE_CONFIG` / mockup per role.
- **Form**: Stacked `{component.text-input}` labels “Email Address” / “Password”; password row with icon toggle; row with checkbox “Remember me” + text link “Forgot?”; full-width `{component.button-primary}` “Sign in”; footer “New here? **Create an account**” with role-aware href.

### DOM contract (`js/login.js`)

Implement HTML to match existing selectors (no JS rewrite unless IDs missing):

| Hook | Purpose |
|------|---------|
| `.login-tab[data-role="guest\|professional\|admin"]` | Role tabs |
| `#login-form` with `name="email"`, `name="password"` | Sign-in |
| `#login-email`, `#login-password`, `#toggle-password` | Email, password, reveal |
| `#remember-me`, `#forgot-password` | Remember / forgot |
| `.login-submit` | Submit buttons (login + complete) |
| `#login-err`, `#complete-err` | Errors |
| `#signup-link` | Register link |
| `.login-signin-panel`, `#complete-panel`, `#complete-form` | Guest completion swap |
| `.login-card`, `.login-card-head` | Card shell for completion title updates |

Optional marketing blocks referenced in JS (hide on completion): `.login-marketing`, `.login-hero` — include only if layout uses them; otherwise JS no-ops safely.

### Legacy URL strategy

- Replace body of `login-guest.html`, `login-pro.html`, `login-admin.html` with `<meta http-equiv="refresh">` or immediate `location.replace('login.html?role=…')` **or** thin duplicate that only redirects — preserve guest-only inline completion only if redirect would break; prefer **single** completion UI on unified page.
- Update nav links across site (`login.html` as hub) to point to unified page.

### Responsive

- **≥768px**: Card fixed max-width, gradient visible left/right.
- **<768px**: Card width `calc(100% - 32px)`, reduce display size one step, tabs may use horizontal scroll inside pill container with `-webkit-overflow-scrolling: touch`.
- **Promo/nav**: Hide center nav links on small screens; keep logo + one CTA.

## Layout structure (admin — unchanged)

```
[ Sidebar ~280px — canvas + hairline border ]
[ Main — canvas ]
  Topbar: search | bell | profile | clock (muted ink, not neon)
  Welcome (EB Garamond 300) + subtitle
  Row 1: KPI × 8 (gradient-orb-card, horizontal scroll)
  Row 2: Platform Overview (line + donut on white) | Recent Activities
  Row 3: Professional Applications | Quick Actions (ink + outline pills) | Live Conversations
  Row 4: Communication Requests | WhatsApp Exchange Requests
  Sections: Members (filters + table), Professionals, Guests, Realtime, …
```

## Decisions

### 1. Editorial tokens replace dark glass in place

**Decision:** Overwrite `:root` in `admin-dashboard.css` with editorial tokens; remove navy/neon token set from superseded revision.

**Alternatives:** Separate `admin-editorial.css` — rejected; single source avoids drift.

### 2. Quick actions use ink/outline only

**Decision:** Remove `.qa-emerald`, `.qa-blue`, `.qa-purple`, `.qa-orange` saturated stacks; map all quick actions to `{component.button-primary}` / `{component.button-outline}`.

### 3. Charts on white cards

**Decision:** Chart.js grid `{colors.hairline-soft}`, ticks `{colors.muted-soft}`; series use orb-adjacent muted greens/purples at fill opacity ≤12% — no glow effects.

### 4. Realtime room dark exception

**Decision:** Real-Time Conversations section MAY use `{colors.canvas-deep}` + `{colors.on-dark}` for the monitoring viewer only; rest of admin stays editorial light.

### 5. Sidebar stays light editorial

**Decision:** Sidebar uses `{colors.canvas}` or `{colors.surface-card}` with hairline — not `#0F172A` dark panel from superseded mockup.

## Do's and Don'ts

**Do:**

- Reserve `{colors.primary}` ink pill for primary CTAs (Approve, Reactivate).
- Use EB Garamond 300 for section display headlines.
- Use pastel gradient orbs as KPI decoration only.
- Keep professional-to-professional communication hidden in discovery (unchanged product rule).

**Don't:**

- Don't use saturated brand action colors or neon Live badge glow.
- Don't bold display copy.
- Don't use dark navy as default admin canvas.
- Don't use sharp 0px radius on CTAs.
- Don't auto-display WhatsApp numbers without admin approval (unchanged product rule).

## Risks / Trade-offs

- **[Risk] Dark glass tasks marked complete** → Apply must restyle again; visual regression until `/opsx-apply`.
- **[Risk] EB Garamond load latency** → Use `display=swap`; fallback Times acceptable.
- **[Trade-off] Admin light vs public pages** → Aligned with marketing editorial — intentional.
- **[Trade-off] Realtime dark band** → Slight contrast shift acceptable per design system exception.

## Migration Plan

### Admin (complete)

1. Editorial tokens in `admin-dashboard.css`; KPI orbs; ink/outline CTAs; Chart.js palette — **done** per tasks §1–5.

### Login (new)

1. Add `css/login.css` with editorial tokens (shared custom properties aligned with admin where possible).
2. Rewrite `login.html` structure + fonts (EB Garamond + Inter); call `WeLinkLogin.init()` after scripts.
3. Implement gradient atmosphere layer (pseudo-element or dedicated `.login-atmosphere` div) per mockup.
4. Wire role hint copy on tab change (small addition in `login.js` or static three hints toggled by CSS/JS).
5. Redirect legacy `login-*.html` to `login.html?role=…`.
6. Update inbound links (`index.html`, register pages, headers) to unified login.
7. Visual QA: 1280 / 768 / 375px; smoke-test guest/pro/admin login, remember-me, incomplete guest completion, `file://` warning.

## Open Questions

- **Nav on login**: Use full `WeLinkUI.renderHeader` vs mockup-minimal nav — default to **minimal mockup nav** inside login shell; full site header optional behind flag.
- **Social login**: Deferred until OAuth providers are configured in Supabase.
