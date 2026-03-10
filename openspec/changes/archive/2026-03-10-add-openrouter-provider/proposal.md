## Why

OpenRouter is a popular LLM API gateway that provides access to dozens of models (OpenAI, Anthropic, Google, Meta, Mistral, etc.) through a single, unified OpenAI-compatible API. Adding OpenRouter as a first-class provider preset gives users instant access to a wide range of models without needing to configure a custom provider manually. This reduces setup friction and significantly expands the model selection available to users.

## What Changes

- Add an **OpenRouter** entry to the `PROVIDERS` constant in `src/shared/constants/providers.ts` with base URL `https://openrouter.ai/api` and a curated list of popular models
- Extend the `ProviderId` type union in `src/types/config.ts` to include `'openrouter'`
- Update the streaming logic in `src/shared/streaming.ts` to handle OpenRouter-specific headers (e.g., `HTTP-Referer`, `X-Title` for app attribution as recommended by OpenRouter docs)
- The Options page UI automatically picks up the new provider from the `PROVIDERS` map — no additional UI changes needed beyond what the existing dropdown already supports

## Capabilities

### New Capabilities
- `openrouter-provider`: Adds OpenRouter as a preset LLM provider with predefined base URL, model list, and proper API header handling.

### Modified Capabilities
- `provider-configuration`: The provider dropdown gains a new "OpenRouter" option with its preset base URL and models. Streaming logic is updated to send OpenRouter-recommended headers.

## Impact

- **Code**: `src/types/config.ts`, `src/shared/constants/providers.ts`, `src/shared/streaming.ts`, `src/options/Options.tsx` (type union + provider map + streaming headers)
- **APIs**: OpenRouter API at `https://openrouter.ai/api/v1/chat/completions` (OpenAI-compatible format)
- **Dependencies**: No new dependencies required — OpenRouter uses the OpenAI-compatible streaming format already supported
- **Systems**: No breaking changes; existing Anthropic, Blackbox, and Custom provider configurations remain unchanged
