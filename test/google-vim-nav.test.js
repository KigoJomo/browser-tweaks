const assert = require("node:assert/strict");
const test = require("node:test");

const {
  focusSearch,
  getResultLinks,
  handleKeydown,
  install,
  navigateResults,
  openSelectedResult
} = require("../src/google-vim-nav.js");

function createFixture(resultCount = 3) {
  const doc = { activeElement: null };
  const links = Array.from({ length: resultCount }, (_, index) => {
    const attributes = new Set();
    return {
      index,
      focusOptions: null,
      clicked: false,
      scrollOptions: null,
      click() {
        this.clicked = true;
      },
      focus(options) {
        this.focusOptions = options;
        doc.activeElement = this;
      },
      hasAttribute(name) {
        return attributes.has(name);
      },
      querySelector(selector) {
        return selector === "h3" ? {} : null;
      },
      removeAttribute(name) {
        attributes.delete(name);
      },
      scrollIntoView(options) {
        this.scrollOptions = options;
      },
      setAttribute(name) {
        attributes.add(name);
      }
    };
  });
  const unrelatedLink = {
    querySelector: () => null
  };
  const search = {
    querySelectorAll(selector) {
      assert.equal(selector, "a[href]");
      return [unrelatedLink, ...links];
    }
  };
  doc.querySelector = (selector) => (selector === "#search" ? search : null);

  return { doc, links };
}

function createEvent(key, target = { closest: () => null }) {
  return {
    key,
    target,
    altKey: false,
    ctrlKey: false,
    defaultPrevented: false,
    metaKey: false,
    prevented: false,
    preventDefault() {
      this.prevented = true;
    }
  };
}

test("finds only heading links inside Google's results container", () => {
  const { doc, links } = createFixture();
  assert.deepEqual(getResultLinks(doc), links);
  assert.deepEqual(getResultLinks({ querySelector: () => null }), []);
});

test("j and k move focus through results without wrapping", () => {
  const { doc, links } = createFixture();

  assert.equal(navigateResults(doc, 1), true);
  assert.equal(doc.activeElement, links[0]);
  assert.deepEqual(links[0].focusOptions, { preventScroll: true });
  assert.deepEqual(links[0].scrollOptions, { block: "center" });

  navigateResults(doc, 1);
  assert.equal(doc.activeElement, links[1]);

  navigateResults(doc, -1);
  navigateResults(doc, -1);
  assert.equal(doc.activeElement, links[0]);
});

test("k starts at the last result when none is selected", () => {
  const { doc, links } = createFixture();
  navigateResults(doc, -1);
  assert.equal(doc.activeElement, links[2]);
});

test("h focuses Google's search field", () => {
  const searchInput = { focused: false, focus() { this.focused = true; } };
  const doc = {
    querySelector(selector) {
      assert.equal(selector, 'textarea[name="q"], input[name="q"]');
      return searchInput;
    }
  };

  assert.equal(focusSearch(doc), true);
  assert.equal(searchInput.focused, true);
});

test("l opens the selected result", () => {
  const { doc, links } = createFixture();
  navigateResults(doc, 1);

  assert.equal(openSelectedResult(doc), true);
  assert.equal(links[0].clicked, true);
});

test("navigation reads the current results on every key press", () => {
  const firstFixture = createFixture(1);
  navigateResults(firstFixture.doc, 1);

  const replacementFixture = createFixture(2);
  assert.equal(navigateResults(replacementFixture.doc, 1), true);
  assert.equal(replacementFixture.doc.activeElement, replacementFixture.links[0]);
});

test("handles lowercase Vim keys and leaves shifted keys alone", () => {
  const { doc, links } = createFixture();
  const j = createEvent("j");
  const shiftedJ = createEvent("J");

  assert.equal(handleKeydown(j, doc), true);
  assert.equal(j.prevented, true);
  assert.equal(doc.activeElement, links[0]);
  assert.equal(handleKeydown(shiftedJ, doc), false);
  assert.equal(shiftedJ.prevented, false);

  const l = createEvent("l");
  assert.equal(handleKeydown(l, doc), true);
  assert.equal(links[0].clicked, true);
});

test("does not navigate while typing or using modified shortcuts", () => {
  const { doc } = createFixture();
  const inputEvent = createEvent("j", {
    closest: (selector) => (selector.includes("input") ? {} : null)
  });
  const modifiedEvent = createEvent("j");
  modifiedEvent.ctrlKey = true;

  assert.equal(handleKeydown(inputEvent, doc), false);
  assert.equal(handleKeydown(modifiedEvent, doc), false);
  assert.equal(inputEvent.prevented, false);
  assert.equal(modifiedEvent.prevented, false);
});

test("installs and removes one keydown listener", () => {
  let installed;
  let removed;
  const doc = {
    addEventListener(type, listener) {
      installed = { type, listener };
    },
    removeEventListener(type, listener) {
      removed = { type, listener };
    }
  };

  const uninstall = install(doc);
  assert.equal(installed.type, "keydown");
  uninstall();
  assert.deepEqual(removed, installed);
});
