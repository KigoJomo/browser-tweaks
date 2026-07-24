const test = require("node:test");
const assert = require("node:assert/strict");

const {
  forceTargetBlank,
  install,
  setTargetBlank
} = require("../src/github-target-blank.js");

function createLink(target = null) {
  const attributes = new Map();
  if (target !== null) attributes.set("target", target);

  return {
    getAttribute: (name) => attributes.get(name) ?? null,
    matches: (selector) => selector === "a[href]",
    querySelectorAll: () => [],
    setAttribute: (name, value) => attributes.set(name, value)
  };
}

test("sets target=_blank on a GitHub link", () => {
  const link = createLink();

  assert.equal(setTargetBlank(link), true);
  assert.equal(link.getAttribute("target"), "_blank");
});

test("leaves an already updated link unchanged", () => {
  const link = createLink("_blank");

  assert.equal(setTargetBlank(link), false);
  assert.equal(link.getAttribute("target"), "_blank");
});

test("updates a link and links nested inside a rendered subtree", () => {
  const rootLink = createLink("_self");
  const nestedLink = createLink();
  rootLink.querySelectorAll = (selector) => {
    assert.equal(selector, "a[href]");
    return [nestedLink];
  };

  assert.equal(forceTargetBlank(rootLink), 2);
  assert.equal(rootLink.getAttribute("target"), "_blank");
  assert.equal(nestedLink.getAttribute("target"), "_blank");
});

test("observes dynamically rendered links and target changes", () => {
  const existingLink = createLink();
  const dynamicLink = createLink();
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
  const uninstall = install(doc, { MutationObserver });

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
    { type: "childList", addedNodes: [dynamicLink] },
    { type: "attributes", target: createLink("_self") }
  ]);
  assert.equal(dynamicLink.getAttribute("target"), "_blank");

  uninstall();
  assert.equal(disconnected, true);
});
