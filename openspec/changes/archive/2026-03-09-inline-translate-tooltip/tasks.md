## 1. Extract Streaming Utility

- [x] 1.1 Create `src/shared/streaming.ts` — extract the core fetch+SSE streaming logic from `useStreaming.ts` into a plain-JS function `streamLLMResponse(messages, config, onChunk, onDone, onError)` with no React dependencies
- [x] 1.2 Refactor `src/shared/hooks/useStreaming.ts` to import and use the extracted `streamLLMResponse` utility instead of its own inline implementation

## 2. Tooltip UI in Content Script

- [x] 2.1 Add tooltip CSS styles to the `POPUP_CSS` string in `src/content/content.ts` — dark themed card with max-width ~400px, max-height ~300px, overflow scroll, loading animation, and error state styles
- [x] 2.2 Create `showTooltip(rect, text)` function that hides the popup bar and renders the tooltip card in the Shadow DOM near the selected text, initially showing a loading indicator
- [x] 2.3 Create `hideTooltip()` function that removes the tooltip and resets state
- [x] 2.4 Integrate tooltip dismiss into existing handlers — `handleClickOutside`, `handleScroll`, `handleKeyDown` should also dismiss the tooltip

## 3. Inline Translation Logic

- [x] 3.1 Import or inline the `streamLLMResponse` utility in the content script (accounting for the Vite inline build plugin)
- [x] 3.2 Create `translateInline(text)` function that reads `llmConfig` from `chrome.storage.local`, builds the translate prompt, calls `streamLLMResponse`, and progressively updates the tooltip content as chunks arrive
- [x] 3.3 Handle error states — show "Configure API in settings" when no config exists, show API error messages in the tooltip for failures (401, 429, network errors)
- [x] 3.4 Support aborting the streaming request when the tooltip is dismissed before completion

## 4. Wire Up Translate Button

- [x] 4.1 Change the translate button's click handler in `showPopup()` to call `translateInline(selectedText)` instead of `sendAction('translate', selectedText)`
- [x] 4.2 Keep the dropdown's Translate option unchanged — it should still call `sendAction('translate', text)` to open in the side panel

## 5. Build and Test

- [x] 5.1 Run `npm run build` and verify no build errors
- [ ] 5.2 Reload extension in Chrome and test: select text → click translate → verify tooltip appears with streamed translation
- [ ] 5.3 Test dismiss behaviors: click outside, scroll, Escape, new selection all dismiss the tooltip
- [ ] 5.4 Test error handling: disconnect network or use invalid API key — verify error message appears in tooltip
