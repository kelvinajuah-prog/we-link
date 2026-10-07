---
name: welink-guest-profile-ui
description: >-
  Clone or redesign the WE-LINK guest dashboard profile from a screenshot or mockup.
  Use for guest profile card, home hero, overview tabs, or Edit Profile form in the
  kelvin project. Combines sevzq screenshot-to-html (render → compare → refine)
  with integration into js/guest-dashboard-ui.js and css/guest-dashboard.css.
---

# WE-LINK guest profile UI (screenshot-to-html)

When the user shares a **guest profile** or **guest dashboard** design image for WE-LINK:

1. Open and follow the project skill at `.cursor/skills/screenshot-to-html/SKILL.md` (full workflow, `shot.mjs`, compare loop).
2. Read [welink-guest-profile.md](welink-guest-profile.md) for which functions and files to update.
3. Prototype in `tmp/screenshot-to-html/` until the render matches the mockup, then port into `guest-dashboard-ui.js` / `guest-dashboard.css`.
4. Keep `WeLink.updateGuestProfile`, `#guest-edit-form`, and `data-guest-view` navigation working.

Do not overwrite unrelated pages (`login.html`, pro dashboard) unless the user asks.
