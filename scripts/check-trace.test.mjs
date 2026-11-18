// Tests for the traceability check, with small sample repos in a temp folder.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { checkTrace, idPattern } from './check-trace.mjs';

const SPEC = `# Spec
- **[RULE-1]** one
- **[RULE-14]** fourteen
- ~~**[RULE-2]** old~~ Dropped 2026-11-01
`;

const plan = (rows) => `# Plan
## Order of work
- **P1.1** do things
- **P2.1** more things
## Traceability
| ID | Requirement | Built in | Proved by |
| --- | --- | --- | --- |
${rows.join('\n')}
## Proof
`;

const GOOD_ROWS = ['| RULE-1 | one | P1.1 | B:test_a.py |', '| RULE-14 | fourteen | P1.1 | B:test_a.py |'];

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), 'trace-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

test('a complete sample passes', () => {
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan(GOOD_ROWS),
    'backend/tests/test_a.py': '# RULE-1\n# RULE-14\n',
  });
  assert.deepEqual(checkTrace({ root, throughPhase: 1 }), []);
});

test('a spec ID with no row is reported', () => {
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan([GOOD_ROWS[0]]),
    'backend/tests/test_a.py': '# RULE-1\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.ok(problems.some((p) => p.includes('RULE-14 has no row')), problems.join('\n'));
});

test('a row naming an unknown ID is reported', () => {
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan([...GOOD_ROWS, '| RULE-9 | nine | P1.1 | B:test_a.py |']),
    'backend/tests/test_a.py': '# RULE-1 RULE-14\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.ok(problems.some((p) => p.includes("RULE-9 is in the Traceability table but the spec doesn't define it")));
});

test('a test mentioning an unknown ID is reported', () => {
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan(GOOD_ROWS),
    'backend/tests/test_a.py': '# RULE-1 RULE-14 RULE-77\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.ok(problems.some((p) => p.includes('mentions RULE-77')));
});

test('a duplicate ID in the spec is reported', () => {
  const root = repo({
    'docs/spec.md': `${SPEC}- **[RULE-1]** again\n`,
    'docs/changes/mvp/plan.md': plan(GOOD_ROWS),
    'backend/tests/test_a.py': '# RULE-1 RULE-14\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.ok(problems.some((p) => p.includes('RULE-1 is defined more than once')));
});

test('an ID not in the PREFIX-N form is reported', () => {
  const root = repo({
    'docs/spec.md': `${SPEC}- **[Rule-x]** odd\n`,
    'docs/changes/mvp/plan.md': plan(GOOD_ROWS),
    'backend/tests/test_a.py': '# RULE-1 RULE-14\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.ok(problems.some((p) => p.includes('"Rule-x" is not in the PREFIX-N form')));
});

test('a proof file that does not mention its ID is reported', () => {
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan(GOOD_ROWS),
    'backend/tests/test_a.py': '# RULE-14 only\n',
  });
  const problems = checkTrace({ root, throughPhase: 1 });
  assert.deepEqual(problems, ["RULE-1: backend/tests/test_a.py doesn't mention RULE-1"]);
});

test('RULE-1 is not matched by RULE-14', () => {
  assert.equal(idPattern('RULE-1').test('covers RULE-14'), false);
  assert.equal(idPattern('RULE-1').test('covers RULE-1, and more'), true);
  assert.equal(idPattern('RULE-1').test('[RULE-1]'), true);
  assert.equal(idPattern('RULE-1').test('XRULE-1'), false);
});

test('a missing proof file is reported only once its phase is reached', () => {
  const rows = ['| RULE-1 | one | P2.1 | B:test_b.py |', '| RULE-14 | fourteen | P1.1 | B:test_a.py |'];
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan(rows),
    'backend/tests/test_a.py': '# RULE-14\n',
  });
  assert.deepEqual(checkTrace({ root, throughPhase: 1 }), []);
  assert.deepEqual(checkTrace({ root, throughPhase: 2 }), ['RULE-1: backend/tests/test_b.py is missing']);
});

test('a step not in Order of work, and empty cells, are reported', () => {
  const rows = ['| RULE-1 | one | P9.9 | B:test_a.py |', '| RULE-14 | fourteen |  |  |'];
  const root = repo({
    'docs/spec.md': SPEC,
    'docs/changes/mvp/plan.md': plan(rows),
    'backend/tests/test_a.py': '# RULE-1 RULE-14\n',
  });
  const problems = checkTrace({ root, throughPhase: 9 });
  assert.ok(problems.some((p) => p.includes("names step P9.9, which isn't in Order of work")));
  assert.ok(problems.some((p) => p.includes('RULE-14 has no step in Built in')));
  assert.ok(problems.some((p) => p.includes('RULE-14 has nothing in Proved by')));
});

test('W points at the walk-through, which is due in phase 5', () => {
  const rows = ['| RULE-1 | one | P1.1 | W |', '| RULE-14 | fourteen | P1.1 | B:test_a.py |'];
  const base = { 'docs/spec.md': SPEC, 'docs/changes/mvp/plan.md': plan(rows), 'backend/tests/test_a.py': '# RULE-14\n' };
  assert.deepEqual(checkTrace({ root: repo(base), throughPhase: 1 }), []);
  assert.deepEqual(checkTrace({ root: repo(base), throughPhase: 5 }), ['RULE-1: docs/walkthrough.md is missing']);
  const ok = repo({ ...base, 'docs/walkthrough.md': '- [ ] RULE-1 checked by hand\n' });
  assert.deepEqual(checkTrace({ root: ok, throughPhase: 5 }), []);
});

test('end-to-end proofs are due in phase 5 and frontend proofs from phase 2', () => {
  const rows = ['| RULE-1 | one | P1.1 | E:a.spec.ts |', '| RULE-14 | fourteen | P1.1 | F:b.test.ts |'];
  const root = repo({ 'docs/spec.md': SPEC, 'docs/changes/mvp/plan.md': plan(rows) });
  assert.deepEqual(checkTrace({ root, throughPhase: 1 }), []);
  assert.deepEqual(checkTrace({ root, throughPhase: 2 }), ['RULE-14: frontend/src/b.test.ts is missing']);
  assert.equal(checkTrace({ root, throughPhase: 5 }).length, 2);
});
