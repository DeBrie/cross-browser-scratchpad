import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const goToolchain = 'go1.19.13';
const gopherjsVersion = 'v1.19.0-beta2';
const source = new URL('../third_party/lute/javascript/', import.meta.url);
const output = process.env.LUTE_OUTPUT
  ? pathToFileURL(process.env.LUTE_OUTPUT)
  : new URL('lute.min.js', source);
const sourceMap = new URL(`${output.href}.map`);
const tools = await mkdtemp(join(tmpdir(), 'scratchpad-lute-build-'));
const gopherjs = join(tools, process.platform === 'win32' ? 'gopherjs.exe' : 'gopherjs');

try {
  execFileSync('go', ['install', `github.com/gopherjs/gopherjs@${gopherjsVersion}`], {
    stdio: 'inherit',
    env: {
      ...process.env,
      GOBIN: tools,
      GOTOOLCHAIN: goToolchain,
    },
  });
  execFileSync(gopherjs, ['build', '--tags', 'javascript', '-o', fileURLToPath(output), '-m'], {
    cwd: fileURLToPath(source),
    stdio: 'inherit',
    env: {
      ...process.env,
      GOARCH: 'ecmascript',
      GOOS: 'js',
      GOTOOLCHAIN: goToolchain,
    },
  });
  const runtime = await readFile(output, 'utf8');
  await writeFile(output, runtime.replace(/\n?\/\/# sourceMappingURL=.*\s*$/, '\n'));
  await rm(sourceMap, { force: true });
} finally {
  await rm(tools, { recursive: true, force: true });
}
