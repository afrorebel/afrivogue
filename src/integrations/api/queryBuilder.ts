// A small chainable query builder:
//   api.from("trends").select("*").eq("published", true).order("created_at", { ascending: false }).limit(10)
// It only describes the query; a transport sends it to the server (or, on the server, runs it directly).
import type { DbError, DbRequest, DbResult, Filter, Row } from "./protocol";

export type Transport = (req: DbRequest) => Promise<DbResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface QueryResult<T = any> {
  data: T;
  error: DbError | null;
  count: number | null;
  status: number;
}

type Mode = "many" | "single" | "maybeSingle";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRow = Record<string, any>;

/** R is the row type; T is what `data` resolves to (R[] by default, R after .single()). */
export class QueryBuilder<R = AnyRow, T = R[]> implements PromiseLike<QueryResult<T>> {
  private req: DbRequest;
  private mode: Mode = "many";

  constructor(
    private transport: Transport,
    table: string,
  ) {
    this.req = { table, action: "select", filters: [] };
  }

  /* ── what to do ── */

  select(columns = "*", options: { count?: "exact" | "planned" | "estimated" | null; head?: boolean } = {}) {
    if (this.req.action === "select") {
      this.req.select = columns;
      if (options.count) this.req.count = "exact";
      if (options.head) this.req.head = true;
    } else {
      // insert(...).select() returns the written rows
      this.req.returning = true;
      this.req.select = columns;
    }
    return this;
  }

  insert(values: AnyRow | AnyRow[]) {
    this.req.action = "insert";
    this.req.values = values as Row | Row[];
    return this;
  }

  upsert(values: AnyRow | AnyRow[], options: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.req.action = "upsert";
    this.req.values = values as Row | Row[];
    this.req.onConflict = options.onConflict;
    this.req.ignoreDuplicates = options.ignoreDuplicates;
    return this;
  }

  update(values: AnyRow) {
    this.req.action = "update";
    this.req.values = values as Row;
    return this;
  }

  delete() {
    this.req.action = "delete";
    return this;
  }

  /* ── filters ── */

  private add(column: string, op: string, value: unknown, negate = false) {
    (this.req.filters as Filter[]).push({ column, op, value, ...(negate ? { negate } : {}) });
    return this;
  }

  eq(column: string, value: unknown) { return this.add(column, "eq", value); }
  neq(column: string, value: unknown) { return this.add(column, "neq", value); }
  gt(column: string, value: unknown) { return this.add(column, "gt", value); }
  gte(column: string, value: unknown) { return this.add(column, "gte", value); }
  lt(column: string, value: unknown) { return this.add(column, "lt", value); }
  lte(column: string, value: unknown) { return this.add(column, "lte", value); }
  like(column: string, pattern: string) { return this.add(column, "like", pattern); }
  ilike(column: string, pattern: string) { return this.add(column, "ilike", pattern); }
  is(column: string, value: boolean | null) { return this.add(column, "is", value); }
  in(column: string, values: readonly unknown[]) { return this.add(column, "in", [...values]); }
  contains(column: string, value: unknown) { return this.add(column, "cs", value); }
  overlaps(column: string, value: unknown) { return this.add(column, "ov", value); }
  not(column: string, op: string, value: unknown) { return this.add(column, op, value, true); }
  filter(column: string, op: string, value: unknown) { return this.add(column, op, value); }

  match(values: AnyRow) {
    for (const [column, value] of Object.entries(values)) this.eq(column, value);
    return this;
  }

  or(group: string) {
    (this.req.or ||= []).push(group);
    return this;
  }

  /* ── shaping ── */

  order(column: string, options: { ascending?: boolean; nullsFirst?: boolean } = {}) {
    (this.req.order ||= []).push({ column, ascending: options.ascending, nullsFirst: options.nullsFirst });
    return this;
  }

  limit(n: number) {
    this.req.limit = n;
    return this;
  }

  range(from: number, to: number) {
    this.req.offset = from;
    this.req.limit = to - from + 1;
    return this;
  }

  single(): QueryBuilder<R, R> {
    this.mode = "single";
    return this as unknown as QueryBuilder<R, R>;
  }

  maybeSingle(): QueryBuilder<R, R | null> {
    this.mode = "maybeSingle";
    return this as unknown as QueryBuilder<R, R | null>;
  }

  /** The request this builder describes (used by tests and the preview). */
  toRequest(): DbRequest {
    return this.req;
  }

  /* ── run ── */

  private async execute(): Promise<QueryResult<T>> {
    let res: DbResult;
    try {
      res = await this.transport(this.req);
    } catch (err) {
      return { data: null as T, error: { message: err instanceof Error ? err.message : "Network error", code: "NETWORK" }, count: null, status: 0 };
    }
    const count = res.count ?? null;
    if (res.error) return { data: null as T, error: res.error, count, status: res.status };
    if (this.mode === "many") return { data: res.data as T, error: null, count, status: res.status };

    const rows = res.data || [];
    if (rows.length > 1 || (this.mode === "single" && rows.length === 0)) {
      return {
        data: null as T,
        error: { message: `Expected one row, found ${rows.length}`, code: "PGRST116" },
        count,
        status: 406,
      };
    }
    return { data: (rows[0] ?? null) as T, error: null, count, status: res.status };
  }

  then<R1 = QueryResult<T>, R2 = never>(
    onfulfilled?: ((value: QueryResult<T>) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.execute().then(onfulfilled, onrejected);
  }
}
