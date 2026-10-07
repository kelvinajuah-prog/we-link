# professional-profiles Specification

## Purpose

Manages professional registration, profile fields, admin approval workflow integration, public discovery, and pro-to-pro browse-only access.

## Requirements

### Requirement: Professional registration fields
Professional registration SHALL capture full name, email, password, WhatsApp/phone number, specialization (skill), location, biography, achievements, and profile picture.

#### Scenario: Achievements stored separately from bio
- **WHEN** a professional submits registration with biography and achievements
- **THEN** `professional_profiles.bio` and `professional_profiles.achievements` are persisted as distinct fields

#### Scenario: Pro photo uploaded on registration
- **WHEN** a professional uploads a profile photo during registration
- **THEN** the photo is stored in Supabase Storage and `profiles.photo_url` is set

#### Scenario: New professional stored as pending
- **WHEN** a professional submits registration
- **THEN** their status is `pending` and they cannot access approved-only features

#### Scenario: Admin notified on new registration
- **WHEN** a professional completes registration
- **THEN** the admin receives a notification about the pending application

### Requirement: Admin approval workflow integration
Stage 3 SHALL surface new profile fields (achievements, photo, phone) in admin pending applications without changing approve/reject behavior.

#### Scenario: Admin sees achievements in pending list
- **WHEN** admin views pending professional applications
- **THEN** achievements and photo are visible alongside skill and location

### Requirement: Professional discovery without pro-to-pro communication
Approved professionals SHALL browse other approved professionals by specialization for discovery only. Professionals MUST NOT request communication with other professionals.

#### Scenario: Pro views another pro profile
- **WHEN** an approved professional browses the professional directory
- **THEN** they see other approved professionals' public profile information

#### Scenario: Pro cannot request communication with another pro
- **WHEN** a professional views another professional's profile
- **THEN** no "Request Communication" or equivalent action is shown

### Requirement: Rejected professional resubmit
Rejected professionals SHALL update profile fields and resubmit for pending review (existing flow preserved).

#### Scenario: Resubmit after rejection
- **WHEN** a rejected professional updates achievements and resubmits
- **THEN** status returns to `pending` and admin sees updated fields

### Requirement: No payment or subscription features
The platform SHALL NOT include payment, subscription, Mobile Money, or payment-screenshot functionality for professionals.

#### Scenario: No payment step in onboarding
- **WHEN** a professional completes registration and approval
- **THEN** no payment or subscription step is presented
