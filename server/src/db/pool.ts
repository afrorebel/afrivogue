import mysql from "mysql2/promise";
import { config } from "../config";
import schemaSql from "./schema.sql";

export const pool = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
  charset: "utf8mb4",
  // Return DATETIME as strings ("2026-10-11 09:30:00.000") so we control the conversion.
  dateStrings: true,
  timezone: "Z",
  supportBigNumbers: true,
  bigNumberStrings: false,
});

export type Row = Record<string, unknown>;

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [rows] = await pool.query(sql, params);
  return rows as T[];
}

export async function execute(sql: string, params: unknown[] = []) {
  const [result] = await pool.query(sql, params);
  return result as mysql.ResultSetHeader;
}

/** Creates any missing tables. Safe to run on every start: every statement is IF NOT EXISTS. */
export async function migrate() {
  await pool.query("SET time_zone = '+00:00'");
  const statements = schemaSql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--") && !/^SET NAMES/i.test(s));
  for (const statement of statements) {
    await pool.query(statement.replace(/^--.*$/gm, "").trim());
  }
}
