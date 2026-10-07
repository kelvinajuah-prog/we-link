## Purpose

Provides secure authentication and role-based access for guest, professional, and admin account types using Supabase Auth.

## ADDED Requirements

### Requirement: Three distinct account roles
The system SHALL support exactly three roles: `guest`, `professional`, and `admin`. Each authenticated user MUST have exactly one role stored in their profile.

#### Scenario: Guest registration assigns guest role
- **WHEN** a user completes guest sign-up
- **THEN** their profile role is set to `guest`

#### Scenario: Professional registration assigns professional role
- **WHEN** a user completes professional sign-up
- **THEN** their profile role is set to `professional`

#### Scenario: Admin sign-up does not grant admin role immediately
- **WHEN** a user completes admin sign-up with name, email, and password
- **THEN** their profile role is set to `guest` (not `admin`) until manually promoted

#### Scenario: Manual admin promotion in Supabase
- **WHEN** the platform owner changes a user's `profiles.role` to `admin` in the Supabase dashboard
- **THEN** that user may sign in via the admin login page and access admin features

### Requirement: Separate sign-up and sign-in per role
The system SHALL provide dedicated sign-up and sign-in entry points for guests, professionals, and admins.

#### Scenario: Guest sign-in rejects wrong role
- **WHEN** a professional user attempts guest sign-in with valid credentials
- **THEN** sign-in fails with a role mismatch error

#### Scenario: Admin routes reject non-admins
- **WHEN** a guest or professional navigates to the admin dashboard without admin role
- **THEN** they are redirected to the appropriate login page

### Requirement: Admin sign-up uses standard account fields
Admin self-registration SHALL collect only name, email, and password—the same baseline fields as guest and professional sign-up. Completing this form creates an auth user and `profiles` row but does NOT assign the `admin` role.

#### Scenario: Admin registration succeeds with standard fields
- **WHEN** a user submits the admin registration form with valid name, email, and password
- **THEN** registration succeeds, a profile is created with role `guest`, and the user is told admin access requires manual approval

#### Scenario: Admin registration form fields
- **WHEN** a user views the admin registration page
- **THEN** the form shows name, email, and password fields only

### Requirement: No email verification gate
The system SHALL NOT require email confirmation before sign-up completes or before profile rows are inserted. Supabase Auth "Confirm email" is disabled in project settings.

#### Scenario: Immediate session after sign-up
- **WHEN** a user completes any role sign-up with valid credentials
- **THEN** Supabase returns an active session and the app proceeds without an email-confirmation step

#### Scenario: No email-confirm UI
- **WHEN** sign-up succeeds
- **THEN** the app does not show "check your email" flows or branch on `needsEmailConfirm`

### Requirement: Sign-up allowed by RLS
Database RLS policies SHALL permit authenticated users to insert their own profile and role-specific profile rows during registration.

#### Scenario: Guest sign-up inserts pass RLS
- **WHEN** a newly authenticated user inserts into `profiles` and `guest_profiles` with `id` / `profile_id` equal to `auth.uid()`
- **THEN** the inserts succeed

#### Scenario: Professional sign-up inserts pass RLS
- **WHEN** a newly authenticated user inserts into `profiles` and `professional_profiles` with `id` / `profile_id` equal to `auth.uid()`
- **THEN** the inserts succeed

#### Scenario: Admin sign-up profile insert passes RLS
- **WHEN** a user completes admin sign-up and inserts a `profiles` row with role `guest` and `id = auth.uid()`
- **THEN** the insert succeeds

### Requirement: Role-based feature access
The system SHALL enforce that users only access features permitted for their role via application guards and database RLS.

#### Scenario: Guest cannot access admin dashboard
- **WHEN** an authenticated guest requests admin-only data
- **THEN** access is denied

#### Scenario: Unapproved professional cannot use pro features
- **WHEN** a professional with `pending` or `rejected` status attempts pro-only actions
- **THEN** access is denied until approved
