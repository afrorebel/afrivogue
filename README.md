# AfriVogue

Fashion, culture and lifestyle through an African lens. One Node.js app and one MySQL database on Hostinger: a React + Vite site, an Express API, accounts, the admin, a Stripe shop and Insider membership, email through a Hostinger mailbox, and a Claude-powered content engine.

To put it live, follow **[DEPLOY-HOSTINGER.md](DEPLOY-HOSTINGER.md)**.

## Layout

| Path | What lives there |
|---|---|
| `src/` | The website (React, Tailwind, shadcn/ui) |
| `src/integrations/api/` | The site's connection to the server: `api.from("trends").select("*").eq(...)`, `api.auth`, `api.storage`, `api.functions` |
| `server/src/` | The server: accounts (`auth.ts`), the permission-checked data API (`data/`), uploads, email (`mail/`), Stripe (`shop.ts`), the Claude content engine and Style Concierge (`content/`) |
| `server/src/db/schema.sql` | Every table. Applied on each start (all `IF NOT EXISTS`); add new tables at the end and describe them in `registry.json` |
| `server/src/data/policies.ts` | Who may read and write each table |
| `server/seed/` | The existing content, loaded into an empty database on first start |

## Run it locally

You need Node 20+ and a MySQL 8 or MariaDB 10.6+ database.

```sh
npm install
cp .env.example .env     # fill in DB_* at least
npm run dev:server       # API on http://localhost:3000 (rebuilds and restarts on change)
npm run dev              # site on http://localhost:8080, proxying /api to the server
```

Checks:

```sh
npm run typecheck
npm test                 # site unit tests
npm run test:server      # API tests against a real database (TEST_DB_* env vars, defaults in server/vitest.config.ts)
```

Build the Hostinger upload:

```sh
npm run package:hostinger   # → release/afrivogue-hostinger.zip
```

## Content engine (Claude)

All writing runs through the Anthropic API (`claude-opus-5-5`) in one shared AfriVogue voice (`server/src/content/voice.ts`).

| Job | What it does |
|---|---|
| `ingest-trends` | Searches the web (Firecrawl), rewrites the best finds as AfriVogue stories |
| `ingest-forecasts` | Turns fresh sources into cultural forecasts |
| `ingest-moodboard` | Claude looks at candidate images, picks the strongest three per category, writes captions |
| `ingest-trivia` | Writes new AfriTrivia questions: short, accurate, and fun for anyone |
| `enrich-content` | `{"mode":"editorial"}` researches and writes 1,400 to 2,200 word editorials; `{"mode":"story"}` re-voices older stories |

Admins run them from the dashboard; Hostinger cron runs them on a schedule via `/api/cron?key=CRON_SECRET&job=…`. They spend API credit, so nobody else can trigger them. Jobs run in the background and the admin page waits for the result.

**Style Concierge** (`/concierge`, `server/src/content/concierge.ts`): tell it the occasion and it builds a complete look, linked to our stories and shop. Guests get 1 look a day, the free Collective 5, Insiders 40 (adjustable with `CONCIERGE_DAILY_*`).

## Email

Sent over SMTP from a Hostinger mailbox with nodemailer (`server/src/mail/`), the same setup as foundright.ng. Templates: welcome (with email confirmation), password reset, contact confirmation, order receipt, plus contact and new-order alerts to `CONTACT_INBOX`. Admins can restyle the member-facing templates in Admin → Emails.
