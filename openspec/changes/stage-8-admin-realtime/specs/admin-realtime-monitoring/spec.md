## ADDED Requirements

### Requirement: Live conversation list preview updates
When the admin Real-Time Conversations Room or dashboard Live Connections widget is visible, last message preview and timestamp for any monitorable conversation SHALL update automatically when a new message is inserted, without requiring admin to re-select that conversation or reload the page.

#### Scenario: Non-selected conversation receives message
- **WHEN** a guest or professional sends a message in a monitorable conversation that is not currently selected in the Real-Time viewer
- **THEN** that conversation's list row preview and relative time update within realtime subscription latency

#### Scenario: Live Connections widget updates
- **WHEN** a new message is inserted in any dual-consented active conversation
- **THEN** the home Live Connections widget snippet and time update without manual refresh while the admin dashboard is open

### Requirement: Consent eligibility appears live
When both guest and professional grant monitoring consent on an active conversation, that conversation SHALL become eligible to appear in admin monitorable lists without a full page reload.

#### Scenario: Second consent granted
- **WHEN** the second monitoring consent flag is set on a conversation while an admin has the Real-Time section or dashboard home open
- **THEN** the conversation appears in the monitorable list if it was previously excluded

#### Scenario: Partial consent remains hidden
- **WHEN** only one party has granted monitoring consent
- **THEN** the conversation remains absent from admin monitorable lists and realtime message feeds

### Requirement: Admin communication queue live updates
The admin Communication section and dashboard communication summary SHALL reflect new guest communication requests without manual refresh.

#### Scenario: Guest submits request
- **WHEN** a guest creates a pending communication request
- **THEN** admin Communication tables show the new pending row and pending count updates within realtime subscription latency

#### Scenario: Request status changes
- **WHEN** an admin approves or rejects a communication request
- **THEN** the Communication section row status updates without requiring navigation away and back

### Requirement: Admin notification live delivery
Admin notification surfaces (topbar bell dropdown and Notifications section) SHALL append new admin-targeted notifications without manual refresh.

#### Scenario: New admin notification inserted
- **WHEN** a notification row is created for an admin profile
- **THEN** the bell unread indicator and notification list update within realtime subscription latency

#### Scenario: Non-admin notification ignored in admin feed
- **WHEN** a notification is created for a guest or professional only
- **THEN** admin notification subscriptions do not display that row in admin-specific feeds

### Requirement: Realtime connection health indicator
The admin Real-Time Conversations section SHALL display Realtime channel connection status and recover from transient disconnects without duplicate subscriptions.

#### Scenario: Connection lost and restored
- **WHEN** the Realtime WebSocket disconnects and reconnects
- **THEN** the UI shows a reconnecting or disconnected state and resumes subscriptions without duplicate message events

#### Scenario: Clean teardown on section leave
- **WHEN** admin navigates away from Real-Time Conversations or closes the admin dashboard
- **THEN** all Stage 8 admin feed subscriptions are removed along with Stage 7 message subscriptions

### Requirement: Real-Time room search and filter
Admin SHALL filter the Real-Time conversation list by guest name, professional name, or specialization text without leaving the Real-Time section.

#### Scenario: Filter narrows list
- **WHEN** admin enters search text matching one participant name
- **THEN** only matching monitorable conversations remain visible in the list

#### Scenario: Clear filter restores full list
- **WHEN** admin clears the search field
- **THEN** all monitorable conversations are shown again

### Requirement: Participant live messaging
Guest and professional chat panels SHALL append incoming messages in the active conversation without full page reload when the chat room is open.

#### Scenario: Guest receives message while chat open
- **WHEN** a professional sends a message in an active conversation and the guest chat room is open
- **THEN** the message appears in the guest chat panel without manual refresh

#### Scenario: Professional receives message while chat open
- **WHEN** a guest sends a message in an active conversation and the professional chat room is open
- **THEN** the message appears in the professional chat panel without manual refresh

#### Scenario: Chat closed does not require subscription
- **WHEN** a participant is not viewing an active conversation chat panel
- **THEN** the client MAY omit message subscriptions to conserve Realtime connections

### Requirement: Consent eligibility propagates without reload
Admin monitorable lists SHALL reflect consent eligibility changes through Realtime conversation updates without requiring a full page reload, while continuing to enforce dual-consent and RLS on all message events.

#### Scenario: Non-consented message not delivered
- **WHEN** admin's realtime subscription receives database events
- **THEN** messages from conversations without dual consent are not delivered to admin clients

#### Scenario: Consent granted mid-session without reload
- **WHEN** both parties grant monitoring consent on a previously non-consented conversation while the admin dashboard is open
- **THEN** that conversation appears in the admin monitorable list automatically without requiring a full page reload
