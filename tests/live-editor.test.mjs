import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('uses an always-on contenteditable surface instead of a Preview toggle', async () => {
  const [html, app] = await Promise.all([
    readFile(new URL('../src/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../src/app.js', import.meta.url), 'utf8'),
  ]);
  assert.match(html, /id="editor"[\s\S]*contenteditable="true"/);
  assert.doesNotMatch(html, /id="mode-button"/);
  assert.match(app, /renderLiveMarkdown/);
  assert.match(app, /convertHeadingShortcut/);
  assert.match(app, /markdown-syntax/);
  assert.doesNotMatch(app, /renderLiveMarkdown\(note\.body, true\)/);
});
