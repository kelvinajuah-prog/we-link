# WE-LINK guest profile — screenshot-to-html integration

Use this when cloning a **guest profile** mockup into the live WE-LINK app (not a standalone page only).

## Scope (guest profile surfaces)

| Surface | UI source | Route / view |
|--------|-----------|----------------|
| Dashboard home + profile card | `profileSection()`, `heroBanner()`, `layoutHome()` | `dashboard.html` → `guestView === "home"` |
| Edit profile | `editProfileForm()` | `guestView === "edit"` (`data-guest-view="edit"`) |
| Shell (nav, layout) | `shell()`, `layoutInner()` | All guest views |

## Files to change after the replica passes visual compare

- `js/guest-dashboard-ui.js` — HTML strings and structure (prefer editing here over inline in `dashboard.html`).
- `css/guest-dashboard.css` — tokens, layout, components (`.gd-profile-*`, `.gd-hero-*`, `.gd-edit-form`, `.gd-tabs`).
- `dashboard.html` — only if wiring changes (`bindGuestEditForm`, `bindGuestEvents`, `renderGuest`).

## Preserve behavior

- Photo: `H.avatarUrl(user)` / file input → `WeLink.updateGuestProfile` via `#guest-edit-form`.
- Edit form fields: `name`, `age`, `town`, `area`, `specialization`, `skills`, `photo` (see `editProfileForm`).
- Navigation: `data-guest-view` values (`home`, `browse`, `inbox`, `events`, `edit`).
- Page class: `document.body.classList.add("guest-dashboard-page")` on guest load.

## Recommended workflow

1. Put the target screenshot in `.cursor/skills/screenshot-to-html/inbox/guest-profile.png` (or project `tmp/`).
2. Build a draft with the screenshot-to-html loop; compare at **1280px** width (desktop dashboard).
3. Port **design tokens** and class names into `guest-dashboard.css`; map structure into `guest-dashboard-ui.js`.
4. Smoke-test: log in as guest → home profile card → **Edit Profile** → save → hero/card photo updates.

## Render / verify commands

From `.cursor/skills/screenshot-to-html/`:

```bash
node scripts/shot.mjs --in path/to/replica.html --out tmp/screenshot-to-html/guest-profile-v1.png --width 1280
```

Compare output to the source screenshot; iterate before merging into `guest-dashboard-ui.js`.

## Stack choice

Default **vanilla** CSS to match existing `guest-dashboard.css` (no Tailwind in production shell unless the project already uses it on that page).
