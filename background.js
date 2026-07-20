/**
 * Focus tabs opened from another tab.
 *
 * Chromium supplies openerTabId for link-driven tabs, including tabs opened
 * by Ctrl/Cmd-click, middle-click, the context menu, and target="_blank".
 * Requiring it avoids hijacking unrelated tabs such as restored sessions.
 */
chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id === undefined || tab.active || tab.openerTabId === undefined) {
    return;
  }

  chrome.tabs.update(tab.id, { active: true }, () => {
    // A tab can disappear before the asynchronous update completes.
    // Reading lastError prevents Chromium from logging that benign race.
    void chrome.runtime.lastError;
  });
});
