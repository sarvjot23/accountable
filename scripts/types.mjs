// `npm run types`: writes the backend's OpenAPI schema (no server needed) and generates
// frontend/src/lib/api-types.ts from it. With --check, fails if the checked-in file is out of date.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import openapiTS, { astToString } from 'openapi-typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'frontend', 'src', 'lib', 'api-types.ts');
const check = process.argv.includes('--check');

const result = spawnSync('uv', ['run', '--project', root, 'python', '-m', 'accountable.openapi'], {
  cwd: join(root, 'backend'),
  encoding: 'utf8',
  shell: process.platform === 'win32',
  maxBuffer: 32 * 1024 * 1024,
});
if (result.status !== 0) {
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}

const schema = JSON.parse(result.stdout);
const header =
  '// Generated from the backend\'s OpenAPI schema by `npm run types`. Do not edit by hand.\n\n';
const generated = (header + astToString(await openapiTS(schema))).replace(/\r\n/g, '\n');

if (check) {
  const current = existsSync(target) ? readFileSync(target, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== generated) {
    console.error('frontend/src/lib/api-types.ts is out of date with the API. Run `npm run types`.');
    process.exit(1);
  }
  console.log('API types are up to date.');
} else {
  writeFileSync(target, generated);
  console.log('Wrote frontend/src/lib/api-types.ts');
}
