// Content Script — minimal, used for future enhancements
// Currently the text selection is handled by the contextMenus API directly
// This script can be extended to add floating toolbars or inline UI features

(() => {
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SELECTION') {
      const selection = window.getSelection()?.toString() || '';
      sendResponse({ text: selection });
    }
    return true;
  });
})();
