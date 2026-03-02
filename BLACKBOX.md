# BLACKBOX.md - Project Context for AI Assistants

## Project Overview

**LLM Assistant Extension** is a Chrome Extension (Manifest V3) that provides a personal AI assistant experience similar to Monica.im. The key differentiation is full user control over AI infrastructure — users configure their own Base URL, API Key, and Model, supporting Anthropic Claude API or OpenAI/Anthropic-compatible proxies.

### Core Features
- **Side Panel UI**: Persistent chat interface accessible via extension icon
- **Context Menu Integration**: Right-click selected text for quick actions (Explain, Summarize, Rewrite, Translate)
- **Streaming Responses**: Real-time SSE streaming for both Anthropic and OpenAI API formats
- **Markdown Rendering**: Full GitHub-flavored markdown with syntax-highlighted code blocks
- **Secure Configuration**: API keys stored locally in `chrome.storage.local`, never sent to third parties

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Chrome Extension (Manifest V3) |
| Frontend | React 19 + Tailwind CSS v4 |
| Build | Vite 7 with multi-entrypoint configuration |
| Markdown | `react-markdown` + `remark-gfm` |
| Code Highlighting | `prismjs` |
| Icons | `lucide-react` |
| LLM APIs | Anthropic Messages API + OpenAI Chat Completions API (SSE streaming) |

## Project Structure

```
llm-assistant-extension/
├── public/
│   ├── manifest.json          # Chrome Extension manifest (Manifest V3)
│   └── icons/                 # Extension icons (16, 48, 128px)
├── src/
│   ├── background/
│   │   └── background.js      # Service worker: context menus, messaging
│   ├── content/
│   │   └── content.js         # Content script (minimal, for future use)
│   ├── options/
│   │   ├── Options.jsx        # Settings page component
│   │   ├── main.jsx           # Options entry point
│   │   └── options.html       # Options HTML template
│   ├── sidepanel/
│   │   ├── SidePanel.jsx      # Main chat interface
│   │   ├── main.jsx           # Side panel entry point
│   │   ├── sidepanel.html     # Side panel HTML template
│   │   ├── components/
│   │   │   ├── ChatInput.jsx  # Message input with send/stop buttons
│   │   │   └── ChatMessage.jsx # Message bubble with markdown rendering
│   │   └── hooks/
│   │       └── useStreaming.js # SSE streaming hook for LLM APIs
│   └── index.css              # Tailwind v4 theme + custom styles
├── openspec/                  # OpenSpec spec-driven development
│   ├── AGENTS.md              # OpenSpec workflow instructions
│   ├── project.md             # Project conventions
│   ├── specs/                 # Current capabilities (truth)
│   └── changes/               # Proposed changes
├── vite.config.js             # Multi-entry build configuration
└── package.json               # Dependencies and scripts
```

## Building and Running

### Development
```bash
npm run dev          # Start Vite dev server
```

### Production Build
```bash
npm run build        # Build to dist/ folder
npm run preview      # Preview production build locally
```

### Loading in Chrome
1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

## Development Conventions

### Code Style
- **React**: Functional components with hooks (no class components)
- **File Extension**: `.jsx` for React components, `.js` for utilities
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Custom Hooks**: Prefixed with `use` (e.g., `useStreaming`)
- **Styling**: Tailwind utility classes; custom CSS only in `src/index.css`

### Architecture Patterns
- **Multi-entry Vite Build**: Separate HTML entries for Side Panel and Options page
- **Background Service Worker**: Handles context menus and inter-component messaging
- **Messaging**: `chrome.runtime.sendMessage` for Background ↔ Side Panel communication
- **State**: React `useState`/`useCallback` + `chrome.storage.local` for persistence
- **Streaming**: `fetch()` + `ReadableStream` for SSE, supporting both Anthropic and OpenAI formats

### API Integration
The extension supports two streaming formats:
- **Anthropic**: `content_block_delta` event format with `anthropic-dangerous-direct-browser-access` header
- **OpenAI**: `choices[0].delta.content` event format with `Authorization: Bearer` header

### Testing
- Manual testing via `chrome://extensions` → "Load unpacked"
- Test Connection button in Options page for API validation
- No automated test framework currently

## Important Constraints

### Security
- API keys stored **only** in `chrome.storage.local`
- Never sent to third-party servers
- Direct browser-to-LLM API communication

### Chrome Extension Limitations
- **Manifest V3**: Required by Chrome Web Store
- **Service Worker**: No persistent background pages
- **CORS**: Anthropic API requires special header for browser calls
- **Side Panel API**: Persists across tab navigation

### OpenSpec Workflow
This project uses OpenSpec for spec-driven development. See `openspec/AGENTS.md` for:
- Creating change proposals
- Spec format conventions
- Implementation workflow

**Key triggers for OpenSpec**:
- New features or capabilities
- Breaking changes (API, schema)
- Architecture changes
- Performance/security work

## Key Files Reference

| File | Purpose |
|------|---------|
| `vite.config.js` | Multi-entry build with custom manifest copy plugin |
| `src/sidepanel/hooks/useStreaming.js` | Core streaming logic for LLM APIs |
| `src/background/background.js` | Context menu definitions and message routing |
| `src/index.css` | Tailwind v4 theme variables and markdown styles |
| `public/manifest.json` | Extension permissions and entry points |

## Theme Colors (Tailwind v4)

Defined in `src/index.css` under `@theme`:
- `--color-bg-primary`: `#0f0f14` (dark background)
- `--color-accent`: `#7c5cfc` (primary purple)
- `--color-text-primary`: `#e8e6f0` (main text)
- `--color-success`: `#34d399` (green)
- `--color-error`: `#f87171` (red)
