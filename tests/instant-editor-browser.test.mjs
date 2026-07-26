import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

test('the bundled editor starts in instant-render mode without a network CDN', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'scratchpad-editor-test-'));
  const page = new URL('./instant-editor-smoke.html', import.meta.url).href;
  try {
    const { stdout } = await run(chrome, [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      `--user-data-dir=${profile}`,
      '--allow-file-access-from-files',
      '--virtual-time-budget=5000',
      '--dump-dom',
      page,
    ], { timeout: 15_000 });
    assert.match(stdout, /data-ready="true"/);
    assert.match(stdout, /data-mode="ir"/);
    const encodedValue = /data-value="([^\"]+)"/.exec(stdout)?.[1];
    assert.ok(encodedValue);
    const markdown = Buffer.from(encodedValue, 'base64').toString();
    assert.match(markdown, /^# Heading\n\n/);
    assert.match(markdown, /- \[ \]\s+Keep whitespace/);
    assert.match(markdown, /\*\*Bold\*\* and `code`/);
    assert.match(stdout, /data-heading-rendered="true"/);
    assert.match(stdout, /data-task-rendered="true"/);
    assert.match(stdout, /data-no-network="true"/);
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});
