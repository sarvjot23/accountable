# Walk-through

The by-hand checklist (P5.4): one line per requirement that can only be checked by eye or by hand. Each line starts with its ID and is ticked with the date it was checked. Everything else is proved by the automated tests (`npm test`).

How it was done: the app was run with `npm run dev` and used in Google Chrome at 1440px as a salesperson would: every section and action, each screen compared by eye with `docs/mockups/b-open-air.png` and the brand, with the browser console watched for errors. The code was then read against "How the code is organised" in `docs/plan.md`.

## Checklist

- [x] APP-1, 2026-11-17: one user, light mode, no sign-in. Laid out for 1280px and up; at 1024px every page still fits with no sideways scrolling (also checked by `e2e/quality.spec.ts`).
- [x] APP-5, 2026-11-17: `npm run dev` from the repo root starts the API (port 8000) and the web app (port 5173), and Vite prints the address to open, `http://localhost:5173/`.
- [x] APP-7, 2026-11-17: `npm test` ran the traceability check, the types check, pytest, Vitest and Playwright in turn, all on their own databases; `backend/data/accountable.db` was unchanged afterwards.
- [ ] APP-8: the three commands on Mac and Linux. Checked on Windows 11 only (2026-11-17); the commands use only npm scripts, `concurrently`, `uv` and small Node scripts, with no shell syntax, but still need a run on a Mac and on Linux.
- [x] APP-9, 2026-11-17: `docs/STATUS.md` says how to install, run, seed, test and regenerate the API types.
- [x] APP-15, 2026-11-17: both sides are organised by feature (`backend/accountable/<feature>/api.py` and `data.py`, plus `rules.py` for deals and activities; `frontend/src/features/<feature>/`). Shared code (`db.py`, `config.py`, `clock.py`; `ui/`, `lib/`) holds only what two or more features use. No base classes, CRUD factories, repository layers or barrel files.
- [x] RULE-16, 2026-11-17: the rules live in `deals/rules.py` and `activities/rules.py` and the API applies them; the frontend works out only the board's instant totals while a move is saving (`features/pipeline/boardTotals.ts`), and refetches afterwards.
- [x] LAY-1, 2026-11-17: the dashboard and pipeline follow mockup B "Open Air": top bar, greeting, figures strip, revenue line and funnel, deals won bars, follow-ups and recent activity; the board's six columns, header panels, cards and late outlines. Differences: recent activity shows 15 entries in a scrolling list (the spec asks for 15; the mockup shows 5), and the funnel's figures come from the sample data.
- [x] DASH-7, 2026-11-17: a smooth Sea Green line with a light area under it; hovering a month shows a Midnight tooltip with the month name and "US$…".
- [x] DASH-8, 2026-11-17: five stacked segments narrowing from New to Won in their stage colors, names centred; value, deal count and share of New to the right; "New to Won, by value" under it.
- [x] DASH-10, 2026-11-17: rounded Marigold bars on light grey tracks, this month a shade darker; hovering shows the month, the deals won and the revenue.
- [x] PIPE-7, 2026-11-17: while dragging, the card lifts and tilts slightly, a striped space shows where it will land, and the column totals update as it moves.
- [x] LOOK-7, 2026-11-17: hover, sheet, dialog, menu and card-drop transitions are 150 to 200 ms; nothing moves on its own.

## Found and fixed during the walk-through

- The Contacts page crashed when a status filter matched nobody (its empty message read the label of "All"). Fixed.
- Deleting an organization from its own page logged a 404 in the console, as the page asked for the deleted record once more on its way out. Fixed: a delete now refreshes everything except the deleted record's own queries.
- On the board, Left and Right arrow keys could pick a card in the same column (the lifted card is tilted). The board now has its own Left/Right keyboard handling that moves to the next column; screen reader messages name the deal and the stage.
- Contrast for WCAG AA (LOOK-8): link text uses a darker Cerulean (`#0B6E8F`); the Negotiation chips use `#0E7DA2` behind white text; the Delete button uses `#C9264E` behind white text; Sea Green text is `#027055`. The brand colors themselves are kept for charts, the funnel, bars, meters and outlines.
- The funnel's links and the board's cards had accessible names that didn't match their visible text. Fixed.
- Numeric column headings used the mono font; they now use Instrument Sans like the other headings.
