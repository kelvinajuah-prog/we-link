## Purpose

Establishes a clean Supabase schema baseline for WE-LINK by removing payment-related data, simplifying professional lifecycle status, and adding profile fields required by later marketplace stages.

## ADDED Requirements

### Requirement: Payment columns removed from professional profiles

The system SHALL NOT store payment, subscription, MoMo, or receipt data in `professional_profiles` or any related table after migration.

#### Scenario: Migration drops payment columns

- **WHEN** the Stage 1 database migration is applied
- **THEN** columns including `months`, `amount`, `charge`, `total`, `payment_screenshot_url`, `screenshot_submitted_at`, `subscription_valid_until`, `terms_accepted`, and `admin_paid_confirm` are removed from `professional_profiles`

#### Scenario: No payment data in API responses

- **WHEN** a client queries `professional_profiles` after migration
- **THEN** no payment or subscription fields are returned

### Requirement: Professional status simplified

The system SHALL represent professional approval lifecycle using only: `pending`, `approved`, `rejected`, `suspended`, and `deactivated`.

#### Scenario: Legacy payment statuses migrated

- **WHEN** existing rows have statuses such as `accepted`, `awaiting_payment`, `screenshot_submitted`, or `active`
- **THEN** they are migrated to `pending` or `approved` according to migration rules documented in design.md

#### Scenario: Invalid status rejected

- **WHEN** an insert or update sets professional status outside the allowed enum
- **THEN** the database rejects the operation

### Requirement: Foundation profile columns added

The system SHALL support extended profile fields needed by later stages without implementing their full workflows in Stage 1.

#### Scenario: Guest location fields

- **WHEN** the migration completes
- **THEN** `guest_profiles` includes nullable `town` and `area` text columns

#### Scenario: Professional enrichment fields

- **WHEN** the migration completes
- **THEN** `professional_profiles` includes nullable `achievements` text, nullable `rejection_reason` text, and nullable `approved_at` timestamptz columns

#### Scenario: Account status on profiles

- **WHEN** the migration completes
- **THEN** `profiles` includes `account_status` with allowed values `active`, `suspended`, and `deactivated`, defaulting to `active`

### Requirement: Legacy stub table removed

The system SHALL remove the unused `we-link` stub table if it contains no production data.

#### Scenario: Empty legacy table dropped

- **WHEN** the `we-link` table has zero rows
- **THEN** the migration drops the table

### Requirement: Schema supports existing Supabase integration

The system SHALL retain and not break existing tables used by the current app: `profiles`, `guest_profiles`, `professional_profiles`, `connections`, `messages`, `notifications`, and `whatsapp_requests`.

#### Scenario: Core tables remain queryable

- **WHEN** Stage 1 migration completes
- **THEN** all listed tables remain present (except dropped `we-link`) and accept reads/writes per existing RLS until Stage 2 RLS rewrite
