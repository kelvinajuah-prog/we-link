## Purpose

Defines Supabase row-level security policies that enforce least-privilege data access for guest, professional, and admin roles across all WE-LINK tables.

## ADDED Requirements

### Requirement: Sign-up insert policies
Authenticated users SHALL be able to insert their own profile rows during registration.

#### Scenario: Guest sign-up inserts pass RLS
- **WHEN** a newly authenticated user inserts into `profiles` and `guest_profiles` with `id` / `profile_id = auth.uid()`
- **THEN** the inserts succeed

#### Scenario: Professional sign-up inserts pass RLS
- **WHEN** a newly authenticated user inserts into `profiles` and `professional_profiles` with `profile_id = auth.uid()` and status `pending`
- **THEN** the inserts succeed

### Requirement: Own-profile read and update
Users SHALL read and update their own `profiles` and role-specific profile rows; admins MAY read/update any profile.

#### Scenario: User updates own guest profile
- **WHEN** a guest updates `guest_profiles` where `profile_id = auth.uid()`
- **THEN** the update succeeds

#### Scenario: User cannot update another user's profile
- **WHEN** a guest attempts to update another user's `profiles` row
- **THEN** the update is denied by RLS

### Requirement: Approved professional public discovery
Anonymous and authenticated users SHALL read approved professionals' public profile data only.

#### Scenario: Approved pro visible in public SELECT
- **WHEN** any user queries `professional_profiles` with `status = 'approved'`
- **THEN** those rows are readable per public discovery policy

#### Scenario: Pending pro hidden from public SELECT
- **WHEN** a non-admin queries for professionals
- **THEN** rows with status other than `approved` are not returned by public policies

### Requirement: Connection and message isolation
Users SHALL only read messages and connections they participate in; admins MAY read all for moderation.

#### Scenario: Guest reads own connection messages
- **WHEN** a guest selects messages where they are sender or recipient
- **THEN** those messages are returned

#### Scenario: Guest cannot read unrelated messages
- **WHEN** a guest selects messages for a connection they are not part of
- **THEN** no rows are returned

### Requirement: Notification ownership
Users SHALL read and update only notifications where `owner_id = auth.uid()`; admins MAY read all.

#### Scenario: User marks own notifications read
- **WHEN** a user updates `notifications.read` for rows they own
- **THEN** the update succeeds

### Requirement: WhatsApp request access
Guests SHALL insert and read their own WhatsApp requests; professionals SHALL read requests involving them; admins SHALL read and update all WhatsApp requests.

#### Scenario: Guest creates WhatsApp request
- **WHEN** a guest inserts a `whatsapp_requests` row for themselves
- **THEN** the insert succeeds

#### Scenario: Admin approves WhatsApp request
- **WHEN** an admin updates a pending WhatsApp request status
- **THEN** the update succeeds

### Requirement: Admin full access via is_admin
An `is_admin()` SQL helper SHALL gate admin-only SELECT/UPDATE/DELETE policies using `profiles.role = 'admin'`.

#### Scenario: Admin deletes member
- **WHEN** an admin deletes a `profiles` row via admin UI
- **THEN** RLS permits the delete

#### Scenario: Non-admin cannot delete profiles
- **WHEN** a guest attempts to delete another profile
- **THEN** RLS denies the operation

### Requirement: Security advisor clean pass
After migration, the Supabase security advisor SHALL report zero critical RLS issues for WE-LINK tables.

#### Scenario: Advisor check after deploy
- **WHEN** `get_advisors` runs on the project after Stage 2 migration
- **THEN** no critical "RLS disabled" or "policy allows public access to sensitive data" findings remain for scoped tables
