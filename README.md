# Chromium Tweaks

A lightweight Manifest V3 extension for small Chromium browser-behavior tweaks.

## Current tweak

Tabs opened from a link become active immediately. This covers Ctrl/Cmd-click,
middle-click, the context menu's **Open link in new tab**, and links using
`target="_blank"`.

Unrelated tabs, such as a manually opened new tab or restored session tabs, are
left alone.

## Load unpacked

1. Open `chrome://extensions` in Chrome, Chromium, Brave, Edge, or another
   Chromium-based browser.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this project directory.

After changing the extension's files, use its **Reload** button on the
extensions page.

## Development

The extension has no runtime dependencies and requests no permissions.

```sh
npm test
```
