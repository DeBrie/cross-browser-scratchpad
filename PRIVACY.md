# Privacy Policy

Last updated: 24 July 2026

Scratchpad is a local-first browser extension. By default, notes remain only in the extension storage on the device where they are created.

## Optional encrypted sync

Sync is disabled until you deliberately create or sign in to an account and confirm the in-app disclosure. When enabled, the extension derives encryption material from the password on the device and encrypts global and site notes before transmitting them to the Scratchpad sync service over HTTPS.

The service stores encrypted note blobs, encryption salts, opaque account identifiers, password-verifier material, encrypted revision history, and hashed session tokens. For a site-specific note, it also receives that note's hostname (for example, `example.com`) so the encrypted record can be identified and synced. It does not receive readable note contents, the full page URL, page content, browsing history, or the account password. Ephemeral notes are never uploaded.

## Data use and sharing

We use the encrypted records and account/session metadata solely to provide the user-requested cross-browser sync feature. We do not sell, rent, use for advertising, or allow people to read note contents. We do not use browser data for unrelated purposes.

## Retention and deletion

Notes and encrypted revisions remain until an account-deletion feature is provided or service data is removed by the operator. A forgotten password cannot recover the encrypted vault in this version.

## Contact

For privacy or security questions, open a private security report through the repository owner rather than including sensitive information in a public issue.
