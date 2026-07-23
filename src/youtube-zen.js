(function initialize(factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  api.install(document, MutationObserver);
})(function createYouTubeZen() {
  "use strict";

  function hideShorts(doc) {
    for (const section of doc.querySelectorAll("ytd-rich-section-renderer")) {
      if (section.hidden) continue;

      const title = section.querySelector("#title, ytd-section-title-renderer");
      const isShortsTitle = title?.textContent?.trim().toLowerCase() === "shorts";
      const containsShort = section.querySelector('a[href^="/shorts/"]');

      if (isShortsTitle || containsShort) {
        section.hidden = true;
      }
    }

    for (const shelf of doc.querySelectorAll("ytd-reel-shelf-renderer")) {
      shelf.hidden = true;
    }
  }

  function install(doc, MutationObserverClass) {
    hideShorts(doc);

    const observer = new MutationObserverClass(() => hideShorts(doc));
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    return () => observer.disconnect();
  }

  return { hideShorts, install };
});
