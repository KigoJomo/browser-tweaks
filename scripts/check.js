const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));

assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.name, "Browser Tweaks");
assert.equal(manifest.background.service_worker, "background.js");
assert.deepEqual(manifest.background.scripts, ["background.js"]);
assert.equal(
  manifest.browser_specific_settings.gecko.data_collection_permissions.required[0],
  "none"
);

const referencedFiles = [
  manifest.background.service_worker,
  ...manifest.content_scripts.flatMap((script) => [
    ...(script.js ?? []),
    ...(script.css ?? [])
  ])
];

for (const path of referencedFiles) {
  readFileSync(join(root, path));
}

console.log(`Manifest is valid and references ${referencedFiles.length} files.`);
