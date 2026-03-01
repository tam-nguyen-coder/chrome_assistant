# Project Context

## Purpose
A Chrome Extension (Manifest V3) that acts as a personal AI assistant, similar to Monica.im. The key differentiation is full user control over AI infrastructure — users configure their own Base URL, API Key, and Model (prioritizing Anthropic Claude API or OpenAI/Anthropic-compatible proxies).

## Tech Stack
- **Runtime**: Chrome Extension (Manifest V3)
- **Frontend**: React 19 + Tailwind CSS v4
- **Build**: Vite 7 with `@vitejs/plugin-react` and `@tailwindcss/vite`
- **Markdown**: `react-markdown` + `remark-gfm`
- **Icons**: `lucide-react`
- **Code Highlighting**: `prismjs`
- **APIs**: Chrome Extension APIs (`chrome.sidePanel`, `chrome.storage`, `chrome.contextMenus`, `chrome.runtime`)
- **LLM Integration**: Anthropic Messages API + OpenAI Chat Completions API (SSE streaming)

## Project Conventions

### Code Style
- React functional components with hooks (no class components)
- JSX file extension (`.jsx`) for React components
- PascalCase for components, camelCase for functions/variables
- Custom hooks prefixed with `use` (e.g., `useStreaming`)
- Tailwind utility classes for styling, custom CSS only in `src/index.css`

### Architecture Patterns
- **Multi-entry Vite build**: Separate HTML entries for Side Panel and Options page
- **Background Service Worker**: Handles context menus and inter-component messaging
- **Content Script**: Minimal, used for future enhancements (text selection, inline UI)
- **Messaging**: `chrome.runtime.sendMessage` for Background ↔ Side Panel communication
- **State**: React `useState`/`useCallback` + `chrome.storage.local` for persistence
- **Streaming**: `fetch()` + `ReadableStream` for SSE, supporting both Anthropic and OpenAI formats

### Testing Strategy
- Manual testing via `chrome://extensions` → "Load unpacked" with `dist/` folder
- Test Connection button in Options page for API validation
- No automated test framework currently (future enhancement)

### Git Workflow
- Feature branches from main
- Conventional commits preferred

## Domain Context
- The extension must handle two different streaming formats: Anthropic (`content_block_delta`) and OpenAI (`choices[0].delta.content`)
- Chrome Extension Manifest V3 requires service workers (not persistent background pages)
- Side Panel API (`chrome.sidePanel`) persists across tab navigation
- API keys are security-sensitive and must never leave the user's browser

## Important Constraints
- **Privacy**: API keys stored only in `chrome.storage.local`, never sent to third-party servers
- **Manifest V3**: Required by Chrome Web Store, no Manifest V2
- **CORS**: Anthropic API requires `anthropic-dangerous-direct-browser-access` header for browser calls
- **No server**: The extension operates entirely client-side

## External Dependencies
- **Anthropic Messages API**: `POST /v1/messages` with SSE streaming
- **OpenAI Chat Completions API**: `POST /v1/chat/completions` with SSE streaming
- **Google Fonts**: Inter (UI text) + JetBrains Mono (code blocks)
