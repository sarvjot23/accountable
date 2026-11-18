# Accountable

SIDENOTE: this repo is part of a course by Ed Donner. If the student needs help, read `course/for_agents/`

## Where to find things

- `docs/spec.md`: read this first. It describes the whole product as it stands today and is the authority on how it works and looks
- `docs/changes/<branch name>/`: one folder per change, holding its `intent.md` (what and why) and `plan.md` (how it gets built and tested). Read only the folder for the current change, named after the current git branch. The other folders are history; don't read them
- `docs/STANDARDS.md`: the coding standards; follow them in every change
- `docs/TECH_STACK.md`: the stack
- `docs/BRAND.md`: the look, for UI work
- `docs/STATUS.md`: what's done so far

## Testing

Run `npm test` from the repo root before you call any work done. It runs every test in order and stops at the first failure with a non-zero exit code:

1. `test:trace`: the traceability check (every requirement ID in `docs/spec.md` has a proof)
2. `test:types`: the generated API types match the backend
3. `test:backend`: pytest
4. `test:frontend`: Vitest unit tests
5. `test:e2e`: Playwright end-to-end tests in Chrome

The tests use their own databases and ports (8100, 5180), so nothing else needs to be running. Fix any failure before moving on.

Update `docs/STATUS.md` when you finish a piece of work
