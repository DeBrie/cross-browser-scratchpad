import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('uses a bundled instant-render Markdown editor instead of a custom contenteditable parser', async () => {
  const [html, app] = await Promise.all([
    readFile(new URL('../src/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
  ]);

  assert.match(html, /href="vendor\/vditor\/dist\/index\.css"/);
  assert.match(html, /src="vendor\/vditor\/dist\/index\.js"/);
  assert.doesNotMatch(html, /index\.min\.js/);
  assert.match(html, /id="editor"/);
  assert.doesNotMatch(html, /contenteditable=/);
  assert.match(app, /new Vditor\("editor",/);
  assert.match(app, /mode:\s*"ir"/);
  assert.match(app, /width:\s*"100%"/);
  assert.match(app, /icon:\s*""/);
  assert.match(app, /cache:\s*\{\s*enable:\s*false\s*\}/);
  assert.doesNotMatch(app, /markdownFromEditor/);
  assert.doesNotMatch(app, /renderLiveMarkdown/);
  assert.doesNotMatch(app, /convertHeadingShortcut/);
});

test('packages Vditor\'s readable runtime instead of its minified bundle', async () => {
  const vendorScript = await readFile(new URL('../scripts/prepare-vendor.mjs', import.meta.url), 'utf8');

  assert.match(vendorScript, /'dist\/index\.js'/);
  assert.doesNotMatch(vendorScript, /'dist\/index\.min\.js'/);
});
