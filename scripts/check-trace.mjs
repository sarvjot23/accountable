// The traceability check: every requirement ID in docs/spec.md is mapped in the
// plan's Traceability table to the step that builds it and the tests that prove it,
// and (for phases up to --through-phase N) those tests really mention the ID.
//
// Usage: node scripts/check-trace.mjs --through-phase 3 [--root <dir>]

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ID_FORM = /^[A-Z]+-\d+$/;

/** The proof roots: `B:` backend tests, `F:` frontend sources, `E:` end-to-end tests. */
const ROOTS = { B: 'backend/tests', F: 'frontend/src', E: 'e2e' };
const WALKTHROUGH = 'docs/walkthrough.md';

/** A regex that matches the ID whole, so RULE-1 never matches RULE-14. */
export function idPattern(id) {
  return new RegExp(`(?<![A-Za-z0-9])${id}(?![0-9])`);
}

/** IDs defined in the spec, as `**[ID]` (bold, bracketed). */
export function parseSpec(text) {
  const defined = new Map(); // id -> { dropped }
  const problems = [];
  const re = /(~~)?\*\*\[([^\]]+)\]/g;
  for (const m of text.matchAll(re)) {
    const id = m[2].trim();
    if (!ID_FORM.test(id)) {
      problems.push(`spec: "${id}" is not in the PREFIX-N form`);
      continue;
    }
    if (defined.has(id)) {
      problems.push(`spec: ${id} is defined more than once`);
      continue;
    }
    defined.set(id, { dropped: Boolean(m[1]) });
  }
  return { defined, problems };
}

function section(text, heading) {
  const start = text.indexOf(`\n## ${heading}`);
  if (start < 0) return '';
  const rest = text.slice(start + 1);
  const next = rest.indexOf('\n## ', 3);
  return next < 0 ? rest : rest.slice(0, next);
}

/** The plan's steps (from Order of work) and Traceability rows. */
export function parsePlan(text) {
  const steps = new Set();
  for (const m of section(text, 'Order of work').matchAll(/\*\*(P\d+\.\d+)\*\*/g)) steps.add(m[1]);

  const rows = [];
  for (const line of section(text, 'Traceability').split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 4 || !ID_FORM.test(cells[0].replace(/~/g, ''))) continue;
    const id = cells[0].replace(/~/g, '');
    const builtIn = cells[2].split(',').map((s) => s.trim()).filter(Boolean);
    const provedBy = cells[3].split(',').map((s) => s.trim()).filter(Boolean);
    rows.push({ id, struck: cells[0].includes('~~'), builtIn, provedBy });
  }
  return { steps, rows };
}

function walk(dir, accept, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, accept, out);
    else if (accept(name)) out.push(full);
  }
  return out;
}

/** Every test file the check reads, plus the walk-through. */
export function testFiles(root) {
  return [
    ...walk(join(root, ROOTS.B), (n) => n.endsWith('.py')),
    ...walk(join(root, ROOTS.F), (n) => /\.test\.tsx?$/.test(n)),
    ...walk(join(root, ROOTS.E), (n) => /\.spec\.ts$/.test(n)),
    ...(existsSync(join(root, WALKTHROUGH)) ? [join(root, WALKTHROUGH)] : []),
  ];
}

function proofPath(root, entry) {
  if (entry === 'W') return join(root, WALKTHROUGH);
  const m = /^([BFE]):(.+)$/.exec(entry);
  if (!m) return null;
  return join(root, ROOTS[m[1]], m[2]);
}

const phaseOf = (step) => Number(/^P(\d+)\./.exec(step)?.[1] ?? NaN);

/**
 * The first phase in which each kind of proof is written: backend tests from phase 1,
 * frontend tests from phase 2, end-to-end tests in P5.1 and the walk-through in P5.4.
 * A proof is due at the later of this and the row's latest step.
 */
export const PROOF_PHASE = { B: 1, F: 2, E: 5, W: 5 };
const proofPhase = (entry) => PROOF_PHASE[entry === 'W' ? 'W' : entry[0]] ?? 1;

export function checkTrace({ root, throughPhase }) {
  const read = (p) => readFileSync(join(root, p), 'utf8');
  const { defined, problems } = parseSpec(read('docs/spec.md'));
  const { steps, rows } = parsePlan(read('docs/plan.md'));

  const live = [...defined].filter(([, v]) => !v.dropped).map(([id]) => id);
  const rowIds = new Set(rows.map((r) => r.id));

  for (const id of live) if (!rowIds.has(id)) problems.push(`plan: ${id} has no row in the Traceability table`);

  const seen = new Set();
  for (const row of rows) {
    if (row.struck || defined.get(row.id)?.dropped) continue;
    if (seen.has(row.id)) problems.push(`plan: ${row.id} has more than one row`);
    seen.add(row.id);
    if (!defined.has(row.id)) {
      problems.push(`plan: ${row.id} is in the Traceability table but the spec doesn't define it`);
      continue;
    }
    if (row.builtIn.length === 0) problems.push(`plan: ${row.id} has no step in Built in`);
    if (row.provedBy.length === 0) problems.push(`plan: ${row.id} has nothing in Proved by`);
    for (const step of row.builtIn) {
      if (!steps.has(step)) problems.push(`plan: ${row.id} names step ${step}, which isn't in Order of work`);
    }
    const latest = Math.max(...row.builtIn.map(phaseOf));
    for (const entry of row.provedBy) {
      if (!(Math.max(latest, proofPhase(entry)) <= throughPhase)) continue;
      const path = proofPath(root, entry);
      if (!path) {
        problems.push(`plan: ${row.id} has a Proved by entry "${entry}" that isn't B:, F:, E: or W`);
        continue;
      }
      const shown = relative(root, path).replaceAll('\\', '/');
      if (!existsSync(path)) problems.push(`${row.id}: ${shown} is missing`);
      else if (!idPattern(row.id).test(readFileSync(path, 'utf8'))) {
        problems.push(`${row.id}: ${shown} doesn't mention ${row.id}`);
      }
    }
  }

  const prefixes = [...new Set([...defined.keys()].map((id) => id.split('-')[0]))];
  if (prefixes.length) {
    const any = new RegExp(`(?<![A-Za-z0-9])(?:${prefixes.join('|')})-\\d+(?![0-9])`, 'g');
    for (const file of testFiles(root)) {
      const text = readFileSync(file, 'utf8');
      for (const m of new Set(text.match(any) ?? [])) {
        if (!defined.has(m)) {
          problems.push(`${relative(root, file).replaceAll('\\', '/')} mentions ${m}, which the spec doesn't define`);
        }
      }
    }
  }
  return problems;
}

function main(argv) {
  const arg = (name, fallback) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const throughPhase = Number(arg('--through-phase', '5'));
  const root = resolve(arg('--root', join(fileURLToPath(import.meta.url), '..', '..')));
  const problems = checkTrace({ root, throughPhase });
  if (problems.length) {
    console.error(`Traceability check failed (through phase ${throughPhase}):`);
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  console.log(`Traceability check passed (through phase ${throughPhase}).`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
