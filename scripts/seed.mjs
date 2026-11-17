// `npm run seed`: resets the database to the sample data (APP-6), the same way on every OS.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync('uv', ['run', '--project', root, 'python', '-m', 'accountable.seed'], {
  cwd: join(root, 'backend'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
