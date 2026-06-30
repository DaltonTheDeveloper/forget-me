/**
 * Persistence + checks for email-ownership verification.
 */
import { and, desc, eq, gt, isNotNull } from "drizzle-orm";
import { getDb } from "../db/index.ts";
import { emailVerifications } from "../db/schema.ts";
import { createToken, hashToken } from "./token.ts";

/** Create a pending verification row and return the raw token to email out. */
export async function startVerification(email: string, purpose = "deletion_send") {
  const { token, tokenHash, expiresAt } = createToken(email, purpose);
  await getDb().insert(emailVerifications).values({
    email: email.toLowerCase(),
    tokenHash,
    purpose,
    expiresAt,
  });
  return { token, expiresAt };
}

/** Mark a verification confirmed by its raw token. Returns the verified email or null. */
export async function confirmVerification(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);
  const db = getDb();
  const [row] = await db
    .select()
    .from(emailVerifications)
    .where(and(eq(emailVerifications.tokenHash, tokenHash), gt(emailVerifications.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  if (!row.verifiedAt) {
    await db
      .update(emailVerifications)
      .set({ verifiedAt: new Date() })
      .where(eq(emailVerifications.id, row.id));
  }
  return row.email;
}

/** True if there is an unexpired, confirmed verification for this email + purpose. */
export async function isEmailVerified(email: string, purpose = "deletion_send"): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: emailVerifications.id })
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.email, email.toLowerCase()),
        eq(emailVerifications.purpose, purpose),
        isNotNull(emailVerifications.verifiedAt),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(emailVerifications.verifiedAt))
    .limit(1);
  return Boolean(row);
}
