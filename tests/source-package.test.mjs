import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('provides a reproducible source package for the bundled Markdown editor', async () => {
  const [packageJson, guide, workflow] = await Promise.all([
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
    readFile(new URL('../SOURCE_BUILD.md', import.meta.url), 'utf8'),
    readFile(new URL('../.github/workflows/release.yml', import.meta.url), 'utf8'),
  ]);

  assert.match(packageJson, /"package:source"/);
  assert.match(guide, /npm ci/);
  assert.match(guide, /npm run package:firefox/);
  assert.match(guide, /Vditor 3\.11\.2/);
  assert.match(guide, /Vanessa219\/vditor\/tree\/v3\.11\.2/);
  assert.match(guide, /Vanessa219\/vditor\/blob\/v3\.11\.2\/dist\/index\.js/);
  assert.match(guide, /88250\/lute\/tree\/v1\.7\.6/);
  assert.match(guide, /npm run rebuild:lute/);
  assert.match(workflow, /npm run package:source/);
  assert.match(
    await readFile(new URL('../scripts/package-source.mjs', import.meta.url), 'utf8'),
    /vendor\(\?:\[\\\\\/\]\|\$\)/,
  );
});

test('source packaging supports repository paths containing spaces', async () => {
  const script = await readFile(new URL('../scripts/package-source.mjs', import.meta.url), 'utf8');
  assert.match(script, /fileURLToPath/);
  assert.doesNotMatch(script, /\.pathname/);
});
