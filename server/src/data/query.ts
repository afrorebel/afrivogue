// Generic, policy-enforced data access. The browser sends a description of the query
// (built by src/integrations/api/queryBuilder.ts); this turns it into parameterized SQL.
// Identifiers are only ever taken from the generated registry, values are always bound.
import { pool } from "../db/pool";
import { decodeRow, encodeValue, tableInfo, withDefaults, type ColumnInfo, type TableInfo } from "../db/registry";
import { applicableRules, POLICIES, type Op, type Principal } from "./policies";
import type { DbRequest, DbResult, Filter, Row } from "../../../src/integrations/api/protocol";

export type { DbRequest, DbResult };

export class DbRequestError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

const ident = (name: string) => "`" + name.replace(/`/g, "") + "`";

function requireTable(table: string): TableInfo {
  const info = tableInfo(table);
  if (!info || !POLICIES[table]) throw new DbRequestError(404, "42P01", `Unknown table "${table}"`);
  return info;
}

function requireColumn(info: TableInfo, table: string, column: string): ColumnInfo {
  const col = info.columns[column];
  if (!col) throw new DbRequestError(400, "42703", `Unknown column "${column}" on "${table}"`);
  return col;
}

/* ───────────── select-string parsing ───────────── */

interface Embed {
  key: string; // property name on the result
  table: string; // embedded table
  fk: string; // column on the base row holding the embedded row's id
  select: string;
}

function splitTopLevel(input: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

/** "products" -> "product_id", "trends" -> "trend_id", "profiles" -> "profile_id" */
const singularFk = (table: string) => table.replace(/ies$/, "y").replace(/s$/, "") + "_id";

function parseSelect(table: string, info: TableInfo, select = "*") {
  const columns = new Set<string>();
  const embeds: Embed[] = [];
  let all = false;
  for (const item of splitTopLevel(select)) {
    if (item === "*") {
      all = true;
      continue;
    }
    const embed = item.match(/^(?:(\w+):)?(\w+)(?:!(\w+))?\((.*)\)$/s);
    if (embed) {
      const [, alias, target, hint, inner] = embed;
      if (alias && info.columns[target]) {
        // profiles:user_id(display_name) -> join profiles on base.user_id
        embeds.push({ key: alias, table: alias, fk: target, select: inner });
      } else {
        // source:products!cross_sell_rules_source_product_id_fkey(name) -> join on base.source_product_id
        const hinted = hint?.match(new RegExp(`^${table}_(\\w+)_fkey$`))?.[1];
        // product:products(*) or trends(headline) -> join on base.product_id / base.trend_id;
        // profiles(...) joins on the row's author (user_id).
        let fk = hinted && info.columns[hinted] ? hinted : singularFk(target);
        if (!info.columns[fk] && target === "profiles" && info.columns.user_id) fk = "user_id";
        embeds.push({ key: alias || target, table: target, fk, select: inner });
      }
      continue;
    }
    const plain = item.match(/^(?:(\w+):)?(\w+)$/);
    if (!plain) throw new DbRequestError(400, "PGRST100", `Unsupported select item "${item}"`);
    requireColumn(info, table, plain[2]);
    columns.add(plain[2]);
  }
  for (const e of embeds) {
    requireColumn(info, table, e.fk);
    if (!all) columns.add(e.fk);
  }
  const list = all ? Object.keys(info.columns) : [...columns];
  return { columns: list.length ? list : Object.keys(info.columns), embeds };
}

/* ───────────── conditions ───────────── */

interface Sql {
  text: string;
  params: unknown[];
}

const TRUE: Sql = { text: "1=1", params: [] };
const FALSE: Sql = { text: "1=0", params: [] };

function listValues(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const s = String(value ?? "").replace(/^[({]|[)}]$/g, "");
  return s ? s.split(",").map((v) => v.trim().replace(/^"|"$/g, "")) : [];
}

function condition(info: TableInfo, table: string, f: Filter): Sql {
  const col = requireColumn(info, table, f.column);
  const c = ident(f.column);
  let sql: Sql;
  switch (f.op) {
    case "eq":
      sql = f.value === null ? { text: `${c} IS NULL`, params: [] } : { text: `${c} = ?`, params: [encodeValue(col, f.value)] };
      break;
    case "neq":
      sql = { text: `${c} <> ?`, params: [encodeValue(col, f.value)] };
      break;
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const sym = { gt: ">", gte: ">=", lt: "<", lte: "<=" }[f.op];
      sql = { text: `${c} ${sym} ?`, params: [encodeValue(col, f.value)] };
      break;
    }
    case "like":
      sql = { text: `${c} LIKE ?`, params: [String(f.value).replace(/\*/g, "%")] };
      break;
    case "ilike":
      sql = { text: `LOWER(${c}) LIKE LOWER(?)`, params: [String(f.value).replace(/\*/g, "%")] };
      break;
    case "is":
      if (f.value === null || f.value === "null") sql = { text: `${c} IS NULL`, params: [] };
      else sql = { text: `${c} = ?`, params: [f.value === true || f.value === "true" ? 1 : 0] };
      break;
    case "in": {
      const values = listValues(f.value);
      sql = values.length
        ? { text: `${c} IN (${values.map(() => "?").join(",")})`, params: values.map((v) => encodeValue(col, v)) }
        : FALSE;
      break;
    }
    case "cs": // JSON array/object contains
    case "contains":
      sql = { text: `JSON_CONTAINS(${c}, ?)`, params: [JSON.stringify(Array.isArray(f.value) || typeof f.value === "object" ? f.value : listValues(f.value))] };
      break;
    case "ov":
    case "overlaps": {
      const values = listValues(f.value);
      sql = values.length
        ? { text: "(" + values.map(() => `JSON_CONTAINS(${c}, ?)`).join(" OR ") + ")", params: values.map((v) => JSON.stringify(v)) }
        : FALSE;
      break;
    }
    default:
      throw new DbRequestError(400, "PGRST100", `Unsupported filter "${f.op}"`);
  }
  return f.negate ? { text: `NOT (${sql.text})`, params: sql.params } : sql;
}

/** Parses "a.eq.1,b.is.null,not.c.eq.2" into one OR'ed condition. */
function orCondition(info: TableInfo, table: string, group: string): Sql {
  const parts = splitTopLevel(group.replace(/^\(|\)$/g, "")).map((p) => {
    let negate = false;
    let rest = p;
    const nested = rest.match(/^(not\.)?(and|or)\((.*)\)$/);
    if (nested) {
      const inner = splitTopLevel(nested[3]).map((x) => orCondition(info, table, x));
      const joined = { text: "(" + inner.map((s) => s.text).join(nested[2] === "and" ? " AND " : " OR ") + ")", params: inner.flatMap((s) => s.params) };
      return nested[1] ? { text: `NOT ${joined.text}`, params: joined.params } : joined;
    }
    const [column, ...more] = rest.split(".");
    rest = more.join(".");
    if (rest.startsWith("not.")) {
      negate = true;
      rest = rest.slice(4);
    }
    const dot = rest.indexOf(".");
    const op = dot === -1 ? rest : rest.slice(0, dot);
    const value = dot === -1 ? "" : rest.slice(dot + 1);
    return condition(info, table, { column, op, value: op === "in" ? listValues(value) : value, negate });
  });
  return { text: "(" + parts.map((p) => p.text).join(" OR ") + ")", params: parts.flatMap((p) => p.params) };
}

/** Rows this caller may see/change for `op`, as SQL. */
function policyCondition(info: TableInfo, table: string, op: Op, who: Principal): Sql {
  const rules = applicableRules(table, op, who);
  if (!rules.length) return FALSE;
  const parts: Sql[] = [];
  for (const rule of rules) {
    const conds: Sql[] = [];
    if (rule.owner) conds.push({ text: `${ident(rule.owner)} = ?`, params: [who.userId] });
    for (const [col, value] of Object.entries(rule.where || {})) {
      conds.push({ text: `${ident(col)} = ?`, params: [encodeValue(requireColumn(info, table, col), value)] });
    }
    if (!conds.length) return TRUE; // unrestricted rule
    parts.push({ text: conds.map((c) => c.text).join(" AND "), params: conds.flatMap((c) => c.params) });
  }
  return { text: "(" + parts.map((p) => `(${p.text})`).join(" OR ") + ")", params: parts.flatMap((p) => p.params) };
}

function whereClause(req: DbRequest, info: TableInfo, op: Op, who: Principal): Sql {
  const parts: Sql[] = [policyCondition(info, req.table, op, who)];
  for (const f of req.filters || []) parts.push(condition(info, req.table, f));
  for (const g of req.or || []) parts.push(orCondition(info, req.table, g));
  return { text: parts.map((p) => p.text).join(" AND "), params: parts.flatMap((p) => p.params) };
}

/* ───────────── select ───────────── */

async function attachEmbeds(rows: Row[], embeds: Embed[], who: Principal) {
  for (const embed of embeds) {
    const info = tableInfo(embed.table);
    if (!info || !POLICIES[embed.table]) throw new DbRequestError(400, "PGRST200", `Unknown relation "${embed.table}"`);
    const ids = [...new Set(rows.map((r) => r[embed.fk]).filter((v) => v !== null && v !== undefined))];
    const byId = new Map<unknown, Row>();
    if (ids.length) {
      const pk = info.primaryKey || "id";
      const { columns } = parseSelect(embed.table, info, embed.select);
      const cols = [...new Set([...columns, pk])];
      const policy = policyCondition(info, embed.table, "select", who);
      const [found] = await pool.query(
        `SELECT ${cols.map(ident).join(", ")} FROM ${ident(embed.table)} WHERE ${ident(pk)} IN (${ids.map(() => "?").join(",")}) AND ${policy.text}`,
        [...ids, ...policy.params],
      );
      for (const r of found as Row[]) {
        const decoded = decodeRow(embed.table, r);
        byId.set(r[pk], Object.fromEntries(Object.entries(decoded).filter(([k]) => columns.includes(k))));
      }
    }
    for (const row of rows) row[embed.key] = byId.get(row[embed.fk]) ?? null;
  }
}

async function runSelect(req: DbRequest, info: TableInfo, who: Principal): Promise<DbResult> {
  const policy = POLICIES[req.table];
  if (policy.requireEqFilter && !who.isAdmin) {
    const ok = (req.filters || []).some((f) => f.column === policy.requireEqFilter && f.op === "eq" && !f.negate);
    if (!ok) return { status: 200, data: [], count: 0 };
  }
  const { columns, embeds } = parseSelect(req.table, info, req.select);
  const where = whereClause(req, info, "select", who);

  let count: number | null = null;
  if (req.count === "exact") {
    const [rows] = await pool.query(`SELECT COUNT(*) AS n FROM ${ident(req.table)} WHERE ${where.text}`, where.params);
    count = Number((rows as Row[])[0].n);
  }
  if (req.head) return { status: 200, data: null, count };

  let sql = `SELECT ${columns.map(ident).join(", ")} FROM ${ident(req.table)} WHERE ${where.text}`;
  const order = (req.order || []).map((o) => {
    requireColumn(info, req.table, o.column);
    const dir = o.ascending === false ? "DESC" : "ASC";
    // MySQL sorts NULLs first ascending; mirror PostgREST defaults (nulls last asc, first desc) unless told.
    const nullsFirst = o.nullsFirst ?? o.ascending === false;
    return `(${ident(o.column)} IS NULL) ${nullsFirst ? "DESC" : "ASC"}, ${ident(o.column)} ${dir}`;
  });
  if (order.length) sql += ` ORDER BY ${order.join(", ")}`;
  const limit = req.limit !== undefined ? Math.max(0, Math.min(Number(req.limit), 5000)) : 5000;
  sql += ` LIMIT ${limit}`;
  if (req.offset) sql += ` OFFSET ${Math.max(0, Number(req.offset))}`;

  const [raw] = await pool.query(sql, where.params);
  const rows = (raw as Row[]).map((r) => decodeRow(req.table, r));
  if (embeds.length) await attachEmbeds(rows, embeds, who);
  return { status: 200, data: rows, count };
}

/* ───────────── writes ───────────── */

function cleanValues(req: DbRequest, info: TableInfo, values: Row, who: Principal): Row {
  const protect = !who.isAdmin ? POLICIES[req.table].protect || [] : [];
  const out: Row = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    requireColumn(info, req.table, key);
    if (protect.includes(key)) continue;
    out[key] = value;
  }
  return out;
}

/** True when some insert/update rule admits this row for the caller. */
function rowAllowed(table: string, op: Op, row: Row, who: Principal): boolean {
  return applicableRules(table, op, who).some((rule) => {
    if (rule.owner && row[rule.owner] !== who.userId) return false;
    for (const [col, value] of Object.entries(rule.where || {})) if (row[col] !== value) return false;
    return true;
  });
}

async function fetchByKeys(table: string, info: TableInfo, keys: unknown[], select: string | undefined, who: Principal) {
  if (!keys.length) return [];
  const pk = info.primaryKey!;
  return (
    await runSelect(
      { table, action: "select", select, filters: [{ column: pk, op: "in", value: keys }] },
      info,
      // Return what was just written even if a read rule would hide it (e.g. an unapproved submission).
      { ...who, isAdmin: true },
    )
  ).data;
}

async function runInsert(req: DbRequest, info: TableInfo, who: Principal): Promise<DbResult> {
  const input = Array.isArray(req.values) ? req.values : [req.values || {}];
  if (!input.length) return { status: 201, data: [] };
  const upsert = req.action === "upsert";
  for (const c of req.onConflict ? req.onConflict.split(",").map((s) => s.trim()) : []) requireColumn(info, req.table, c);
  const rows = input.map((v) => withDefaults(req.table, cleanValues(req, info, v, who)));
  for (const row of rows) {
    if (!rowAllowed(req.table, "insert", row, who) || (upsert && !rowAllowed(req.table, "update", row, who))) {
      throw new DbRequestError(403, "42501", `Not allowed to write to "${req.table}"`);
    }
  }
  const columns = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  // A row that leaves out a column gets that column's DEFAULT (not NULL) in a multi-row insert.
  const placeholders = rows.map((r) => `(${columns.map((c) => (r[c] === undefined ? "DEFAULT" : "?")).join(",")})`).join(",");
  const params = rows.flatMap((r) => columns.filter((c) => r[c] !== undefined).map((c) => encodeValue(info.columns[c], r[c])));
  let sql = `INSERT ${upsert && req.ignoreDuplicates ? "IGNORE " : ""}INTO ${ident(req.table)} (${columns.map(ident).join(",")}) VALUES ${placeholders}`;
  if (upsert && !req.ignoreDuplicates) {
    const keyCols = new Set([info.primaryKey, ...(req.onConflict ? req.onConflict.split(",").map((s) => s.trim()) : [])]);
    const updatable = columns.filter((c) => !keyCols.has(c));
    const set = updatable.length ? updatable.map((c) => `${ident(c)} = VALUES(${ident(c)})`) : [`${ident(columns[0])} = ${ident(columns[0])}`];
    sql += ` ON DUPLICATE KEY UPDATE ${set.join(", ")}`;
  }
  await pool.query(sql, params);

  if (!req.returning) return { status: 201, data: null };
  const pk = info.primaryKey!;
  let keys: unknown[] = rows.map((r) => r[pk]).filter((v) => v !== undefined);
  if (upsert && req.onConflict && keys.length < rows.length) {
    // Upserts matched on another unique key: look the rows up by that key.
    const conflictCols = req.onConflict.split(",").map((s) => s.trim());
    const found: unknown[] = [];
    for (const r of rows) {
      const where = conflictCols.map((c) => `${ident(c)} = ?`).join(" AND ");
      const [hit] = await pool.query(`SELECT ${ident(pk)} AS k FROM ${ident(req.table)} WHERE ${where} LIMIT 1`, conflictCols.map((c) => encodeValue(info.columns[c], r[c])));
      if ((hit as Row[])[0]) found.push((hit as Row[])[0].k);
    }
    keys = found;
  }
  return { status: 201, data: await fetchByKeys(req.table, info, keys, req.select, who) };
}

async function matchingKeys(req: DbRequest, info: TableInfo, op: Op, who: Principal): Promise<unknown[]> {
  if (!info.primaryKey) throw new DbRequestError(400, "PGRST100", `"${req.table}" has no primary key`);
  if (!(req.filters?.length || req.or?.length)) throw new DbRequestError(400, "21000", `${op} requires a filter`);
  const where = whereClause(req, info, op, who);
  const [rows] = await pool.query(`SELECT ${ident(info.primaryKey)} AS k FROM ${ident(req.table)} WHERE ${where.text}`, where.params);
  return (rows as Row[]).map((r) => r.k);
}

async function runUpdate(req: DbRequest, info: TableInfo, who: Principal): Promise<DbResult> {
  const values = cleanValues(req, info, (req.values as Row) || {}, who);
  if (!Object.keys(values).length) return { status: 200, data: req.returning ? [] : null };
  // Owners cannot hand a row to someone else.
  for (const rule of applicableRules(req.table, "update", who)) {
    if (rule.owner && values[rule.owner] !== undefined && values[rule.owner] !== who.userId && !who.isAdmin) {
      throw new DbRequestError(403, "42501", `Not allowed to change "${rule.owner}"`);
    }
  }
  const keys = await matchingKeys(req, info, "update", who);
  if (keys.length) {
    const set = Object.keys(values).map((c) => `${ident(c)} = ?`).join(", ");
    await pool.query(`UPDATE ${ident(req.table)} SET ${set} WHERE ${ident(info.primaryKey!)} IN (${keys.map(() => "?").join(",")})`, [
      ...Object.entries(values).map(([c, v]) => encodeValue(info.columns[c], v)),
      ...keys,
    ]);
  }
  return { status: 200, data: req.returning ? await fetchByKeys(req.table, info, keys, req.select, who) : null };
}

async function runDelete(req: DbRequest, info: TableInfo, who: Principal): Promise<DbResult> {
  const keys = await matchingKeys(req, info, "delete", who);
  const before = req.returning ? await fetchByKeys(req.table, info, keys, req.select, who) : null;
  if (keys.length) {
    await pool.query(`DELETE FROM ${ident(req.table)} WHERE ${ident(info.primaryKey!)} IN (${keys.map(() => "?").join(",")})`, keys);
  }
  return { status: 200, data: before };
}

/* ───────────── entry point ───────────── */

export async function runDbRequest(req: DbRequest, who: Principal): Promise<DbResult> {
  try {
    const info = requireTable(req.table);
    switch (req.action) {
      case "select":
        return await runSelect(req, info, who);
      case "insert":
      case "upsert":
        return await runInsert(req, info, who);
      case "update":
        return await runUpdate(req, info, who);
      case "delete":
        return await runDelete(req, info, who);
      default:
        throw new DbRequestError(400, "PGRST100", "Unknown action");
    }
  } catch (err) {
    if (err instanceof DbRequestError) return { status: err.status, data: null, error: { message: err.message, code: err.code } };
    const e = err as { code?: string; sqlMessage?: string; message?: string };
    if (e.code === "ER_DUP_ENTRY") return { status: 409, data: null, error: { message: "Already exists", code: "23505", details: e.sqlMessage } };
    if (e.code === "ER_NO_REFERENCED_ROW_2" || e.code === "ER_ROW_IS_REFERENCED_2") {
      return { status: 409, data: null, error: { message: "Related record problem", code: "23503", details: e.sqlMessage } };
    }
    if (e.code === "ER_BAD_NULL_ERROR" || e.code === "ER_NO_DEFAULT_FOR_FIELD") {
      return { status: 400, data: null, error: { message: e.sqlMessage || "Missing required value", code: "23502" } };
    }
    console.error("db error", err);
    return { status: 500, data: null, error: { message: "Database error", code: "XX000" } };
  }
}
