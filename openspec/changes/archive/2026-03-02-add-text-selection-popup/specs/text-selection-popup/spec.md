## ADDED Requirements

### Requirement: Selection Popup Appearance
The system SHALL display a small floating popup near the user's text selection on any webpage.

#### Scenario: Popup appears on text selection
- **WHEN** the user selects text on any webpage
- **THEN** a floating popup appears near the end of the selection, containing a translate icon button and an expand arrow button

#### Scenario: Popup does not appear on empty selection
- **WHEN** the user clicks without selecting any text
- **THEN** no popup is displayed

#### Scenario: Popup is style-isolated
- **WHEN** the popup is rendered on any webpage
- **THEN** the popup uses Shadow DOM so its styles do not conflict with the host page

---

### Requirement: Quick Translate Action
The system SHALL provide a one-click translate button on the floating popup.

#### Scenario: Quick translate sends text to side panel
- **WHEN** the user selects text and clicks the translate icon on the popup
- **THEN** the side panel opens and the selected text is sent for translation

#### Scenario: Quick translate uses existing translate prompt
- **WHEN** the translate action is triggered
- **THEN** the system uses the same translation prompt as the existing context menu translate action

---

### Requirement: AI Actions Dropdown
The system SHALL provide an expandable dropdown on the floating popup with multiple AI actions.

#### Scenario: Dropdown opens on arrow click
- **WHEN** the user clicks the expand arrow on the popup
- **THEN** a dropdown appears showing available AI actions (Explain, Summarize, Rewrite, Translate)

#### Scenario: Dropdown action sends text to side panel
- **WHEN** the user selects an action from the dropdown
- **THEN** the side panel opens and the selected text is sent with the corresponding action prompt

---

### Requirement: Popup Auto-Dismiss
The system SHALL automatically dismiss the popup when it is no longer relevant.

#### Scenario: Dismiss on click outside
- **WHEN** the user clicks anywhere outside the popup
- **THEN** the popup is hidden

#### Scenario: Dismiss on new selection
- **WHEN** the user begins a new text selection
- **THEN** the previous popup is hidden

#### Scenario: Dismiss on scroll
- **WHEN** the user scrolls the page
- **THEN** the popup is hidden

#### Scenario: Dismiss on escape key
- **WHEN** the user presses the Escape key
- **THEN** the popup is hidden
