# Plan: building the Accountable MVP

This plan builds what `docs/intent.md` asks for and `docs/spec.md` describes, with the stack in `docs/TECH_STACK.md`. The dashboard and pipeline follow `docs/mockups/b-open-air.html`.

Every requirement in the spec has an ID such as `RULE-3`. The **Traceability** section maps each one to the step that builds it and the tests that prove it, and `scripts/check-trace.mjs` checks the mapping, so coverage is checked by `npm test`, not taken on trust.

## Files that change

Everything is new except the docs. Paths are from the repo root.

### How the code is organised (APP-15)

Both sides are organised by feature, so adding one later (quotes, invoices, products) means adding a folder, a migration and one line that mounts its router, not editing shared files.

- **A backend feature** starts with two files: `api.py` (the routes and their Pydantic request and response models) and `data.py` (its table and its queries, with SQLAlchemy Core). It gets a `rules.py` only when it has plain logic worth testing without a database.
- **A frontend feature** holds its `api.ts` (query hooks), its pages, its forms and its own components, with tests and CSS Modules beside them.
- **Features may use each other's data functions** (backend) or components and hooks (frontend), never each other's routes. Linked records are deleted or unlinked mostly by the database's foreign keys, so little code crosses features.
- **Shared code** (`db.py`, `config.py`, `clock.py`; `ui/`, `lib/`) holds only what two or more features use. Something is moved into it when a third copy would appear, not before.
- **Not built:** base classes, generic CRUD factories, repository interfaces, a service layer that only passes calls through, barrel `index.ts` files, hook factories, or placeholders for sign-in or Postgres.

### Repo root

| File | What it does |
| --- | --- |
| `package.json` | npm workspace with `frontend/`; scripts `dev`, `seed`, `test`, `types`, plus `test:trace`, `test:types`, `test:backend`, `test:frontend`, `test:e2e`; dev dependencies `concurrently`, `@playwright/test`, `@axe-core/playwright` |
| `package-lock.json` | lock file |
| `pyproject.toml`, `uv.lock` | Python 3.12 project for `backend/`: FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic; dev: pytest, httpx |
| `.gitignore` | adds `node_modules/`, `.venv/`, `backend/data/`, `frontend/dist/`, `test-results/`, `playwright-report/` |
| `.gitattributes` | `* text=auto eol=lf`, so line endings stay the same on Windows |
| `scripts/seed.mjs` | runs the backend seed through `uv run`, the same way on every OS |
| `scripts/types.mjs` | writes the OpenAPI schema from the backend (no server needed) and generates `frontend/src/lib/api-types.ts`; with `--check`, fails if the checked-in file is out of date |
| `scripts/check-trace.mjs` | the traceability check (see Proof) |
| `scripts/check-trace.test.mjs` | its own tests, run with `node --test` |

### Backend (`backend/`)

| File | What it does |
| --- | --- |
| `accountable/main.py` | the FastAPI app; mounts each feature's router under `/api`; runs migrations and seeds a new database on start |
| `accountable/config.py` | settings, including the database path from `ACCOUNTABLE_DB` (default `backend/data/accountable.db`), so tests use their own |
| `accountable/clock.py` | `today()` and `now()`, the one place the date comes from |
| `accountable/db.py` | the engine, the shared `MetaData`, a connection per request, foreign keys on for every connection |
| `accountable/organizations/api.py`, `data.py` | organization routes, table, queries, delete impact |
| `accountable/contacts/api.py`, `data.py` | contact routes, table, queries, status filter |
| `accountable/deals/api.py`, `data.py` | deal routes including `move`, table, queries |
| `accountable/deals/rules.py` | expected revenue, open totals, stage change, back from closed, manual values, late, card positions, funnel |
| `accountable/deals/stages.py` | the fixed stage table, and `GET /meta/stages` |
| `accountable/activities/api.py`, `data.py` | activity routes, timelines, `done`, table, queries |
| `accountable/activities/rules.py` | follow-up grouping |
| `accountable/dashboard/api.py`, `data.py` | `GET /dashboard` and every figure behind it |
| `accountable/seed.py` | sample data built from today, with each deal's stage-change history; `python -m accountable.seed` resets the database |
| `accountable/openapi.py` | prints the OpenAPI schema, for `scripts/types.mjs` |
| `alembic.ini`, `migrations/env.py`, `migrations/versions/0001_initial.py` | Alembic, using the shared `MetaData`; the first migration creates the four tables |
| `tests/conftest.py` | a fresh temporary database per test (migrated, not created directly), a fixed "today", an API client |
| `tests/<feature>/test_*.py`, `tests/test_*.py` | see Proof; feature tests mirror the feature folders |

### Frontend (`frontend/`)

| File | What it does |
| --- | --- |
| `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html` | Vite, React, TypeScript; `/api` proxied; Vitest |
| `src/main.tsx` | entry |
| `src/app/App.tsx` | the router and the TanStack Query provider |
| `src/app/TopBar.tsx`, `GlobalSearch.tsx` | the top bar, tabs and global search |
| `src/styles/tokens.css`, `global.css` | brand colors, `@fontsource` fonts, radii, spacing; components style themselves with CSS Modules (`*.module.css`) beside them |
| `src/lib/api.ts` | the fetch wrapper: JSON, errors as plain messages |
| `src/lib/api-types.ts` | generated from the backend's OpenAPI schema by `npm run types`; never edited by hand |
| `src/lib/format.ts` | money, dates, times, percentages |
| `src/lib/stages.ts` | stage labels, colors and series order |
| `src/ui/PageHeader.tsx`, `Panel.tsx`, `Pill.tsx`, `EmptyState.tsx` | shared layout pieces |
| `src/ui/DataTable.tsx` | the shared table (TanStack Table) |
| `src/ui/Sheet.tsx`, `ConfirmDelete.tsx`, `Toast.tsx` | side sheet, delete dialog, toasts (Radix) |
| `src/features/organizations/api.ts`, `OrganizationsPage.tsx`, `OrganizationPage.tsx`, `OrganizationForm.tsx` | organizations |
| `src/features/contacts/api.ts`, `ContactsPage.tsx`, `ContactPage.tsx`, `ContactForm.tsx` | contacts |
| `src/features/deals/api.ts`, `DealsPage.tsx`, `DealPage.tsx`, `DealForm.tsx`, `StageSelector.tsx`, `StageChip.tsx`, `LateChip.tsx` | deals |
| `src/features/activities/api.ts`, `Timeline.tsx`, `ActivityForm.tsx` | activities and timelines |
| `src/features/pipeline/PipelinePage.tsx`, `Column.tsx`, `DealCard.tsx`, `positions.ts`, `boardTotals.ts` | the board (dnd-kit); uses `deals/api.ts` |
| `src/features/dashboard/api.ts`, `DashboardPage.tsx`, `Greeting.tsx`, `FiguresStrip.tsx`, `RevenueChart.tsx`, `SalesFunnel.tsx`, `DealsWonChart.tsx`, `FollowUps.tsx`, `RecentActivity.tsx` | the dashboard (Recharts; the funnel in SVG) |
| `src/**/*.test.ts(x)` | see Proof; beside the code they test |

### End-to-end (`e2e/`)

| File | What it does |
| --- | --- |
| `playwright.config.ts` | Chrome (`channel: 'chrome'`); starts backend and frontend on test ports with their own database; reseeds before the run |
| `e2e/fixtures.ts` | a page fixture that fails any test on a console error |
| `e2e/*.spec.ts` | see Proof |

### Docs

| File | Change |
| --- | --- |
| `docs/spec.md` | carries the requirement IDs |
| `docs/plan.md` | this file |
| `docs/walkthrough.md` | the by-hand checklist, one line per ID that can only be checked by eye or by hand, ticked during the walk-through (written in P5.4) |
| `docs/STATUS.md` | how to install, run, seed, test and regenerate types; what's done after each phase |

## Order of work

Five phases, each small enough for one session. Each step has an ID such as `P1.3` that the Traceability table points to. A phase is done when its tests pass, `test:trace` is raised to that phase and passes, and `docs/STATUS.md` has a line for it.

### Phase 1: foundations and the API

- **P1.1** Root `package.json`, `pyproject.toml`, `.gitattributes`, `.gitignore`; `npm run dev`, `npm run seed` and `npm test` wired up; `scripts/check-trace.mjs` and its tests, with `test:trace` at `--through-phase 1`; the empty feature folders.
- **P1.2** `config.py`, `clock.py`, `db.py`; Alembic with the first migration; `main.py` runs migrations and seeds a new database on start.
- **P1.3** `deals/stages.py`, `deals/rules.py` and `activities/rules.py`, tests first.
- **P1.4** `api.py` and `data.py` for organizations, contacts, deals and activities: CRUD, `move`, timelines, `done`, the delete rules, delete impact, error messages.
- **P1.5** `seed.py` and `npm run seed`: the sample data with full stage-change histories.
- **P1.6** `dashboard/` and `GET /api/dashboard`; `openapi.py`.

### Phase 2: the frontend shell and the three tables

- **P2.1** Vite app, brand tokens, local fonts, CSS Modules, `app/` with the top bar, `ui/` with page header, panel and pill.
- **P2.2** `lib/`: the fetch wrapper, `npm run types` and the generated `api-types.ts`, `test:types` in `npm test`, formatting and stage helpers.
- **P2.3** `ui/` DataTable, Sheet, ConfirmDelete, Toast and EmptyState; the form conventions.
- **P2.4** `features/organizations`, `contacts` and `deals`: the tables with search, sort and filters, Add, Edit, Delete and their forms.
- **P2.5** The record page for each, with linked records and Add buttons that preset the link.
- **P2.6** Global search in the top bar.

### Phase 3: activities, timelines and the pipeline

- **P3.1** `features/activities`: `ActivityForm` and `Timeline` on contact and deal pages, with stage-change entries, edit, delete and Done.
- **P3.2** The stage selector on the deal page.
- **P3.3** `features/pipeline`: header, columns, cards, late cards, Open only and All stages, "+" per column, "N more", card click.
- **P3.4** Drag and drop with dnd-kit, mouse and keyboard, instant totals, saving through `move`, rolling back on failure.

### Phase 4: the dashboard

- **P4.1** `features/dashboard`: the greeting and the figures strip.
- **P4.2** Revenue won line chart and deals won bar chart, with tooltips.
- **P4.3** The sales funnel in SVG, with side labels, the "New to Won" line and click-through.
- **P4.4** Follow-ups with Done, and recent activity.
- **P4.5** Side-by-side check against `docs/mockups/b-open-air.png`, adjusting until it matches.

### Phase 5: end to end, speed and finish

- **P5.1** Playwright config, the console-error fixture, and the end-to-end tests in Proof.
- **P5.2** The speed check: every page under a second.
- **P5.3** Empty states, keyboard use, focus rings, contrast, no console errors.
- **P5.4** `docs/walkthrough.md` and a full walk-through in a real browser as a salesperson, fixing what's found.
- **P5.5** `docs/STATUS.md`: install, run, seed, test, regenerate types.

## Traceability

One row per spec ID. **Built in** is the step (or steps) from Order of work. **Proved by** names the test files that must mention the ID, by path from their test root: `B:` from `backend/tests/`, `F:` from `frontend/src/`, `E:` from `e2e/`, and `W` for `docs/walkthrough.md`. The check script reads this table.

| ID | Requirement | Built in | Proved by |
| --- | --- | --- | --- |
| APP-1 | one user, light mode, 1280px, usable at 1024px | P2.1 | E:quality.spec.ts, W |
| APP-2 | backend on SQLite; migrations and seed on first start | P1.2 | B:test_startup.py |
| APP-3 | frontend talks only to `/api` | P2.2 | E:quality.spec.ts |
| APP-4 | works offline; nothing from a CDN | P2.1 | E:quality.spec.ts |
| APP-5 | `npm run dev` starts both | P1.1 | W |
| APP-6 | `npm run seed` resets the data | P1.5 | B:test_seed.py, E:persistence.spec.ts |
| APP-7 | `npm test` runs everything on its own database | P1.1 | B:test_isolation.py, W |
| APP-8 | commands work on Mac, Linux and Windows | P1.1 | W |
| APP-9 | STATUS.md says how to install, run, seed, test | P5.5 | W |
| APP-10 | the listed libraries are used | P1.1, P2.2 | F:app/dependencies.test.ts |
| APP-11 | changes survive refresh and restart | P1.4 | E:persistence.spec.ts |
| APP-12 | every screen under a second | P5.2 | E:quality.spec.ts |
| APP-13 | no console errors | P5.3 | E:quality.spec.ts |
| APP-14 | migrations bring an existing database up to date | P1.2 | B:test_migrations.py, B:test_startup.py |
| APP-15 | code organised by feature, no needless layers | P1.1, P2.1 | W |
| DATA-1 | ids, timestamps, whole dollars, ISO dates | P1.2 | B:organizations/test_api.py |
| DATA-2 | organization fields and rules | P1.2, P1.4 | B:organizations/test_api.py |
| DATA-3 | contact fields and rules | P1.2, P1.4 | B:contacts/test_api.py |
| DATA-4 | deal fields and rules | P1.2, P1.4 | B:deals/test_api.py |
| DATA-5 | activity fields and rules | P1.2, P1.4 | B:activities/test_api.py |
| DATA-6 | an activity needs a contact or deal when created | P1.4 | B:activities/test_api.py |
| DATA-7 | the stage table | P1.3 | B:deals/test_stages.py, F:lib/stages.test.ts |
| DATA-8 | foreign keys on | P1.2 | B:test_db.py |
| RULE-1 | expected revenue | P1.3 | B:deals/test_rules.py |
| RULE-2 | open pipeline totals | P1.3 | B:deals/test_rules.py |
| RULE-3 | stage change effects | P1.3, P1.4 | B:deals/test_rules.py, B:deals/test_api.py |
| RULE-4 | back from Won or Lost | P1.3 | B:deals/test_rules.py |
| RULE-5 | manual probability and close date | P1.3, P1.4 | B:deals/test_rules.py, F:features/deals/DealForm.test.tsx |
| RULE-6 | late | P1.3 | B:deals/test_rules.py |
| RULE-7 | follow-up grouping | P1.3 | B:activities/test_rules.py |
| RULE-8 | delete an organization | P1.4 | B:test_deletes.py |
| RULE-9 | delete a contact | P1.4 | B:test_deletes.py |
| RULE-10 | delete a deal | P1.4 | B:test_deletes.py |
| RULE-11 | delete an activity | P1.4 | B:test_deletes.py |
| RULE-12 | delete impact | P1.4 | B:test_deletes.py |
| RULE-13 | deals and revenue won by month | P1.6 | B:dashboard/test_dashboard.py |
| RULE-14 | sales funnel | P1.3, P1.6 | B:deals/test_rules.py, B:dashboard/test_dashboard.py |
| RULE-15 | one "today" | P1.2 | B:test_clock.py |
| RULE-16 | rules in feature `rules.py` files, not the frontend, except instant totals | P1.3, P3.4 | F:features/pipeline/boardTotals.test.ts, W |
| LAY-1 | follows mockup B | P4.5 | W |
| LAY-2 | top bar | P2.1 | E:layout.spec.ts |
| LAY-3 | global search | P2.6 | E:layout.spec.ts |
| LAY-4 | page header | P2.1 | E:layout.spec.ts |
| LAY-5 | panels | P2.1 | E:look.spec.ts |
| DASH-1 | one call; reflects changes | P1.6, P4.1 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-2 | greeting | P4.1 | F:features/dashboard/Greeting.test.tsx |
| DASH-3 | open pipeline figure | P1.6, P4.1 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-4 | expected revenue figure | P1.6, P4.1 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-5 | won this month and change | P1.6, P4.1 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-6 | late deals figure and link | P1.6, P4.1 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-7 | revenue won line chart and tooltip | P4.2 | E:dashboard.spec.ts, W |
| DASH-8 | the funnel's shape and labels | P4.3 | F:features/dashboard/SalesFunnel.test.tsx, W |
| DASH-9 | funnel click opens the board | P4.3 | E:dashboard.spec.ts |
| DASH-10 | deals won bar chart | P4.2 | E:dashboard.spec.ts, W |
| DASH-11 | follow-ups panel | P1.6, P4.4 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-12 | Done on the dashboard | P4.4 | E:activities.spec.ts |
| DASH-13 | recent activity | P1.6, P4.4 | B:dashboard/test_dashboard.py, E:dashboard.spec.ts |
| DASH-14 | money with currency, tooltips too | P2.2, P4.2 | F:lib/format.test.ts, E:look.spec.ts |
| DASH-15 | empty states | P5.3 | F:ui/EmptyState.test.tsx |
| TBL-1 | search | P2.3 | F:ui/DataTable.test.tsx, E:organizations.spec.ts |
| TBL-2 | sort | P2.3 | F:ui/DataTable.test.tsx, E:deals.spec.ts |
| TBL-3 | Add opens a side sheet | P2.4 | E:organizations.spec.ts |
| TBL-4 | row Edit and Delete | P2.3 | E:contacts.spec.ts |
| TBL-5 | row click opens the record | P2.3 | E:contacts.spec.ts |
| TBL-6 | loaded once, sorted and filtered in the browser | P2.3 | F:ui/DataTable.test.tsx |
| TBL-7 | empty table | P2.3 | F:ui/DataTable.test.tsx |
| TBL-8 | organization columns | P2.4 | E:organizations.spec.ts |
| TBL-9 | contact columns | P2.4 | E:contacts.spec.ts |
| TBL-10 | status filter | P2.4 | E:contacts.spec.ts |
| TBL-11 | deal columns | P2.4 | E:deals.spec.ts |
| TBL-12 | stage filter and Late only | P2.4 | E:deals.spec.ts |
| TBL-13 | late chip in the table | P2.4 | E:deals.spec.ts |
| REC-1 | record header with Edit and Delete | P2.5 | E:organizations.spec.ts |
| REC-2 | organization page | P2.5 | E:organizations.spec.ts |
| REC-3 | contact page | P2.5, P3.1 | E:contacts.spec.ts |
| REC-4 | deal page | P2.5, P3.1 | E:deals.spec.ts |
| REC-5 | stage selector on the deal page | P3.2 | E:deals.spec.ts |
| REC-6 | timeline, newest first | P3.1 | F:features/activities/Timeline.test.tsx, E:activities.spec.ts |
| REC-7 | an activity in both timelines | P3.1 | B:activities/test_api.py, E:activities.spec.ts |
| REC-8 | edit and delete entries, stage changes too | P3.1 | E:activities.spec.ts |
| REC-9 | Done on the timeline | P3.1 | E:activities.spec.ts |
| REC-10 | Log activity form | P3.1 | F:features/activities/ActivityForm.test.tsx, E:activities.spec.ts |
| PIPE-1 | board header summary | P3.3 | E:pipeline.spec.ts |
| PIPE-2 | Open only and All stages | P3.3 | E:pipeline.spec.ts |
| PIPE-3 | six columns and headers | P3.3 | E:pipeline.spec.ts |
| PIPE-4 | Won and Lost: last 12 months, N more | P3.3 | E:pipeline.spec.ts |
| PIPE-5 | card content | P3.3 | E:pipeline.spec.ts |
| PIPE-6 | late card | P3.3 | E:pipeline.spec.ts |
| PIPE-7 | drag feedback | P3.4 | W |
| PIPE-8 | drag to another column changes the stage | P3.4 | E:pipeline.spec.ts |
| PIPE-9 | drop anywhere, stays after refresh | P3.4 | E:pipeline.spec.ts |
| PIPE-10 | keyboard moves | P3.4 | E:pipeline.spec.ts |
| PIPE-11 | instant totals | P3.4 | F:features/pipeline/boardTotals.test.ts, E:pipeline.spec.ts |
| PIPE-12 | roll back on a failed save | P3.4 | F:features/pipeline/PipelinePage.test.tsx |
| PIPE-13 | "+" adds a deal at that stage | P3.3 | E:pipeline.spec.ts |
| PIPE-14 | card click opens the deal | P3.3 | E:pipeline.spec.ts |
| PIPE-15 | positions and renumbering | P1.3, P3.4 | B:deals/test_rules.py, F:features/pipeline/positions.test.ts |
| PIPE-16 | one `move` call | P1.4 | B:deals/test_api.py |
| FORM-1 | sheets, validation, Save disabled while saving | P2.3 | F:features/deals/DealForm.test.tsx |
| FORM-2 | searchable pickers | P2.4 | E:deals.spec.ts |
| FORM-3 | organization's contacts listed first | P2.4 | F:features/deals/DealForm.test.tsx |
| FORM-4 | value in whole dollars with "US$" | P2.4 | F:features/deals/DealForm.test.tsx |
| FORM-5 | save closes, toast, refresh | P2.3 | E:organizations.spec.ts |
| DEL-1 | delete dialog | P2.3 | F:ui/ConfirmDelete.test.tsx, E:organizations.spec.ts |
| API-1 | JSON errors with plain messages | P1.4 | B:organizations/test_api.py |
| API-2 | organizations routes | P1.4 | B:organizations/test_api.py |
| API-3 | contacts routes and status filter | P1.4 | B:contacts/test_api.py |
| API-4 | deals routes with expected revenue and late | P1.4 | B:deals/test_api.py |
| API-5 | `move` | P1.4 | B:deals/test_api.py |
| API-6 | timelines | P1.4 | B:activities/test_api.py |
| API-7 | activities and `done` | P1.4 | B:activities/test_api.py |
| API-8 | delete impact | P1.4 | B:test_deletes.py |
| API-9 | dashboard | P1.6 | B:dashboard/test_dashboard.py |
| API-10 | meta stages | P1.3 | B:deals/test_stages.py |
| LOOK-1 | fonts | P2.1 | E:look.spec.ts |
| LOOK-2 | shapes | P2.1 | E:look.spec.ts |
| LOOK-3 | colors | P2.1 | E:look.spec.ts |
| LOOK-4 | series order | P2.2 | F:lib/stages.test.ts |
| LOOK-5 | surfaces, no edge borders | P2.1 | E:look.spec.ts |
| LOOK-6 | words, money, dates | P2.2 | F:lib/format.test.ts, E:look.spec.ts |
| LOOK-7 | motion | P2.1 | W |
| LOOK-8 | contrast, keyboard, focus | P5.3 | E:a11y.spec.ts |
| SEED-1 | seeded on start and by command, dates from today | P1.5 | B:test_seed.py |
| SEED-2 | 6 organizations | P1.5 | B:test_seed.py |
| SEED-3 | 15 contacts at every status | P1.5 | B:test_seed.py |
| SEED-4 | about 20 deals at every stage, 10 won, 2 late | P1.5 | B:test_seed.py |
| SEED-5 | about 40 activities, histories, follow-ups | P1.5 | B:test_seed.py |

## Risks

| Risk | What we do about it |
| --- | --- |
| A requirement is missed, or a test claims an ID that doesn't exist | `scripts/check-trace.mjs` in `npm test` (see Proof). |
| A requirement is marked covered by a test that doesn't really prove it | The check only proves a test names the ID. Reviewing the tests against the spec stays a human job, at the end of each phase and in the review. |
| The feature layout erodes: shared files grow, or layers creep in | The rules under "How the code is organised", APP-15 in the walk-through, and the review at the end of each phase. |
| A migration loses or breaks existing data | Tests build their databases through the migrations, not straight from the tables; `test_migrations.py` checks the migrated schema matches the code's tables and that upgrading a database with data keeps it. |
| Frontend types drift from the API | Generated from the OpenAPI schema; `test:types` fails `npm test` when the checked-in types are out of date. |
| Commands behave differently on Windows, Mac and Linux | Only npm scripts, `concurrently` and small Node scripts, no shell syntax. This machine is Windows, so Mac and Linux are checked by hand when one is available (APP-8 is a walk-through item). |
| Tests touch the real data | `ACCOUNTABLE_DB` points tests at a temporary file; Playwright uses its own database and port; a test checks the default path is never used under test. |
| Dates make tests flaky (month ends, time zones) | One `clock.py`, fixed in tests. The sample data is built from today, so its figures are checked by rule, not hard-coded. |
| SQLite ignores foreign keys by default, so delete rules silently fail | Turned on per connection (DATA-8), with every delete rule tested through the API. |
| Card order drifts or collides after many drags | Midpoint positions with renumbering, and a 200-move test. |
| The board's instant totals disagree with the saved data | Totals come from the same stage table, the board refetches after each save, and a test compares them. |
| The funnel depends on stage-change history, which can be deleted | RULE-14 never puts a deal lower than its current stage; tested with deleted history. |
| Drag and drop is hard to test reliably | Keyboard moves in Playwright plus one mouse drag; `positions.ts` unit-tested separately. |
| Playwright can't find Chrome | `channel: 'chrome'`; STATUS.md says Chrome must be installed. |
| Look and feel can't all be tested automatically | Computed-style checks in `look.spec.ts`; axe for contrast; the rest in the walk-through, by ID. |
| Pages slower than a second | One dashboard call, small payloads, client-side sort and search; measured in `quality.spec.ts`. |

## Proof

`npm test` runs, in order: the traceability check, the types check, pytest, Vitest, then Playwright. It fails if any fails. Every test names the IDs it proves in its title or a comment, for example `def test_stage_change_sets_probability():  # RULE-3` or `test('[PIPE-9] a card dropped mid-column stays there after a refresh', …)`.

### The traceability check (`scripts/check-trace.mjs`)

It reads `docs/spec.md`, the Traceability table above, the test files and `docs/walkthrough.md`, and fails with a list of problems when:

1. an ID is defined twice in the spec, or not in the `PREFIX-N` form;
2. a spec ID has no row in the Traceability table, or a row names an ID the spec doesn't define (struck-through dropped IDs are skipped);
3. a row has no step in **Built in** or no entry in **Proved by**, or names a step that isn't in Order of work;
4. a file named in **Proved by** is missing or doesn't mention the ID, once it is due: at the later of the row's latest step and the phase that writes that kind of test (backend tests from phase 1, frontend tests from phase 2, end-to-end tests in P5.1 and the walk-through in P5.4), up to `--through-phase N`;
5. any test file or the walk-through mentions an ID the spec doesn't define.

IDs are matched whole, so `RULE-1` never matches `RULE-14`. `test:trace` starts at `--through-phase 1` and is raised at the end of each phase, reaching 5 when the MVP is done, when every ID must be proved. `scripts/check-trace.test.mjs` tests the script itself with small sample files: a missing ID, an unknown ID, a duplicate, a proof file that doesn't mention its ID, and `RULE-1` against `RULE-14`.

### Backend unit tests (pytest, `backend/tests/`)

- `deals/test_rules.py`, with a fixed "today":
  - expected revenue and open totals
  - stage change effects, back from closed, manual probability and close date
  - late, including today, no date, and Won and Lost
  - positions: midpoints, both ends, renumbering, 200 random moves keep a strict order
  - funnel: won, lost at Proposal, created at Proposal, deleted history
- `deals/test_stages.py`: the stage table and `GET /meta/stages`.
- `deals/test_api.py`: CRUD and field rules; a deal without an organization refused; `expected_revenue` and `is_late` in responses; `move` across columns writes one stage-change entry and applies the rules; `move` within a column changes only the position; the form's stage change does the same as `move`.
- `activities/test_rules.py`: follow-ups grouped into overdue, due today and upcoming; done ones left out.
- `activities/test_api.py`: field rules; an activity needs a contact or a deal; linked to both, it's in both timelines, newest first; `done`; stage-change entries can be edited (text and time) and deleted.
- `organizations/test_api.py`: CRUD, field rules, ids and timestamps, the GET by id with contacts and deals, 422 errors with plain messages.
- `contacts/test_api.py`: CRUD, field rules, a contact without an organization allowed, the status filter.
- `dashboard/test_dashboard.py`: every figure against a small hand-built data set, by month for 12 months, the funnel, follow-ups and the 15 newest activities.
- `test_deletes.py`: each delete rule across features, and impact counts matching what's deleted or unlinked.
- `test_seed.py`: counts, every stage and status, 2 late, follow-ups overdue and upcoming, most months with revenue won, seeding twice gives the same counts.
- `test_startup.py`: a new database is migrated and seeded on start; an existing one is migrated and its data kept.
- `test_migrations.py`: the migrated schema matches the code's tables; upgrading a database with data keeps the data.
- `test_db.py`: foreign keys are on for every connection.
- `test_clock.py`: rules and figures use the one fixed "today".
- `test_isolation.py`: under test, the default database path is never used.

### Frontend unit tests (Vitest, beside the code in `frontend/src/`)

- `lib/format.test.ts`: money always "US$" with separators, dates "17 Nov 2026", times, percentages.
- `lib/stages.test.ts`: labels and colors match the backend's table; series order.
- `app/dependencies.test.ts`: the listed libraries are in `package.json`.
- `ui/DataTable.test.tsx`: search, sort and reverse, empty state, no refetch when sorting or searching.
- `ui/ConfirmDelete.test.tsx`: impact counts shown; Cancel focused first.
- `ui/EmptyState.test.tsx`: each panel and table says what to do next when empty.
- `features/deals/DealForm.test.tsx`: required fields, whole dollars, probability edit marks it manual, the organization's contacts first, Save disabled while saving.
- `features/activities/ActivityForm.test.tsx`: needs a contact or a deal; follow-up optional.
- `features/activities/Timeline.test.tsx`: newest first, an icon per type, stage-change edit limited to text and time.
- `features/pipeline/positions.test.ts`: drop positions match the backend's rule.
- `features/pipeline/boardTotals.test.ts`: column and board totals right after a move, before the save returns.
- `features/pipeline/PipelinePage.test.tsx`: a failed save puts the card back and shows a message.
- `features/dashboard/SalesFunnel.test.tsx`: widths follow value with a minimum; labels and shares.
- `features/dashboard/Greeting.test.tsx`: morning, afternoon and evening; revenue won this month; the summary line.

### Types check (`npm run test:types`)

Regenerates the OpenAPI schema and types into a temporary file and fails if they differ from `frontend/src/lib/api-types.ts`.

### End-to-end tests (Playwright with installed Chrome, `e2e/`)

All start from freshly seeded sample data, and all use the fixture that fails on a console error.

- `dashboard.spec.ts`: lands on the dashboard; figures match the API; tooltips; the funnel opens the board; the late figure opens the filtered deals; a deal moved to Won raises the won figures.
- `layout.spec.ts`: the top bar, tabs and current tab; page headers; global search opens a deal, a contact and an organization.
- `organizations.spec.ts`: add in a side sheet with a toast, search, edit; the record page with its contacts and deals; delete shows the counts and removes the linked records.
- `contacts.spec.ts`: add a lead, filter by status, row menu edit to customer, row click opens the page, delete keeps the activities.
- `deals.spec.ts`: add with a searchable organization picker, sort by value, late chip, Late only, the deal page, the stage selector.
- `pipeline.spec.ts`: header and columns, Open only, Won and Lost lists, card content, late card, drag to another column, drag within a column and refresh, keyboard move, instant totals, "+" in a column, card click.
- `activities.spec.ts`: log a call with a follow-up on a deal with its contact; it's on both timelines and the dashboard; Done from the timeline and from the dashboard; edit and delete a stage-change entry.
- `persistence.spec.ts`: changes survive a refresh and a backend restart; the seed command brings back the sample data.
- `look.spec.ts`: computed fonts, colors, radii, no panel borders, money always with "US$", no exclamation marks.
- `a11y.spec.ts`: axe finds no contrast or labelling problems on any page; every page can be used with Tab and Enter; focus rings show.
- `quality.spec.ts`: no console errors on any page; every page opens in under a second; no request leaves localhost; no sideways scrolling at 1024px.

### By hand (`docs/walkthrough.md`)

A walk-through in Chrome as a salesperson would work: every section and action, each screen checked by eye against the mockup and the brand, and a read of the code against "How the code is organised". One checklist line per `W` row above, starting with its ID, ticked with the date it was checked.
