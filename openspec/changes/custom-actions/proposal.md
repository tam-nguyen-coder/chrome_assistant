## Why

Currently, the Chrome extension has a fixed set of AI actions (Explain, Summarize, Rewrite, Translate) hardcoded in three places: `src/shared/constants/actions.ts`, `src/content/content.ts` (inlined), and `src/background/background.ts` (context menus). Users have no way to add, modify, or remove actions — they're stuck with the four defaults. Power users who want domain-specific prompts (e.g., "Code Review", "Fix Grammar", "ELI5", "Generate SQL") have no option but to manually type their prompt every time.

Adding a custom actions management page in the Options UI empowers users to tailor the extension to their workflow. This is a core extensibility feature that directly maps to the extension's value proposition: full user control over their AI assistant.

## What Changes

- **Custom Actions management page**: A new section/tab in the Options page where users can create, edit, and delete custom AI actions. Each action has a name (label), emoji/icon, and prompt template.
- **Storage-backed actions**: Custom actions are persisted in `chrome.storage.local` alongside the existing `llmConfig`. The hardcoded `AI_ACTIONS` and `CONTEXT_ACTIONS` arrays become the defaults, merged with user-defined actions at runtime.
- **Dynamic context menus**: The background service worker registers context menus from the merged action list (defaults + custom) instead of only hardcoded ones. Menus are re-registered when custom actions change.
- **Dynamic dropdown in content script**: The text selection popup dropdown reads the merged action list from storage, so new custom actions appear immediately without extension reload.
- **Dynamic action buttons in side panel**: If the side panel references actions (suggestions, etc.), they reflect the merged list.

## Capabilities

### New Capabilities
- `custom-actions-management`: Options page UI for adding, editing, deleting, and reordering custom AI actions with a name, emoji, and prompt template.
- `dynamic-action-loading`: Runtime merging of default actions + user custom actions from `chrome.storage.local`, used across the extension (context menus, popup dropdown, side panel).

### Modified Capabilities
- `context-menus`: Background service worker dynamically registers context menus from the merged action list, and re-registers when custom actions are updated.
- `text-selection-popup`: The dropdown action list is loaded from storage at popup creation time instead of being hardcoded.
- `options-page`: Gets a new tab/section for managing custom actions alongside the existing LLM configuration.

## Impact

- **`src/options/Options.tsx`**: Major — add tab navigation (Settings / Custom Actions), build the custom actions CRUD UI with form fields for name, emoji, prompt.
- **`src/shared/constants/actions.ts`**: Minor — export defaults as `DEFAULT_ACTIONS`, add a utility to merge defaults with custom actions from storage.
- **`src/types/actions.ts`**: Minor — extend `AIAction` with an optional `isCustom` flag and optional `emoji` field.
- **`src/background/background.ts`**: Moderate — load merged actions from storage, register dynamic context menus, listen for storage changes to re-register menus.
- **`src/content/content.ts`**: Moderate — load actions from `chrome.storage.local` at popup creation time instead of using the hardcoded `AI_ACTIONS` array.
- **No new dependencies**: Uses existing React, Tailwind CSS, Lucide icons, and Chrome Storage APIs.
- **No manifest changes**: `chrome.storage.local` and `chrome.contextMenus` are already in permissions.
