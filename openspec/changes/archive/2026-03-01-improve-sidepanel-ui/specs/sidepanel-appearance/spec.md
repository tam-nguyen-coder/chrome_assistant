## ADDED Requirements

### Requirement: Suggested Prompt Chips
The empty conversation state SHALL display a set of clickable suggestion chips that allow users to start a conversation with a single click.

#### Scenario: Chips displayed on empty state
- **WHEN** the chat has no messages and the API config is valid
- **THEN** the system displays at least 3 suggested prompt chips below the "Start a Conversation" heading

#### Scenario: Chip triggers conversation
- **WHEN** the user clicks a suggestion chip
- **THEN** the system sends the chip's text as a user message and begins streaming an AI response

---

### Requirement: Syntax Highlighted Code Blocks
AI response code blocks SHALL render with syntax highlighting using PrismJS for supported languages.

#### Scenario: Code block with language tag
- **WHEN** an AI response contains a fenced code block with a language identifier (e.g., ` ```python `)
- **THEN** the code block renders with PrismJS syntax-highlighted tokens for that language

#### Scenario: Code block without language tag
- **WHEN** an AI response contains a fenced code block without a language identifier
- **THEN** the code block renders as plain monospaced text without highlighting

---

### Requirement: Typing Indicator
The system SHALL display an animated typing indicator when the AI is generating a response and no content has been received yet.

#### Scenario: Indicator shown during initial streaming
- **WHEN** a user message is sent and the AI response is being generated but no text has arrived yet
- **THEN** an animated dot-pulse typing indicator is displayed inside the assistant message bubble

#### Scenario: Indicator replaced by content
- **WHEN** the first chunk of AI response text arrives
- **THEN** the typing indicator is replaced by the actual response content

---

### Requirement: New Chat Button
The side panel header SHALL include a "New Chat" button that clears the current conversation.

#### Scenario: New chat from active conversation
- **WHEN** the user clicks the "New Chat" button while messages exist
- **THEN** all messages are cleared and the empty state with suggestion chips is shown

#### Scenario: Button visibility
- **WHEN** the side panel is open
- **THEN** the "New Chat" button is always visible in the header

---

### Requirement: Styled Markdown Tables
AI response markdown tables SHALL render with visual styling that matches the dark theme.

#### Scenario: Table rendering
- **WHEN** an AI response contains a markdown table
- **THEN** the table renders with bordered cells, a styled header row, and alternating row backgrounds
