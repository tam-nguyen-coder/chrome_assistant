// Background Service Worker — Manifest V3
import { CONTEXT_ACTIONS } from '@/shared/constants';
import type { ContextActionMessage, PopupActionMessage } from '@/types';

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const action = CONTEXT_ACTIONS.find((a) => a.id === info.menuItemId);
  if (!action || !info.selectionText) return;

  const prompt = action.prompt + `"${info.selectionText}"`;

  // Open side panel
  if (tab?.id) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }

  // Wait a bit for side panel to load, then send message
  setTimeout(() => {
    chrome.runtime.sendMessage({
      type: 'CONTEXT_ACTION',
      prompt,
      action: action.id,
      selectedText: info.selectionText,
    } as ContextActionMessage);
  }, 500);
});

// Register context menus on install
chrome.runtime.onInstalled.addListener(() => {
  CONTEXT_ACTIONS.forEach((action) => {
    chrome.contextMenus.create({
      id: action.id,
      title: action.label,
      contexts: ['selection'],
    });
  });
});

// Handle popup actions from content script
chrome.runtime.onMessage.addListener((message: PopupActionMessage, sender) => {
  if (message.type === 'POPUP_ACTION') {
    const actionData = {
      type: 'CONTEXT_ACTION' as const,
      prompt: message.prompt,
      action: message.action,
      selectedText: message.selectedText,
      timestamp: Date.now(),
    };

    // Store pending action in storage (side panel picks it up via onChanged listener)
    chrome.storage.local.set({ pendingAction: actionData });

    // Try to open side panel if we have a tab
    if (sender?.tab?.id) {
      chrome.sidePanel.open({ tabId: sender.tab.id }).catch(() => {
        // Side panel may already be open — that's OK, storage listener handles it
      });
    }
  }
});

// Open side panel when clicking the extension icon
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.sidePanel.open({ tabId: tab.id });
  }
});