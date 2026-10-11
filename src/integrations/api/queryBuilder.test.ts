import { describe, expect, it } from "vitest";
import type { DbRequest, DbResult } from "./protocol";
import { QueryBuilder } from "./queryBuilder";

const capture = (rows: Record<string, unknown>[] = []) => {
  const seen: DbRequest[] = [];
  const transport = async (req: DbRequest): Promise<DbResult> => {
    seen.push(structuredClone(req));
    return { status: 200, data: rows, count: rows.length };
  };
  return { seen, from: (t: string) => new QueryBuilder(transport, t) };
};

describe("QueryBuilder", () => {
  it("describes a filtered, ordered, paged select", async () => {
    const { seen, from } = capture();
    await from("trends").select("id, headline", { count: "exact" }).eq("published", true).in("category", ["Fashion"]).order("created_at", { ascending: false }).range(10, 19);
    expect(seen[0]).toMatchObject({
      table: "trends",
      action: "select",
      select: "id, headline",
      count: "exact",
      filters: [
        { column: "published", op: "eq", value: true },
        { column: "category", op: "in", value: ["Fashion"] },
      ],
      order: [{ column: "created_at", ascending: false }],
      offset: 10,
      limit: 10,
    });
  });

  it("marks writes followed by select() as returning", async () => {
    const { seen, from } = capture([{ id: "1" }]);
    const { data } = await from("comments").insert({ body: "hi" }).select().single();
    expect(seen[0]).toMatchObject({ action: "insert", returning: true, values: { body: "hi" } });
    expect(data).toEqual({ id: "1" });
  });

  it("supports not(), or() and match()", async () => {
    const { seen, from } = capture();
    await from("trends").select("*").not("original_source_content", "is", null).or("a.eq.1,b.eq.2").match({ category: "Beauty" });
    expect(seen[0].filters).toEqual([
      { column: "original_source_content", op: "is", value: null, negate: true },
      { column: "category", op: "eq", value: "Beauty" },
    ]);
    expect(seen[0].or).toEqual(["a.eq.1,b.eq.2"]);
  });

  it("returns an error from single() when there is no row, and null from maybeSingle()", async () => {
    const { from } = capture([]);
    expect((await from("profiles").select("*").single()).error?.code).toBe("PGRST116");
    const maybe = await from("profiles").select("*").maybeSingle();
    expect(maybe.error).toBeNull();
    expect(maybe.data).toBeNull();
  });
});
