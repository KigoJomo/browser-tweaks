(function initialize(factory) {
  const api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
    return;
  }

  api.install(document);
})(function createGoogleVimNav() {
  "use strict";

  const EDITABLE_SELECTOR = [
    "input",
    "textarea",
    "select",
    '[contenteditable]:not([contenteditable="false"])',
    '[role="textbox"]'
  ].join(", ");
  const RESULT_LINK_SELECTOR = "a[href]";
  const SEARCH_INPUT_SELECTOR = 'textarea[name="q"], input[name="q"]';
  const SELECTED_ATTRIBUTE = "data-google-vim-selected";

  function isEditableTarget(target) {
    return Boolean(target?.closest?.(EDITABLE_SELECTOR));
  }

  function getResultLinks(doc) {
    const results = doc.querySelector("#search");
    if (!results) return [];

    return Array.from(results.querySelectorAll(RESULT_LINK_SELECTOR)).filter(
      (link) => link.querySelector("h3")
    );
  }

  function getSelectedIndex(doc, links) {
    const focusedIndex = links.indexOf(doc.activeElement);
    if (focusedIndex !== -1) return focusedIndex;

    return links.findIndex((link) => link.hasAttribute(SELECTED_ATTRIBUTE));
  }

  function selectResult(doc, links, index) {
    if (index < 0 || index >= links.length) return false;

    for (const link of links) link.removeAttribute(SELECTED_ATTRIBUTE);

    const link = links[index];
    link.setAttribute(SELECTED_ATTRIBUTE, "");
    link.focus({ preventScroll: true });
    link.scrollIntoView({ block: "center" });
    return true;
  }

  function focusSearch(doc) {
    const input = doc.querySelector(SEARCH_INPUT_SELECTOR);
    if (!input) return false;

    input.focus();
    return true;
  }

  function openSelectedResult(doc) {
    const links = getResultLinks(doc);
    const selectedIndex = getSelectedIndex(doc, links);
    if (selectedIndex === -1) return false;

    links[selectedIndex].click();
    return true;
  }

  function navigateResults(doc, direction) {
    const links = getResultLinks(doc);
    if (links.length === 0) return false;

    const selectedIndex = getSelectedIndex(doc, links);
    const nextIndex =
      selectedIndex === -1
        ? direction > 0
          ? 0
          : links.length - 1
        : Math.max(0, Math.min(links.length - 1, selectedIndex + direction));

    return selectResult(doc, links, nextIndex);
  }

  function handleKeydown(event, doc) {
    if (
      event.defaultPrevented ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      isEditableTarget(event.target)
    ) {
      return false;
    }

    const handled =
      (event.key === "h" && focusSearch(doc)) ||
      (event.key === "j" && navigateResults(doc, 1)) ||
      (event.key === "k" && navigateResults(doc, -1)) ||
      (event.key === "l" && openSelectedResult(doc));
    if (!handled) return false;

    event.preventDefault();
    return true;
  }

  function install(doc) {
    const onKeydown = (event) => handleKeydown(event, doc);
    doc.addEventListener("keydown", onKeydown);
    return () => doc.removeEventListener("keydown", onKeydown);
  }

  return {
    focusSearch,
    getResultLinks,
    getSelectedIndex,
    handleKeydown,
    install,
    isEditableTarget,
    navigateResults,
    openSelectedResult,
    selectResult
  };
});
