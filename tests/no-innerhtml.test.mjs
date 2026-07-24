import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('extension source does not assign HTML strings into the DOM', async () => {
  const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /innerHTML/);
});
