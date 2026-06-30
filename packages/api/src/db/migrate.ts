/**
 * Run pending Drizzle migrations. Usage: `bun run db:migrate`.
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDb, getRawClient } from "./index.ts";

async function main() {
  const db = getDb();
  console.log("Running migrations…");
  await migrate(db, { migrationsFolder: new URL("../../drizzle", import.meta.url).pathname });
  console.log("✓ Migrations complete.");
  await getRawClient().end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
