# Putting AfriVogue live on Hostinger

AfriVogue is one Node.js app plus a MySQL database, both on your Hostinger plan. The app serves the website, accounts, the admin, the shop (Stripe), email (your Hostinger mailbox) and the Claude content engine. Nothing runs on Supabase, Lovable or GitHub.

You upload one file: **`afrivogue-hostinger.zip`**. It's already built and needs no `npm install`.

Budget about 30 minutes the first time.

---

## 1. Create the database (5 minutes)

1. In hPanel, open **Databases → MySQL Databases**.
2. Create a database (for example `afrivogue`), a user and a strong password. Save all three.
3. Note the **host** hPanel shows for the database. On the same server it is usually `localhost`.

You don't need to import anything. On first start the app creates every table and loads AfriVogue's existing content: about 360 stories, 1,770 forecasts, 970 trivia questions, the moodboard and the shop.

## 2. Create the email mailbox (3 minutes)

This is the same setup that sends email for foundright.ng: a normal Hostinger mailbox, sent over SMTP. No Resend, no extra service.

1. In hPanel, open **Emails** and create `hello@afrivogue.com` (or any address you like). Save the password.
2. Under **Emails → DNS settings**, make sure SPF, DKIM and DMARC are on, so mail lands in inboxes rather than spam.

## 3. Create the Node.js app (10 minutes)

1. In hPanel, go to **Websites → Add website → Node.js app** (on some plans: **Advanced → Node.js**).
2. Choose **Upload files** and upload `afrivogue-hostinger.zip`.
3. Settings:
   - **Node version:** 20.x or 22.x
   - **Entry file / start command:** `server.mjs` (or `npm start`)
   - **Install command:** leave empty, or `npm install` (there's nothing to install)
   - **Build command:** leave empty, or `npm run build` (it just says "Already built")
4. **Environment variables.** Add these (`.env.example` in the zip explains every one):

   | Name | Value |
   |---|---|
   | `APP_URL` | `https://afrivogue.com` |
   | `NODE_ENV` | `production` |
   | `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | from step 1 |
   | `ADMIN_EMAIL` | the email you'll sign up with |
   | `APP_SECRET`, `CRON_SECRET` | two different long random strings from a password generator |
   | `SMTP_HOST` | `smtp.hostinger.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER`, `SMTP_PASSWORD` | the mailbox from step 2 |
   | `EMAIL_FROM` | `AfriVogue <hello@afrivogue.com>` |
   | `ANTHROPIC_API_KEY` | from console.anthropic.com (powers stories, editorials, trivia and the Style Concierge) |
   | `FIRECRAWL_API_KEY` | from firecrawl.dev (finds fresh sources) |

   Stripe comes in step 5; the site works without it, checkout just stays switched off.
5. Point **afrivogue.com** at this app (hPanel → Domains) and turn on **SSL**.
6. Deploy / start the app. The first start takes about a minute while it loads the existing content.

## 4. Make yourself the admin (2 minutes)

1. Visit `https://afrivogue.com/auth?mode=signup` and create your account with the `ADMIN_EMAIL` address.
2. Open the welcome email and tap **Confirm my email**. That confirmation is what unlocks admin, so nobody else can claim it by signing up with your address.
3. Visit `https://afrivogue.com/admin`.

No email yet? Check the app's logs in hPanel: until SMTP is set up, the app notes "SMTP not configured" instead of sending. Fix the SMTP variables, restart, then use **Forgot password?** on the sign-in page; resetting your password also confirms your email.

## 5. Stripe: Insider membership and the shop (10 minutes)

1. In Stripe, start in **Test mode**. **Developers → API keys** → copy the **Secret key** (`sk_test_…`).
2. **Developers → Webhooks → Add endpoint**
   - URL: `https://afrivogue.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_…`).
3. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to the app's environment variables and restart.
4. If your Insider prices live in a different Stripe account than before, add `STRIPE_PRICE_MONTHLY` and `STRIPE_PRICE_YEARLY` with your price IDs.
5. Test with card `4242 4242 4242 4242` (any future date, any CVC):
   - **Insider:** `/membership` → choose a plan → pay → your dashboard shows Insider.
   - **Shop:** add a product to the bag → checkout → pay. The order turns **paid** in Admin → Shop, you get a receipt, and the contact inbox gets a new-order alert.
6. To go live, repeat steps 1–3 with live keys and a live webhook.

## 6. Schedule the content engine (5 minutes)

In hPanel, open **Advanced → Cron Jobs** and add these (replace `YOUR_CRON_SECRET`):

| How often | Command |
|---|---|
| Every 6 hours | `curl -fsS "https://afrivogue.com/api/cron?key=YOUR_CRON_SECRET&job=ingest-trends" > /dev/null` |
| Daily | `curl -fsS "https://afrivogue.com/api/cron?key=YOUR_CRON_SECRET&job=ingest-forecasts,ingest-moodboard" > /dev/null` |
| Daily | `curl -fsS "https://afrivogue.com/api/cron?key=YOUR_CRON_SECRET&job=enrich-content" > /dev/null` |
| Weekly | `curl -fsS "https://afrivogue.com/api/cron?key=YOUR_CRON_SECRET&job=ingest-trivia" > /dev/null` |

Each call returns straight away and the work carries on in the background. Every run spends Anthropic and Firecrawl credit, so start slow and speed up once you like the results. You can also run any of these by hand from the admin (Trends, Forecasts, Moodboard and Trivia tabs).

New stories from the engine are marked **needs review**; long-form features stay unpublished until you approve them in Admin → Trends.

## 7. Check it works

- `https://afrivogue.com/api/health` shows `{"ok":true}`.
- The homepage shows stories, and `/concierge` styles a look.
- Send yourself a message from `/contact`: it arrives in your inbox and in Admin → Messages.

## Updating the site later

Ask Claude for a new `afrivogue-hostinger.zip`, then in hPanel upload it over the old files and restart the app. Your database, settings and (with `UPLOAD_DIR` set, see below) uploaded images are untouched, and new tables are added automatically on start.

To build the zip yourself: `npm install`, then `npm run package:hostinger`. It lands in `release/`.

## Good to know

- **Uploaded images** live in the app's `uploads/` folder by default. So that a re-upload of the zip can never touch them, set `UPLOAD_DIR` to a folder outside the app, for example `/home/YOUR_HOSTINGER_USER/afrivogue-uploads`, and include it in your backups.
- **Logs:** hPanel → your Node.js app → Logs. Content jobs, emails and errors are all written there.
- **Old accounts:** accounts from the previous (Lovable) setup don't carry over. Members sign up again; their content, stories and the shop are all here.
