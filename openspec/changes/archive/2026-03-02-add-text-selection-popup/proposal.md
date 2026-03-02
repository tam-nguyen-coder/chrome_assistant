# Change: Add Text Selection Popup (eJoy-style)

## Why
Currently interacting with selected text requires right-clicking and navigating context menus, which is slow and unintuitive. An eJoy-style floating popup that appears instantly on text selection provides a much faster workflow — one click to translate, expand for more AI actions.

## What Changes
- **Floating popup on text selection**: When the user selects text on any webpage, a small floating bubble appears near the selection with a translate icon and an expand arrow
- **Quick translate**: Clicking the translate icon immediately sends the selected text to the AI for translation via the side panel
- **AI actions dropdown**: Clicking the expand arrow opens a dropdown with AI actions (Explain, Summarize, Rewrite, Translate) — the same actions currently available via context menus
- **Auto-dismiss**: The popup disappears when the user clicks elsewhere, starts a new selection, or scrolls away
- **Shadow DOM isolation**: The floating UI is injected via Shadow DOM to prevent style conflicts with host pages

## Impact
- Affected specs: `text-selection-popup` (new capability)
- Affected code:
  - `src/content/content.js` → Major rewrite: inject floating popup with Shadow DOM, listen for selection events
  - `src/background/background.js` → Add message handler to relay popup actions to side panel
  - `public/manifest.json` → No changes needed (content script already registered on `<all_urls>`)
  - `vite.config.js` → May need CSS injection setup for content script
