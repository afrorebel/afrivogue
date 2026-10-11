// The wire format between the site and its server. The browser describes a query
// (table, filters, order...) and the server runs it with the caller's permissions.

export type Row = Record<string, unknown>;

export interface Filter {
  column: string;
  op: string;
  value: unknown;
  negate?: boolean;
}

export interface OrderSpec {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
}

export interface DbRequest {
  table: string;
  action: "select" | "insert" | "update" | "upsert" | "delete";
  select?: string;
  filters?: Filter[];
  /** Or-groups in the familiar "column.op.value,column.op.value" form. */
  or?: string[];
  order?: OrderSpec[];
  limit?: number;
  offset?: number;
  count?: "exact" | null;
  head?: boolean;
  values?: Row | Row[];
  onConflict?: string;
  ignoreDuplicates?: boolean;
  /** For writes: return the affected rows (the caller chained .select()). */
  returning?: boolean;
}

export interface DbError {
  message: string;
  code: string;
  details?: string | null;
  hint?: string | null;
}

export interface DbResult {
  status: number;
  data: Row[] | null;
  count?: number | null;
  error?: DbError;
}
