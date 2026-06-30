/**
 * Validate every guide in guides/ and upsert into deletion_guides.
 * Usage: `bun run db:seed:guides`.
 */
import { sql } from "drizzle-orm";
import { getDb, getRawClient } from "./index.ts";
import { deletionGuides } from "./schema.ts";
import { loadAllGuides } from "../guides/load.ts";

async function main() {
  const guides = loadAllGuides();
  console.log(`Validated ${guides.length} guides.`);

  const db = getDb();
  let upserted = 0;
  for (const g of guides) {
    await db
      .insert(deletionGuides)
      .values({
        serviceName: g.serviceName,
        serviceDomain: g.serviceDomain,
        website: g.website,
        difficulty: g.difficulty,
        estimatedTimeMinutes: g.estimatedTimeMinutes,
        requiresEmailAccess: g.requiresEmailAccess,
        requiresPassword: g.requiresPassword,
        steps: g.steps,
        method: g.method,
        emailConfig: g.email ?? null,
        userFormConfig: g.userForm ?? null,
        notes: g.notes,
        verifiedBy: g.verifiedBy,
        verifiedDate: g.verifiedDate ? new Date(g.verifiedDate) : null,
        communityVerified: g.communityVerified,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: deletionGuides.serviceName,
        set: {
          steps: g.steps,
          method: g.method,
          emailConfig: g.email ?? null,
          userFormConfig: g.userForm ?? null,
          difficulty: g.difficulty,
          notes: g.notes,
          updatedAt: new Date(),
        },
      });
    upserted++;
  }

  const countRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deletionGuides);
  console.log(`✓ Upserted ${upserted} guides. Total in DB: ${countRows[0]?.count ?? 0}.`);
  await getRawClient().end();
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
