import { cp, mkdir, rm } from 'node:fs/promises';

const vendorRoot = new URL('../src/vendor/vditor/', import.meta.url);
const vditorRoot = new URL('../node_modules/vditor/', import.meta.url);
const luteRuntime = new URL('../third_party/lute/javascript/lute.min.js', import.meta.url);

await rm(vendorRoot, { recursive: true, force: true });
await mkdir(vendorRoot, { recursive: true });
const runtimeFiles = [
  'dist/index.css',
  'dist/index.js',
  'dist/css/content-theme/light.css',
  'dist/js/i18n/en_US.js',
  'dist/js/icons/ant.js',
];
for (const file of runtimeFiles) {
  const target = new URL(file, vendorRoot);
  await mkdir(new URL('.', target), { recursive: true });
  await cp(new URL(file, vditorRoot), target);
}
await mkdir(new URL('dist/js/lute/', vendorRoot), { recursive: true });
await cp(luteRuntime, new URL('dist/js/lute/lute.min.js', vendorRoot));
await cp(new URL('LICENSE', vditorRoot), new URL('LICENSE', vendorRoot));
