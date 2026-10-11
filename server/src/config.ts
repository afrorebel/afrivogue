// Runtime configuration, read once from environment variables (set them in hPanel).

const env = (name: string, fallback = "") => process.env[name]?.trim() || fallback;

/** Parses mysql://user:pass@host:port/db, or falls back to the separate DB_* variables. */
function databaseConfig() {
  const url = env("DATABASE_URL");
  if (url) {
    const u = new URL(url);
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ""),
    };
  }
  return {
    host: env("DB_HOST", "127.0.0.1"),
    port: Number(env("DB_PORT", "3306")),
    user: env("DB_USER"),
    password: env("DB_PASSWORD"),
    database: env("DB_NAME"),
  };
}

export const config = {
  port: Number(env("PORT", "3000")),
  appUrl: env("APP_URL", "http://localhost:3000").replace(/\/$/, ""),
  isProduction: env("NODE_ENV") === "production",
  db: databaseConfig(),

  /** Where uploaded images are stored on disk (served at /uploads). */
  uploadDir: env("UPLOAD_DIR", "uploads"),

  /** Accounts with these emails (comma-separated) become admins once they confirm their email. */
  adminEmails: env("ADMIN_EMAIL")
    .toLowerCase()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  /** Signs unsubscribe links. Any long random string; keep it secret. */
  appSecret: env("APP_SECRET", env("CRON_SECRET")),

  smtp: {
    host: env("SMTP_HOST"),
    port: Number(env("SMTP_PORT", "465")),
    user: env("SMTP_USER"),
    password: env("SMTP_PASSWORD"),
    from: env("EMAIL_FROM", "AfriVogue <hello@afrivogue.com>"),
    /** Where contact-form messages are delivered. */
    inbox: env("CONTACT_INBOX", env("SMTP_USER")),
  },

  stripe: {
    secretKey: env("STRIPE_SECRET_KEY"),
    webhookSecret: env("STRIPE_WEBHOOK_SECRET"),
    priceMonthly: env("STRIPE_PRICE_MONTHLY", "price_1TBq4WF8fCmGgQNVm93x6nSr"),
    priceYearly: env("STRIPE_PRICE_YEARLY", "price_1TBqAtF8fCmGgQNVOKWafPev"),
  },

  anthropicApiKey: env("ANTHROPIC_API_KEY"),
  firecrawlApiKey: env("FIRECRAWL_API_KEY"),
  cronSecret: env("CRON_SECRET"),

  /** Style Concierge looks per day: guests, free Collective accounts, paying Insiders. */
  conciergeDailyGuest: Number(env("CONCIERGE_DAILY_GUEST", "1")),
  conciergeDailyFree: Number(env("CONCIERGE_DAILY_FREE", "5")),
  conciergeDailyMember: Number(env("CONCIERGE_DAILY_MEMBER", "40")),
};

export type Config = typeof config;
