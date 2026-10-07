## Purpose

Governs guest-to-professional communication requests, admin approve/reject, guest cancel, cooldown rules, active conversations, in-app messaging, monitoring consent, and notifications to professionals and admins.

## ADDED Requirements

### Requirement: Only guests may request communication
Only guests SHALL create communication requests targeting approved professionals. Professionals MUST NOT create communication requests with other professionals or with guests.

#### Scenario: Guest requests communication with approved pro
- **WHEN** a guest submits a communication request to an approved professional
- **THEN** a row is created with status `pending`, the professional is notified, every admin is notified, and no conversation or messaging is enabled yet

#### Scenario: Pro cannot request communication
- **WHEN** a professional attempts to create a communication request targeting any user
- **THEN** the request is rejected and no row is created

#### Scenario: Guest cannot request unapproved pro
- **WHEN** a guest attempts to request communication with a professional whose status is not `approved`
- **THEN** the request is rejected

#### Scenario: Duplicate pending request blocked
- **WHEN** a guest submits a communication request while an existing `pending` request exists for the same professional
- **THEN** the duplicate is rejected with a clear error

### Requirement: Admin approves or rejects requests
Admin SHALL approve or reject pending communication requests. Professionals MUST NOT change request status. Chat MUST NOT start until admin approves.

#### Scenario: Admin approves request
- **WHEN** an admin approves a pending communication request
- **THEN** request status becomes `accepted`, `responded_at` is recorded, an active conversation is created, and both guest and professional are notified

#### Scenario: Admin rejects request
- **WHEN** an admin rejects a pending communication request
- **THEN** request status becomes `rejected`, `rejected_at` is recorded, no conversation is created, and the guest is notified that a 24-hour cooldown applies

#### Scenario: Professional cannot accept on their own
- **WHEN** a professional attempts to accept or reject a communication request
- **THEN** the mutation is denied and the request stays pending until admin acts

### Requirement: Guest may cancel pending requests
A guest SHALL cancel their own pending communication request before admin responds.

#### Scenario: Guest cancels pending request
- **WHEN** a guest cancels a pending request they own
- **THEN** request status becomes `cancelled` and the professional is notified

#### Scenario: Guest re-requests immediately after cancel
- **WHEN** a guest cancels a pending request and immediately submits a new request to the same professional
- **THEN** the new request is allowed with status `pending`

### Requirement: Twenty-four hour cooldown after rejection
After admin rejects a communication request, the same guest MUST wait 24 hours before submitting a new request to that professional.

#### Scenario: Re-request blocked within cooldown
- **WHEN** a guest submits a new request to the same professional within 24 hours of `rejected_at`
- **THEN** the request is rejected with a cooldown message indicating when re-request is allowed

#### Scenario: Re-request allowed after cooldown
- **WHEN** a guest submits a new request to the same professional after 24 hours from `rejected_at`
- **THEN** the request is created with status `pending`

### Requirement: Active conversation messaging
Guest and professional SHALL exchange messages only within an active conversation created after admin approval.

#### Scenario: Message sent in active conversation
- **WHEN** a participant sends a message in a conversation with status `active`
- **THEN** the message is stored with `conversation_id` and the other participant is notified

#### Scenario: Message blocked without active conversation
- **WHEN** a user attempts to send a message without an approved request and active conversation
- **THEN** the message is rejected and the UI shows that communication is not yet active

#### Scenario: Messaging blocked for pending pro
- **WHEN** a professional with status other than `approved` attempts to send or receive platform messages
- **THEN** messaging is denied by application guards and RLS

### Requirement: Monitoring consent before admin message visibility
Both guest and professional MUST record monitoring consent on the conversation before admin may read message content.

#### Scenario: Admin cannot view without dual consent
- **WHEN** admin attempts to load messages for a conversation where either `monitoring_consent_guest` or `monitoring_consent_pro` is false
- **THEN** message body content is not returned to admin

#### Scenario: Admin can view with dual consent
- **WHEN** both guest and professional have recorded monitoring consent on the conversation
- **THEN** admin may read the full message history subject to RLS

#### Scenario: Consent does not block guest-pro messaging
- **WHEN** admin approves a request and either party has not yet recorded consent
- **THEN** guest and professional may still exchange messages between themselves

### Requirement: Communication notifications
The system SHALL deliver in-app notifications for communication lifecycle events to affected parties.

#### Scenario: Pro and admin notified of new request
- **WHEN** a guest submits a communication request
- **THEN** the targeted professional receives a notification and every admin receives a notification

#### Scenario: Guest and pro notified of approval
- **WHEN** an admin approves a communication request
- **THEN** the guest and the professional receive notifications that the room is open

#### Scenario: Guest notified of rejection
- **WHEN** an admin rejects a communication request
- **THEN** the guest receives a notification including that a 24-hour cooldown applies before re-request

#### Scenario: Participant notified of new message
- **WHEN** a message is sent in an active conversation
- **THEN** the recipient receives a notification

### Requirement: Admin communication management
Admin SHALL view all communication requests and approve or reject pending ones.

#### Scenario: Admin views pending requests
- **WHEN** admin opens the Communication section
- **THEN** pending, accepted, rejected, and cancelled requests are listed with guest name, professional name, status, timestamps, and Approve/Reject actions on pending rows

#### Scenario: Admin views active conversations
- **WHEN** admin opens conversation oversight for a dual-consented conversation
- **THEN** message history is visible read-only
