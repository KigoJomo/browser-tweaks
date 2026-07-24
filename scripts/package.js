const { execFileSync } = require("node:child_process");
const { mkdirSync, rmSync } = require("node:fs");
const { join } = require("node:path");

const root = join(__dirname, "..");
const outputDirectory = join(root, "dist");
const archive = join(outputDirectory, "browser-tweaks.zip");

mkdirSync(outputDirectory, { recursive: true });
rmSync(archive, { force: true });

execFileSync(
  "zip",
  [
    "-r",
    archive,
    "manifest.json",
    "background.js",
    "src/github-target-blank.js",
    "src/github-releases-nav.js",
    "src/github-releases-nav.css",
    "src/youtube-zen.js",
    "src/fast-dark.css"
  ],
  { cwd: root, stdio: "inherit" }
);
