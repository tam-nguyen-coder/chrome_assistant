## Context

The LLM Assistant Chrome extension currently has a text selection popup that appears when users select text on any webpage. The popup has a translate button (🌐) and a dropdown with more actions (Explain, Summarize, Rewrite, Translate). All actions currently route through the background service worker to the side panel chat, where the LLM response appears as a conversation message.

The user wants the translate button to show results inline — as a tooltip near the selected text — rather than opening the side panel. This mirrors the UX of eJoy AI Dictionary, where translations appear immediately in-context.

The content script (`src/content/content.ts`) already uses Shadow DOM for the popup. The streaming logic lives in `src/shared/hooks/useStreaming.ts` as a React hook. The LLM config (provider, API key, model, base URL) is stored in `chrome.storage.local` under the `llmConfig` key.

## Goals / Non-Goals

**Goals:**
- Show translation results in an inline tooltip directly on the page, near the selected text
- Stream the LLM response in real-time into the tooltip (same SSE streaming as the side panel)
- Maintain the existing dismiss behavior (click outside, scroll, Escape, new selection)
- Keep all other actions (Explain, Summarize, Rewrite) routing to the side panel as before

**Non-Goals:**
- Changing the dropdown actions behavior (those still open the side panel)
- Adding tooltips for other actions beyond translate
- Implementing offline/cached translations
- Adding language detection or language picker UI

## Decisions

### 1. Extract streaming logic into a plain-JS utility

**Decision**: Extract the core fetch+SSE streaming logic from `useStreaming.ts` into a new `src/shared/streaming.ts` utility function (no React dependencies). Both the React hook and the content script will use this shared utility.

**Rationale**: The content script runs outside React and cannot use hooks. Duplicating the streaming logic would create maintenance burden. A shared utility function ensures both callsites parse SSE the same way and handle Anthropic vs OpenAI formats consistently.

**Alternatives considered**:
- *Duplicate streaming in content script* — Rejected: DRY violation, two places to fix streaming bugs.
- *Use background script as proxy* — Rejected: Adds unnecessary complexity and latency. Content script can call `fetch` directly.

### 2. Render tooltip in the existing Shadow DOM host

**Decision**: Render the translation tooltip as a sibling of the popup within the same Shadow DOM host element (`#llm-assistant-popup-host`).

**Rationale**: Reusing the existing Shadow DOM avoids creating another shadow root. Style isolation is already established. The tooltip can share the same CSS scope and dismiss logic.

### 3. Tooltip replaces the popup bar during translation

**Decision**: When the user clicks translate, hide the popup bar and show the tooltip in its place (positioned relative to the selected text). When the tooltip is dismissed, everything resets.

**Rationale**: Showing both the popup and tooltip simultaneously clutters the UI. The eJoy pattern is: click translate → the popup transforms/replaces into the result card.

### 4. Read LLM config directly from `chrome.storage.local`

**Decision**: The content script reads `llmConfig` from `chrome.storage.local` directly when making the translate API call.

**Rationale**: Content scripts have full access to `chrome.storage.local` (it's in the extension's permissions). No need to route through background. This is simpler and faster.

### 5. Tooltip max dimensions and scrolling

**Decision**: The tooltip has a max-width of ~400px and max-height of ~300px, with overflow scroll for long translations.

**Rationale**: Keeps the tooltip reasonable on-screen without blocking too much page content. Long translations (paragraphs) need scrolling rather than expanding indefinitely.

## Risks / Trade-offs

- **[Content script bundle size]** → Adding streaming logic to the content script increases its size (~2-3KB). Mitigation: The streaming utility is small and the content script is already inlined by the Vite build plugin.
- **[CORS from content scripts]** → Content scripts run in the page's origin, so `fetch` calls to the LLM API may face CORS issues. Mitigation: Blackbox AI and most OpenAI-compatible APIs send proper CORS headers. If an API doesn't support CORS from browser origins, the translate will fail gracefully with an error in the tooltip. The Anthropic API already requires `anthropic-dangerous-direct-browser-access` header for direct browser calls.
- **[Config not set]** → User clicks translate before configuring API. Mitigation: Show a "Configure API in settings" error message in the tooltip.
