import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Firefox manifest uses its Firefox-only background worker', async () => {
  const manifest = JSON.parse(await readFile(new URL('../firefox/manifest.json', import.meta.url), 'utf8'));
  assert.deepEqual(manifest.background.scripts, ['firefox/background.js']);
});

test('Firefox packaging recreates its archive before adding files', async () => {
  const script = await readFile(new URL('../scripts/package-firefox.mjs', import.meta.url), 'utf8');
  assert.match(script, /await rm\(archive, \{ force: true \}\);/);
});
