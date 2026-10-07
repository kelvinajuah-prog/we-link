## Purpose

Provides administrators a Real-Time Conversations Room to monitor active guest–professional conversations with live message updates and participant presence, subject to dual monitoring consent enforced by RLS.

## ADDED Requirements

### Requirement: Real-Time Conversations Room layout
The admin dashboard SHALL include a Real-Time Conversations Room with a conversation list on one side and a selected conversation message viewer on the other.

#### Scenario: Admin selects conversation
- **WHEN** admin clicks a conversation in the list
- **THEN** the full message history and participant information appear in the viewer panel

#### Scenario: No conversation selected
- **WHEN** admin opens the Real-Time Conversations Room without selecting a conversation
- **THEN** the viewer panel shows an empty state prompting selection from the list

### Requirement: Conversation list metadata
Each conversation in the list SHALL show guest and professional names, photos, specializations, last message preview, last message time, conversation status, and WhatsApp exchange status where applicable.

#### Scenario: List shows consented active conversations
- **WHEN** admin opens the Real-Time Conversations Room
- **THEN** only active conversations where both guest and professional have granted monitoring consent appear with last message metadata

#### Scenario: Non-consented conversation excluded from list
- **WHEN** a conversation exists but dual monitoring consent is incomplete
- **THEN** that conversation does not appear in the Real-Time Conversations list

### Requirement: Live message updates via Supabase Realtime
New messages in the selected conversation SHALL appear automatically without page refresh using Supabase Realtime subscriptions on the messages table filtered by `conversation_id`.

#### Scenario: New message appears live
- **WHEN** a guest or professional sends a message in the selected conversation
- **THEN** the message appears in the admin viewer within realtime subscription latency without manual refresh

#### Scenario: Admin switches conversation subscription
- **WHEN** admin selects a different conversation from the list
- **THEN** the viewer updates to that conversation's messages and the previous realtime subscription is torn down before subscribing to the new conversation

### Requirement: Presence and live connections
The admin dashboard SHALL display online or offline status for conversation participants using Supabase Realtime Presence (or equivalent), in the Live Connections widget on the dashboard home and in the Real-Time Conversations list.

#### Scenario: Offline participant indicated
- **WHEN** a conversation participant is not present on the platform
- **THEN** their status is shown as offline in the connections view

#### Scenario: Participant comes online
- **WHEN** a guest or professional opens the platform while an admin views Live Connections
- **THEN** their presence status updates to online without a full page reload

### Requirement: Admin monitoring restricted by consent and RLS
Admin realtime subscriptions and message reads SHALL only receive events for conversations where both guest and professional have granted monitoring consent, enforced by RLS and Realtime publication filters.

#### Scenario: Non-consented message not delivered
- **WHEN** admin's realtime subscription receives database events
- **THEN** messages from conversations without dual consent are not delivered to admin clients

#### Scenario: Consent granted mid-session
- **WHEN** both parties grant monitoring consent on a previously non-consented conversation
- **THEN** that conversation becomes eligible to appear in the admin list on the next load or list refresh

### Requirement: Admin switches between conversations
Admin SHALL switch between multiple guest–professional conversations without leaving the Real-Time Conversations Room.

#### Scenario: Switch conversation context
- **WHEN** admin selects a different conversation from the list
- **THEN** the viewer updates to that conversation's messages and participant header without navigating away from the Real-Time section

### Requirement: Realtime cleanup on navigation
The admin client SHALL unsubscribe from Realtime channels when the admin leaves the Real-Time Conversations section or closes the admin dashboard.

#### Scenario: Admin navigates away
- **WHEN** admin navigates from Real-Time Conversations to another admin section
- **THEN** active message and presence subscriptions are removed to avoid duplicate listeners

### Requirement: Participant live messaging optional enhancement
Guest and professional chat panels MAY subscribe to their own active conversation for live message append; this behavior is optional in Stage 7 and MUST NOT bypass consent or RLS rules.

#### Scenario: Participant receives own conversation message
- **WHEN** a guest or professional has an active conversation open and the other party sends a message
- **THEN** the message MAY appear in the participant's chat panel without full page reload if realtime is enabled for that role
