(function initialize(factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  api.install(document, window);
})(function createGitHubTargetBlank() {
  "use strict";

  const LINK_SELECTOR = "a[href]";

  function setTargetBlank(link) {
    if (link.getAttribute("target") === "_blank") return false;

    link.setAttribute("target", "_blank");
    return true;
  }

  function forceTargetBlank(root) {
    let updated = 0;

    if (root.matches?.(LINK_SELECTOR) && setTargetBlank(root)) {
      updated += 1;
    }

    for (const link of root.querySelectorAll?.(LINK_SELECTOR) ?? []) {
      if (setTargetBlank(link)) updated += 1;
    }

    return updated;
  }

  function install(doc, windowLike) {
    forceTargetBlank(doc);

    const observer = new windowLike.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          forceTargetBlank(mutation.target);
          continue;
        }

        for (const node of mutation.addedNodes) {
          forceTargetBlank(node);
        }
      }
    });

    observer.observe(doc.documentElement, {
      attributes: true,
      attributeFilter: ["href", "target"],
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }

  return { forceTargetBlank, install, setTargetBlank };
});
