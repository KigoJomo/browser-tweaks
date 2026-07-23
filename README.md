# Browser Tweaks

A lightweight, cross-browser WebExtension for small browser-experience fixes.

## Tweaks

- Immediately focuses tabs opened from links without hijacking unrelated tabs.
- Removes Shorts shelves from YouTube.
- Adds Releases beside Code in GitHub repository navigation.
- Applies a dark theme to fast.com.

It supports Chromium-based browsers and Firefox 121 or newer. It has no runtime
dependencies, stores no data, and requests no standalone permissions.

## Load unpacked

### Chromium

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this project directory.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Select **Load Temporary Add-on**.
3. Choose `manifest.json` in this project directory.

Temporary Firefox add-ons must be reloaded after Firefox restarts.

## Development

```sh
npm run check
npm run package
```

The package command creates `dist/browser-tweaks.zip`.
