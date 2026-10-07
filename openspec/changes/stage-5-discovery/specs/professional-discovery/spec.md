## Purpose

Enables guests, professionals, and public visitors to discover approved professionals through searchable, filterable directories without initiating communication.

## ADDED Requirements

### Requirement: Approved-only directory
The system SHALL list only professionals with `approved` status in all discovery views.

#### Scenario: Pending professional excluded from directory
- **WHEN** a user opens any professional directory (dashboard, public page)
- **THEN** professionals with status other than `approved` are not shown

#### Scenario: Rejected professional excluded
- **WHEN** a guest searches the directory
- **THEN** rejected or pending professionals never appear in results

### Requirement: Guest discovery with matching
Guests SHALL browse approved professionals and see skill-based matches derived from their specialization and skills.

#### Scenario: Guest sees matched professionals
- **WHEN** a signed-in guest opens the professional directory
- **THEN** they see a list of approved professionals prioritized by relevance to their specialization/skills

#### Scenario: Guest filters by specialization
- **WHEN** a guest filters the directory by skill or specialization category
- **THEN** only approved professionals matching the filter are shown

#### Scenario: Guest views professional detail
- **WHEN** a guest opens an approved professional profile
- **THEN** they see name, photo, skill, location, biography, and achievements

### Requirement: Professional read-only discovery
Approved professionals SHALL browse other approved professionals for discovery only without communication actions.

#### Scenario: Pro views peer directory
- **WHEN** an approved professional opens the professional directory
- **THEN** they see other approved professionals' public profile information

#### Scenario: Pro cannot request communication with another pro
- **WHEN** a professional views another professional's profile in the directory
- **THEN** no "Request Communication" or equivalent action is displayed

#### Scenario: Pro-to-pro request blocked at API
- **WHEN** a professional attempts to create a communication request targeting another professional programmatically
- **THEN** the system rejects the request

### Requirement: Public professional listing
Anonymous and signed-out visitors SHALL browse approved professionals on public pages without authentication.

#### Scenario: Public professionals page
- **WHEN** a visitor opens `professionals.html`
- **THEN** approved professionals are listed with name, skill, location, and bio preview from Supabase

#### Scenario: Landing page featured professionals
- **WHEN** a visitor opens the marketing homepage
- **THEN** a section shows live approved professionals (or empty state if none)

### Requirement: Discovery search
Users SHALL search the directory by professional name, skill, or location text.

#### Scenario: Search filters results
- **WHEN** a user types in the directory search field
- **THEN** visible professionals filter to those matching the query in name, skill, or location

### Requirement: No communication in discovery stage
Discovery views SHALL NOT expose active communication or messaging controls until the communication stage ships.

#### Scenario: Guest detail has no active comm button
- **WHEN** a guest views a professional profile in Stage 5
- **THEN** communication request controls are hidden or show a non-actionable "coming soon" state
