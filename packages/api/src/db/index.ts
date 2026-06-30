/**
 * Database client. Lazily connects so commands that don't need the DB
 * (e.g. `--help`) don't fail when DATABASE_URL is unset.
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.ts";

export const DATABASE_URL = process.env.DATABASE_URL;

let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
  }
  if (!_db) {
    _client = postgres(DATABASE_URL, { max: 10 });
    _db = drizzle(_client, { schema });
  }
  return _db;
}

export function getRawClient() {
  getDb();
  return _client!;
}

export { schema };
