## ADDED Requirements

### Requirement: Inline Translation Tooltip
The system SHALL display an inline tooltip near the selected text showing the LLM translation result when the user clicks the quick-translate button.

#### Scenario: Tooltip appears after clicking translate
- **WHEN** the user selects text and clicks the translate (🌐) button on the popup
- **THEN** the popup bar is hidden and a tooltip card appears near the selected text showing a loading indicator

#### Scenario: Translation streams into tooltip
- **WHEN** the LLM API responds with translation chunks
- **THEN** the tooltip displays the translated text progressively as it streams in

#### Scenario: Translation completes
- **WHEN** the LLM API finishes streaming the response
- **THEN** the tooltip displays the complete translated text and the loading indicator is removed

---

### Requirement: Tooltip Error Handling
The system SHALL display meaningful error messages in the tooltip when the translation fails.

#### Scenario: API error shown in tooltip
- **WHEN** the LLM API returns an error (e.g., 401, 429, network failure)
- **THEN** the tooltip displays an error message describing the failure

#### Scenario: No API configuration
- **WHEN** the user clicks translate but no LLM config (API key) is set
- **THEN** the tooltip displays a message instructing the user to configure the API in settings

---

### Requirement: Tooltip Dismiss Behavior
The system SHALL auto-dismiss the tooltip consistent with the existing popup dismiss behavior.

#### Scenario: Dismiss on click outside
- **WHEN** the user clicks anywhere outside the tooltip
- **THEN** the tooltip is hidden

#### Scenario: Dismiss on scroll
- **WHEN** the user scrolls the page
- **THEN** the tooltip is hidden

#### Scenario: Dismiss on Escape key
- **WHEN** the user presses the Escape key
- **THEN** the tooltip is hidden

#### Scenario: Dismiss on new text selection
- **WHEN** the user begins a new text selection
- **THEN** the previous tooltip is hidden

---

### Requirement: Tooltip Visual Design
The system SHALL style the tooltip with the same dark theme as the popup, using Shadow DOM for style isolation.

#### Scenario: Tooltip matches extension theme
- **WHEN** the tooltip is displayed
- **THEN** it uses the dark theme (dark background, light text) consistent with the popup styling

#### Scenario: Tooltip has bounded dimensions
- **WHEN** a long translation result is shown
- **THEN** the tooltip has a max-width and max-height with scrollable overflow for content that exceeds the bounds

#### Scenario: Tooltip is style-isolated
- **WHEN** the tooltip is rendered on any webpage
- **THEN** the tooltip uses the existing Shadow DOM host so its styles do not conflict with the host page
