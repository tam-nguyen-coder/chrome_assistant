## Why

Currently, clicking the translate button on the text selection popup opens the side panel chat and sends the translation as a conversation message. This interrupts the user's reading flow — they must switch focus to the side panel, wait for the full LLM response, and mentally context-switch back. Extensions like eJoy AI Dictionary solve this by showing the translation directly in an inline tooltip near the selected text, keeping the user in context. The translate action should behave the same way: show results inline, not in the chat.

## What Changes

- **Inline translation tooltip**: When the user clicks the translate button on the text selection popup, a tooltip/card appears directly below the popup (or near the selected text) showing the translation result, streamed in real-time from the LLM API.
- **Self-contained content script LLM call**: The translate action will make the LLM API call directly from the content script (reading config from `chrome.storage.local`) instead of routing through the background → side panel pipeline.
- **Loading and error states**: The tooltip shows a loading indicator while the translation streams in, and displays an error message if the API call fails.
- **Tooltip dismiss behavior**: The tooltip auto-dismisses on click outside, scroll, Escape key, or new text selection — consistent with existing popup dismiss behavior.
- **Other actions unchanged**: The dropdown actions (Explain, Summarize, Rewrite) and the dropdown's Translate option continue to open in the side panel chat as before. Only the quick-translate button (🌐) on the popup bar triggers the inline tooltip.

## Capabilities

### New Capabilities
- `inline-translate-tooltip`: Inline tooltip UI rendered in Shadow DOM that displays LLM translation results directly on the page near the selected text, with streaming, loading, and error states.

### Modified Capabilities
- `text-selection-popup`: The quick-translate button now shows an inline tooltip instead of sending the action to the side panel. The popup must coordinate with the tooltip for positioning and dismiss behavior.

## Impact

- **`src/content/content.ts`**: Major changes — needs to render the tooltip UI in Shadow DOM, make LLM API calls directly (fetch + SSE streaming), read config from `chrome.storage.local`, and handle tooltip lifecycle.
- **`src/shared/hooks/useStreaming.ts`**: The streaming logic may need to be extracted into a reusable non-React utility so the content script can use it without React.
- **`src/sidepanel/SidePanel.tsx`**: Minor — the pendingAction listener for translate actions from the quick-translate button path is no longer needed (other actions still use it).
- **No new dependencies**: Uses existing `fetch` + `ReadableStream` APIs already in the project.
- **No manifest changes**: Content script already has access to `chrome.storage.local`.
