import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';

const run = promisify(execFile);
const root = new URL('../', import.meta.url);

test('the pinned toolchain reproduces the committed Lute runtime', async () => {
  const outputDirectory = await mkdtemp(join(tmpdir(), 'scratchpad-lute-test-'));
  const output = join(outputDirectory, 'lute.min.js');
  try {
    await run(process.execPath, ['scripts/build-lute.mjs'], {
      cwd: root,
      env: { ...process.env, LUTE_OUTPUT: output },
    });
    const [expected, rebuilt] = await Promise.all([
      readFile(new URL('../third_party/lute/javascript/lute.min.js', import.meta.url)),
      readFile(output),
    ]);
    assert.deepEqual(rebuilt, expected);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});

test('the Firefox runtime is copied from the reproducible Lute build', async () => {
  await run(process.execPath, ['scripts/prepare-vendor.mjs'], {
    cwd: root,
  });

  const [builtRuntime, packagedRuntime] = await Promise.all([
    readFile(new URL('../third_party/lute/javascript/lute.min.js', import.meta.url)),
    readFile(new URL('../src/vendor/vditor/dist/js/lute/lute.min.js', import.meta.url)),
  ]);

  assert.deepEqual(packagedRuntime, builtRuntime);
});

test('the Mozilla source archive contains Lute source and its build chain', async () => {
  await run(process.execPath, ['scripts/package-source.mjs'], {
    cwd: root,
  });
  const archive = new URL('../dist/cross-browser-scratchpad-source.zip', import.meta.url);
  const { stdout } = await run('unzip', ['-Z1', fileURLToPath(archive)]);

  assert.match(stdout, /third_party\/lute\/lute\.go/);
  assert.match(stdout, /third_party\/lute\/javascript\/main\.go/);
  assert.match(stdout, /scripts\/build-lute\.mjs/);
});
