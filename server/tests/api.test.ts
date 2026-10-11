import { rmSync } from "node:fs";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/index";
import { migrate, pool } from "../src/db/pool";
import { unsubscribeUrl } from "../src/functions";

const app = createApp();

async function resetDb() {
  const [rows] = await pool.query("SHOW TABLES");
  await pool.query("SET FOREIGN_KEY_CHECKS = 0");
  for (const r of rows as Record<string, string>[]) await pool.query(`TRUNCATE TABLE \`${Object.values(r)[0]}\``);
  await pool.query("SET FOREIGN_KEY_CHECKS = 1");
}

/** Signs up and returns an agent that keeps the session cookie. */
async function member(email: string, name = "Ada") {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/signup").send({ email, password: "correct-horse", data: { display_name: name } });
  expect(res.status).toBe(201);
  return { agent, user: res.body.user as { id: string; email: string } };
}

const db = (agent: request.Agent | ReturnType<typeof request>, body: Record<string, unknown>) =>
  (agent as request.Agent).post("/api/db").send(body);

beforeAll(async () => {
  await migrate();
  await resetDb();
  rmSync("/tmp/afrivogue-test-uploads", { recursive: true, force: true });
});

afterAll(async () => {
  await pool.end();
});

describe("accounts", () => {
  it("signs up, creates a profile, keeps a session, signs out", async () => {
    const { agent, user } = await member("ada@example.com", "Ada Obi");
    const session = await agent.get("/api/auth/session");
    expect(session.body.user.email).toBe("ada@example.com");
    expect(session.body.isAdmin).toBe(false);

    const profile = await db(agent, { table: "profiles", action: "select", filters: [{ column: "id", op: "eq", value: user.id }] });
    expect(profile.body.data[0].display_name).toBe("Ada Obi");

    await agent.post("/api/auth/logout");
    expect((await agent.get("/api/auth/session")).body.user).toBeNull();
  });

  it("rejects duplicate emails, short passwords and wrong passwords", async () => {
    expect((await request(app).post("/api/auth/signup").send({ email: "ada@example.com", password: "whatever-123" })).status).toBe(409);
    expect((await request(app).post("/api/auth/signup").send({ email: "new@example.com", password: "short" })).status).toBe(400);
    expect((await request(app).post("/api/auth/login").send({ email: "ada@example.com", password: "nope-nope" })).status).toBe(400);
    expect((await request(app).post("/api/auth/login").send({ email: "ada@example.com", password: "correct-horse" })).status).toBe(200);
  });

  it("grants admin to ADMIN_EMAIL only after the email is confirmed", async () => {
    const { agent, user } = await member("editor@afrivogue.test", "Editor");
    expect((await agent.get("/api/auth/session")).body.isAdmin).toBe(false);

    // Simulate clicking the confirmation link from the welcome email.
    const { createHash, randomBytes } = await import("node:crypto");
    const token = randomBytes(16).toString("hex");
    await pool.query("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, 'confirm', DATE_ADD(NOW(), INTERVAL 1 DAY))", [
      createHash("sha256").update(token).digest("hex"),
      user.id,
    ]);
    const confirm = await agent.get(`/api/auth/confirm?token=${token}`);
    expect(confirm.status).toBe(302);
    expect((await agent.get("/api/auth/session")).body.isAdmin).toBe(true);
    // has_role works for yourself, never for someone else.
    expect((await agent.post("/api/rpc/has_role").send({ _user_id: user.id, _role: "admin" })).body.data).toBe(true);
    const { agent: other } = await member("other@example.com");
    expect((await other.post("/api/rpc/has_role").send({ _user_id: user.id, _role: "admin" })).body.data).toBe(false);
  });

  it("resets a password with a one-time token", async () => {
    const { user } = await member("reset@example.com");
    const { createHash, randomBytes } = await import("node:crypto");
    const token = randomBytes(16).toString("hex");
    await pool.query("INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES (?, ?, 'reset', DATE_ADD(NOW(), INTERVAL 1 HOUR))", [
      createHash("sha256").update(token).digest("hex"),
      user.id,
    ]);
    expect((await request(app).post("/api/auth/reset").send({ token, password: "brand-new-pass" })).status).toBe(200);
    expect((await request(app).post("/api/auth/reset").send({ token, password: "again-new-pass" })).status).toBe(400);
    expect((await request(app).post("/api/auth/login").send({ email: "reset@example.com", password: "brand-new-pass" })).status).toBe(200);
  });
});

describe("data permissions", () => {
  let admin: request.Agent;
  beforeAll(async () => {
    admin = request.agent(app);
    await admin.post("/api/auth/login").send({ email: "editor@afrivogue.test", password: "correct-horse" });
  });

  it("only shows published stories to readers, everything to admins", async () => {
    const insert = await db(admin, {
      table: "trends",
      action: "insert",
      returning: true,
      values: [
        { headline: "Lagos tailoring", cultural_significance: "x", category: "Fashion", urgency: "Emerging", geo_relevance: "Africa", content_tier: "Daily Brief", published: true },
        { headline: "Draft piece", cultural_significance: "x", category: "Beauty", urgency: "Emerging", geo_relevance: "Africa", content_tier: "Daily Brief" },
      ],
    });
    expect(insert.status).toBe(201);
    expect(insert.body.data).toHaveLength(2);
    // The second row left out "published" and got the column default (false), not NULL.
    expect(insert.body.data.map((r: { published: boolean }) => r.published).sort()).toEqual([false, true]);

    const reader = await db(request(app), { table: "trends", action: "select", select: "headline", order: [{ column: "headline" }] });
    expect(reader.body.data.map((r: { headline: string }) => r.headline)).toEqual(["Lagos tailoring"]);
    const all = await db(admin, { table: "trends", action: "select", select: "headline", count: "exact" });
    expect(all.body.count).toBe(2);

    expect((await db(request(app), { table: "trends", action: "insert", values: { headline: "Spam" } })).status).toBe(403);
  });

  it("supports or-groups, ilike, in, ranges and single-row reads", async () => {
    const res = await db(request(app), {
      table: "trends",
      action: "select",
      or: ["headline.ilike.*lagos*,category.eq.Nothing"],
      filters: [{ column: "category", op: "in", value: ["Fashion", "Beauty"] }],
      limit: 1,
    });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].headline).toBe("Lagos tailoring");
  });

  it("keeps people inside their own rows", async () => {
    const { agent: a, user: ua } = await member("a@example.com");
    const { agent: b } = await member("b@example.com");
    const [trend] = (await db(request(app), { table: "trends", action: "select", select: "id" })).body.data;

    expect((await db(a, { table: "saved_articles", action: "insert", values: { user_id: ua.id, trend_id: trend.id } })).status).toBe(201);
    // b cannot save on a's behalf, read a's saves, or delete them.
    expect((await db(b, { table: "saved_articles", action: "insert", values: { user_id: ua.id, trend_id: trend.id } })).status).toBe(403);
    expect((await db(b, { table: "saved_articles", action: "select" })).body.data).toHaveLength(0);
    await db(b, { table: "saved_articles", action: "delete", filters: [{ column: "user_id", op: "eq", value: ua.id }] });
    const mine = await db(a, { table: "saved_articles", action: "select", select: "*, trends(headline)" });
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].trends.headline).toBe("Lagos tailoring");
  });

  it("strips admin-only fields and blocks admin-only tables", async () => {
    const { agent, user } = await member("pitch@example.com");
    const res = await db(agent, {
      table: "article_submissions",
      action: "insert",
      returning: true,
      values: { user_id: user.id, title: "My pitch", content: "Body", category: "Culture", status: "approved", points_awarded: 999 },
    });
    expect(res.status).toBe(201);
    expect(res.body.data[0].status).not.toBe("approved");
    expect(res.body.data[0].points_awarded ?? 0).toBe(0);

    expect((await db(agent, { table: "user_roles", action: "insert", values: { user_id: user.id, role: "admin" } })).status).toBe(403);
    expect((await db(agent, { table: "contact_messages", action: "select" })).body.data).toHaveLength(0);
    expect((await db(agent, { table: "users", action: "select" })).status).toBe(404);
  });

  it("lets anyone join the newsletter but nobody list it", async () => {
    expect((await db(request(app), { table: "newsletter_subscribers", action: "insert", values: { email: "fan@example.com", source: "footer" } })).status).toBe(201);
    expect((await db(request(app), { table: "newsletter_subscribers", action: "insert", values: { email: "fan@example.com" } })).body.error.code).toBe("23505");
    expect((await db(request(app), { table: "newsletter_subscribers", action: "select" })).body.data).toHaveLength(0);
  });

  it("checks one discount code at a time but never lists them", async () => {
    await db(admin, { table: "discount_codes", action: "insert", values: { code: "WELCOME10", discount_type: "percentage", discount_value: 10, active: true } });
    expect((await db(request(app), { table: "discount_codes", action: "select" })).body.data).toHaveLength(0);
    const one = await db(request(app), { table: "discount_codes", action: "select", filters: [{ column: "code", op: "eq", value: "WELCOME10" }] });
    expect(one.body.data[0].discount_value).toBe(10);
  });

  it("rejects unknown columns instead of passing them to SQL", async () => {
    const res = await db(request(app), { table: "trends", action: "select", select: "headline, password_hash" });
    expect(res.status).toBe(400);
    const sneaky = await db(request(app), { table: "trends", action: "select", order: [{ column: "headline`; DROP TABLE trends; --" }] });
    expect(sneaky.status).toBe(400);
  });
});

describe("uploads", () => {
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");

  it("lets members add moodboard images but keeps shop images admin-only", async () => {
    expect((await request(app).post("/api/storage/trend-images").attach("file", png, { filename: "a.png", contentType: "image/png" })).status).toBe(401);
    const { agent } = await member("upload@example.com");
    const ok = await agent.post("/api/storage/trend-images").field("path", "moodboard/test.png").attach("file", png, { filename: "a.png", contentType: "image/png" });
    expect(ok.status).toBe(201);
    expect(ok.body.publicUrl).toContain("/uploads/trend-images/moodboard/test.png");
    expect((await request(app).get("/uploads/trend-images/moodboard/test.png")).status).toBe(200);

    expect((await agent.post("/api/storage/product-images").attach("file", png, { filename: "a.png", contentType: "image/png" })).status).toBe(403);
    expect((await agent.post("/api/storage/trend-images").field("path", "../escape.png").attach("file", png, { filename: "a.png", contentType: "image/png" })).status).toBe(400);
    expect((await agent.post("/api/storage/trend-images").attach("file", Buffer.from("<script>"), { filename: "x.html", contentType: "text/html" })).status).toBe(400);
  });
});

describe("functions", () => {
  it("stores contact messages for the admin inbox", async () => {
    const res = await request(app).post("/api/functions/contact").send({ name: "Kemi", email: "kemi@example.com", subject: "Collab", message: "Hello!" });
    expect(res.status).toBe(200);
    const [rows] = await pool.query("SELECT name, message FROM contact_messages");
    expect(rows).toEqual([{ name: "Kemi", message: "Hello!" }]);
  });

  it("unsubscribes with a signed link and refuses forged ones", async () => {
    const token = new URL(unsubscribeUrl("fan@example.com")).searchParams.get("token");
    expect((await request(app).post("/api/functions/handle-email-unsubscribe").send({ token, check: true })).body.valid).toBe(true);
    expect((await request(app).post("/api/functions/handle-email-unsubscribe").send({ token })).body.success).toBe(true);
    expect((await request(app).post("/api/functions/handle-email-unsubscribe").send({ token, check: true })).body.reason).toBe("already_unsubscribed");
    const forged = `${Buffer.from("victim@example.com").toString("base64url")}.abc`;
    expect((await request(app).post("/api/functions/handle-email-unsubscribe").send({ token: forged })).status).toBe(404);
  });

  it("keeps paid content jobs behind admin or cron", async () => {
    expect((await request(app).post("/api/functions/ingest-trends")).status).toBe(401);
    const { agent } = await member("notadmin@example.com");
    expect((await agent.post("/api/functions/enrich-content")).status).toBe(403);
    expect((await request(app).get("/api/cron?key=wrong&job=ingest-trivia")).status).toBe(401);
  });

  it("reports Style Concierge allowance by tier", async () => {
    const guest = await request(app).post("/api/functions/style-concierge-status");
    expect(guest.body).toMatchObject({ tier: "guest", allowance: 1, available: false });
    const { agent } = await member("style@example.com");
    expect((await agent.post("/api/functions/style-concierge-status")).body).toMatchObject({ tier: "collective", allowance: 5 });
    // Without an Anthropic key the concierge says it is resting rather than failing.
    expect((await agent.post("/api/functions/style-concierge").send({ occasion: "A wedding" })).status).toBe(503);
  });

  it("requires sign-in for checkout", async () => {
    expect((await request(app).post("/api/functions/create-checkout").send({ plan: "monthly" })).status).toBe(401);
  });
});
