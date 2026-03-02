// Background Service Worker — Manifest V3

// Context menu actions
const CONTEXT_ACTIONS = [
  { id: 'explain', title: '💡 Explain', prompt: 'Please explain the following text clearly and concisely:\n\n' },
  { id: 'summarize', title: '📝 Summarize', prompt: 'Please provide a concise summary of the following text:\n\n' },
  { id: 'rewrite', title: '✍️ Rewrite', prompt: 'Please rewrite the following text to improve clarity and readability:\n\n' },
  { id: 'translate', title: '🌐 Translate', prompt: 'Please translate the following text to English (or if it is already in English, translate to Vietnamese):\n\n' },
];

// Register context menus on install
chrome.runtime.onInstalled.addListener(() => {
  CONTEXT_ACTIONS.forEach((action) => {
    chrome.contextMenus.create({
      id: action.id,
      title: action.title,
      contexts: ['selection'],
    });
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const action = CONTEXT_ACTIONS.find((a) => a.id === info.menuItemId);
  if (!action || !info.selectionText) return;

  const prompt = action.prompt + `"${info.selectionText}"`;

  // Open side panel
  await chrome.sidePanel.open({ tabId: tab.id });

  // Wait a bit for side panel to load, then send message
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'CONTEXT_ACTION',
      prompt,
      action: action.id,
      selectedText: info.selectionText,
    });
  }, 500);
});

// Handle popup actions from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'POPUP_ACTION' && sender.tab) {
    const actionData = {
      type: 'CONTEXT_ACTION',
      prompt: message.prompt,
      action: message.action,
      selectedText: message.selectedText,
      timestamp: Date.now(),
    };

    // Store pending action in storage (side panel picks it up via onChanged listener)
    chrome.storage.local.set({ pendingAction: actionData });

    // Try to open side panel (may fail without user gesture context)
    chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
      // Side panel may already be open — that's OK, storage listener handles it
    });
  }
});

// Open side panel when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
