// Column metadata for every table, generated from the original schema
// (server/scripts/generate-schema.py). Used to convert values between MySQL and JSON.
import { randomUUID } from "node:crypto";
import registryJson from "./registry.json";

export type ColumnKind = "string" | "number" | "boolean" | "json" | "datetime" | "date";

export interface ColumnInfo {
  kind: ColumnKind;
  nullable: boolean;
  default?: unknown;
}

export interface TableInfo {
  primaryKey: string | null;
  uniques: string[][];
  columns: Record<string, ColumnInfo>;
}

export const registry = registryJson as unknown as Record<string, TableInfo>;

export function tableInfo(table: string): TableInfo | undefined {
  return Object.prototype.hasOwnProperty.call(registry, table) ? registry[table] : undefined;
}

/** MySQL DATETIME string (UTC) to ISO-8601, the format the site already expects. */
const toIso = (value: string) => (value.includes("T") ? value : value.replace(" ", "T") + "Z");

/** ISO-8601 (or Date) to a MySQL DATETIME(3) literal in UTC. */
export function toMysqlDatetime(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().replace("T", " ").replace("Z", "");
}

/** Converts a raw MySQL row into JSON-friendly values. */
export function decodeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const info = tableInfo(table);
  if (!info) return row;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const col = info.columns[key];
    if (!col || value === null || value === undefined) {
      out[key] = value ?? null;
      continue;
    }
    switch (col.kind) {
      case "boolean":
        out[key] = value === 1 || value === true || value === "1";
        break;
      case "json":
        if (typeof value === "string") {
          try {
            out[key] = JSON.parse(value);
          } catch {
            out[key] = value;
          }
        } else out[key] = value;
        break;
      case "number":
        out[key] = typeof value === "string" ? Number(value) : value;
        break;
      case "datetime":
        out[key] = toIso(String(value));
        break;
      default:
        out[key] = value;
    }
  }
  return out;
}

/** Converts one incoming value for storage. */
export function encodeValue(col: ColumnInfo, value: unknown): unknown {
  if (value === null || value === undefined) return null;
  switch (col.kind) {
    case "boolean":
      return value === true || value === "true" || value === 1 || value === "1" ? 1 : 0;
    case "json":
      return JSON.stringify(value);
    case "datetime":
      return toMysqlDatetime(value);
    case "number":
      return typeof value === "number" ? value : Number(value);
    default:
      return typeof value === "object" ? JSON.stringify(value) : value;
  }
}

/** Fills defaults that MySQL cannot express (UUIDs, JSON and TEXT defaults). */
export function withDefaults(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const info = tableInfo(table);
  if (!info) return row;
  const out = { ...row };
  for (const [name, col] of Object.entries(info.columns)) {
    if (out[name] !== undefined || col.default === undefined) continue;
    if (col.default === "uuid") out[name] = randomUUID();
    else if (col.default === "now") continue; // MySQL CURRENT_TIMESTAMP default handles it
    else out[name] = col.default;
  }
  return out;
}
