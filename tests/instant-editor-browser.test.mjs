import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);

function resolveChromeExecutable(platform = process.platform, env = process.env) {
  if (env.CHROME_BIN) return env.CHROME_BIN;
  return platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'google-chrome';
}

test('uses Chrome from PATH on Linux CI runners', () => {
  assert.equal(resolveChromeExecutable('linux', {}), 'google-chrome');
});

test('honours an explicit Chrome executable override', () => {
  assert.equal(
    resolveChromeExecutable('linux', { CHROME_BIN: '/opt/chrome-for-testing' }),
    '/opt/chrome-for-testing',
  );
});

test('the bundled editor starts in instant-render mode without a network CDN', async () => {
  const profile = await mkdtemp(join(tmpdir(), 'scratchpad-editor-test-'));
  const page = new URL('./instant-editor-smoke.html', import.meta.url).href;
  try {
    const { stdout } = await run(resolveChromeExecutable(), [
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
    assert.match(stdout, /data-overflows="false"/);
    assert.match(stdout, /data-has-inline-icon-script="false"/);
    assert.match(stdout, /data-no-network="true"/);
  } finally {
    await rm(profile, { recursive: true, force: true });
  }
});

for (const [surface, width, height] of [
  ['popup', 380, 520],
  ['sidebar', 760, 720],
]) {
  test(`a long note scrolls inside the ${surface} without clipping the footer`, async () => {
    const profile = await mkdtemp(join(tmpdir(), `scratchpad-${surface}-layout-test-`));
    const pageUrl = new URL('./long-note-layout.html', import.meta.url);
    pageUrl.searchParams.set('width', width);
    pageUrl.searchParams.set('height', height);
    try {
      const { stdout } = await run(resolveChromeExecutable(), [
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        `--user-data-dir=${profile}`,
        '--allow-file-access-from-files',
        '--window-size=900,900',
        '--virtual-time-budget=5000',
        '--dump-dom',
        pageUrl.href,
      ], { timeout: 15_000 });
      assert.match(stdout, /data-ready="true"/);
      assert.match(stdout, /data-footer-visible="true"/);
      assert.match(stdout, /data-document-overflows="false"/);
      assert.match(stdout, /data-editor-scrolls="true"/);
      assert.match(stdout, /data-editor-clear-of-footer="true"/);
      assert.match(stdout, /data-horizontal-overflow="false"/);
    } finally {
      await rm(profile, { recursive: true, force: true });
    }
  });
}
