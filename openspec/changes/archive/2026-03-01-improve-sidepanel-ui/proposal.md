# Change: Improve Side Panel UI

## Why
The current side panel UI is functional but feels basic—the empty state wastes screen space with no engagement hooks, AI responses lack syntax highlighting despite `prismjs` being installed, there is no animated typing indicator, and the overall visual polish can be elevated to feel more premium.

## What Changes
- **Suggested prompts**: Add quick-action suggestion chips to the empty state so users can start conversations with one click
- **Syntax highlighting**: Activate PrismJS for code blocks in AI responses (currently imported but not applied)
- **Typing indicator**: Replace the blinking cursor with an animated dot-pulse thinking indicator while the AI is generating
- **New conversation button**: Add a dedicated "New Chat" button in the header for quick conversation reset
- **Visual refinements**: Improve message bubble spacing, add subtle hover/active micro-animations for interactive elements, polish the overall layout
- **Markdown table styling**: Add proper table styling for AI responses that contain markdown tables

## Impact
- Affected specs: `sidepanel-appearance` (new capability)
- Affected code:
  - `src/sidepanel/SidePanel.jsx` — Empty state suggestions, header "New Chat" button
  - `src/sidepanel/components/ChatMessage.jsx` — Syntax highlighting, typing indicator, table rendering
  - `src/sidepanel/components/ChatInput.jsx` — Minor styling tweaks
  - `src/index.css` — New animations, table styles, typing indicator styles, suggestion chip styles
