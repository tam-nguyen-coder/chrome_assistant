## 1. Content Script — Popup Core
- [x] 1.1 Create Shadow DOM host element and inject into `document.body`
- [x] 1.2 Build popup HTML structure inside Shadow DOM (translate icon + expand arrow)
- [x] 1.3 Write inline CSS for popup (dark theme, rounded, shadow, transitions)
- [x] 1.4 Add `mouseup` / `selectionchange` listeners to detect text selection and position popup near selection
- [x] 1.5 Implement auto-dismiss: click-outside, new selection, scroll, escape key

## 2. Content Script — Actions
- [x] 2.1 Implement quick-translate click handler: send `CONTEXT_ACTION` message with translate prompt
- [x] 2.2 Implement expand arrow: toggle dropdown with AI actions (Explain, Summarize, Rewrite, Translate)
- [x] 2.3 Send selected action as `CONTEXT_ACTION` message via `chrome.runtime.sendMessage`

## 3. Background Script — Relay
- [x] 3.1 Add message handler for `POPUP_ACTION` from content script
- [x] 3.2 Open side panel and relay `CONTEXT_ACTION` message to side panel (reuse existing pattern)

## 4. Verification
- [x] 4.1 Build the extension (`npm run build`) and verify no errors
- [x] 4.2 Load unpacked extension in Chrome, select text on any page, verify popup appears
- [x] 4.3 Test quick-translate sends text to side panel
- [x] 4.4 Test dropdown actions work correctly
- [x] 4.5 Test auto-dismiss on click-outside, scroll, and new selection
