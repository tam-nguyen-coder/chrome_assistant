// Content Script — Text Selection Popup with Inline Translation Tooltip
// Injects a floating popup via Shadow DOM when user selects text

// ── Inline streaming utility (since content scripts need self-contained code) ──
// Mirrors src/shared/streaming.ts but inlined to avoid module import issues

interface InlineStreamConfig {
  provider?: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

function streamLLMResponseInline(
  messages: { role: string; content: string }[],
  config: InlineStreamConfig,
  onChunk: (fullText: string) => void,
  onDone: (fullText: string | null) => void,
  onError: (error: string) => void,
  abortController?: AbortController
): AbortController {
  const controller = abortController || new AbortController();

  (async () => {
    try {
      const isAnthropic = config.provider === 'anthropic' ||
        (!config.provider && config.baseUrl.includes('anthropic'));
      const url = isAnthropic
        ? `${config.baseUrl.replace(/\/$/, '')}/v1/messages`
        : `${config.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      let body: string;

      if (isAnthropic) {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
        headers['anthropic-dangerous-direct-browser-access'] = 'true';
        body = JSON.stringify({
          model: config.model,
          max_tokens: 8192,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
      } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        body = JSON.stringify({
          model: config.model,
          max_tokens: 8192,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });
      }

      const res = await fetch(url, {
        method: 'POST',
        headers,
        body,
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: { message?: string } };
        const errMsg = errData.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        if (res.status === 401) throw new Error(`Authentication failed: ${errMsg}`);
        if (res.status === 403) throw new Error(`Access denied: ${errMsg}`);
        if (res.status === 429) throw new Error(`Rate limit exceeded. Please wait and try again.`);
        throw new Error(errMsg);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data) as {
              type?: string;
              delta?: { text?: string };
              choices?: Array<{ delta?: { content?: string } }>;
            };
            let text = '';

            if (isAnthropic) {
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                text = parsed.delta.text;
              }
            } else {
              text = parsed.choices?.[0]?.delta?.content || '';
            }

            if (text) {
              fullText += text;
              onChunk(fullText);
            }
          } catch {
            // skip malformed JSON
          }
        }
      }

      onDone(fullText);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        onDone(null);
      } else {
        onError(err instanceof Error ? err.message : 'Unknown error');
      }
    }
  })();

  return controller;
}

// AI Actions config (inlined to avoid module import issues in content scripts)
const AI_ACTIONS = [
  { id: 'explain', label: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
  { id: 'summarize', label: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
  { id: 'rewrite', label: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
  { id: 'translate', label: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n' },
];



(() => {
  // ── Inline CSS for Shadow DOM ──
  const POPUP_CSS = `
    :host {
      all: initial;
      position: fixed;
      z-index: 2147483647;
      pointer-events: none;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .llm-popup {
      pointer-events: auto;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px;
      background: #1a1a24;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,92,252,0.15);
      animation: popIn 0.18s ease-out;
      position: relative;
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.85) translateY(4px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .llm-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
      background: transparent;
      color: #9896a8;
      font-size: 16px;
      position: relative;
    }
    .llm-btn:hover {
      background: rgba(124,92,252,0.15);
      color: #e8e6f0;
    }
    .llm-btn-translate {
      color: #9b7dff;
    }
    .llm-btn-translate:hover {
      background: rgba(124,92,252,0.2);
      color: #c4b5fd;
    }
    .llm-divider {
      width: 1px;
      height: 22px;
      background: rgba(255,255,255,0.08);
      margin: 0 1px;
    }
    .llm-btn-expand svg {
      transition: transform 0.2s ease;
    }
    .llm-btn-expand.open svg {
      transform: rotate(180deg);
    }
    .llm-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 200px;
      background: #1a1a24;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.6);
      padding: 6px;
      animation: popIn 0.15s ease-out;
      pointer-events: auto;
      z-index: 100;
    }
    .llm-dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 14px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #9896a8;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      white-space: nowrap;
    }
    .llm-dropdown-item:hover {
      background: rgba(124,92,252,0.15);
      color: #e8e6f0;
    }
    .llm-dropdown-item span.emoji {
      font-size: 16px;
      width: 22px;
      text-align: center;
    }

    /* ── Inline Translation Tooltip ── */
    .llm-tooltip {
      pointer-events: auto;
      position: fixed;
      max-width: 420px;
      min-width: 260px;
      max-height: 320px;
      background: #1a1a24;
      border: 1px solid rgba(124,92,252,0.25);
      border-radius: 14px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,92,252,0.1);
      animation: tooltipIn 0.22s ease-out;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    @keyframes tooltipIn {
      from { opacity: 0; transform: translateY(6px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .llm-tooltip-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .llm-tooltip-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #9b7dff;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .llm-tooltip-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 6px;
      background: transparent;
      color: #6b6980;
      cursor: pointer;
      transition: all 0.15s ease;
      font-size: 14px;
      line-height: 1;
    }
    .llm-tooltip-close:hover {
      background: rgba(255,255,255,0.08);
      color: #e8e6f0;
    }
    .llm-tooltip-body {
      padding: 12px 14px 14px;
      overflow-y: auto;
      flex: 1;
      font-size: 14px;
      line-height: 1.65;
      color: #e0dfe6;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .llm-tooltip-body::-webkit-scrollbar {
      width: 5px;
    }
    .llm-tooltip-body::-webkit-scrollbar-track {
      background: transparent;
    }
    .llm-tooltip-body::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.12);
      border-radius: 4px;
    }
    .llm-tooltip-body::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.2);
    }
    .llm-tooltip-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #9896a8;
      font-size: 13px;
    }
    .llm-tooltip-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(124,92,252,0.2);
      border-top-color: #9b7dff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .llm-tooltip-error {
      color: #f87171;
      font-size: 13px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .llm-tooltip-error-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }
    .llm-tooltip-cursor {
      display: inline-block;
      width: 2px;
      height: 16px;
      background: #9b7dff;
      margin-left: 2px;
      vertical-align: text-bottom;
      animation: blink 0.8s step-end infinite;
    }
    @keyframes blink {
      50% { opacity: 0; }
    }
  `;

  // ── SVG Icons ──
  const TRANSLATE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
  const CHEVRON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  const CLOSE_ICON = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
  const ERROR_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

  // ── State ──
  let hostEl: HTMLDivElement | null = null;
  let shadowRoot: ShadowRoot | null = null;
  let popupEl: HTMLDivElement | null = null;
  let tooltipEl: HTMLDivElement | null = null;
  let dropdownEl: HTMLDivElement | null = null;
  let isDropdownOpen = false;
  let selectedText = '';
  let currentAbortController: AbortController | null = null;

  // ── Create Shadow DOM host ──
  function createHost() {
    hostEl = document.createElement('div');
    hostEl.id = 'llm-assistant-popup-host';
    hostEl.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;pointer-events:none;';
    shadowRoot = hostEl.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = POPUP_CSS;
    shadowRoot.appendChild(style);

    document.documentElement.appendChild(hostEl);
  }

  // ── Show popup near selection ──
  function showPopup(rect: DOMRect, text: string) {
    hidePopup();
    hideTooltip();
    selectedText = text;

    popupEl = document.createElement('div');
    popupEl.className = 'llm-popup';

    // Translate button — triggers inline tooltip
    const translateBtn = document.createElement('button');
    translateBtn.className = 'llm-btn llm-btn-translate';
    translateBtn.innerHTML = TRANSLATE_ICON;
    translateBtn.title = 'Translate';
    translateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToTranslate = selectedText;
      const popupRect = popupEl?.getBoundingClientRect();
      hidePopup();
      translateInline(textToTranslate, rect, popupRect || rect);
    });

    // Divider
    const divider = document.createElement('div');
    divider.className = 'llm-divider';

    // Expand button
    const expandBtn = document.createElement('button');
    expandBtn.className = 'llm-btn llm-btn-expand';
    expandBtn.innerHTML = CHEVRON_ICON;
    expandBtn.title = 'More actions';
    expandBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDropdown(expandBtn);
    });

    popupEl.appendChild(translateBtn);
    popupEl.appendChild(divider);
    popupEl.appendChild(expandBtn);

    shadowRoot?.appendChild(popupEl);

    // Position popup
    positionPopup(rect);
  }

  // ── Position popup near selection end ──
  function positionPopup(rect: DOMRect) {
    if (!popupEl) return;
    const popupRect = popupEl.getBoundingClientRect();
    const margin = 8;

    let left = rect.left + rect.width / 2 - popupRect.width / 2;
    let top = rect.bottom + margin;

    // Clamp to viewport
    left = Math.max(margin, Math.min(left, window.innerWidth - popupRect.width - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - popupRect.height - margin));

    // If not enough space below, show above
    if (top + popupRect.height > window.innerHeight - margin) {
      top = rect.top - popupRect.height - margin;
    }

    popupEl.style.position = 'fixed';
    popupEl.style.left = left + 'px';
    popupEl.style.top = top + 'px';
  }

  // ── Toggle dropdown ──
  function toggleDropdown(expandBtn: HTMLButtonElement) {
    if (isDropdownOpen) {
      closeDropdown();
      expandBtn.classList.remove('open');
      return;
    }

    isDropdownOpen = true;
    expandBtn.classList.add('open');

    dropdownEl = document.createElement('div');
    dropdownEl.className = 'llm-dropdown';

    // Load all actions from storage (fallback to hardcoded defaults if empty)
    chrome.storage.local.get('customActions', (result: { customActions?: typeof AI_ACTIONS }) => {
      const allActions = (result.customActions && result.customActions.length > 0)
        ? result.customActions
        : AI_ACTIONS;

      allActions.forEach((action) => {
        const item = document.createElement('button');
        item.className = 'llm-dropdown-item';

        const emoji = document.createElement('span');
        emoji.className = 'emoji';
        emoji.textContent = action.label.split(' ')[0]; // emoji part

        const label = document.createElement('span');
        label.textContent = action.label.split(' ').slice(1).join(' '); // text part

        item.appendChild(emoji);
        item.appendChild(label);

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          // All dropdown actions (including Translate) go to side panel
          sendActionWithPrompt(action.id, action.prompt, selectedText);
          hidePopup();
        });
        dropdownEl?.appendChild(item);
      });
    });

    popupEl?.appendChild(dropdownEl);
  }

  // ── Close dropdown ──
  function closeDropdown() {
    isDropdownOpen = false;
    if (dropdownEl) {
      dropdownEl.remove();
      dropdownEl = null;
    }
    const expandBtn = shadowRoot?.querySelector('.llm-btn-expand');
    if (expandBtn) expandBtn.classList.remove('open');
  }

  // ── Hide popup ──
  function hidePopup() {
    isDropdownOpen = false;
    dropdownEl = null;
    if (popupEl) {
      popupEl.remove();
      popupEl = null;
    }
  }

  // ══════════════════════════════════════════════════════
  //  INLINE TRANSLATION TOOLTIP
  // ══════════════════════════════════════════════════════

  // ── Show tooltip near selection with loading state ──
  function showTooltip(selectionRect: DOMRect, anchorRect: DOMRect) {
    hideTooltip();

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'llm-tooltip';

    // Header
    const header = document.createElement('div');
    header.className = 'llm-tooltip-header';

    const title = document.createElement('div');
    title.className = 'llm-tooltip-title';
    title.innerHTML = `${TRANSLATE_ICON} Translation`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'llm-tooltip-close';
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hideTooltip();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 'llm-tooltip-body';
    body.innerHTML = `<div class="llm-tooltip-loading"><div class="llm-tooltip-spinner"></div><span>Translating...</span></div>`;

    tooltipEl.appendChild(header);
    tooltipEl.appendChild(body);

    shadowRoot?.appendChild(tooltipEl);

    // Position tooltip
    positionTooltip(selectionRect, anchorRect);
  }

  // ── Position tooltip ──
  function positionTooltip(selectionRect: DOMRect, anchorRect: DOMRect) {
    if (!tooltipEl) return;
    const margin = 8;

    // Get tooltip dimensions after rendering
    const tooltipRect = tooltipEl.getBoundingClientRect();

    // Try to position below the anchor (where the popup was)
    let left = anchorRect.left;
    let top = anchorRect.bottom + margin;

    // Clamp to viewport width
    if (left + tooltipRect.width > window.innerWidth - margin) {
      left = window.innerWidth - tooltipRect.width - margin;
    }
    left = Math.max(margin, left);

    // If not enough space below, show above the selection
    if (top + tooltipRect.height > window.innerHeight - margin) {
      top = selectionRect.top - tooltipRect.height - margin;
    }
    top = Math.max(margin, top);

    tooltipEl.style.left = left + 'px';
    tooltipEl.style.top = top + 'px';
  }

  // ── Update tooltip body with translated text ──
  function updateTooltipContent(text: string, isStreaming: boolean) {
    if (!tooltipEl) return;
    const body = tooltipEl.querySelector('.llm-tooltip-body');
    if (!body) return;

    if (isStreaming) {
      body.innerHTML = `${escapeHtml(text)}<span class="llm-tooltip-cursor"></span>`;
    } else {
      body.textContent = text;
    }
  }

  // ── Show error in tooltip ──
  function showTooltipError(message: string) {
    if (!tooltipEl) return;
    const body = tooltipEl.querySelector('.llm-tooltip-body');
    if (!body) return;

    body.innerHTML = `<div class="llm-tooltip-error"><span class="llm-tooltip-error-icon">${ERROR_ICON}</span><span>${escapeHtml(message)}</span></div>`;
  }

  // ── Hide tooltip + abort any running stream ──
  function hideTooltip() {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    if (tooltipEl) {
      tooltipEl.remove();
      tooltipEl = null;
    }
  }

  // ── Escape HTML special characters ──
  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Inline translate: read config, stream LLM, show in tooltip ──
  function translateInline(text: string, selectionRect: DOMRect, anchorRect: DOMRect) {
    showTooltip(selectionRect, anchorRect);

    // Read LLM config and actions from storage
    chrome.storage.local.get(['llmConfig', 'customActions'], (result: { llmConfig?: InlineStreamConfig; customActions?: typeof AI_ACTIONS }) => {
      const config = result.llmConfig;

      if (!config || !config.apiKey) {
        showTooltipError('API not configured. Open extension settings to set up your API key.');
        return;
      }

      // Load translate prompt from storage (may be customized), fallback to hardcoded
      const allActions = (result.customActions && result.customActions.length > 0) ? result.customActions : AI_ACTIONS;
      const translateAction = allActions.find(a => a.id === 'translate') || AI_ACTIONS.find(a => a.id === 'translate');
      if (!translateAction) return;

      const prompt = translateAction.prompt + `"${text}"`;
      const messages = [{ role: 'user', content: prompt }];

      currentAbortController = streamLLMResponseInline(
        messages,
        config,
        // onChunk — progressively update tooltip
        (fullText: string) => {
          updateTooltipContent(fullText, true);
        },
        // onDone — finalize
        (fullText: string | null) => {
          currentAbortController = null;
          if (fullText !== null) {
            updateTooltipContent(fullText, false);
          }
          // If null, it was aborted — tooltip is already hidden
        },
        // onError
        (errMsg: string) => {
          currentAbortController = null;
          showTooltipError(errMsg);
        }
      );
    });
  }

  // ══════════════════════════════════════════════════════
  //  SEND TO SIDE PANEL (for dropdown actions)
  // ══════════════════════════════════════════════════════

  // ── Send action to background (with prompt already resolved) ──
  function sendActionWithPrompt(actionId: string, actionPrompt: string, text: string) {
    console.log('[LLM] sendActionWithPrompt called:', actionId, text?.substring(0, 30));
    if (!text) return;

    const prompt = actionPrompt + `"${text}"`;
    const message = {
      type: 'POPUP_ACTION' as const,
      prompt: prompt,
      action: actionId,
      selectedText: text,
    };

    // Try sending to background (background stores pendingAction in storage)
    try {
      chrome.runtime.sendMessage(message);
    } catch {
      // sendMessage failed — fall back to storing directly in storage
      const actionData = {
        type: 'CONTEXT_ACTION' as const,
        prompt,
        action: actionId,
        selectedText: text,
        timestamp: Date.now(),
      };
      chrome.storage.local.set({ pendingAction: actionData });
    }
  }


  // ══════════════════════════════════════════════════════
  //  EVENT HANDLERS
  // ══════════════════════════════════════════════════════

  // ── Mouse handler ──
  function handleMouseUp(e: MouseEvent) {
    // Ignore clicks inside our popup/tooltip
    if (hostEl && hostEl.contains(e.target as Node)) return;
    if (e.target === hostEl) return;

    // Check shadow DOM — if click was in our shadow root, ignore
    const path = e.composedPath();
    if (path.some((el) => el === hostEl)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        hidePopup();
        // Don't hide tooltip on empty click here — handleClickOutside handles that
        return;
      }

      try {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        showPopup(rect, text);
      } catch {
        hidePopup();
      }
    }, 10);
  }

  // ── Auto-dismiss listeners ──
  function handleClickOutside(e: MouseEvent) {
    const path = e.composedPath();
    const isInsideHost = path.some((el) => el === hostEl);

    // Dismiss popup
    if (popupEl && !isInsideHost) {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length >= 2) return;
      hidePopup();
    }

    // Dismiss tooltip
    if (tooltipEl && !isInsideHost) {
      hideTooltip();
    }
  }

  function handleScroll() {
    hidePopup();
    // Tooltip intentionally NOT dismissed on scroll — stays visible until
    // user clicks outside, presses Escape, or clicks the close button
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      hidePopup();
      hideTooltip();
    }
  }

  // ── Listen for messages from background ──
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_SELECTION') {
      const selection = window.getSelection()?.toString() || '';
      sendResponse({ text: selection });
    }
    return true;
  });

  // ── Initialize ──
  function init() {
    createHost();
    document.addEventListener('mouseup', handleMouseUp, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('keydown', handleKeyDown, true);
  }

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();