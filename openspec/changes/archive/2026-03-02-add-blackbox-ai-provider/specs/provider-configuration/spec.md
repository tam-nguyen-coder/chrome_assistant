# provider-configuration Specification

## Purpose
Defines how users configure LLM providers in the extension, including preset providers (Anthropic, Blackbox AI) and custom provider options.

## ADDED Requirements

### Requirement: Provider Selection
The Options page SHALL allow users to select from predefined LLM providers or configure a custom provider.

#### Scenario: Provider dropdown displayed
- **WHEN** the user opens the Options page
- **THEN** a provider selector dropdown is displayed with options: Anthropic, Blackbox AI, and Custom

#### Scenario: Selecting Anthropic provider
- **WHEN** the user selects "Anthropic" from the provider dropdown
- **THEN** the base URL is auto-filled to `https://api.anthropic.com` and the model dropdown shows Anthropic models

#### Scenario: Selecting Blackbox AI provider
- **WHEN** the user selects "Blackbox AI" from the provider dropdown
- **THEN** the base URL is auto-filled to the Blackbox AI API endpoint and the model dropdown shows Blackbox AI models

#### Scenario: Selecting Custom provider
- **WHEN** the user selects "Custom" from the provider dropdown
- **THEN** the base URL field becomes editable for manual input

---

### Requirement: Blackbox AI Provider Preset
The system SHALL provide a preset configuration for Blackbox AI with predefined base URL and model options.

#### Scenario: Blackbox AI base URL
- **WHEN** Blackbox AI provider is selected
- **THEN** the base URL is set to `https://api.blackbox.ai` (or the correct Blackbox AI API endpoint)

#### Scenario: Blackbox AI model selection
- **WHEN** Blackbox AI provider is selected
- **THEN** the model dropdown includes common Blackbox AI models for user selection

#### Scenario: Blackbox AI custom model
- **WHEN** the user wants to use a model not in the preset list
- **THEN** the user can type a custom model name

---

### Requirement: Provider-Specific Model Dropdown
The Options page SHALL display a model dropdown with relevant models based on the selected provider.

#### Scenario: Anthropic models shown
- **WHEN** Anthropic provider is selected
- **THEN** the model dropdown shows Anthropic Claude models (e.g., claude-sonnet-4-20250514, claude-opus-4-20250514)

#### Scenario: Blackbox AI models shown
- **WHEN** Blackbox AI provider is selected
- **THEN** the model dropdown shows available Blackbox AI models

#### Scenario: Custom provider model input
- **WHEN** Custom provider is selected
- **THEN** the model field allows free-form text input

---

### Requirement: Configuration Persistence
The selected provider and its configuration SHALL be persisted in chrome.storage.local.

#### Scenario: Save provider selection
- **WHEN** the user saves the configuration
- **THEN** the provider identifier is stored alongside baseUrl, apiKey, and model

#### Scenario: Load saved provider
- **WHEN** the Options page is opened with existing configuration
- **THEN** the provider dropdown is set to the previously saved provider

---

### Requirement: Backward Compatibility
Existing configurations without a provider field SHALL be treated as Custom provider configurations.

#### Scenario: Legacy config migration
- **WHEN** a configuration exists without a provider field
- **THEN** the system treats it as a Custom provider and preserves the existing baseUrl and model values

#### Scenario: Anthropic detection for legacy configs
- **WHEN** a legacy configuration has `api.anthropic.com` as the base URL
- **THEN** the system may auto-detect and set the provider to Anthropic
