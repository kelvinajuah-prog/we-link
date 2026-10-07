## Purpose

Defines the unified WeLink sign-in experience: editorial visual design, role-based tabbed login, and compatibility with existing Supabase authentication and guest profile completion — aligned with the Welink print-directory design system and the approved login mockup.

## ADDED Requirements

### Requirement: Single unified login page
The product SHALL expose one primary login URL at `login.html` that supports Guest, Professional, and Admin sign-in without separate role-specific login forms.

#### Scenario: User opens primary login
- **WHEN** a user navigates to `login.html`
- **THEN** they see a centered sign-in card with WeLink branding, display headline “Log in to WeLink”, and subtitle about the professional workspace
- **AND** they can sign in without choosing a different HTML file per role

#### Scenario: Legacy login URLs redirect
- **WHEN** a user opens `login-guest.html`, `login-pro.html`, or `login-admin.html`
- **THEN** they are taken to `login.html` with the appropriate `role` query parameter (`guest`, `professional`, or `admin`) pre-selected
- **AND** authentication behavior matches the unified page

### Requirement: Role tab selector
The login card SHALL provide a three-segment control for Guest, Professional, and Admin roles.

#### Scenario: Default role tab
- **WHEN** `login.html` loads without a `role` query parameter
- **THEN** the Guest tab is active by default

#### Scenario: Role from query string
- **WHEN** `login.html` loads with `?role=professional` or `?role=admin`
- **THEN** the matching tab is active and `aria-selected` reflects the active tab

#### Scenario: Tab switches update signup target
- **WHEN** the user selects a different role tab
- **THEN** the “Create an account” link updates to the register URL for that role (guest → seeker register, professional → pro register, admin → admin register)
- **AND** the URL query parameter `role` updates via `history.replaceState` without a full reload

#### Scenario: Role hint copy
- **WHEN** a role tab is active
- **THEN** a short contextual hint appears below the tabs (e.g. professional: manage profile and guest conversations) using muted editorial body text on a soft tinted strip

### Requirement: Sign-in form and actions
The login card SHALL collect credentials and submit through existing `WeLink.login` with the active role.

#### Scenario: Successful sign-in redirect
- **WHEN** the user submits valid credentials for the active role
- **THEN** they are redirected to `dashboard.html` for guest and professional roles
- **AND** to `admin.html` for admin role

#### Scenario: Invalid credentials
- **WHEN** sign-in fails
- **THEN** an inline error message is shown in the card without navigating away
- **AND** the submit button is re-enabled

#### Scenario: Remember me
- **WHEN** the user checks “Remember me” and signs in successfully
- **THEN** the email address is stored in localStorage under the existing `welink_login_email` key
- **WHEN** they return to login without remember-me
- **THEN** stored email is cleared on successful sign-in without remember-me

#### Scenario: Password visibility toggle
- **WHEN** the user activates the password reveal control
- **THEN** the password field toggles between `password` and `text` types
- **AND** the control updates accessible label text for show/hide

#### Scenario: Forgot password affordance
- **WHEN** the user activates “Forgot?”
- **THEN** they receive the existing informational guidance (administrator / Supabase-managed reset) without breaking the form

### Requirement: Guest profile completion on login
When a guest account requires profile completion, the login page SHALL swap to the completion form without losing session context.

#### Scenario: Incomplete guest after login attempt
- **WHEN** `WeLink.login` indicates incomplete guest profile
- **THEN** the sign-in panel hides and the guest profile completion form appears in the same card shell
- **AND** submitting the completion form redirects to `dashboard.html` on success

### Requirement: Editorial login visual design
The login experience SHALL use the editorial design system and match the approved mockup’s atmosphere and hierarchy.

#### Scenario: Typography and brand
- **WHEN** the login page renders
- **THEN** the headline uses EB Garamond weight 300 and body UI uses Inter
- **AND** the WeLink logo mark and tagline “Connect · Collaborate · Grow” appear above the headline

#### Scenario: Gradient atmosphere
- **WHEN** the login page renders on desktop
- **THEN** a soft multi-stop pastel gradient (sky, lavender, peach tones) appears as a blurred atmospheric background behind the card
- **AND** the sign-in card remains `{colors.surface-card}` white with hairline border and generous radius (~24px)

#### Scenario: Primary CTA styling
- **WHEN** the user views the sign-in button
- **THEN** it uses the ink pill primary (`#292524`, `{rounded.pill}`, white label “Sign in”)
- **AND** inactive role tabs use outline/hairline treatment; active tab uses filled ink or strong hairline emphasis per mockup

#### Scenario: Inputs
- **WHEN** the user focuses email or password fields
- **THEN** fields show 1px hairline-strong borders, `{rounded.md}` corners, and ink focus ring consistent with `{component.text-input}`

### Requirement: Responsive login layout
The login layout SHALL remain usable from 375px width upward.

#### Scenario: Mobile layout
- **WHEN** the viewport is below 768px
- **THEN** the card uses horizontal padding safe for narrow screens
- **AND** role tabs remain operable without horizontal overflow of the viewport
- **AND** optional top nav collapses or hides nonessential links without blocking sign-in

#### Scenario: Reduced motion
- **WHEN** the user prefers reduced motion
- **THEN** gradient background animation (if any) is disabled or static
- **AND** essential focus states remain visible

### Requirement: Auth environment warning
The login page SHALL warn when opened via `file://` protocol.

#### Scenario: file protocol
- **WHEN** the page is loaded with `file://`
- **THEN** a visible warning explains that Supabase auth requires http(s) localhost
- **AND** the warning appears inside or above the login card
