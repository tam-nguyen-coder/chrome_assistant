# openrouter-provider Specification

## Purpose
Defines the OpenRouter provider preset configuration, including API headers and authentication. Created by archiving change add-openrouter-provider.

## Requirements

### Requirement: OpenRouter Provider Preset
The system SHALL provide a preset configuration for OpenRouter with a predefined base URL and curated model options.

#### Scenario: OpenRouter base URL
- **WHEN** OpenRouter provider is selected
- **THEN** the base URL is set to `https://openrouter.ai/api`

#### Scenario: OpenRouter model selection
- **WHEN** OpenRouter provider is selected
- **THEN** the model dropdown includes a curated list of popular OpenRouter models spanning different capability tiers

#### Scenario: OpenRouter custom model
- **WHEN** the user wants to use a model not in the preset list
- **THEN** the user can type a custom model identifier (e.g., `meta-llama/llama-3-70b-instruct`)

---

### Requirement: OpenRouter API Headers
The system SHALL send OpenRouter-recommended attribution headers when using the OpenRouter provider.

#### Scenario: Attribution headers sent
- **WHEN** a streaming request is made with the OpenRouter provider
- **THEN** the request includes `HTTP-Referer` and `X-Title` headers for app attribution

#### Scenario: Headers not sent for other providers
- **WHEN** a streaming request is made with a non-OpenRouter provider
- **THEN** the request does NOT include `HTTP-Referer` or `X-Title` headers

---

### Requirement: OpenRouter Authentication
The system SHALL use Bearer token authentication for OpenRouter API calls.

#### Scenario: Bearer token in Authorization header
- **WHEN** a streaming request is made with the OpenRouter provider
- **THEN** the `Authorization` header is set to `Bearer <apiKey>`

#### Scenario: User enters API key
- **WHEN** the user selects OpenRouter and enters their API key
- **THEN** the API key is stored in `chrome.storage.local` alongside the provider configuration
