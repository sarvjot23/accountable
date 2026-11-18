// Claude Code Stop hook: runs `npm run check:quick` when Claude finishes a turn.
// If it fails, the turn is blocked once and the failure is sent back to Claude to fix.
// When Claude stops again after that (stop_hook_active), it is let through, so this can't loop.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
if (input.stop_hook_active) process.exit(0);

const run = spawnSync('npm run check:quick', {
  cwd: process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd(),
  shell: true,
  encoding: 'utf8',
  env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  maxBuffer: 64 * 1024 * 1024,
});
if (run.status === 0) process.exit(0);

// Send back the end of the output, where the failure is.
const output = `${run.stdout ?? ''}\n${run.stderr ?? ''}`.trim().split('\n').slice(-120).join('\n');
console.log(
  JSON.stringify({
    decision: 'block',
    reason: `npm run check:quick failed (exit ${run.status}). Fix this without weakening any rule, then finish:\n\n${output}`,
  }),
);
