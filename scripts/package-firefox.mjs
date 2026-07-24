import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const output = new URL('../dist/firefox/', import.meta.url);
const archive = new URL('../scratchpad-firefox.zip', import.meta.url);
await rm(output, { recursive: true, force: true });
await rm(archive, { force: true });
await mkdir(output, { recursive: true });
await cp(new URL('../firefox/manifest.json', import.meta.url), new URL('manifest.json', output));
await mkdir(new URL('firefox/', output), { recursive: true });
await cp(new URL('../firefox/background.js', import.meta.url), new URL('firefox/background.js', output));
await cp(new URL('../src/', import.meta.url), new URL('src/', output), {
  recursive: true,
  filter: (source) => !String(source).endsWith('background.js'),
});
await rm(new URL('src/background.js', output), { force: true });
await cp(new URL('../assets/', import.meta.url), new URL('assets/', output), { recursive: true });
execFileSync('zip', ['-rq', archive.pathname, '.'], { cwd: output.pathname });
