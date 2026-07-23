const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findRepositoryNavigation,
  getReleasesPath,
  getRepositoryNwo,
  getRepositoryPath,
  isReleasesRoute,
  normalizeRepositoryNwo
} = require("../src/github-releases-nav.js");

test("recognizes releases routes and excludes other Code routes", () => {
  assert.equal(isReleasesRoute("/openai/codex/releases", "openai/codex"), true);
  assert.equal(
    isReleasesRoute("/openai/codex/releases/tag/v1.0.0", "openai/codex"),
    true
  );
  assert.equal(isReleasesRoute("/openai/codex", "openai/codex"), false);
  assert.equal(isReleasesRoute("/openai/codex/tree/main", "openai/codex"), false);
});

test("only searches GitHub's repository tab navigation", () => {
  const codeItem = { id: "code-item" };
  const codeLink = {
    href: "https://github.com/openai/codex",
    closest: (selector) => (selector === "li" ? codeItem : null)
  };
  const repositoryNav = {
    querySelectorAll: (selector) => (selector === "a[href]" ? [codeLink] : [])
  };
  const doc = {
    querySelectorAll(selector) {
      assert.equal(
        selector,
        'nav[aria-label="Repository"], nav[data-testid="repository-nav"], nav.js-repo-nav'
      );
      return [repositoryNav];
    }
  };

  assert.deepEqual(
    findRepositoryNavigation(
      doc,
      "openai/codex",
      "https://github.com/openai/codex"
    ),
    { nav: repositoryNav, codeLink, codeItem }
  );
});

test("does not fall back to unrelated navigation containers", () => {
  const breadcrumbOnlyDocument = { querySelectorAll: () => [] };

  assert.equal(
    findRepositoryNavigation(
      breadcrumbOnlyDocument,
      "openai/codex",
      "https://github.com/openai/codex"
    ),
    null
  );
});

test("normalizes a valid GitHub repository name", () => {
  assert.equal(normalizeRepositoryNwo(" openai/codex "), "openai/codex");
});

test("rejects values that are not an owner/repository pair", () => {
  assert.equal(normalizeRepositoryNwo("openai"), null);
  assert.equal(normalizeRepositoryNwo("openai/codex/releases"), null);
  assert.equal(normalizeRepositoryNwo("open ai/codex"), null);
  assert.equal(normalizeRepositoryNwo(null), null);
});

test("builds repository-relative paths without requesting extra permissions", () => {
  assert.equal(getRepositoryPath("openai/codex"), "/openai/codex");
  assert.equal(getReleasesPath("openai/codex"), "/openai/codex/releases");
});

test("reads the repository identity from GitHub metadata", () => {
  const doc = {
    querySelector(selector) {
      assert.equal(
        selector,
        'meta[name="octolytics-dimension-repository_nwo"]'
      );
      return { getAttribute: () => "openai/codex" };
    }
  };

  assert.equal(getRepositoryNwo(doc), "openai/codex");
});

test("returns null when repository metadata is unavailable", () => {
  const doc = { querySelector: () => null };
  assert.equal(getRepositoryNwo(doc), null);
});
