# Scratchpad

A local-first, encrypted Markdown scratchpad for Chromium browsers and Firefox.

Scratchpad keeps a global note, a per-site note, and an ephemeral note in one quiet popup. Optional end-to-end encrypted sync connects your global and site notes across browsers without sending note text or passwords to the server.

The optional sync service is available at `scratchpad-sync.localintelligence.dev`.

## Install in Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode** in the top-right corner.
3. Choose **Load unpacked**.
4. Select the cloned repository folder.
5. Pin Scratchpad and click its toolbar button to write.

Or download `chrome-scratchpad-extension.zip` from a GitHub release, extract it, and select the extracted folder.

## Notes

- **All notes** persists across every page.
- **This site** persists separately for each website hostname.
- **Ephemeral** lasts only for the current Chrome window and is removed when that window closes.
- Use **Preview** to read rendered Markdown, or **📌** to open the same workspace in Chrome's side panel.
- **Sync** is optional. Use **🔒** to create an account or sign in; global and site notes are encrypted in the extension before crossing to the sync service. Ephemeral notes never leave the current browser window.
- When two browsers have divergent notes on first sync, Scratchpad preserves both as Markdown sections instead of silently discarding either copy.

## Firefox

Run `npm run package:firefox`, then load `dist/firefox/manifest.json` temporarily from `about:debugging#/runtime/this-firefox`. Release ZIPs are also attached to GitHub releases. The same optional encrypted sync account works in both browser builds.

## Releases and CI

Every pull request and push to `main` runs tests, source checks, and packages both extensions. Pushing a tag such as `v1.2.0` creates a GitHub release with the Chrome and Firefox ZIP files.

## Verify

```sh
npm test
npm run check
npm run package:firefox
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and pull-request guidance.

Read the [Privacy Policy](PRIVACY.md) before enabling optional encrypted sync.
