## MODIFIED Requirements

### Requirement: Provider Selection
The Options page SHALL allow users to select from predefined LLM providers or configure a custom provider.

#### Scenario: Provider dropdown displayed
- **WHEN** the user opens the Options page
- **THEN** a provider selector dropdown is displayed with options: Anthropic, Blackbox AI, OpenRouter, and Custom

#### Scenario: Selecting Anthropic provider
- **WHEN** the user selects "Anthropic" from the provider dropdown
- **THEN** the base URL is auto-filled to `https://api.anthropic.com` and the model dropdown shows Anthropic models

#### Scenario: Selecting Blackbox AI provider
- **WHEN** the user selects "Blackbox AI" from the provider dropdown
- **THEN** the base URL is auto-filled to the Blackbox AI API endpoint and the model dropdown shows Blackbox AI models

#### Scenario: Selecting OpenRouter provider
- **WHEN** the user selects "OpenRouter" from the provider dropdown
- **THEN** the base URL is auto-filled to `https://openrouter.ai/api` and the model dropdown shows curated OpenRouter models

#### Scenario: Selecting Custom provider
- **WHEN** the user selects "Custom" from the provider dropdown
- **THEN** the base URL field becomes editable for manual input

---

### Requirement: Provider-Specific Model Dropdown
The Options page SHALL display a model dropdown with relevant models based on the selected provider.

#### Scenario: Anthropic models shown
- **WHEN** Anthropic provider is selected
- **THEN** the model dropdown shows Anthropic Claude models (e.g., claude-sonnet-4-20250514, claude-opus-4-20250514)

#### Scenario: Blackbox AI models shown
- **WHEN** Blackbox AI provider is selected
- **THEN** the model dropdown shows available Blackbox AI models

#### Scenario: OpenRouter models shown
- **WHEN** OpenRouter provider is selected
- **THEN** the model dropdown shows curated OpenRouter models from different capability tiers

#### Scenario: Custom provider model input
- **WHEN** Custom provider is selected
- **THEN** the model field allows free-form text input
