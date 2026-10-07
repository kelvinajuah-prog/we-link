## Purpose

Defines the visual structure and interaction model for a polished WeLink admin dashboard that adopts the **Welink editorial print-directory** design system (off-white canvas, warm ink typography, EB Garamond display at weight 300, atmospheric pastel gradient orbs, ink-pill CTAs), while reusing existing backend data, member management, and admin workflows.

## MODIFIED Requirements

### Requirement: Admin shell uses sidebar navigation
The admin dashboard SHALL use a fixed left sidebar for primary navigation and a main content area for section views on `admin.html`.

#### Scenario: Sidebar branding and tagline
- **WHEN** an admin opens the admin dashboard
- **THEN** the sidebar displays the WeLink wordmark with tagline "Connect · Collaborate · Grow" on `{colors.canvas}` or `{colors.surface-card}` with `{colors.ink}` text

#### Scenario: Sidebar navigation items visible
- **WHEN** an admin opens the admin dashboard
- **THEN** a sidebar displays navigation for Dashboard, Professionals, Guests, Communication, Real-Time Conversations, WhatsApp Management, Notifications, Members, and Settings using `{typography.nav-link}` (Inter 15px / 500)

#### Scenario: Expandable nav items show chevron
- **WHEN** an admin views sidebar items that support sub-navigation (Professionals, Guests, Communication, WhatsApp Management)
- **THEN** each item displays a chevron indicator on the editorial sidebar nav

#### Scenario: Real-Time Conversations shows Live badge
- **WHEN** an admin views the sidebar
- **THEN** the Real-Time Conversations item displays a LIVE `{component.badge-pill}` using `{colors.surface-strong}` background and `{typography.caption-uppercase}` — not neon glow

#### Scenario: Notifications shows unread count badge
- **WHEN** unread notifications exist
- **THEN** the Notifications sidebar item displays an unread count badge using `{component.badge-pill}` styling — not saturated rose neon

#### Scenario: Active section highlighted
- **WHEN** an admin selects a sidebar item
- **THEN** that item shows an active state with subtle ink or hairline-strong emphasis on the editorial sidebar and the main content area switches to the corresponding section

#### Scenario: Mobile sidebar collapses
- **WHEN** the viewport width is below the tablet breakpoint
- **THEN** the sidebar collapses behind a menu toggle without breaking access to all sections

#### Scenario: Sidebar bottom brand card
- **WHEN** an admin views the sidebar on desktop
- **THEN** a decorative brand card appears at the bottom with `{colors.muted}` copy on editorial canvas

### Requirement: Admin top bar with search, profile, and live clock
The admin shell SHALL include a top bar with search, notifications, admin profile, and a live date/time display on `{colors.canvas}`.

#### Scenario: Search input with keyboard hint
- **WHEN** an admin views the top bar
- **THEN** a `{component.text-input}` search field displays placeholder "Search members, professionals, or conversations…" with a `Ctrl+K` shortcut hint

#### Scenario: Admin profile in top bar
- **WHEN** an admin is logged in
- **THEN** the top bar shows `{component.avatar-circular}`, display name in Inter, and role label "Super Administrator" in `{colors.muted}`

#### Scenario: Live clock updates
- **WHEN** the admin dashboard is open
- **THEN** the top bar displays the current date and time in `{colors.body}` or `{colors.muted}` ink styling — not emerald neon accent — and updates at least every second

#### Scenario: Notification bell accessible
- **WHEN** an admin clicks the notification bell in the top bar
- **THEN** unread notifications are accessible without leaving the admin shell

### Requirement: Dashboard home overview layout
The default Dashboard section SHALL present an at-a-glance overview: welcome header, eight KPI stat cards, platform overview chart with member distribution donut, professional applications table, quick actions, recent activities, live conversations preview, and bottom request summary tables.

#### Scenario: Welcome header on dashboard home
- **WHEN** an admin lands on the Dashboard section
- **THEN** a welcome message "Welcome back, Admin 👋" renders in `{typography.display-lg}` (EB Garamond 300) with subtitle in `{typography.body-md}` muted text on `{colors.canvas}`

#### Scenario: Eight KPI cards with live counts
- **WHEN** dashboard home loads
- **THEN** stat cards display Registered Members, Active Members, Professionals, Guests, Pending Applications, Approved Professionals, Rejected Applications, and Active Connections as `{component.gradient-orb-card}` white cards with distinct pastel atmospheric orbs (sky, mint, mint, rose, peach, mint, rose, lavender), icons, counts, and trend or "Live count" caption text

#### Scenario: Platform overview line chart
- **WHEN** dashboard home loads
- **THEN** a Platform Overview white card shows a line chart with Professionals and Guests series over the last 7 days on `{colors.hairline-soft}` grid lines with muted orb-adjacent series colors — not glowing neon on dark grid

#### Scenario: Member distribution donut
- **WHEN** dashboard home loads
- **THEN** a member distribution donut chart on `{colors.surface-card}` shows total member count, Professionals percentage/count, and Guests percentage/count

#### Scenario: Professional applications table
- **WHEN** dashboard home loads
- **THEN** a Professional Applications table lists recent applicants with avatar/name, specialization, submission time, and PENDING `{component.badge-pill}` in `{colors.surface-strong}`

#### Scenario: Quick actions panel
- **WHEN** dashboard home loads
- **THEN** quick actions are visible using `{component.button-primary}` (ink pill) and `{component.button-outline}` — Approve Professional, View Pending Applications, Manage Members, and Real-Time Conversations — not saturated emerald/blue/purple/orange stacked fills

#### Scenario: Recent activities feed
- **WHEN** dashboard home loads
- **THEN** a Recent Activities white card lists the latest platform events with subtle icons and relative timestamps in `{typography.caption}` muted text

#### Scenario: Live conversations preview
- **WHEN** monitorable guest–professional conversations exist
- **THEN** a Live Conversations panel lists pairs with avatars, names, message snippets, and status `{component.badge-pill}` labels — not neon ACTIVE glow

#### Scenario: Bottom request summary tables
- **WHEN** dashboard home loads
- **THEN** Communication Requests and WhatsApp Exchange Requests summary tables are displayed side-by-side on white hairline-bordered cards with `{component.badge-pill}` status labels

### Requirement: Editorial print-directory design system for admin
The admin dashboard SHALL adopt the Welink editorial design system: off-white canvas (`#f5f5f5`), warm near-black ink (`#0c0a09`), ink primary pill (`#292524`), white cards with hairline borders, EB Garamond display at weight 300, Inter body at +0.15–0.18px tracking, pastel gradient orbs as decoration only, and no dark-canvas / neon-accent dev-tools atmosphere on the default admin shell.

#### Scenario: Main canvas uses editorial surfaces
- **WHEN** an admin views any main content section except the Real-Time Monitoring Room dark band
- **THEN** the background is `{colors.canvas}`, cards are `{colors.surface-card}` with 1px `{colors.hairline}`, and hover states use soft drop shadow only

#### Scenario: Typography uses EB Garamond display and Inter body
- **WHEN** an admin views welcome or section headings
- **THEN** display headings render in EB Garamond weight 300 — never bold display — and body UI renders in Inter

#### Scenario: Primary actions use ink pill
- **WHEN** an admin views primary CTAs (e.g. Approve Professional, Reactivate)
- **THEN** buttons use `{component.button-primary}` (near-black ink pill, white text, `{rounded.pill}`) — not saturated accent fills

#### Scenario: Secondary actions use outline pill
- **WHEN** an admin views secondary CTAs (e.g. View, Cancel, Suspend)
- **THEN** buttons use `{component.button-outline}` with `{colors.hairline-strong}` border and ink text

#### Scenario: Atmospheric orbs on KPI cards only
- **WHEN** an admin views KPI cards or decorative hero bands
- **THEN** mint, peach, lavender, sky, and rose appear only as soft radial-gradient orbs inside `{component.gradient-orb-card}` — not as button fills or neon chart glow

#### Scenario: Admin theme isolated from public pages
- **WHEN** a user navigates from the marketing site to the admin dashboard
- **THEN** admin-specific styles apply only within the admin shell and align editorially with the public design direction

### Requirement: Real-Time Monitoring Room dark exception
The Real-Time Conversations section MAY use `{colors.canvas-deep}` and `{colors.on-dark}` for the split monitoring viewer per design system, while the rest of the admin shell remains editorial light.

#### Scenario: Realtime split view layout
- **WHEN** an admin opens Real-Time Conversations
- **THEN** a 340px fixed conversation list and flexible main message viewer are displayed in `{component.realtime-chat-room}` with `{rounded.xl}` and hairline border

#### Scenario: Realtime room may use dark canvas
- **WHEN** an admin views the realtime message viewer
- **THEN** the viewer MAY use `{colors.canvas-deep}` background and `{colors.on-dark}` text as the sole dark exception in the admin shell

### Requirement: Member management surfaces
The Members section SHALL support viewing, searching, filtering, and acting on all registered members using editorial table and modal styling.

#### Scenario: Unified member table with filters
- **WHEN** an admin opens the Members section
- **THEN** a filterable table lists guests and professionals with role badges, account status, application status (for pros), and `{component.button-outline}` / `{component.button-primary}` action buttons

#### Scenario: Member profile modal
- **WHEN** an admin clicks View on a member row
- **THEN** a modal displays full profile details with `{typography.display-md}` title (EB Garamond 300) on white `{colors.surface-card}`

#### Scenario: Member actions preserved
- **WHEN** an admin approves, rejects, suspends, deactivates, reactivates, or deletes a member
- **THEN** the action succeeds and KPI counts refresh without breaking editorial styling

### Requirement: Quick actions and activity feeds
The dashboard home SHALL surface actionable shortcuts and recent platform activity without requiring navigation to sub-sections first.

#### Scenario: Quick actions navigate to workflows
- **WHEN** an admin clicks Approve Professional or View Pending Applications
- **THEN** the dashboard navigates to the Professionals section and focuses the pending applications panel

#### Scenario: Manage Members quick action
- **WHEN** an admin clicks Manage Members
- **THEN** the dashboard navigates to the Members section

#### Scenario: Real-Time Conversations quick action
- **WHEN** an admin clicks Real-Time Conversations
- **THEN** the dashboard navigates to the Real-Time Conversations section

### Requirement: Existing admin workflows preserved in new layout
All current admin capabilities (pending pro approve/reject, member management, WhatsApp queue, communication approval, realtime monitoring, live stat updates) SHALL remain accessible without regression in functionality.

#### Scenario: Pending professional approval still works
- **WHEN** an admin approves or rejects a pending professional from the Professionals or Members section
- **THEN** the action succeeds and the UI refreshes counts and lists

#### Scenario: WhatsApp and messages sections retain actions
- **WHEN** an admin opens WhatsApp Management or Communication sections
- **THEN** existing approve/reject and read-only message views remain available

### Requirement: Search filters active section lists
The admin top bar search SHALL filter visible lists in the active section.

#### Scenario: Search filters member lists
- **WHEN** an admin types in the header search while viewing Members, Professionals, or Guests
- **THEN** visible lists filter by name, email, skill, or specialization

#### Scenario: Ctrl+K focuses search
- **WHEN** an admin presses Ctrl+K while on the admin dashboard
- **THEN** the search input receives focus
