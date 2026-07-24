# Store submission checklist

## Shared

- [ ] Run `npm ci && npm test && npm run check`.
- [ ] Build the Chrome and Firefox packages from the release tag.
- [ ] Test first sync with empty, non-empty, and conflicting local notes.
- [ ] Publish the repository `PRIVACY.md` as the privacy-policy URL.
- [ ] Use the copy in `store/LISTING.md` for the listing and disclosure fields.
- [ ] Capture current screenshots of the popup, Markdown preview, and Sync-consent dialog at the store's required dimensions.

## Chrome Web Store

- [ ] Confirm the developer account has 2-Step Verification enabled.
- [ ] Upload `chrome-scratchpad-extension.zip` with `manifest.json` at the archive root.
- [ ] Add the 128px icon and at least one current product screenshot.
- [ ] Set the single purpose to local-first Markdown notes with optional encrypted cross-browser sync.
- [ ] Link `PRIVACY.md` from a public URL in the Privacy practices section.
- [ ] Declare the email/account metadata and encrypted note records used only for optional sync.
- [ ] Submit for review.

## Firefox Add-ons (AMO)

- [ ] Upload `scratchpad-firefox.zip` to AMO.
- [ ] Use the existing Gecko ID `scratchpad@local`.
- [ ] Add the icon, screenshots, support URL, privacy-policy URL, and listing copy.
- [ ] Complete AMO's data-collection and privacy questionnaire.
- [ ] Submit for signing and listed distribution.
