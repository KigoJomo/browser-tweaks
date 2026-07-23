const assert = require("node:assert/strict");
const test = require("node:test");

function loadBackground(apiName = "chrome") {
  let listener;
  const updates = [];

  delete globalThis.browser;
  delete globalThis.chrome;
  globalThis[apiName] = {
    tabs: {
      onCreated: {
        addListener(callback) {
          listener = callback;
        }
      },
      update(tabId, properties) {
        updates.push({ tabId, properties });
        return Promise.resolve();
      }
    }
  };

  delete require.cache[require.resolve("../background.js")];
  require("../background.js");
  assert.equal(typeof listener, "function");

  return { listener, updates };
}

test("activates a background tab opened by another tab", () => {
  const { listener, updates } = loadBackground();

  listener({ id: 42, active: false, openerTabId: 7 });

  assert.deepEqual(updates, [{ tabId: 42, properties: { active: true } }]);
});

test("uses Firefox's browser namespace when available", () => {
  const { listener, updates } = loadBackground("browser");

  listener({ id: 42, active: false, openerTabId: 7 });

  assert.deepEqual(updates, [{ tabId: 42, properties: { active: true } }]);
});

test("does not touch a tab that is already active", () => {
  const { listener, updates } = loadBackground();

  listener({ id: 42, active: true, openerTabId: 7 });

  assert.deepEqual(updates, []);
});

test("does not hijack tabs without an opener", () => {
  const { listener, updates } = loadBackground();

  listener({ id: 42, active: false });

  assert.deepEqual(updates, []);
});

test("ignores incomplete tab events", () => {
  const { listener, updates } = loadBackground();

  listener({ active: false, openerTabId: 7 });

  assert.deepEqual(updates, []);
});
