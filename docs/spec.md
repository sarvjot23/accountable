# Spec: the Accountable MVP

This spec turns `docs/intent.md` into requirements and a design. The intent says what and why. This file says how it works and how it looks. The stack is in `docs/TECH_STACK.md` and the brand in `.claude/skills/brand/SKILL.md`.

## 1. Shape of the app

- One salesperson, one computer, no sign-in. Light mode, laptop and desktop widths (1280px and up, usable down to 1024px).
- `backend/`: FastAPI serving a JSON API under `/api`, with SQLAlchemy Core on a SQLite file at `backend/data/accountable.db` (git-ignored). On start, it creates the tables if needed and seeds the sample data if the database is new.
- `frontend/`: React, TypeScript and Vite. Talks only to `/api` (Vite proxies it in development).
- Works with no internet connection: fonts and every library are installed through npm or uv and served locally. Nothing loads from a CDN or Google Fonts at runtime.
- Commands, from the repo root, the same on Mac, Linux and Windows:
  - `npm run dev`: starts the backend and the frontend together and prints the address to open.
  - `npm run seed`: deletes the data and loads the sample data again.
  - `npm test`: runs every test (Vitest, pytest, Playwright) and fails if any fails.
- `docs/STATUS.md` says how to install and run the app.

### Libraries

Chosen for being popular and well supported, so nothing here is hand-rolled:

| Need | Library |
| --- | --- |
| Routing | React Router |
| Server data and caching | TanStack Query |
| Tables (sort, search) | TanStack Table |
| Charts | Recharts |
| Drag and drop on the board | dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`) |
| Forms and validation | React Hook Form with Zod |
| Dialogs, menus, selects | Radix UI primitives |
| Icons | Lucide |
| Dates | date-fns |
| Fonts | `@fontsource` packages for Instrument Sans, Instrument Serif and JetBrains Mono |
| Backend | FastAPI, Pydantic, SQLAlchemy Core, Uvicorn |
| Running both in dev | concurrently |

## 2. Data

All tables have an integer `id` and `created_at` / `updated_at` timestamps (UTC). Money is stored as whole US dollars (integer). Dates without a time (close date, follow-up date) are stored as ISO dates. SQLite foreign keys are turned on.

### organizations

| Field | Type | Rules |
| --- | --- | --- |
| name | text | required, 1 to 120 characters |
| website | text | optional, must look like a web address; `https://` added if missing |
| industry | text | optional, free text with suggestions from existing values |
| notes | text | optional, up to 5,000 characters |

### contacts

| Field | Type | Rules |
| --- | --- | --- |
| first_name, last_name | text | first name required; last name optional |
| email | text | optional, valid email |
| phone | text | optional, free text |
| job_title | text | optional |
| organization_id | int | optional, references organizations; deleted with the organization |
| status | text | required: `lead`, `qualified` or `customer`; new contacts start as `lead` |

### deals

| Field | Type | Rules |
| --- | --- | --- |
| name | text | required, 1 to 160 characters |
| organization_id | int | required, references organizations; deleted with the organization |
| contact_id | int | optional, references contacts; set to empty when the contact is deleted |
| stage | text | required: `new`, `qualified`, `proposal`, `negotiation`, `won`, `lost` |
| value | int | required, US dollars, 0 or more |
| probability | int | 0 to 100; defaults to the stage's probability |
| probability_manual | bool | true once the probability is set by hand; reset when the stage changes |
| close_date | date | optional; the expected close date while open, the actual one once won or lost |
| close_date_manual | bool | true once the close date is set by hand |
| position | real | the card's place within its stage column (see 4.5) |
| stage_changed_at | timestamp | when the deal last changed stage; used for "won this month" |

### activities

| Field | Type | Rules |
| --- | --- | --- |
| type | text | `note`, `call`, `email`, or `stage_change` (made by the app only) |
| description | text | required, up to 5,000 characters |
| occurred_at | timestamp | when it happened; defaults to now |
| contact_id | int | optional, references contacts; set to empty when the contact is deleted |
| deal_id | int | optional, references deals; set to empty when the deal is deleted |
| follow_up_date | date | optional |
| follow_up_done | bool | defaults to false |
| from_stage, to_stage | text | only on `stage_change` entries |

A note, call or email needs a contact, a deal or both when it's created. Once created, it can lose those links through a delete and still exist, as history.

### Stage table (fixed, in code)

| Stage | Label | Probability | Open | Color |
| --- | --- | --- | --- | --- |
| new | New | 10% | yes | Sea Green |
| qualified | Qualified | 25% | yes | Marigold |
| proposal | Proposal | 50% | yes | Coral |
| negotiation | Negotiation | 75% | yes | Cerulean (white text) |
| won | Won | 100% | no | Midnight (white text) |
| lost | Lost | 0% | no | Sea Mist |

The stage colors follow the brand's order for things side by side: Sea Green, Marigold, Coral, then Cerulean.

## 3. Business rules

These live in one backend module (`backend/rules.py` or similar), are covered by unit tests, and the API applies them. The frontend never works them out on its own, except to update the board's totals instantly while a save is in flight (4.5).

1. **Expected revenue** of a deal = value × probability ÷ 100, rounded to the dollar.
2. **Open pipeline** = deals in New, Qualified, Proposal and Negotiation. Its total value and expected revenue count only those. Won and Lost are never in open totals.
3. **Stage change.** When a deal's stage changes, in one transaction:
   - the probability becomes the new stage's probability, and `probability_manual` goes back to false;
   - if the new stage is Won or Lost and `close_date_manual` is false, the close date becomes today;
   - `stage_changed_at` becomes now;
   - a `stage_change` activity is added, linked to the deal and its main contact, reading "Moved from Proposal to Negotiation".
   Changing the stage in the deal form follows the same rule as dragging. A deal can move from Won or Lost back to an open stage by the same rule: its probability goes back to the stage's usual figure and its close date stays as it is until changed by hand.
4. **Manual values.** Editing the probability in the deal form sets `probability_manual`. Editing the close date sets `close_date_manual`. A manual probability is kept until the stage changes. A manual close date is kept through stage changes.
5. **Late.** A deal is late when its stage is open, it has a close date, and that date is before today. Won and Lost deals are never late.
6. **Follow-ups.** An activity with a follow-up date and `follow_up_done` false is a task. It is overdue when the date is before today, due today when equal, and upcoming when later.
7. **Deleting.**
   - An organization: its contacts, its deals and every activity linked to any of them are deleted. The confirmation names the counts: "Delete Northwind Labs? This also deletes 3 contacts, 2 deals and 11 activities."
   - A contact: their activities stay, unlinked from the contact. Deals with them as main contact stay, with no contact. The confirmation says so.
   - A deal: its activities stay, unlinked from the deal. The confirmation says so.
   - An activity: deleted on its own after confirming.
   The API offers `GET /api/<kind>/<id>/delete-impact` so the dialog can show the counts before asking.
8. **Deals won** and **revenue won** in a month count deals in Won whose close date falls in that month.
9. **Sales funnel.** The deals counted are every open deal and every deal won or lost in the last 12 months. Each deal counts at every stage up to the furthest one it reached, worked out from its stage-change history: a Won deal counts at New, Qualified, Proposal, Negotiation and Won; a deal lost from Proposal counts at New, Qualified and Proposal; an open deal counts up to its current stage. A deal created at a later stage (for example added straight into Proposal) counts as having passed the stages before it. For each stage the funnel shows the total value and count of deals that reached it, and that value as a share of the value at New.
10. **Dates and "today"** use the computer's local date. The backend takes "today" from one function so tests can fix it.

## 4. Screens

### 4.1 Layout

The dashboard and the pipeline follow mockup B, "Open Air", in `docs/mockups/b-open-air.html` (screenshot beside it). The other screens use the same layout and styles.

- A white top bar, 68px tall, across the page: the Accountable wordmark (a Midnight circle with a Sea Green dot) on the left, then Dashboard, Pipeline, Deals, Organizations and Contacts as pill-shaped tabs. The current tab is a Midnight pill with white text. On the right, a search box that finds deals, contacts and organizations by name, and an "Add deal" button.
- Below it, the page on the background `#F0F4F5` with 40px side margins. Each page opens with a header row: the page title in Instrument Serif at 44px on the left, a one-line summary under it, and the page's actions as pill buttons on the right.
- Content sits in white panels with 20px rounded corners, no outline and no shadow. 24px gaps between panels.

### 4.2 Dashboard (`/`)

The landing page. All figures come from one call, `GET /api/dashboard`, so it loads fast and its numbers agree.

**Greeting**: "Good morning." (or afternoon or evening) followed by revenue won this month in Sea Green italics, for example "Good morning. US$92,000 won so far this month." Under it, the date and a plain summary such as "2 follow-ups overdue, 2 deals running late". On the right, "Log activity" and "Add deal".

**Figures strip**: one wide panel split into four, numbers in JetBrains Mono at 34px, each with a thin meter under it:

1. **Open pipeline**: total value of open deals, and the count.
2. **Expected revenue**: the open pipeline weighted by probability, and its share of the open pipeline.
3. **Won this month**: revenue won this month, with the change against last month in a Sea Green or Raspberry pill.
4. **Late deals**: the count in Raspberry, and their value in a Raspberry pill. Links to the Deals table filtered to late deals.

**Second row**, two panels:

- **Revenue won** (line chart): a smooth Sea Green line with a light area under it, revenue won per month for the last 12 months. Hovering a month shows a Midnight tooltip with the month and the amount.
- **Sales funnel**: a true funnel of five stacked segments that narrow from top to bottom: New, Qualified, Proposal, Negotiation and Won, each in its stage color with the stage name centred inside it. Each segment's width follows the value that reached that stage (rule 9 in section 3), with a minimum width so the lowest segments stay readable. To the right of each segment: the value, then the deal count and the share of New. Below the funnel, a line with "New to Won, by value" and its percentage. Clicking a segment opens the Pipeline board.

**Third row**, three panels:

- **Deals won** (bar chart): deals won per month for the last 12 months, as rounded Marigold bars on light grey tracks, with the current month a shade darker.
- **Follow-ups**: open tasks, overdue first (Raspberry ring and date) then coming up in the next 14 days, each with a round "Done" checkbox, its contact or deal and a link to the record. Up to 8 shown, then "Show all".
- **Recent activity**: the 15 newest activities of every type, including stage changes and activities no longer linked to anything, each with the contact's initials in a tinted circle, the description, the organization (or "No longer linked") and the date.

Every figure is shown with its currency, for example "US$248,500". Chart tooltips use the same format. Empty states say what to do next, for example "No follow-ups due. Log an activity from a contact or deal."

### 4.3 Tables: Organizations, Contacts, Deals

All three share one table component built on TanStack Table:

- A search box above the table that filters as you type, across the visible text columns.
- Click a column heading to sort, again to reverse. The current sort shows an arrow.
- "Add …" button in the page header opens the form in a side sheet from the right.
- Each row has Edit and Delete in a row-end menu. Clicking anywhere else on the row opens the record's page.
- Data is loaded once per page and filtered and sorted in the browser (the data set is small).
- An empty table shows a short message and the Add button.

Columns:

- **Organizations**: Name, Industry, Website, Contacts (count), Open deals (count), Open value.
- **Contacts**: Name, Organization, Job title, Email, Phone, Status (colored chip). A status filter above the table: All, Lead, Qualified, Customer, with counts.
- **Deals**: Name, Organization, Contact, Stage (chip in stage color), Value, Probability, Expected revenue, Close date. A stage filter (All, Open, each stage) and a "Late only" toggle. Late deals show a Raspberry "Late" chip next to the close date, and the date in Raspberry.

### 4.4 Record pages

Each page has a header panel with the record's main fields and Edit / Delete buttons, then two columns.

- **Organization** (`/organizations/:id`): details and notes; its contacts (mini table) and its deals (mini table with stage and value), each with an Add button that presets the organization.
- **Contact** (`/contacts/:id`): details with a status chip, a link to the organization, their deals; on the right, the timeline with "Log activity".
- **Deal** (`/deals/:id`): stage, value, probability, expected revenue, close date (with the Late chip), organization and main contact; a stage selector that moves the deal by the same rules as the board; on the right, the timeline with "Log activity".

**Timeline**: newest first. Each entry shows an icon per type (note, call, email, stage change), the description, when it happened, its other linked record (for example the deal, on a contact's timeline), and its follow-up with a Done checkbox. Every entry has Edit and Delete in a small menu. For a stage change, Edit changes only its description and time, and the delete dialog says the deal stays in its current stage.

**Log activity form**: type, description, when (defaults to now), contact and deal (prefilled from the page; either can be changed or cleared, but not both), optional follow-up date.

### 4.5 Pipeline (`/pipeline`)

- The page header says the open pipeline's total value, deal count and expected revenue, for example "US$695,000 open across 8 deals · US$371,450 expected". On the right: "Open only" and "All stages" chips (Open only hides Won and Lost) and "Add deal".
- Six equal columns: New, Qualified, Proposal, Negotiation, Won, Lost. Each column starts with a white header panel: the stage name in a pill of its stage color, the count, the total value in JetBrains Mono and the expected revenue under it. Won and Lost say "Closed, last 12 months" instead of an expected figure, and show the 12 months' total. Won and Lost show deals closed in the last 12 months, the most recent first, with the rest behind "N more".
- Cards are white with 16px corners: the organization, the deal name, the value, a thin probability bar in the stage color with the percentage, then the main contact and the close date. A late card has a Raspberry outline and a "Late · 10 Nov" pill in place of the date.
- While dragging, the card lifts and tilts slightly, and a striped space shows where it will land.
- Dragging (dnd-kit, mouse and keyboard) moves a card to another column or to another place in its column. A card dropped anywhere stays exactly there.
- Totals update at once, before the save finishes. If the save fails, the card goes back and a message explains.
- Each column has a "+" button that opens the Add deal sheet with that stage set.
- Clicking a card opens the deal's page.

**Ordering.** Each card has a `position` number. A dropped card gets the midpoint of its new neighbours' positions (or one more or less than the end card). If two positions get too close, the backend renumbers that column. One call, `PATCH /api/deals/:id/move` with `{stage, before_id, after_id}`, saves the move and applies the stage rules when the stage changes.

### 4.6 Forms

- Side sheets with labelled fields, inline validation messages in plain words ("Enter a name"), and Save / Cancel. Save is disabled while saving.
- Organization and contact pickers are searchable selects. In the deal form, the contact picker lists the chosen organization's contacts first.
- Value is entered in whole dollars with a "US$" prefix.
- A successful save closes the sheet, shows a short toast ("Deal saved") and refreshes the affected data.

### 4.7 Delete dialog

A centered dialog with the record's name, what will happen to linked records (from the delete-impact call), and two buttons: Cancel (default focus) and Delete (Raspberry).

## 5. API

JSON over HTTP, under `/api`. Errors return `{"detail": "..."}` with a plain-English message and a 4xx status.

| Method and path | Purpose |
| --- | --- |
| `GET/POST /organizations`, `GET/PUT/DELETE /organizations/:id` | CRUD; the GET by id includes its contacts and deals |
| `GET/POST /contacts`, `GET/PUT/DELETE /contacts/:id` | CRUD; `?status=` filter |
| `GET/POST /deals`, `GET/PUT/DELETE /deals/:id` | CRUD; responses include `expected_revenue` and `is_late` |
| `PATCH /deals/:id/move` | stage and position change from the board |
| `GET /contacts/:id/timeline`, `GET /deals/:id/timeline` | activities, newest first |
| `POST /activities`, `PUT/DELETE /activities/:id`, `PATCH /activities/:id/done` | activities and follow-ups |
| `GET /<kind>/:id/delete-impact` | counts of what a delete would remove or unlink |
| `GET /dashboard` | every dashboard figure in one response |
| `GET /meta/stages` | the stage table |

## 6. Look and feel

Following the brand skill, which wins over any other design guidance.

- **Fonts**: Instrument Serif for page titles and the dashboard greeting (44px). Instrument Sans for everything else (panel titles 16px semibold, body 14px). JetBrains Mono for money, counts, percentages and dates.
- **Shapes**: panels and cards have rounded corners (20px panels, 16px cards). Buttons, tabs, chips and status labels are full pills.
- **Colors**: Midnight `#073B4C` for text, the current tab and the dark buttons. Sea Green `#06D6A0` for the primary button (Midnight text) and positive changes. Cerulean `#118AB2` for links and information. Raspberry `#EF476F` for late, overdue and delete. Sea Green and Marigold are darkened (for example `#048A68` and `#A87400`) when used for small text on white.
- **Chart and stage series**: Sea Green, Marigold, Coral, then Cerulean, then Raspberry, in that order.
- **Surfaces**: page `#F0F4F5`, white top bar and panels, no outlines, no border on one edge, no line across the top of the page, gradients only for the soft area under the revenue line. Splits inside a panel (between figures, between list rows) use a 1px tint of `#E6EDEF`.
- **Words**: plain business English, short labels, no exclamation marks. Money always with its currency ("US$12,500"). Dates as "17 Nov 2026"; times as "2:30 pm".
- **Motion**: short (150 to 200 ms) transitions on hover, sheets and card drops. Nothing moves on its own.
- **Accessibility**: text meets WCAG AA contrast; every control works with the keyboard, including the board; visible focus rings in Cerulean.

## 7. Sample data

Seeded on first start and by `npm run seed`, with dates worked out from the day it runs so it always looks current. A company selling IT, software and AI solutions:

- **6 organizations** across healthcare, logistics, retail, finance, manufacturing and education.
- **15 contacts**, 2 or 3 per organization, at every status (about 6 leads, 4 qualified, 5 customers).
- **About 20 deals** at every stage: about 2 New, 2 Qualified, 2 Proposal, 2 Negotiation (2 of these 8 running late), 10 Won spread across the past 12 months so most months on the revenue and deals-won charts have data, and 2 Lost. Values from US$8,000 to US$180,000, for things such as a cloud migration, a managed IT contract, an AI support assistant or a data platform.
- **About 40 activities**: notes, calls and emails over the last few months, every stage change the deals went through, 3 follow-ups coming up in the next week and 2 overdue.

## 8. Testing

`npm test` runs all three, against a database of its own, so it never changes your data.

- **Backend (pytest)**: every rule in section 3 with a fixed "today": stage-change effects, manual probability and close date, late, open totals, expected revenue, follow-up grouping, each delete rule and its impact counts, card positions and renumbering, the dashboard figures against the sample data, and validation errors.
- **Frontend (Vitest)**: money and date formatting, the table's search and sort, the board's instant totals, form validation.
- **End to end (Playwright with installed Chrome)**: start on the dashboard with sample data; add, search, sort, edit and delete each kind of record; filter contacts by status; drag a card to another column and within a column, refresh and see it stay; add a deal from a column; log an activity with a follow-up and see it on the dashboard; mark it done; delete an organization and see the counts; check no console errors on any page; check each page opens in under a second with the sample data.

## 9. Not in the MVP

As in the intent: sign-in and several users, dark mode and phone layouts, AI features, integrations, other currencies, reports beyond the dashboard, tags and custom fields, changing the stages, importing and exporting.
