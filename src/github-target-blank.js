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

  function isExternalLink(link, baseUrl) {
    try {
      const url = new URL(link.getAttribute("href"), baseUrl);
      return (
        (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname !== new URL(baseUrl).hostname
      );
    } catch {
      return false;
    }
  }

  function setExternalTargetBlank(link, baseUrl) {
    if (!isExternalLink(link, baseUrl)) return false;
    if (link.getAttribute("target") === "_blank") return false;

    link.setAttribute("target", "_blank");
    return true;
  }

  function forceExternalTargets(root, baseUrl) {
    let updated = 0;

    if (
      root.matches?.(LINK_SELECTOR) &&
      setExternalTargetBlank(root, baseUrl)
    ) {
      updated += 1;
    }

    for (const link of root.querySelectorAll?.(LINK_SELECTOR) ?? []) {
      if (setExternalTargetBlank(link, baseUrl)) updated += 1;
    }

    return updated;
  }

  function install(doc, windowLike) {
    const baseUrl = windowLike.location.href;
    forceExternalTargets(doc, baseUrl);

    const observer = new windowLike.MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "attributes") {
          forceExternalTargets(mutation.target, baseUrl);
          continue;
        }

        for (const node of mutation.addedNodes) {
          forceExternalTargets(node, baseUrl);
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

  return {
    forceExternalTargets,
    install,
    isExternalLink,
    setExternalTargetBlank
  };
});
