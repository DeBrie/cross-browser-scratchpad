import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('makes every Vditor editing layer inherit Scratchpad paper', async () => {
  const css = await readFile(new URL('../src/library.css', import.meta.url), 'utf8');

  assert.match(css, /#editor\.vditor[\s\S]*background(?:-color)?:\s*var\(--paper\)\s*!important/);
  assert.match(css, /#editor\s+\.vditor-content[\s\S]*background(?:-color)?:\s*var\(--paper\)\s*!important/);
  assert.match(css, /#editor\s+\.vditor-ir[\s\S]*background(?:-color)?:\s*var\(--paper\)\s*!important/);
});
