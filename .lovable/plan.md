

# Automated Editorial Pipeline — No Perplexity Needed

No problem at all. We can build the entire pipeline without Perplexity by using **Firecrawl** (connector) for web scraping/search and **Lovable AI models** (free, no API key needed) for editorial rewriting. Here's the plan:

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Cron (every 30 min)                            │
│  pg_cron → calls edge function                  │
└──────────────┬──────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────┐
│  Edge Function: ingest-trends                   │
│                                                 │
│  1. Firecrawl Search API → discover trending    │
│     articles from fashion/culture sources       │
│  2. Firecrawl Scrape API → deep-scrape the      │
│     best results for full content + images      │
│  3. Lovable AI (Gemini 2.5 Flash) → rewrite     │
│     in Afrivogue editorial voice with:          │
│     - Luxury editorial tone                     │
│     - Citations & source links                  │
│     - SEO/AEO optimization                      │
│     - Structured JSON output                    │
│  4. Save to `trends` table                      │
│     - published = true                          │
│     - needs_review = true (new column)          │
└─────────────────────────────────────────────────┘
```

## Steps

### 1. Connect Firecrawl
Use the Firecrawl connector to provide scraping/search capabilities to the edge function.

### 2. Database migration
- Add `needs_review` boolean column (default `true`) to `trends` table
- Add `original_source_content` text column for archival
- Enable `pg_cron` and `pg_net` extensions

### 3. Edge function: `ingest-trends`
A single edge function that:
- **Discovers** content via Firecrawl Search across multiple queries (African fashion trends, luxury culture Africa, African beauty industry, etc.)
- **Scrapes** top results for full article content, images, and metadata
- **Deduplicates** against existing headlines in the database
- **Rewrites** using Lovable AI (Gemini 2.5 Flash) with a detailed system prompt enforcing:
  - Afrivogue's luxury editorial voice
  - Mandatory citations with direct links to original sources
  - Quotes from industry figures where available
  - SEO-optimized headlines and cultural significance text
  - Structured JSON output (headline, cultural_significance, category, urgency, source_name, source_url, featured_image_url, images array)
- **Saves** to database with `published: true` and `needs_review: true`

### 4. Cron job
Schedule via `pg_cron` to invoke the edge function every 30 minutes.

### 5. Admin dashboard update
- Add a "Needs Review" filter/badge in AdminTrends so editors can quickly find auto-generated content
- Add a "Mark Reviewed" action button

### 6. Config update
Add the edge function to `supabase/config.toml` with `verify_jwt = false` (cron calls it without auth).

## Cost Summary
- **Firecrawl**: Free tier available (500 credits/month)
- **Lovable AI**: No cost, built-in
- **No Perplexity needed**

