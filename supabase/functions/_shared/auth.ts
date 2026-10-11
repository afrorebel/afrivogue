// Guards the paid content functions (they spend Anthropic and Firecrawl credit).
// Allowed callers:
//   1. Scheduled jobs sending the `x-cron-secret` header that matches the CRON_SECRET secret
//   2. Server-side callers using the service-role key
//   3. A signed-in user who holds the `admin` role
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export class UnauthorizedError extends Error {}

export async function requireAdminOrCron(req: Request): Promise<void> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && req.headers.get("x-cron-secret") === cronSecret) return;

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new UnauthorizedError("Sign in as an admin to run this.");

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return;

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey!);
  const { data: userData, error } = await supabase.auth.getUser(token);
  if (error || !userData?.user) throw new UnauthorizedError("Sign in as an admin to run this.");

  const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
  if (!isAdmin) throw new UnauthorizedError("Only admins can run content generation.");
}
