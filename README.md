# Browser Tweaks

A single WebExtension for the browser fixes I kept rebuilding one at a time.

| Site or behaviour | Tweak |
| --- | --- |
| Tabs opened from links | Focuses the new tab without stealing focus for unrelated background tabs |
| GitHub | Opens external links in a new tab |
| GitHub repositories | Adds `Releases` beside `Code` |
| YouTube | Removes Shorts shelves |
| fast.com | Replaces the default light page with a dark theme |

It runs on Chromium browsers and Firefox 121 or newer. There are no runtime dependencies, stored settings, or standalone extension permissions.

## Load it locally

For Chromium, open `chrome://extensions`, enable developer mode, and choose `Load unpacked`. Select this repository.

For Firefox, open `about:debugging#/runtime/this-firefox`, choose `Load Temporary Add-on`, and select `manifest.json`. Firefox removes temporary add-ons when the browser restarts.

## Development

```bash
npm run check
npm run package
```

`npm run check` validates the manifest and runs the Node test suite. `npm run package` writes `dist/browser-tweaks.zip`.

MIT licensed.
