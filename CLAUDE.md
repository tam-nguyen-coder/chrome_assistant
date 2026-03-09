# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

To load in Chrome: build, then go to `chrome://extensions`, enable Developer mode, and "Load unpacked" the `dist/` folder.

## Architecture Overview

This is a Chrome Extension (Manifest V3) providing an AI chat assistant via the browser side panel. Users configure their own LLM API (Anthropic or OpenAI-compatible endpoints).

### Entry Points (multi-entry Vite build)
- **Side Panel** (`src/sidepanel/`): Main chat interface, opened via extension icon
- **Options Page** (`src/options/`): Settings page for API configuration
- **Background Service Worker** (`src/background/background.js`): Context menus, message routing
- **Content Script** (`src/content/content.js`): Injected into all pages for text selection popup

### Key Data Flow
1. User config → stored in `chrome.storage.local` as `llmConfig`
2. Background handles context menu clicks → opens side panel → sends prompt via `chrome.runtime.sendMessage`
3. Content script detects text selection → shows popup via Shadow DOM → sends action to background
4. Side panel uses `useStreaming` hook for SSE streaming to LLM APIs

### LLM API Integration (`useStreaming.js`)
- Detects provider type (Anthropic vs OpenAI-compatible) via `config.provider` field
- Anthropic: uses `x-api-key` header, `anthropic-version`, `anthropic-dangerous-direct-browser-access`
- OpenAI-compatible: uses `Authorization: Bearer` header
- Both use SSE streaming with different event formats

## Tech Stack

- React 19 + Tailwind CSS v4
- Vite 7 with multi-entrypoint configuration
- `react-markdown` + `prismjs` for rendering
- `lucide-react` for icons

## Code Conventions

- Functional React components with hooks
- `.jsx` for components, `.js` for utilities
- Custom hooks prefixed with `use` (e.g., `useStreaming`)
- Tailwind utilities; custom CSS only in `src/index.css`
- Theme colors defined in `src/index.css` under `@theme`

## OpenSpec Workflow

This project uses OpenSpec for spec-driven development. See `openspec/AGENTS.md` when:
- Adding new features or capabilities
- Making breaking changes
- Proposing architecture changes

## Key Files

| File | Purpose |
|------|---------|
| `vite.config.js` | Multi-entry build with manifest copy plugin |
| `src/sidepanel/hooks/useStreaming.js` | Core SSE streaming logic |
| `src/background/background.js` | Context menus and message routing |
| `src/content/content.js` | Text selection popup (Shadow DOM) |
| `public/manifest.json` | Extension manifest (permissions, entry points) |
