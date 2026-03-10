## 1. Extend Types and Constants

- [x] 1.1 Update `src/types/actions.ts` — add optional `isCustom?: boolean` and `emoji?: string` fields to the `AIAction` interface
- [x] 1.2 Update `src/shared/constants/actions.ts` — rename exports to `DEFAULT_CONTEXT_ACTIONS` and `DEFAULT_AI_ACTIONS`. Add a `loadCustomActions()` async helper that reads `customActions` from `chrome.storage.local` and returns an `AIAction[]`. Add a `getMergedActions()` async helper that returns `[...DEFAULT_AI_ACTIONS, ...customActions]`.

## 2. Options Page — Tab Navigation

- [x] 2.1 Add tab state and tab bar UI to `src/options/Options.tsx` — a horizontal tab bar with "Connection" and "Custom Actions" tabs. Wrap the existing LLM config card in a conditional render for the "Connection" tab.
- [x] 2.2 Create the "Custom Actions" tab panel — a card showing the list of custom actions (loaded from `chrome.storage.local` on mount) with an "Add Action" button at the top.

## 3. Custom Actions CRUD UI

- [x] 3.1 Build the action card component — each custom action displayed as a card showing emoji, name, prompt preview (truncated), with Edit and Delete buttons. Use the same dark card style as the existing config card.
- [x] 3.2 Build the action form (add/edit) — inline form with: emoji text input (single emoji), action name input, prompt textarea (with placeholder explaining `{text}` variable). Form has Save and Cancel buttons. When adding, the form appears above the list. When editing, it replaces the card.
- [x] 3.3 Implement save logic — on Save, generate ID (`custom-${Date.now()}`), build the `AIAction` object, update the `customActions` array in `chrome.storage.local`. Show a brief success indicator.
- [x] 3.4 Implement delete logic — on Delete, show a confirmation (or directly remove), update `customActions` in storage.
- [x] 3.5 Implement edit logic — on Edit, populate the form with the existing action's data. On Save, update the action in place in the array (same ID), persist to storage.

## 4. Dynamic Context Menu Registration

- [x] 4.1 Update `src/background/background.ts` — replace the hardcoded `CONTEXT_ACTIONS.forEach(...)` in `onInstalled` with an async function `registerContextMenus()` that loads merged actions from storage (defaults + custom) and registers all of them.
- [x] 4.2 Add a `chrome.storage.onChanged` listener in the background script — when `customActions` changes, call `chrome.contextMenus.removeAll()` then `registerContextMenus()` to re-register with the updated list.
- [x] 4.3 Update the `contextMenus.onClicked` handler — instead of looking up actions from the hardcoded array, load the merged action list from storage to find the clicked action's prompt.

## 5. Dynamic Actions in Content Script

- [x] 5.1 Update the `toggleDropdown()` function in `src/content/content.ts` — read `customActions` from `chrome.storage.local` at dropdown-open time, merge with the hardcoded `AI_ACTIONS` fallback, and render the dropdown items from the merged list.
- [x] 5.2 Update `sendAction()` and `triggerActionDirectly()` in the content script — when looking up an action by ID, search the merged list (reading from storage at call time) instead of only the hardcoded array.

## 6. Build and Test

- [x] 6.1 Run `npm run build` and verify no build errors
- [ ] 6.2 Reload extension in Chrome and test: open Options → verify tab navigation works, Connection tab shows existing LLM config
- [ ] 6.3 Test custom action CRUD: add a new action (e.g., "Code Review" with prompt "Please review this code..."), verify it appears in the list, edit it, delete it
- [ ] 6.4 Test context menus: right-click on selected text → verify custom action appears in the context menu alongside defaults
- [ ] 6.5 Test text selection popup: select text → click dropdown → verify custom action appears in the dropdown
- [ ] 6.6 Test persistence: close and reopen Options page → verify custom actions persist
