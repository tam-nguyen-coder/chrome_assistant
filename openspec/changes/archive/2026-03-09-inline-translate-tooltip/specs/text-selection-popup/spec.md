## MODIFIED Requirements

### Requirement: Quick Translate Action
The system SHALL provide a one-click translate button on the floating popup that shows the translation result inline.

#### Scenario: Quick translate shows inline tooltip
- **WHEN** the user selects text and clicks the translate icon on the popup
- **THEN** the popup bar is hidden and an inline tooltip appears near the selected text showing the translation result streamed from the LLM API

#### Scenario: Quick translate uses existing translate prompt
- **WHEN** the translate action is triggered
- **THEN** the system uses the same translation prompt as the existing context menu translate action
