/**
 * User read/write helpers for the Clerk + Stripe integration.
 */
import { eq } from "drizzle-orm";
import { getDb } from "./index.ts";
import { users } from "./schema.ts";

export async function upsertUser(input: {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  await getDb()
    .insert(users)
    .values({
      id: input.id,
      email: input.email,
      name: input.name ?? null,
      avatarUrl: input.avatarUrl ?? null,
      subscriptionTier: "free",
      searchesRemaining: 10,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: { email: input.email, name: input.name ?? null, avatarUrl: input.avatarUrl ?? null, updatedAt: new Date() },
    });
}

export async function getUser(id: string) {
  const [row] = await getDb().select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function getUserByStripeCustomer(customerId: string) {
  const [row] = await getDb().select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
  return row ?? null;
}

export async function setSubscription(
  userId: string,
  data: { tier: string; status: string; stripeCustomerId?: string; stripeSubscriptionId?: string; endDate?: Date | null },
) {
  await getDb()
    .update(users)
    .set({
      subscriptionTier: data.tier,
      subscriptionStatus: data.status,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      subscriptionEndDate: data.endDate ?? null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
