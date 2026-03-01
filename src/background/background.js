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

// Open side panel when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
