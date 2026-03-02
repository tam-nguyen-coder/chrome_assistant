# Implementation Tasks

## 1. Provider Configuration Data Structure
- [x] 1.1 Define provider presets (Anthropic, Blackbox AI, Custom)
- [x] 1.2 Update DEFAULT_CONFIG to include provider field
- [x] 1.3 Add Blackbox AI base URL and default model constants

## 2. Options Page UI Updates
- [x] 2.1 Add provider selector dropdown above Base URL field
- [x] 2.2 Implement auto-fill logic when provider is selected
- [x] 2.3 Show/hide Base URL field based on provider selection (hidden for preset providers, shown for Custom)
- [x] 2.4 Add model dropdown with preset options for each provider
- [x] 2.5 Allow custom model input for advanced users

## 3. Streaming Logic Updates
- [x] 3.1 Verify Blackbox AI uses OpenAI-compatible streaming format
- [x] 3.2 Update useStreaming.js if needed for Blackbox AI-specific headers
- [x] 3.3 Test streaming with Blackbox AI API

## 4. Storage & Migration
- [x] 4.1 Ensure backward compatibility with existing configs (no provider field = treat as Custom)
- [x] 4.2 Add migration logic to detect existing Anthropic configs and set provider accordingly

## 5. Testing
- [x] 5.1 Test Anthropic provider selection and connection
- [x] 5.2 Test Blackbox AI provider selection and connection
- [x] 5.3 Test Custom provider with manual base URL
- [x] 5.4 Test backward compatibility with existing saved configs
- [x] 5.5 Test model switching within each provider
