(function initialize(factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  api.install(document, window);
})(function createGitHubReleasesNav() {
  "use strict";

  const ITEM_ATTRIBUTE = "data-github-releases-nav-item";
  const LINK_ATTRIBUTE = "data-github-releases-nav-link";
  const REPOSITORY_META_NAME = "octolytics-dimension-repository_nwo";
  const REPOSITORY_NAV_SELECTOR = [
    'nav[aria-label="Repository"]',
    'nav[data-testid="repository-nav"]',
    "nav.js-repo-nav"
  ].join(", ");
  const SELECTED_CLASS = "selected";
  const STATE_CLASSES = [SELECTED_CLASS, "active"];

  function normalizeRepositoryNwo(value) {
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    if (!/^[^/\s]+\/[^/\s]+$/.test(trimmed)) return null;

    return trimmed;
  }

  function getRepositoryNwo(doc) {
    const meta = doc.querySelector(`meta[name="${REPOSITORY_META_NAME}"]`);
    return normalizeRepositoryNwo(meta?.getAttribute("content"));
  }

  function getRepositoryPath(nwo) {
    return `/${nwo}`;
  }

  function getReleasesPath(nwo) {
    return `${getRepositoryPath(nwo)}/releases`;
  }

  function isReleasesRoute(pathname, nwo) {
    const releasesPath = getReleasesPath(nwo);
    return pathname === releasesPath || pathname.startsWith(`${releasesPath}/`);
  }

  function normalizedPathname(anchor, baseUrl) {
    try {
      return new URL(anchor.href, baseUrl).pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  }

  function findRepositoryNavigation(doc, nwo, baseUrl) {
    const repositoryPath = getRepositoryPath(nwo);

    for (const nav of doc.querySelectorAll(REPOSITORY_NAV_SELECTOR)) {
      for (const anchor of nav.querySelectorAll("a[href]")) {
        if (normalizedPathname(anchor, baseUrl) === repositoryPath) {
          const item = anchor.closest("li");
          if (item) return { nav, codeLink: anchor, codeItem: item };
        }
      }
    }

    return null;
  }

  function createReleasesIcon(doc) {
    const svg = doc.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "octicon octicon-tag UnderlineNav-octicon");

    const path = doc.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M2.75 2.5a.25.25 0 0 0-.25.25v4.5c0 .066.026.13.073.177l5.5 5.5a.25.25 0 0 0 .354 0l4.5-4.5a.25.25 0 0 0 0-.354l-5.5-5.5A.25.25 0 0 0 7.25 2.5h-4.5ZM1 2.75A1.75 1.75 0 0 1 2.75 1h4.5c.464 0 .91.184 1.238.513l5.5 5.5a1.75 1.75 0 0 1 0 2.474l-4.5 4.5a1.75 1.75 0 0 1-2.475 0l-5.5-5.5A1.75 1.75 0 0 1 1 7.25v-4.5ZM5.5 5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"
    );
    svg.append(path);

    return svg;
  }

  function createReleasesItem(doc, codeItem, codeLink) {
    const item = doc.createElement("li");
    const link = doc.createElement("a");
    const label = doc.createElement("span");

    item.className = codeItem.className;
    if (codeItem.hasAttribute("role")) {
      item.setAttribute("role", codeItem.getAttribute("role"));
    }
    item.setAttribute(ITEM_ATTRIBUTE, "");

    link.className = codeLink.className;
    link.setAttribute(LINK_ATTRIBUTE, "");
    link.removeAttribute("id");
    link.classList.remove("js-selected-navigation-item");

    label.textContent = "Releases";
    label.setAttribute("data-content", "Releases");

    link.append(createReleasesIcon(doc), label);
    item.append(link);

    return { item, link };
  }

  function clearSelectedState(element) {
    element.classList.remove(...STATE_CLASSES);
    element.removeAttribute("aria-current");
    element.removeAttribute("data-selected");
  }

  function setSelectedState(item, link, isSelected) {
    clearSelectedState(item);
    clearSelectedState(link);
    link.classList.remove("js-selected-navigation-item");

    if (isSelected) {
      link.classList.add(SELECTED_CLASS);
      link.setAttribute("aria-current", "page");
    }
  }

  function removeOrphanedItems(doc, currentItem) {
    for (const item of doc.querySelectorAll(`[${ITEM_ATTRIBUTE}]`)) {
      if (item !== currentItem) item.remove();
    }
  }

  function ensureReleasesItem(doc, locationLike) {
    const nwo = getRepositoryNwo(doc);
    if (!nwo) {
      removeOrphanedItems(doc, null);
      return false;
    }

    const navigation = findRepositoryNavigation(doc, nwo, locationLike.href);
    if (!navigation) return false;

    const releasesPath = getReleasesPath(nwo);
    let item = navigation.nav.querySelector(`[${ITEM_ATTRIBUTE}]`);
    let link = item?.querySelector(`[${LINK_ATTRIBUTE}]`);

    if (!item || !link) {
      ({ item, link } = createReleasesItem(
        doc,
        navigation.codeItem,
        navigation.codeLink
      ));
    }

    link.href = releasesPath;
    const releasesSelected = isReleasesRoute(locationLike.pathname, nwo);

    if (releasesSelected) {
      clearSelectedState(navigation.codeItem);
      clearSelectedState(navigation.codeLink);
    }

    setSelectedState(item, link, releasesSelected);

    if (navigation.codeItem.nextElementSibling !== item) {
      navigation.codeItem.insertAdjacentElement("afterend", item);
    }

    removeOrphanedItems(doc, item);
    return true;
  }

  function install(doc, windowLike) {
    let scheduled = false;

    const scheduleEnsure = () => {
      if (scheduled) return;
      scheduled = true;

      windowLike.requestAnimationFrame(() => {
        scheduled = false;
        ensureReleasesItem(doc, windowLike.location);
      });
    };

    const observer = new windowLike.MutationObserver(scheduleEnsure);
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    doc.addEventListener("turbo:load", scheduleEnsure);
    doc.addEventListener("pjax:end", scheduleEnsure);
    windowLike.addEventListener("popstate", scheduleEnsure);
    scheduleEnsure();

    return () => {
      observer.disconnect();
      doc.removeEventListener("turbo:load", scheduleEnsure);
      doc.removeEventListener("pjax:end", scheduleEnsure);
      windowLike.removeEventListener("popstate", scheduleEnsure);
    };
  }

  return {
    ensureReleasesItem,
    findRepositoryNavigation,
    getReleasesPath,
    getRepositoryNwo,
    getRepositoryPath,
    install,
    isReleasesRoute,
    normalizeRepositoryNwo
  };
});
