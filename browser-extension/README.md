# AI Atlas Lookup (Browser Extension)

Minimal Manifest V3 browser extension that surfaces a quick AI Atlas lookup card on GitHub and Hugging Face repository pages.

## Features

- Detects the current repo slug (`owner/repo`) on `github.com/*/*` and `huggingface.co/*/*` pages.
- Injects a small dark card linking to [https://ai-atlas.dev](https://ai-atlas.dev).
- Toolbar popup with a direct link to AI Atlas.

## Files

- `manifest.json` — Manifest V3 definition.
- `content.js` — Content script that detects the slug and injects the card.
- `popup.html` — Toolbar popup.
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` — Placeholder icons.

## Load in Chrome

1. Open `chrome://extensions/`.
2. Toggle **Developer mode** on (top right).
3. Click **Load unpacked**.
4. Select the `browser-extension/` folder.
5. Visit any GitHub or Hugging Face repo page (e.g. `https://github.com/owner/repo`) — the card should appear in the bottom-right.

## Load in Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Pick `browser-extension/manifest.json`.
4. The extension stays loaded for the current browser session.

## Permissions

- `activeTab` — required so the popup can open AI Atlas on the current tab.
- `host_permissions` for `github.com` and `huggingface.co` — required so the content script can run on those pages.

## Version

0.3.0
