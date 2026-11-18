# Status

The Accountable MVP is built: all five phases of `docs/plan.md` are done and `npm test` passes. One walk-through item is still open: running the commands on a Mac and on Linux (APP-8, see `docs/walkthrough.md`).

## Install

You need, once:

- [Node.js](https://nodejs.org) 22 or later (24 or 26 recommended), which includes npm
- [uv](https://docs.astral.sh/uv/) for Python; it fetches Python 3.12 by itself
- Google Chrome, for the end-to-end tests

Then, from the repo root:

```
npm install
uv sync
```

## Run

```
npm run dev
```

This starts the API (port 8000) and the web app together, then prints the address to open: http://localhost:5173. The first start creates `backend/data/accountable.db`, brings it up to date with the migrations and loads the sample data. Later starts run any new migrations and keep your data. Stop with Ctrl+C.

## Reset to the sample data

```
npm run seed
```

This deletes everything in the database and loads the sample data again, with dates worked out from today.

## Test

```
npm test
```

This runs, in order: the traceability check (`test:trace`), the API types check (`test:types`), the backend tests (`test:backend`, pytest), the frontend unit tests (`test:frontend`, Vitest) and the end-to-end tests (`test:e2e`, Playwright in Chrome). It fails if any of them fails. Each can be run on its own, for example `npm run test:backend`. The tests use their own databases (a temporary file for pytest, and one in your system's temp folder for Playwright, on ports 8100 and 5180), so they never touch your data and need nothing else running.

## Regenerate the API types

After changing the backend's routes or models:

```
npm run types
```

This writes `frontend/src/lib/api-types.ts` from the backend's OpenAPI schema. `npm test` fails if it's out of date.

## History

- 2026-11-17: `docs/intent.md` was refined after an interview. It now records the delete rules, required links, stage probabilities, how Won and Lost count, when a deal is late, the IT, software and AI sample data, three more success criteria and the later list.
- 2026-11-17: `docs/spec.md` was written. It covers the data model, business rules, screens, API, look and feel (from the brand skill), sample data and tests for the MVP. The open decisions were settled: about 20 sample deals so the charts look full, fonts installed locally so the app works offline, money shown as "US$", deals can move back from Won or Lost, and stage-change entries can be edited or deleted.
- 2026-11-17: Three mockups of the dashboard and pipeline were made in `docs/mockups/`, each with a screenshot beside it: A Midnight Classic (`a-midnight-classic`), B Open Air (`b-open-air`) and C Command Centre (`c-command-centre`). B Open Air was chosen and given a true funnel chart (New down to Won, by value reaching each stage). `docs/spec.md` now follows mockup B for the layout, dashboard, pipeline and stage colors.
- 2026-11-17: `docs/plan.md` was written: the files that change, five phases of work (foundations and API, frontend tables, activities and pipeline, dashboard, end to end and finish), the risks, and the unit and end-to-end tests that prove it. No code yet.
- 2026-11-17: Every requirement in `docs/spec.md` now has a stable ID (125 in all, such as RULE-3 or PIPE-9). `docs/plan.md` has a Traceability table mapping each ID to the step that builds it and the tests that prove it, and plans `scripts/check-trace.mjs` so `npm test` fails if any ID is left uncovered.
- 2026-11-17: The planned code layout was changed to folders by feature on both sides (backend `organizations/`, `contacts/`, `deals/`, `activities/`, `dashboard/`, each with `api.py` and `data.py`; frontend `features/` with `ui/` and `lib/` for shared code), with rules against needless layers. Added Alembic migrations (APP-14), the layout rule (APP-15), CSS Modules, and frontend types generated from the API with a check in `npm test`. 127 IDs, all mapped.
- 2026-11-17: Phase 1 done: the backend. FastAPI with SQLAlchemy Core on SQLite, organised by feature (`backend/accountable/organizations`, `contacts`, `deals`, `activities`, `dashboard`), Alembic with the first migration, migrations and seeding on start, the rules in `deals/rules.py` and `activities/rules.py`, every route in the spec including `move`, timelines, `done`, delete impact and `GET /api/dashboard`, and the sample data (`npm run seed`). 152 pytest tests pass. `scripts/check-trace.mjs` checks the Traceability table; a proof is now due at the later of its row's step and the phase that writes that kind of test (E2E in P5.1, walk-through in P5.4), and RULE-16 and PIPE-15 also name P3.4, where their frontend tests are written.
- 2026-11-17: Phase 2 done: the frontend shell and the three tables. Vite, React and TypeScript in `frontend/`, organised by feature (`features/organizations`, `contacts`, `deals`) with shared `ui/` and `lib/`; brand tokens and local `@fontsource` fonts; the top bar with tabs and global search; the shared DataTable (search, sort, row menu), side-sheet forms with React Hook Form and Zod, the delete dialog with impact counts, toasts; each record page with its linked records. `npm run types` generates `frontend/src/lib/api-types.ts` from the API, and `test:types` checks it. Small shared pieces beyond the plan's list: `ui/Button`, `Field`, `Picker` (searchable select, Radix Popover with cmdk), `Select`, `RowMenu`, `Chips`, `Record`, `PageState`, and `lib/cx.ts`. Packages are pinned to the previous majors of TanStack Table (8), React Router (7), Vite (7), Vitest (3) and TypeScript (5.9).
- 2026-11-17: Phase 3 done: activities and timelines (log, edit, delete, Done, stage-change entries), the stage selector on the deal page, and the pipeline board with dnd-kit: drag with the mouse or move with the keyboard, totals that update at once, saving through one `move` call and putting the card back if the save fails.
- 2026-11-17: Phase 4 done: the dashboard following mockup B: greeting, figures strip, revenue won line chart and deals won bar chart (Recharts) with tooltips, the sales funnel in SVG that opens the board, follow-ups with Done, and recent activity.
- 2026-11-17: Phase 5 done: Playwright end-to-end tests in Chrome (72 tests across 11 specs, with a fixture that fails any test on a console error), the speed check, accessibility with axe, and `docs/walkthrough.md`. The walk-through found and fixed a crash on the Contacts filter, a 404 after deleting from a record page, keyboard moves between columns on the board, accessible names, and colour contrast (small text and white-on-colour now use slightly deeper shades of Cerulean, Raspberry and Sea Green; the brand colours stay for charts and surfaces). `test:trace` now runs `--through-phase 5`, so every requirement ID must be proved.
- 2026-11-17: `AGENTS.md` now has a Testing section: run `npm test` before calling any work done. It runs all five suites in turn and stops with a non-zero exit at the first failure. A full run passed: 12 trace tests plus the traceability check, types up to date, 152 pytest, 91 Vitest and 72 Playwright.
