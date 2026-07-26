# Contributing

Thanks for helping improve Scratchpad.

## Development

Use Node.js 22 or newer.

```sh
npm ci
npm run prepare:vendor
npm test
npm run check
npm run package:firefox
```

Load the Chrome extension from the repository root with Chrome's **Load unpacked** flow. For Firefox, load `dist/firefox/manifest.json` temporarily from `about:debugging`.

## Pull requests

- Keep changes focused and include tests for note storage, encryption, or merge behaviour.
- Never add credentials, `.dev.vars`, generated ZIPs, or Cloudflare secrets.
- Run the commands above before opening a PR.
- Explain user-visible behaviour and any data-migration implications in the PR description.

## Security

Do not report security issues in public issues. Contact the repository owner privately with a minimal reproduction and impact description.
