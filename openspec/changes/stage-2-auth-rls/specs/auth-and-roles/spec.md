## Purpose

Defines authentication flows, three-role assignment, route guards, and application-level access control for WE-LINK guest, professional, and admin users.

## ADDED Requirements

### Requirement: Three distinct account roles
The system SHALL support exactly three roles: `guest`, `professional`, and `admin`. Each authenticated user MUST have exactly one role stored in `profiles.role`.

#### Scenario: Guest registration assigns guest role
- **WHEN** a user completes guest sign-up
- **THEN** their profile role is set to `guest`

#### Scenario: Professional registration assigns professional role
- **WHEN** a user completes professional sign-up
- **THEN** their profile role is set to `professional`

#### Scenario: Admin sign-up does not grant admin role immediately
- **WHEN** a user completes admin sign-up with name, email, and password
- **THEN** their profile role is set to `guest` until manually promoted in Supabase

#### Scenario: Manual admin promotion in Supabase
- **WHEN** the platform owner sets `profiles.role = 'admin'` for a user in Supabase
- **THEN** that user may sign in via the admin login page and access admin features

### Requirement: Separate sign-up and sign-in per role
The system SHALL provide dedicated sign-up and sign-in entry points for guests, professionals, and admins.

#### Scenario: Guest sign-in rejects wrong role
- **WHEN** a professional or admin user attempts guest sign-in with valid credentials
- **THEN** sign-in fails with a role mismatch message and no session is kept

#### Scenario: Admin login rejects non-admins
- **WHEN** a guest or professional signs in via the admin login page
- **THEN** sign-in fails or the user is redirected away from admin routes

#### Scenario: Admin routes reject non-admins
- **WHEN** a guest or professional navigates to `admin.html` without admin role
- **THEN** they are redirected to the appropriate login page

### Requirement: No email verification gate
The system SHALL NOT require email confirmation before sign-up completes or profile rows are inserted.

#### Scenario: Immediate session after sign-up
- **WHEN** a user completes any role sign-up with valid credentials
- **THEN** Supabase returns an active session and the app proceeds without an email-confirmation step

#### Scenario: No email-confirm UI
- **WHEN** sign-up succeeds
- **THEN** the app does not show "check your email" flows

### Requirement: Unapproved professional restricted
Professionals with status `pending`, `rejected`, `suspended`, or `deactivated` MUST NOT access approved-only professional features (browse directory as pro, messaging, WhatsApp requests).

#### Scenario: Pending pro sees limited dashboard
- **WHEN** a professional with `pending` status signs in
- **THEN** they see a waiting/rejection state and cannot browse or message as an approved pro

#### Scenario: Approved pro accesses pro features
- **WHEN** a professional with `approved` status signs in
- **THEN** they may access professional dashboard features permitted by RLS

### Requirement: Account status enforcement
Users with `profiles.account_status` of `suspended` or `deactivated` MUST NOT access role features until restored by admin.

#### Scenario: Suspended user blocked
- **WHEN** a suspended user attempts sign-in or API access
- **THEN** access is denied with an appropriate message
