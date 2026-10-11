// Who may read and write each table. Mirrors the original database row-level security,
// with a few holes closed (see `protect` and the notes below).

export type Op = "select" | "insert" | "update" | "delete";
export type Role = "anyone" | "user" | "admin";

export interface Rule {
  ops: Op[];
  role: Role;
  /** Row must belong to the caller: this column equals the signed-in user's id. */
  owner?: string;
  /** Row must have these exact column values (e.g. only published rows). */
  where?: Record<string, unknown>;
}

export interface TablePolicy {
  rules: Rule[];
  /** Columns only admins may set (stripped from non-admin inserts/updates). */
  protect?: string[];
  /** Non-admin selects must filter this column with an exact match. */
  requireEqFilter?: string;
}

const ALL: Op[] = ["select", "insert", "update", "delete"];
const adminAll: Rule = { ops: ALL, role: "admin" };
const publicRead: Rule = { ops: ["select"], role: "anyone" };
const ownAll = (owner = "user_id"): Rule => ({ ops: ALL, role: "user", owner });

export const POLICIES: Record<string, TablePolicy> = {
  // ── Public editorial content ──
  trends: { rules: [{ ops: ["select"], role: "anyone", where: { published: true } }, adminAll] },
  forecasts: { rules: [{ ops: ["select"], role: "anyone", where: { published: true } }, adminAll] },
  trivia_questions: { rules: [{ ops: ["select"], role: "anyone", where: { published: true } }, adminAll] },
  categories: { rules: [publicRead, adminAll] },
  site_settings: { rules: [publicRead, adminAll] },
  moodboard_items: {
    rules: [
      { ops: ["select"], role: "anyone", where: { approved: true } },
      { ops: ["select", "insert"], role: "user", owner: "submitted_by" },
      adminAll,
    ],
    // Submissions start unapproved; only admins approve.
    protect: ["approved", "needs_review"],
  },

  // ── Shop ──
  products: { rules: [{ ops: ["select"], role: "anyone", where: { published: true } }, adminAll] },
  product_bundles: { rules: [{ ops: ["select"], role: "anyone", where: { published: true } }, adminAll] },
  bundle_items: { rules: [publicRead, adminAll] },
  cross_sell_rules: { rules: [publicRead, adminAll] },
  // Codes can be checked one at a time, but never listed.
  discount_codes: {
    rules: [{ ops: ["select"], role: "anyone", where: { active: true } }, adminAll],
    requireEqFilter: "code",
  },
  product_reviews: { rules: [publicRead, ownAll(), adminAll] },
  cart_items: { rules: [ownAll(), adminAll] },
  wishlists: { rules: [ownAll(), adminAll] },
  // Orders are created by the checkout on the server, never directly by shoppers.
  orders: { rules: [{ ops: ["select"], role: "user", owner: "user_id" }, adminAll] },

  // ── Community ──
  profiles: { rules: [publicRead, { ops: ["insert", "update"], role: "user", owner: "id" }, adminAll] },
  comments: { rules: [publicRead, ownAll(), adminAll] },
  favorite_authors: { rules: [publicRead, ownAll(), adminAll] },
  trivia_scores: { rules: [publicRead, { ops: ["insert"], role: "user", owner: "user_id" }, adminAll] },
  article_submissions: { rules: [ownAll(), adminAll], protect: ["status", "admin_notes", "points_awarded"] },
  saved_articles: { rules: [ownAll(), adminAll] },
  saved_moodboard_items: { rules: [ownAll(), adminAll] },
  reading_history: { rules: [ownAll(), adminAll] },
  user_preferences: { rules: [ownAll(), adminAll] },
  newsletter_subscribers: { rules: [{ ops: ["insert"], role: "anyone" }, adminAll] },

  // ── Points, referrals, payouts ──
  user_points: { rules: [{ ops: ["select"], role: "user", owner: "user_id" }, adminAll] },
  points_history: { rules: [{ ops: ["select"], role: "user", owner: "user_id" }, adminAll] },
  referrals: { rules: [{ ops: ["select"], role: "user", owner: "referrer_id" }, adminAll] },
  withdrawals: {
    rules: [{ ops: ["select", "insert"], role: "user", owner: "user_id" }, adminAll],
    protect: ["status", "processed_at"],
  },

  // ── Admin only ──
  user_roles: { rules: [adminAll] },
  customer_segments: { rules: [adminAll] },
  segment_members: { rules: [adminAll] },
  crm_email_log: { rules: [adminAll] },
  contact_messages: { rules: [adminAll] },
};

export interface Principal {
  userId: string | null;
  isAdmin: boolean;
}

/** Rules that apply to this caller for this operation. */
export function applicableRules(table: string, op: Op, who: Principal): Rule[] {
  const policy = POLICIES[table];
  if (!policy) return [];
  return policy.rules.filter((r) => {
    if (!r.ops.includes(op)) return false;
    if (r.role === "admin") return who.isAdmin;
    if (r.role === "user") return !!who.userId;
    return true;
  });
}
