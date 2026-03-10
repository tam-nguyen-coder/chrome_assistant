## Context

The LLM Assistant extension currently supports three provider presets: **Anthropic**, **Blackbox AI**, and **Custom**. The provider system is designed around a `PROVIDERS` map in `src/shared/constants/providers.ts`, a `ProviderId` type union in `src/types/config.ts`, and streaming logic in `src/shared/streaming.ts` that branches between Anthropic-format and OpenAI-compatible format.

OpenRouter uses the **OpenAI-compatible** streaming format (`/v1/chat/completions` with SSE), so the existing streaming parser already handles its response format. The main additions are:
1. A new entry in the provider map with curated models
2. Extending the `ProviderId` type
3. Adding OpenRouter-recommended HTTP headers for proper attribution

The Options page dropdown automatically renders all entries in the `PROVIDERS` map, so no UI component changes are needed.

## Goals / Non-Goals

**Goals:**
- Add OpenRouter as a first-class provider preset with base URL and curated model list
- Send OpenRouter-recommended attribution headers (`HTTP-Referer`, `X-Title`) for API compliance
- Maintain full backward compatibility with existing Anthropic, Blackbox, and Custom configurations
- Follow the existing provider addition pattern established by the Blackbox AI provider

**Non-Goals:**
- Dynamic model fetching from OpenRouter's `/api/v1/models` endpoint (future enhancement)
- OpenRouter-specific features like fallback routing, cost tracking, or usage dashboard links
- OAuth-based authentication (OpenRouter uses simple Bearer token, which we already support)
- Modifying the "Custom" provider flow — users who want niche OpenRouter models can still type them manually

## Decisions

### 1. Reuse OpenAI-compatible streaming path
**Decision**: Route OpenRouter through the existing `else` (non-Anthropic) code path in `streaming.ts`.

**Rationale**: OpenRouter's API is fully OpenAI-compatible — same endpoint structure (`/v1/chat/completions`), same SSE format (`choices[0].delta.content`), same Bearer token auth. No new parsing logic needed.

**Alternatives considered**:
- Dedicated OpenRouter parsing branch → Unnecessary complexity since the format is identical to OpenAI.

### 2. Add OpenRouter-specific headers conditionally
**Decision**: When `config.provider === 'openrouter'`, add `HTTP-Referer` and `X-Title` headers to the streaming request.

**Rationale**: OpenRouter's API docs recommend these headers for app attribution and ranking. They are optional but improve the extension's standing on their platform. Adding them conditionally avoids affecting other providers.

**Alternatives considered**:
- Always send these headers for all providers → Could cause unexpected behavior with other APIs.
- Skip headers entirely → Works but misses OpenRouter best practices.

### 3. Curate a focused default model list
**Decision**: Include ~5-6 popular models spanning different tiers (high capability, mid-tier, budget) rather than listing all 200+ available models.

**Rationale**: A manageable list reduces decision fatigue. Users needing other models can type a custom model name (existing behavior for all providers). The list can be expanded later.

### 4. Base URL set to `https://openrouter.ai/api`
**Decision**: Use `https://openrouter.ai/api` as the base URL, with the streaming code appending `/v1/chat/completions`.

**Rationale**: This matches the endpoint structure already used by the streaming code (`${baseUrl}/v1/chat/completions`).

## Risks / Trade-offs

- **Model list staleness** → The hardcoded model list may become outdated as OpenRouter adds/removes models. Mitigation: Users can type custom model IDs; a future enhancement can fetch models dynamically.
- **Header compatibility** → `HTTP-Referer` and `X-Title` are non-standard headers. Mitigation: Only sent when `provider === 'openrouter'`, so other providers are unaffected.
- **No model validation** → We don't verify that a selected model exists on OpenRouter. Mitigation: OpenRouter returns clear error messages for invalid models, which our existing error handling surfaces to the user.
