// Full-access database client for server code (content pipelines, checkout, webhooks).
// Same chainable API the site uses: db.from("trends").select("*").eq("published", true)
import { QueryBuilder } from "../../../src/integrations/api/queryBuilder";
import type { Principal } from "./policies";
import { runDbRequest } from "./query";

const SYSTEM: Principal = { userId: null, isAdmin: true };

export const db = {
  from: (table: string) => new QueryBuilder((req) => runDbRequest(req, SYSTEM), table),
};
