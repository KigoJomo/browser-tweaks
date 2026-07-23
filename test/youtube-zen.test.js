const assert = require("node:assert/strict");
const test = require("node:test");

const { hideShorts, install } = require("../src/youtube-zen.js");

function createElement({ title, hasShort = false, hidden = false } = {}) {
  return {
    hidden,
    querySelector(selector) {
      if (selector === "#title, ytd-section-title-renderer") {
        return title === undefined ? null : { textContent: title };
      }
      if (selector === 'a[href^="/shorts/"]') {
        return hasShort ? {} : null;
      }
      return null;
    }
  };
}

test("hides Shorts sections by title, link, and shelf element", () => {
  const byTitle = createElement({ title: " Shorts " });
  const byLink = createElement({ hasShort: true });
  const regular = createElement({ title: "News" });
  const shelf = createElement();
  const doc = {
    querySelectorAll(selector) {
      return selector === "ytd-rich-section-renderer"
        ? [byTitle, byLink, regular]
        : [shelf];
    }
  };

  hideShorts(doc);

  assert.equal(byTitle.hidden, true);
  assert.equal(byLink.hidden, true);
  assert.equal(regular.hidden, false);
  assert.equal(shelf.hidden, true);
});

test("installs and disconnects a mutation observer", () => {
  let observed;
  let disconnected = false;
  class FakeObserver {
    constructor(callback) {
      assert.equal(typeof callback, "function");
    }

    observe(target, options) {
      observed = { target, options };
    }

    disconnect() {
      disconnected = true;
    }
  }
  const documentElement = {};
  const doc = {
    documentElement,
    querySelectorAll() {
      return [];
    }
  };

  const uninstall = install(doc, FakeObserver);

  assert.deepEqual(observed, {
    target: documentElement,
    options: { childList: true, subtree: true }
  });
  uninstall();
  assert.equal(disconnected, true);
});
