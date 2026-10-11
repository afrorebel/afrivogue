# AfriVogue

Fashion, culture and lifestyle through an African lens. A React + Vite site backed by Supabase (database, auth, storage, edge functions), deployed to Hostinger, with a Claude-powered content engine.

## Run it locally

```sh
npm ci
npm run dev        # http://localhost:8080
npm test           # unit tests
npm run build      # production build in dist/
```

The public Supabase URL and publishable key live in `.env` (both are safe to ship to browsers).

## Deploy (Hostinger)

Every push to `main` builds the site and uploads `dist/` to Hostinger over FTPS (`.github/workflows/deploy-hostinger.yml`).

One-time setup in **GitHub > Settings > Secrets and variables > Actions**:

| Secret | Where to find it |
|---|---|
| `HOSTINGER_FTP_SERVER` | hPanel > Files > FTP Accounts (e.g. `ftp.afrivogue.com`) |
| `HOSTINGER_FTP_USERNAME` | same page |
| `HOSTINGER_FTP_PASSWORD` | same page (reset it there if unknown) |
| `HOSTINGER_FTP_DIR` | optional; defaults to `public_html/` |

`public/.htaccess` sends every route to `index.html` (so `/editorials` works on refresh) and sets caching: fingerprinted files in `/assets` cache for a year, `index.html` always revalidates.

You can also run the deploy by hand from **GitHub > Actions > Deploy to Hostinger > Run workflow**.

## Content engine (Claude)

All AI writing runs in Supabase Edge Functions through the Anthropic API (`claude-opus-5-5`), in one shared AfriVogue voice (`supabase/functions/_shared/voice.ts`).

| Function | What it does |
|---|---|
| `ingest-trends` | Searches the web (Firecrawl), rewrites the best finds as AfriVogue stories |
| `ingest-forecasts` | Turns fresh sources into cultural forecasts |
| `ingest-moodboard` | Claude looks at candidate images, picks the strongest three per category, writes captions |
| `ingest-trivia` | Writes new AfriTrivia questions |
| `enrich-content` | `{"mode":"editorial"}` researches and writes 1,400 to 2,200 word long-form editorials for features; `{"mode":"story"}` re-voices older short stories |

Admins can run each one from the admin dashboard. These functions spend API credit, so they only run for signed-in admins, the service role, or a scheduled job that sends the `x-cron-secret` header.

### Secrets (Supabase > Project Settings > Edge Functions > Secrets)

| Secret | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude. Create one at console.anthropic.com. |
| `FIRECRAWL_API_KEY` | Web search and scraping |
| `CRON_SECRET` | Any long random string; scheduled jobs send it as `x-cron-secret` |

### Schedule it (Supabase > SQL Editor)

```sql
-- Store the cron secret once (same value as the CRON_SECRET function secret).
select vault.create_secret('<your CRON_SECRET>', 'cron_secret');

-- Helper that calls a content function with the secret.
create or replace function public.run_content_job(fn text, payload jsonb default '{}'::jsonb)
returns void language sql security definer as $$
  select net.http_post(
    url := 'https://mafitpqnezbkjmtaqcjq.supabase.co/functions/v1/' || fn,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body := payload
  );
$$;

select cron.schedule('afrivogue-stories',    '0 */6 * * *',  $$select public.run_content_job('ingest-trends')$$);
select cron.schedule('afrivogue-editorials', '30 */3 * * *', $$select public.run_content_job('enrich-content', '{"mode":"editorial","limit":1}')$$);
select cron.schedule('afrivogue-forecasts',  '0 9 * * *',    $$select public.run_content_job('ingest-forecasts')$$);
select cron.schedule('afrivogue-moodboard',  '0 12 * * *',   $$select public.run_content_job('ingest-moodboard')$$);
select cron.schedule('afrivogue-trivia',     '0 7 * * 1',    $$select public.run_content_job('ingest-trivia')$$);
```

Remove any older schedules that called these functions without the secret (`select * from cron.job;`, then `select cron.unschedule('<name>');`).

### Deploying functions

`.github/workflows/deploy-supabase-functions.yml` deploys `supabase/functions/**` on push once `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_REF` are set as GitHub secrets. Until then it skips itself. To deploy by hand: `supabase functions deploy --project-ref mafitpqnezbkjmtaqcjq`.

## Still tied to Lovable

- **Email.** Sign-up, password-reset and transactional emails go through Lovable's email service (`@lovable.dev/email-js`, `LOVABLE_API_KEY`). These keep working only while that account is active; the next step is moving them to a provider such as Resend.
- **Database ownership.** If the Supabase project was created by Lovable Cloud, move it into a Supabase account you own so the data, auth and functions are fully yours.
