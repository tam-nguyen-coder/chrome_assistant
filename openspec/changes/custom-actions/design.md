## Context

The LLM Assistant Chrome extension currently has four hardcoded AI actions: Explain, Summarize, Rewrite, and Translate. These are defined in `src/shared/constants/actions.ts` and duplicated as inline arrays in `src/content/content.ts` (for the text selection popup) and consumed by `src/background/background.ts` (for right-click context menus).

Each action has three fields: `id`, `label` (emoji + name), and `prompt` (the template sent to the LLM). The Options page (`src/options/Options.tsx`) currently only manages LLM connection settings (provider, API key, model) — there is no UI for managing actions.

The user wants a way to add custom actions with their own name and prompt, edit them, and have them appear everywhere the defaults do (context menus, popup dropdown, side panel suggestions).

## Goals / Non-Goals

**Goals:**
- Let users create custom AI actions with a name, emoji, and prompt template
- Edit and delete existing custom actions
- Persist custom actions in `chrome.storage.local`
- Merge custom actions with the built-in defaults across all extension surfaces (context menus, text selection popup dropdown, side panel)
- Dynamic context menu re-registration when actions change
- Clean, consistent UI in the Options page with tab navigation

**Non-Goals:**
- Reordering actions (drag-and-drop) — keep it simple, natural order
- Editing or deleting the four built-in default actions — these stay fixed
- Import/export of actions
- Action categories or folders
- Sharing actions between users

## Decisions

### 1. Tab navigation in Options page

**Decision**: Add a horizontal tab bar at the top of the Options page with two tabs: "Connection" (existing LLM config) and "Custom Actions" (new CRUD UI). Both tabs render in the same single-page component.

**Rationale**: Keeps the Options page as a single entry point with clear separation. The existing LLM config UI remains untouched — it's just placed under the first tab. A separate HTML page would add unnecessary complexity.

**Alternatives considered**:
- *Separate options page for actions* — Rejected: Adds another HTML entry in the Vite build and fragments the settings experience.
- *Accordion sections* — Rejected: Less clear navigation as the page grows.

### 2. Storage key: `customActions`

**Decision**: Store user-created actions as an array under `chrome.storage.local` key `customActions`. The data shape is `AIAction[]` (same as the built-in actions but with `isCustom: true`).

**Rationale**: Keeps it simple — same type as built-in actions. Using a separate storage key (not mixing into `llmConfig`) ensures clean separation and easy migration.

### 3. Merge strategy: defaults first, then custom

**Decision**: At runtime, the action list is always `[...DEFAULT_ACTIONS, ...customActions]`. Built-in actions come first, custom actions follow.

**Rationale**: Users see the familiar defaults first, with their custom additions below. No risk of custom actions accidentally overriding defaults.

### 4. Action ID generation

**Decision**: Generate action IDs for custom actions using `custom-${Date.now()}` to guarantee uniqueness from built-in IDs.

**Rationale**: Simple, no collisions with built-in IDs (which are plain words like `explain`, `translate`). No need for UUID library.

### 5. Dynamic context menu registration

**Decision**: Use a `loadActions()` helper that reads from storage and returns the merged list. The background service worker calls this on install and on `chrome.storage.onChanged` to re-create all context menus.

**Rationale**: Context menus must be registered via `chrome.contextMenus.create` — there's no way to add individual items without removing old ones first. So we `removeAll()` then re-create from the merged list on any change.

### 6. Content script reads actions from storage

**Decision**: The content script's `toggleDropdown()` function reads `customActions` from `chrome.storage.local` when building the dropdown items, instead of using the hardcoded `AI_ACTIONS` array. The hardcoded array is kept as the fallback default.

**Rationale**: Content scripts can access `chrome.storage.local` directly. Reading at dropdown-open time ensures new custom actions appear immediately without extension reload. The hardcoded array only serves as a fallback if storage hasn't been initialized.

### 7. Custom action form UI

**Decision**: Use an inline form within the Custom Actions tab — a card-style form with emoji picker (text input), action name input, and a textarea for the prompt template. The form appears at the top of the list when "Add Action" is clicked. Editing an action replaces the action card with the form inline.

**Rationale**: Inline editing is faster than modals. The form is simple (3 fields) and fits naturally in the card layout.

## Risks / Trade-offs

- **[Context menu flickering]** → Calling `removeAll()` + re-create on every change may cause a brief flash. Mitigation: This is a background operation invisible to the user — no visual impact.
- **[Storage limits]** → `chrome.storage.local` has a 10MB limit. Even hundreds of custom actions with long prompts would be well under 1MB. Non-issue.
- **[Content script sync]** → The content script reads actions from storage when the dropdown opens. If storage is slow, there could be a brief lag. Mitigation: Storage reads are fast (<10ms for small data). Keep the hardcoded defaults as immediate fallback.
- **[ID collisions]** → `custom-${Date.now()}` could theoretically collide if two actions are created in the same millisecond. Mitigation: Extremely unlikely in practice. If needed, add a random suffix later.
