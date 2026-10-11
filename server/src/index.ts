// AfriVogue server: serves the built site, the API, uploads and scheduled content jobs.
// Runs as a Node.js app on Hostinger with a MySQL database (see DEPLOY-HOSTINGER.md).
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type NextFunction, type Request, type Response } from "express";
import { authRouter, hasRoleRpc, requireAdminOrCron, sessionMiddleware } from "./auth";
import { config } from "./config";
import { runDbRequest } from "./data/query";
import { migrate } from "./db/pool";
import { seedIfEmpty } from "./db/seed";
import { CONTENT_JOBS, functionsRouter, jobsRouter } from "./functions";
import { handle, HttpError, rateLimit } from "./http";
import { startJob } from "./jobs";
import { handleStripeWebhook } from "./shop";
import { storageRouter, uploadRoot } from "./storage";

const here = path.dirname(fileURLToPath(import.meta.url));
/** The built site: ./public next to the bundled server in production, ../../dist in development. */
const siteDir = [path.join(here, "public"), path.resolve(here, "../../dist"), path.resolve("dist")].find((p) =>
  existsSync(path.join(p, "index.html")),
);

export function createApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  // Stripe needs the raw body to verify its signature, so this comes before the JSON parser.
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "1mb" }),
    handle(async (req, res) => {
      res.json(await handleStripeWebhook(req.body as Buffer, req.get("stripe-signature")));
    }),
  );

  app.use(express.json({ limit: "6mb" }));
  app.use("/api", sessionMiddleware);

  app.get("/api/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);

  app.post(
    "/api/db",
    rateLimit("db", 900, 60 * 1000),
    handle(async (req, res) => {
      const body = req.body;
      if (!body || typeof body.table !== "string" || typeof body.action !== "string") throw new HttpError(400, "Bad request");
      const result = await runDbRequest(body, req.principal);
      res.status(result.status).json(result);
    }),
  );

  app.post(
    "/api/rpc/:fn",
    handle(async (req, res) => {
      if (req.params.fn !== "has_role") throw new HttpError(404, "Unknown function");
      res.json({ data: await hasRoleRpc(req, req.body || {}) });
    }),
  );

  app.use("/api/storage", storageRouter);
  app.use("/api/functions", functionsRouter);
  app.use("/api/jobs", jobsRouter);

  // Hostinger cron: curl -s "https://afrivogue.com/api/cron?key=CRON_SECRET&job=ingest-trends"
  app.all(
    "/api/cron",
    handle(async (req, res) => {
      if (!config.cronSecret) throw new HttpError(503, "Set CRON_SECRET first.");
      requireAdminOrCron(req);
      const names = String(req.query.job || "ingest-trends")
        .split(",")
        .map((s) => s.trim())
        .filter((n) => CONTENT_JOBS[n]);
      if (!names.length) throw new HttpError(400, `Unknown job. Use one of: ${Object.keys(CONTENT_JOBS).join(", ")}`);
      const started = names.map((name) => {
        const body = name === "enrich-content" ? { mode: req.query.mode === "story" ? "story" : "editorial" } : {};
        const job = startJob(name, () => CONTENT_JOBS[name](body));
        return { name, job: job.id };
      });
      res.status(202).json({ started });
    }),
  );

  app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

  app.use(
    "/uploads",
    express.static(uploadRoot(), {
      maxAge: "30d",
      fallthrough: false,
      setHeaders: (res) => res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'"),
    }),
  );

  if (siteDir) {
    app.use(
      "/assets",
      express.static(path.join(siteDir, "assets"), { immutable: true, maxAge: "1y", fallthrough: false }),
    );
    app.use(express.static(siteDir, { maxAge: "1h", index: false }));
    // Every other page is handled by the React app.
    app.get(/.*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(siteDir, "index.html"));
    });
  }

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if ((err as { name?: string }).name === "MulterError") {
      res.status(400).json({ error: "That image is too large. Please keep uploads under 8 MB." });
      return;
    }
    const status = (err as { status?: number; statusCode?: number }).status || (err as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      res.status(status).json({ error: err instanceof Error ? err.message : "Bad request" });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong on our side. Please try again." });
  });

  return app;
}

async function main() {
  await migrate();
  await seedIfEmpty([path.join(here, "seed"), path.resolve(here, "../seed")].find((p) => existsSync(p)) || "");
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`AfriVogue listening on :${config.port}${siteDir ? "" : " (no built site found; API only)"}`);
  });
}

if (process.env.AFRIVOGUE_NO_LISTEN !== "1") {
  main().catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
}
