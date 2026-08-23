const { execFileSync } = require("node:child_process");
const { mkdirSync, readFileSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const outputDirectory = join(root, "dist");
const archive = join(outputDirectory, "browser-tweaks.zip");
const manifest = JSON.parse(readFileSync(join(root, "manifest.json"), "utf8"));
const extensionFiles = new Set([
  "manifest.json",
  manifest.background.service_worker,
  ...(manifest.background.scripts ?? []),
  ...manifest.content_scripts.flatMap((script) => [
    ...(script.js ?? []),
    ...(script.css ?? [])
  ])
]);

mkdirSync(outputDirectory, { recursive: true });
rmSync(archive, { force: true });

execFileSync(
  "zip",
  ["-r", archive, ...extensionFiles],
  { cwd: root, stdio: "inherit" }
);
