## Purpose

Removes all payment and subscription concepts from the WE-LINK frontend so the product operates without MoMo, fees, receipts, or payment onboarding steps.

## ADDED Requirements

### Requirement: No payment UI in user dashboards

The system SHALL NOT display payment modals, MoMo numbers, subscription quotes, receipt upload, or payment confirmation flows on guest or professional dashboards.

#### Scenario: Professional dashboard without payment steps

- **WHEN** a professional views their dashboard in `pending`, `approved`, or `rejected` status
- **THEN** no payment modal, MoMo instructions, or receipt upload controls are shown

#### Scenario: Guest dashboard unchanged by payments

- **WHEN** a guest views their dashboard
- **THEN** no payment-related text or controls appear

### Requirement: No payment UI in admin dashboard

The system SHALL NOT display payment receipt review, grant-access-via-payment, or MoMo-related admin tabs.

#### Scenario: Admin tabs exclude payments

- **WHEN** an admin opens the admin dashboard
- **THEN** there is no "Pro receipts", payment preview modal, or grant-payment-access workflow

### Requirement: Store layer free of payment logic

The application store SHALL NOT expose payment constants, quote functions, or payment submission functions.

#### Scenario: Payment constants removed

- **WHEN** application code is searched for MoMo, monthly fee, subscription, or payment screenshot identifiers in `js/store.js`
- **THEN** no payment-related exports or business logic remain

#### Scenario: Onboarding functions simplified

- **WHEN** professional onboarding runs after Stage 1
- **THEN** flows use only `pending → approved/rejected` without terms acceptance tied to payment or screenshot submission

### Requirement: Registration and marketing copy updated

User-facing pages SHALL NOT reference fees, MoMo, subscriptions, or payment screenshots.

#### Scenario: Register pages

- **WHEN** a user views professional or main registration pages
- **THEN** copy describes admin review only, with no monthly fee or payment language

#### Scenario: Landing page

- **WHEN** a visitor views the homepage registration CTAs
- **THEN** no payment or subscription promises appear in professional signup messaging

### Requirement: Application remains functional after cleanup

Removing payment code SHALL NOT break authentication, profile loading, or basic dashboard rendering for all three roles.

#### Scenario: Guest login and dashboard

- **WHEN** a guest signs in after Stage 1
- **THEN** the dashboard loads without JavaScript errors related to removed payment code

#### Scenario: Professional pending state

- **WHEN** a professional with `pending` status signs in
- **THEN** they see a pending-approval message without payment prompts

#### Scenario: Admin dashboard loads

- **WHEN** an admin signs in
- **THEN** the admin dashboard renders without referencing removed payment panels
