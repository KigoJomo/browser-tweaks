/**
 * Focus tabs opened from another tab.
 *
 * Browsers supply openerTabId for link-driven tabs, including tabs opened
 * by Ctrl/Cmd-click, middle-click, the context menu, and target="_blank".
 * Requiring it avoids hijacking unrelated tabs such as restored sessions.
 */
const browserApi = globalThis.browser ?? globalThis.chrome;

browserApi.tabs.onCreated.addListener((tab) => {
  if (tab.id === undefined || tab.active || tab.openerTabId === undefined) {
    return;
  }

  const update = browserApi.tabs.update(tab.id, { active: true });

  // A tab can disappear before the asynchronous update completes.
  // Ignore that benign race in browsers whose API returns a Promise.
  void update?.catch(() => {});
});
