const test = require("node:test");
const assert = require("node:assert/strict");

const {
  forceExternalTargets,
  install,
  isExternalLink,
  setExternalTargetBlank
} = require("../src/github-target-blank.js");

const GITHUB_URL = "https://github.com/openai/codex";

function createLink(href, target = null) {
  const attributes = new Map([["href", href]]);
  if (target !== null) attributes.set("target", target);

  return {
    getAttribute: (name) => attributes.get(name) ?? null,
    matches: (selector) => selector === "a[href]",
    querySelectorAll: () => [],
    setAttribute: (name, value) => attributes.set(name, value)
  };
}

test("recognizes links that leave GitHub", () => {
  assert.equal(
    isExternalLink(createLink("https://openai.com"), GITHUB_URL),
    true
  );
  assert.equal(
    isExternalLink(createLink("https://example.com/path"), GITHUB_URL),
    true
  );
});

test("treats relative and absolute GitHub links as internal", () => {
  assert.equal(
    isExternalLink(createLink("/openai/codex/releases"), GITHUB_URL),
    false
  );
  assert.equal(
    isExternalLink(
      createLink("https://github.com/openai/codex/issues"),
      GITHUB_URL
    ),
    false
  );
});

test("ignores non-web links", () => {
  assert.equal(
    isExternalLink(createLink("mailto:hello@example.com"), GITHUB_URL),
    false
  );
  assert.equal(isExternalLink(createLink("#readme"), GITHUB_URL), false);
});

test("sets target=_blank only on external links", () => {
  const externalLink = createLink("https://openai.com");
  const releasesLink = createLink("/openai/codex/releases");

  assert.equal(setExternalTargetBlank(externalLink, GITHUB_URL), true);
  assert.equal(externalLink.getAttribute("target"), "_blank");
  assert.equal(setExternalTargetBlank(releasesLink, GITHUB_URL), false);
  assert.equal(releasesLink.getAttribute("target"), null);
});

test("leaves an already updated external link unchanged", () => {
  const link = createLink("https://openai.com", "_blank");

  assert.equal(setExternalTargetBlank(link, GITHUB_URL), false);
  assert.equal(link.getAttribute("target"), "_blank");
});

test("updates external links inside a rendered subtree", () => {
  const rootLink = createLink("/openai/codex");
  const nestedExternalLink = createLink("https://openai.com");
  const nestedInternalLink = createLink("/openai/codex/releases");
  rootLink.querySelectorAll = (selector) => {
    assert.equal(selector, "a[href]");
    return [nestedExternalLink, nestedInternalLink];
  };

  assert.equal(forceExternalTargets(rootLink, GITHUB_URL), 1);
  assert.equal(rootLink.getAttribute("target"), null);
  assert.equal(nestedExternalLink.getAttribute("target"), "_blank");
  assert.equal(nestedInternalLink.getAttribute("target"), null);
});

test("observes dynamically rendered external links and target changes", () => {
  const existingLink = createLink("https://openai.com");
  const dynamicExternalLink = createLink("https://example.com");
  const dynamicInternalLink = createLink("/openai/codex/releases");
  const documentElement = {};
  let observerCallback;
  let observed;
  let disconnected = false;

  class MutationObserver {
    constructor(callback) {
      observerCallback = callback;
    }

    observe(target, options) {
      observed = { target, options };
    }

    disconnect() {
      disconnected = true;
    }
  }

  const doc = {
    documentElement,
    querySelectorAll: () => [existingLink]
  };
  const uninstall = install(doc, {
    location: { href: GITHUB_URL },
    MutationObserver
  });

  assert.equal(existingLink.getAttribute("target"), "_blank");
  assert.deepEqual(observed, {
    target: documentElement,
    options: {
      attributes: true,
      attributeFilter: ["href", "target"],
      childList: true,
      subtree: true
    }
  });

  observerCallback([
    {
      type: "childList",
      addedNodes: [dynamicExternalLink, dynamicInternalLink]
    },
    {
      type: "attributes",
      target: createLink("https://example.org", "_self")
    }
  ]);
  assert.equal(dynamicExternalLink.getAttribute("target"), "_blank");
  assert.equal(dynamicInternalLink.getAttribute("target"), null);

  uninstall();
  assert.equal(disconnected, true);
});
