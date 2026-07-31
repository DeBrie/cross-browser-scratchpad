import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/source/', import.meta.url);
const archive = new URL('../dist/cross-browser-scratchpad-source.zip', import.meta.url);
const root = new URL('../', import.meta.url);

await rm(output, { recursive: true, force: true });
await rm(archive, { force: true });
await mkdir(output, { recursive: true });

for (const file of [
  'package.json',
  'package-lock.json',
  'manifest.json',
  'README.md',
  'CONTRIBUTING.md',
  'SOURCE_BUILD.md',
  'PRIVACY.md',
  'LICENSE',
]) {
  await cp(new URL(file, root), new URL(file, output));
}
for (const directory of ['assets/', 'firefox/', 'scripts/', 'tests/']) {
  await cp(new URL(directory, root), new URL(directory, output), {
    recursive: true,
  });
}
await cp(new URL('src/', root), new URL('src/', output), {
  recursive: true,
  filter: (source) => !/[\\/]vendor(?:[\\/]|$)/.test(String(source)),
});
execFileSync('zip', ['-rq', fileURLToPath(archive), '.'], { cwd: fileURLToPath(output) });
