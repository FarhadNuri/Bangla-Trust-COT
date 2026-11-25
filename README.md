# BanglaTrust-CoT

BanglaTrust-CoT is a bilingual research website for a study of trust calibration in AI chain-of-thought reasoning. Participants evaluate AI-generated reasoning for Bangla and English riddles; the study records trust ratings, answer choices, and whether participants identify reasoning flaws.

## Website

### Participant study

The study is available at the site root (`/`). Its flow is:

1. Read the study information and provide consent.
2. Complete a short demographics questionnaire.
3. Answer 34 riddle trials in two language blocks of 17 trials each. Language order is counterbalanced.
4. For every trial, review the riddle, the AI's four-step explanation, and its final answer; then rate trust, choose an answer, and report any reasoning flaw.
5. View a completion code and a summary of participant and AI answer accuracy.

The study includes two attention checks. They are used for internal data-quality analysis and are not displayed as pass/fail results to participants. Participant sessions are saved on the server and can be restored after a page reload.

### Administration

The dashboard is available at `/admin` and requires the `ADMIN_SECRET`. It reports participant totals, completion time, distribution across the eight form/language-order counterbalancing cells, attention-check results, and potential speeders. Administrators can refresh statistics, enable 30-second auto-refresh, and export trial-level data as CSV, optionally limited to completed participants.

## Technology

- Next.js 16 with React 19
- PostgreSQL with Prisma
- Tailwind CSS 4
- Node.js 20 or later

## Local setup

1. Install Node.js 20 or later and PostgreSQL.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and set:
   - `DATABASE_URL`: PostgreSQL runtime connection URL (a pooled URL is suitable).
   - `DIRECT_URL`: direct PostgreSQL connection URL for Prisma migrations.
   - `ADMIN_SECRET`: a long, random secret for the admin dashboard and API.
4. Apply the database migration and start the development server:

   ```bash
   npx prisma migrate deploy
   npm run dev
   ```

   Open `http://localhost:3000`. To create and apply a new migration during development, use `npx prisma migrate dev`.

The application requires a configured database for participant sessions and admin metrics. Never commit `.env` or production credentials.

## Available commands

- `npm run dev` — start the development server.
- `npm run build` — generate the Prisma client and build the production application.
- `npm start` — serve the production build.
- `npm run lint` — run ESLint.
- `npm test` — run the Node.js unit tests.
- `npm run validate:stimuli` — validate the stimulus and attention-check datasets.
- `npm run smoke` — run end-to-end checks against a running server and test database.
- `node scripts/db-check.mjs` — check database connectivity and participant count.

The smoke test requires a running server, a test database, and `ADMIN_SECRET`. It creates test participants; run it only against a local or disposable test database.

## API overview

- `POST /api/sessions/start` — create a consented participant session and assign its trial queue.
- `GET /api/sessions/:uuid` — restore session progress.
- `PATCH /api/sessions/:uuid/demographics` — save participant demographics.
- `POST /api/responses` — validate and save a trial response.
- `POST /api/sessions/:uuid/complete` — finalize a completed study session.
- `GET /api/admin/stats` — retrieve admin metrics (Bearer authentication required).
- `GET /api/admin/export.csv` — download trial-level CSV data (Bearer authentication required).

## Study data and documentation

Stimulus forms and attention-check definitions are stored in `data/`. The `docs/` directory contains the project analysis, architecture, API and database specifications, testing guidance, and UI notes.
