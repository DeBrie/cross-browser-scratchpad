# Reproducible Firefox source build

This archive is the readable source package for Cross-Browser Scratchpad.

## Requirements

- Node.js 22 or newer
- npm 10 or newer
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
under its MIT license. Only its runtime files are copied into the extension; no code
is fetched from a CDN or another network location at runtime.

- Official package: `vditor@3.11.2` from the public npm registry
- Readable source: https://github.com/Vanessa219/vditor/tree/v3.11.2
- License: https://github.com/Vanessa219/vditor/blob/v3.11.2/LICENSE
- Copy step: `scripts/prepare-vendor.mjs`

Mozilla's validator may report unsafe-DOM warnings in Vditor's upstream minified
runtime. Those warnings originate in the unmodified library; Scratchpad's own source
does not assign user content with `innerHTML`.
