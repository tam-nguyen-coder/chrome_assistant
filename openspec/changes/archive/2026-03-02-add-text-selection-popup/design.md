## Context
The content script (`content.js`) is currently minimal — it only responds to `GET_SELECTION` messages. This change turns it into a full interactive UI injector. The floating popup must work across all websites without breaking host page styles or being broken by them.

## Goals / Non-Goals
- **Goals**:
  - Inject a floating popup near selected text on any page
  - Quick-translate with one click (primary action)
  - Expandable dropdown for other AI actions
  - Shadow DOM isolation from host page CSS
  - Dismiss on click-outside, new selection, or scroll
- **Non-Goals**:
  - Inline translation result display (results go to side panel)
  - Custom per-site styling or positioning rules
  - Keyboard shortcut triggers (future enhancement)

## Decisions

### Shadow DOM for style isolation
- **Decision**: Use an open Shadow DOM attached to a host `<div>` injected into `document.body`
- **Why**: Prevents host CSS from leaking into the popup and vice versa. All popup styles are self-contained inside the shadow root.
- **Alternative**: Using `<iframe>` — rejected because iframes add complexity (cross-origin messaging, sizing) and feel heavier for a small popup.

### Inline CSS in content script (no external stylesheet)
- **Decision**: All popup CSS is written as a `<style>` element inside the Shadow DOM, embedded directly in `content.js`
- **Why**: Content scripts in Manifest V3 cannot easily load external CSS into a Shadow DOM. Inline styles are simpler, bundle with the script, and avoid FOUC.
- **Alternative**: Using `chrome.scripting.insertCSS` — rejected because it injects into the page, not Shadow DOM.

### Communication flow
- **Decision**: Content script → `chrome.runtime.sendMessage` → Background → `chrome.sidePanel.open` + `chrome.runtime.sendMessage` to side panel
- **Why**: Reuses the existing `CONTEXT_ACTION` message pattern already handled by `SidePanel.jsx`. The background acts as the relay because content scripts cannot directly open the side panel.

### Popup positioning
- **Decision**: Position the popup at the end of the selection range using `Range.getBoundingClientRect()`, offset slightly below
- **Why**: Consistent with eJoy and similar tools. The popup appears right where the user is looking.

## Risks / Trade-offs
- **Risk**: Some pages use aggressive CSS resets or `all: initial` that could interfere with Shadow DOM rendering → **Mitigation**: Apply explicit styles to every element inside the popup
- **Risk**: Pages with `mouseup` event listeners may interfere with selection detection → **Mitigation**: Use `document.addEventListener` in capture phase
- **Risk**: Popup position may go off-screen on edge selections → **Mitigation**: Clamp position to viewport bounds

## Open Questions
- None — the design is straightforward and based on proven patterns (eJoy, Google Translate extension)
