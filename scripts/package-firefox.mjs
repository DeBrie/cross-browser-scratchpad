import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const output = new URL('../dist/firefox/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(new URL('../firefox/manifest.json', import.meta.url), new URL('manifest.json', output));
await cp(new URL('../src/', import.meta.url), new URL('src/', output), { recursive: true });
execFileSync('zip', ['-rq', '../../scratchpad-firefox.zip', '.'], { cwd: output.pathname });
