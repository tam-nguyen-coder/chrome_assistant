## 1. Type System Update

- [x] 1.1 Add `'openrouter'` to the `ProviderId` type union in `src/types/config.ts`

## 2. Provider Preset Configuration

- [x] 2.1 Add OpenRouter entry to the `PROVIDERS` map in `src/shared/constants/providers.ts` with base URL `https://openrouter.ai/api`, curated model list, and default model
- [x] 2.2 Verify the Options page dropdown automatically displays OpenRouter as a selectable provider (no UI code changes expected)

## 3. Streaming Logic — OpenRouter Headers

- [x] 3.1 Add conditional logic in `src/shared/streaming.ts` to detect `config.provider === 'openrouter'` and include `HTTP-Referer` and `X-Title` headers in the fetch request
- [x] 3.2 Ensure OpenRouter requests route through the existing OpenAI-compatible streaming path (Bearer token auth + `/v1/chat/completions`)

## 4. Verification

- [x] 4.1 Build the extension with `npm run build` and confirm no TypeScript errors
- [ ] 4.2 Load the extension in Chrome and verify OpenRouter appears in the Options page provider dropdown
- [ ] 4.3 Select OpenRouter, confirm base URL auto-fills and model dropdown shows curated models
- [ ] 4.4 Test connection with an OpenRouter API key to verify streaming works end-to-end
