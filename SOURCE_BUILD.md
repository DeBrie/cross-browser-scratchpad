# Reproducible Firefox source build

This archive is the readable source package for Cross-Browser Scratchpad.

## Requirements

- Node.js 22 or newer (verified with Mozilla's Node.js 24.14 default)
- npm 10 or newer (verified with Mozilla's npm 11.9 default)
- macOS, Linux, or Windows with a `zip` command available

## Build the Firefox package

```sh
npm ci
npm run package:firefox
```

The resulting upload is `dist/scratchpad-firefox.zip`. The build script recreates
`src/vendor/vditor/` from the exact npm dependency recorded in `package-lock.json`.

## Bundled third-party library

The extension bundles the unmodified Vditor 3.11.2 instant-render Markdown editor
under its MIT license. The main Vditor runtime shipped in the add-on is its readable,
unminified distribution. Vditor also requires its generated Lute WebAssembly/JavaScript
runtime, which is copied verbatim from the same tagged release. No code is fetched from
a CDN or another network location at runtime.

- Official package: `vditor@3.11.2` from the public npm registry
- Readable Vditor runtime included in the add-on: https://github.com/Vanessa219/vditor/blob/v3.11.2/dist/index.js
- Vditor source: https://github.com/Vanessa219/vditor/tree/v3.11.2/src
- Generated Lute runtime included in the add-on: https://github.com/Vanessa219/vditor/blob/v3.11.2/dist/js/lute/lute.min.js
- License: https://github.com/Vanessa219/vditor/blob/v3.11.2/LICENSE
- Copy step: `scripts/prepare-vendor.mjs`

`npm ci` verifies the exact package integrity recorded in `package-lock.json`, and the
copy step copies these official distribution files byte-for-byte. Mozilla's validator
may report unsafe-DOM warnings in these upstream Vditor files. Scratchpad's own source
does not assign user content with `innerHTML`.
