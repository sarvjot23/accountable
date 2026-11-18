# Accountable

SIDENOTE: this repo is part of a course by Ed Donner. If the student needs help, read `course/for_agents/`

## Where to find things

- `docs/spec.md`: read this first. It describes the whole product as it stands today and is the authority on how it works and looks
- `docs/changes/<branch name>/`: one folder per change, holding its `intent.md` (what and why) and `plan.md` (how it gets built and tested). Read only the folder for the current change, named after the current git branch. The other folders are history; don't read them
- `docs/STANDARDS.md`: the coding standards; follow them in every change
- `docs/TECH_STACK.md`: the stack
- `docs/BRAND.md`: the look, for UI work
- `docs/STATUS.md`: what's done so far

## Checks

Run `npm run check` from the repo root before you call any work done, and fix whatever it finds without weakening a rule. It stops at the first failure with a non-zero exit code. In order:

1. `lint`: Prettier and ESLint for the frontend (recommended TypeScript, React Hooks and accessibility rules), `ruff format --check` and `ruff check` for the backend. No function may have a cyclomatic complexity above 15
2. `typecheck`: `tsc` for the frontend, `ty` for the backend
3. `secrets`: gitleaks over the repo, its history and the working tree (the git-ignored `.env` is allowed)
4. `npm test`, below, with unit test coverage of at least 80% on both sides

`npm run check:quick` runs the same without the end-to-end tests, for quick feedback while you work. `npm run format` fixes the formatting.

Hooks run some of this for you:

- Git pre-commit (lefthook, `lefthook.yml`): formats the staged files, then runs `lint`, `typecheck` and gitleaks on the staged changes. No tests
- Claude Code (`.claude/settings.json`): when you finish a turn, `npm run check:quick` runs and any failure is sent back to you once to fix. Edits to `.env` are blocked; ask the user to change it

## Testing

`npm test` runs every test in order and stops at the first failure:

1. `test:trace`: the traceability check (every requirement ID in `docs/spec.md` has a proof)
2. `test:types`: the generated API types match the backend
3. `test:backend`: pytest, with coverage of at least 80%
4. `test:frontend`: Vitest unit tests, with coverage of at least 80%
5. `test:e2e`: Playwright end-to-end tests in Chrome

The tests use their own databases and ports (8100, 5180), so nothing else needs to be running. Fix any failure before moving on.

Update `docs/STATUS.md` when you finish a piece of work
