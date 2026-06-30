/**
 * Read helpers for the deletion_guides table.
 */
import { asc, eq, ilike, sql } from "drizzle-orm";
import { getDb } from "./index.ts";
import { deletionGuides } from "./schema.ts";

export async function listGuides(opts: {
  search?: string;
  difficulty?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const db = getDb();
  const conditions = [];
  if (opts.search) conditions.push(ilike(deletionGuides.serviceName, `%${opts.search}%`));
  if (opts.difficulty) conditions.push(eq(deletionGuides.difficulty, opts.difficulty as any));

  const where = conditions.length ? sql.join(conditions, sql` AND `) : undefined;
  const rows = await db
    .select()
    .from(deletionGuides)
    .where(where)
    .orderBy(asc(deletionGuides.serviceName))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deletionGuides)
    .where(where);

  return { rows, total: countRows[0]?.count ?? 0 };
}

export async function getGuideById(id: number) {
  const [row] = await getDb().select().from(deletionGuides).where(eq(deletionGuides.id, id)).limit(1);
  return row ?? null;
}

export async function getGuideByService(service: string) {
  const [row] = await getDb()
    .select()
    .from(deletionGuides)
    .where(ilike(deletionGuides.serviceName, service))
    .limit(1);
  return row ?? null;
}

/** Map of lowercased service name -> guide id, for tagging discovery findings. */
export async function buildGuideIndex(): Promise<Map<string, number>> {
  const rows = await getDb()
    .select({ id: deletionGuides.id, name: deletionGuides.serviceName })
    .from(deletionGuides);
  return new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
}
