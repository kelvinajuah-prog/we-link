# pro-approval-workflow Specification

## Purpose

Defines the complete professional approval lifecycle: admin review, approve/reject with optional reason, notifications, and professional resubmit after rejection.

## Requirements

### Requirement: Admin approves pending professional
An admin SHALL approve pending professional applications, setting status to `approved` and recording `approved_at`.

#### Scenario: Approve updates status and notifies pro
- **WHEN** admin clicks Approve on a pending application
- **THEN** `professional_profiles.status` becomes `approved`, `approved_at` is set, and the professional receives an approval notification

#### Scenario: Approved pro gains directory access
- **WHEN** a professional's status becomes `approved`
- **THEN** they appear in public approved-professional queries and may access approved-only dashboard features

### Requirement: Admin rejects with optional reason
An admin SHALL reject pending applications and MAY provide a rejection reason persisted to `professional_profiles.rejection_reason`.

#### Scenario: Reject with reason
- **WHEN** admin rejects an application and enters a reason
- **THEN** status becomes `rejected`, `rejection_reason` is saved, and the professional receives a notification containing the reason

#### Scenario: Reject without reason
- **WHEN** admin rejects without entering a reason
- **THEN** status becomes `rejected` and the professional receives a generic rejection notification

### Requirement: Admin notified on new professional registration
The system SHALL notify administrators when a new professional registration is submitted.

#### Scenario: Admin notification on register
- **WHEN** a professional completes registration with pending status
- **THEN** at least one admin receives an in-app notification about the pending application

### Requirement: Professional pending state
Professionals with `pending` status SHALL see a waiting state and MUST NOT access approved-only features (directory browse as pro, messaging).

#### Scenario: Pending pro blocked from pro features
- **WHEN** a pending professional signs in
- **THEN** they see a pending-approval message and cannot browse or message as an approved pro

### Requirement: Professional rejected resubmit
Rejected professionals SHALL view their rejection reason and resubmit updated profile information, returning status to `pending`.

#### Scenario: Rejected pro sees reason
- **WHEN** a rejected professional opens their dashboard
- **THEN** they see the rejection reason if one was provided

#### Scenario: Resubmit clears rejection and resets pending
- **WHEN** a rejected professional submits the resubmit form with valid data
- **THEN** status returns to `pending`, `rejection_reason` is cleared, and admin is notified of the updated application

### Requirement: Admin application review shows full profile
The admin pending applications view SHALL display name, photo, phone, skill, location, bio, achievements, and submission date.

#### Scenario: Admin reviews application detail
- **WHEN** admin opens the Professionals section with pending applications
- **THEN** each row shows sufficient detail to approve or reject without opening Supabase dashboard
