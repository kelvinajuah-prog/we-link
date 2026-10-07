# guest-profiles Specification

## Purpose

Enables guest users to create complete profiles, view their own data, and browse approved professionals for discovery.

## Requirements

### Requirement: Guest profile fields
A guest profile SHALL include name, email, town, area, specialization, skills, profile picture, and age.

#### Scenario: Guest registers with town and area
- **WHEN** a guest completes registration with town and area fields
- **THEN** `guest_profiles.town` and `guest_profiles.area` are persisted

#### Scenario: Guest dashboard shows profile
- **WHEN** a signed-in guest views their dashboard
- **THEN** they see name, photo, town, area, specialization, and skills

### Requirement: Browse approved professionals
Guests SHALL browse and view profiles of professionals with `approved` status only.

#### Scenario: Pending professional hidden from browse
- **WHEN** a guest opens the professional directory
- **THEN** professionals with non-approved status are not listed

#### Scenario: Guest views professional detail
- **WHEN** a guest opens an approved professional profile
- **THEN** they see name, photo, specialization, location, biography, and achievements

### Requirement: Guest cannot access admin or pro-only tools
Guests MUST NOT access admin dashboard, professional approval tools, or professional-only management features.

#### Scenario: Guest blocked from admin area
- **WHEN** a guest navigates to admin URLs
- **THEN** they are redirected to login or denied access

### Requirement: Guest cannot request communication with another guest
The platform SHALL NOT offer guest-to-guest communication request flows in this stage.

#### Scenario: No guest-to-guest request button
- **WHEN** a guest browses profiles
- **THEN** only approved professional profiles show communication entry points (when Stage 4 enables them)
