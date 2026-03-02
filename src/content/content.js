// Content Script — Text Selection Popup (eJoy-style)
// Injects a floating popup via Shadow DOM when user selects text

(() => {
  // ── AI Actions (same as background.js context menu actions) ──
  const AI_ACTIONS = [
    { id: 'explain', label: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
    { id: 'summarize', label: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
    { id: 'rewrite', label: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
    { id: 'translate', label: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n' },
  ];

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
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 9px;
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
      height: 20px;
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
      top: calc(100% + 6px);
      right: 0;
      min-width: 180px;
      background: #1a1a24;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.5);
      padding: 4px;
      animation: popIn 0.15s ease-out;
      pointer-events: auto;
    }
    .llm-dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 9px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #9896a8;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      white-space: nowrap;
    }
    .llm-dropdown-item:hover {
      background: rgba(124,92,252,0.12);
      color: #e8e6f0;
    }
    .llm-dropdown-item span.emoji {
      font-size: 15px;
      width: 20px;
      text-align: center;
    }
  `;

  // ── SVG Icons ──
  const TRANSLATE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
  const CHEVRON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

  // ── State ──
  let hostEl = null;
  let shadowRoot = null;
  let popupEl = null;
  let dropdownEl = null;
  let isDropdownOpen = false;
  let selectedText = '';

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
  function showPopup(rect, text) {
    hidePopup();
    selectedText = text;

    popupEl = document.createElement('div');
    popupEl.className = 'llm-popup';

    // Translate button
    const translateBtn = document.createElement('button');
    translateBtn.className = 'llm-btn llm-btn-translate';
    translateBtn.innerHTML = TRANSLATE_ICON;
    translateBtn.title = 'Translate';
    translateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sendAction('translate', selectedText);
      hidePopup();
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

    shadowRoot.appendChild(popupEl);

    // Position popup
    positionPopup(rect);
  }

  // ── Position popup near selection end ──
  function positionPopup(rect) {
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
  function toggleDropdown(expandBtn) {
    if (isDropdownOpen) {
      closeDropdown();
      expandBtn.classList.remove('open');
      return;
    }

    isDropdownOpen = true;
    expandBtn.classList.add('open');

    dropdownEl = document.createElement('div');
    dropdownEl.className = 'llm-dropdown';

    AI_ACTIONS.forEach((action) => {
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
        sendAction(action.id, selectedText);
        hidePopup();
      });
      dropdownEl.appendChild(item);
    });

    popupEl.appendChild(dropdownEl);
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
    selectedText = '';
  }

  // ── Send action to background ──
  function sendAction(actionId, text) {
    const action = AI_ACTIONS.find((a) => a.id === actionId);
    if (!action || !text) return;

    chrome.runtime.sendMessage({
      type: 'POPUP_ACTION',
      prompt: action.prompt + `"${text}"`,
      action: actionId,
      selectedText: text,
    });
  }

  // ── Selection listener ──
  let selectionTimeout = null;

  function handleSelectionChange() {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        // Don't hide immediately on selectionchange — only if it's truly empty
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        showPopup(rect, text);
      } catch {
        // Selection may be invalid
      }
    }, 300);
  }

  function handleMouseUp(e) {
    // Ignore clicks inside our popup
    if (hostEl && hostEl.contains(e.target)) return;
    if (e.target === hostEl) return;

    // Check shadow DOM — if click was in our shadow root, ignore
    const path = e.composedPath();
    if (path.some((el) => el === hostEl)) return;

    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (!text || text.length < 2) {
        hidePopup();
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        showPopup(rect, text);
      } catch {
        hidePopup();
      }
    }, 10);
  }

  // ── Auto-dismiss listeners ──
  function handleClickOutside(e) {
    if (!popupEl) return;
    const path = e.composedPath();
    if (path.some((el) => el === hostEl)) return;

    // If there's still a selection, don't dismiss (the mouseup handler will handle it)
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length >= 2) return;

    hidePopup();
  }

  function handleScroll() {
    hidePopup();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      hidePopup();
    }
  }

  // ── Listen for messages from background ──
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
