import assert from "node:assert/strict";
import test from "node:test";

async function loadBackground() {
  let listener;
  const updates = [];

  globalThis.chrome = {
    runtime: { lastError: undefined },
    tabs: {
      onCreated: {
        addListener(callback) {
          listener = callback;
        }
      },
      update(tabId, properties, callback) {
        updates.push({ tabId, properties });
        callback();
      }
    }
  };

  await import(`../background.js?test=${Math.random()}`);
  assert.equal(typeof listener, "function");

  return { listener, updates };
}

test("activates a background tab opened by another tab", async () => {
  const { listener, updates } = await loadBackground();

  listener({ id: 42, active: false, openerTabId: 7 });

  assert.deepEqual(updates, [{ tabId: 42, properties: { active: true } }]);
});

test("does not touch a tab that is already active", async () => {
  const { listener, updates } = await loadBackground();

  listener({ id: 42, active: true, openerTabId: 7 });

  assert.deepEqual(updates, []);
});

test("does not hijack tabs without an opener", async () => {
  const { listener, updates } = await loadBackground();

  listener({ id: 42, active: false });

  assert.deepEqual(updates, []);
});

test("ignores incomplete tab events", async () => {
  const { listener, updates } = await loadBackground();

  listener({ active: false, openerTabId: 7 });

  assert.deepEqual(updates, []);
});
