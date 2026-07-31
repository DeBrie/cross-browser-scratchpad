# Reproducible Firefox source build

This archive is the readable source package for Cross-Browser Scratchpad.

## Requirements

- Node.js 22 or newer (verified with Mozilla's Node.js 24.14 default)
- npm 10 or newer (verified with Mozilla's npm 11.9 default)
- Go 1.21 or newer with toolchain downloads enabled (verified with Go 1.24.5;
  the build selects Go 1.19.13 automatically)
- macOS, Linux, or Windows with a `zip` command available

## Build the Firefox package

```sh
npm ci
npm run rebuild:lute
npm run package:firefox
```

The resulting upload is `dist/scratchpad-firefox.zip`. The build script recreates
`src/vendor/vditor/` from the exact npm dependency recorded in `package-lock.json`
and the Lute runtime rebuilt by the preceding command.

## Bundled third-party library

The extension bundles Vditor 3.11.2 under its MIT license. Its main runtime is the
readable, unminified distribution. Vditor requires Lute, a Markdown engine written in
Go. The complete readable Lute v1.7.6 source is included under `third_party/lute/`.
`npm run rebuild:lute` compiles it with pinned GopherJS v1.19.0-beta2 and Go 1.19.13,
then applies GopherJS's `-m` size optimisation. The result is generated/minified code,
not hand-authored or obfuscated code, and it can be reproduced from the included source.
No code is fetched at extension runtime.

- Official package: `vditor@3.11.2` from the public npm registry
- Readable Vditor runtime included in the add-on: https://github.com/Vanessa219/vditor/blob/v3.11.2/dist/index.js
- Vditor source: https://github.com/Vanessa219/vditor/tree/v3.11.2/src
- License: https://github.com/Vanessa219/vditor/blob/v3.11.2/LICENSE
- Lute source release: https://github.com/88250/lute/tree/v1.7.6
- Lute source commit: https://github.com/88250/lute/commit/1f5951d8baaa29542bfa7c41415f4d68fa040202
- GopherJS compiler: https://github.com/gopherjs/gopherjs/tree/v1.19.0-beta2
- Lute compile step: `scripts/build-lute.mjs`
- Runtime copy step: `scripts/prepare-vendor.mjs`

Mozilla's validator may report unsafe-DOM warnings in Vditor's readable upstream
runtime. Scratchpad's own source does not assign user content with `innerHTML`.
