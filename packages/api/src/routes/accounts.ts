/**
 * Env-gated auth (Clerk) + payments (Stripe) routes.
 *
 * Every route degrades to 503 when its provider key is absent, so the API runs
 * fine locally / in free-tier-only mode without Clerk or Stripe configured.
 */
import { Hono } from "hono";
import Stripe from "stripe";
import { Webhook } from "svix";
import { config, features } from "../config.ts";
import { getUser, getUserByStripeCustomer, setSubscription, upsertUser } from "../db/users-repo.ts";

export const accounts = new Hono();

let _stripe: Stripe | null = null;
function stripe(): Stripe {
  if (!_stripe) _stripe = new Stripe(config.stripeSecretKey!);
  return _stripe;
}

const PRICE_BY_TIER: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  annual: process.env.STRIPE_PRICE_ANNUAL,
  lifetime: process.env.STRIPE_PRICE_LIFETIME,
};

// ── Clerk: user sync webhook ────────────────────────────────────────────────────
accounts.post("/api/auth/webhook", async (c) => {
  if (!config.clerkWebhookSecret) return c.json({ error: "Clerk not configured" }, 503);
  const payload = await c.req.text();
  const headers = {
    "svix-id": c.req.header("svix-id") ?? "",
    "svix-timestamp": c.req.header("svix-timestamp") ?? "",
    "svix-signature": c.req.header("svix-signature") ?? "",
  };
  let evt: any;
  try {
    evt = new Webhook(config.clerkWebhookSecret).verify(payload, headers);
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }
  if (evt.type === "user.created" || evt.type === "user.updated") {
    const d = evt.data;
    const email = d.email_addresses?.[0]?.email_address;
    if (email) {
      await upsertUser({
        id: d.id,
        email,
        name: [d.first_name, d.last_name].filter(Boolean).join(" ") || null,
        avatarUrl: d.image_url ?? null,
      });
    }
  }
  return c.json({ received: true });
});

// ── Authenticated user profile ──────────────────────────────────────────────────
// Trusts an upstream-verified Clerk user id header (set by the web BFF / middleware).
accounts.get("/api/auth/user", async (c) => {
  if (!features.auth) return c.json({ error: "Auth not configured" }, 503);
  const userId = c.req.header("x-clerk-user-id");
  if (!userId) return c.json({ error: "Unauthenticated" }, 401);
  const user = await getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    searchesRemaining: user.searchesRemaining,
    deletionRequestsSent: user.deletionRequestsSent,
  });
});

// ── Stripe: create checkout session ──────────────────────────────────────────────
accounts.post("/api/billing/session", async (c) => {
  if (!features.payments) return c.json({ error: "Payments not configured" }, 503);
  const userId = c.req.header("x-clerk-user-id");
  if (!userId) return c.json({ error: "Unauthenticated" }, 401);
  const body = await c.req.json().catch(() => ({}));
  const tier = body.tier as string;
  const price = PRICE_BY_TIER[tier];
  if (!price) return c.json({ error: `Unknown or unconfigured tier: ${tier}` }, 400);

  const user = await getUser(userId);
  const session = await stripe().checkout.sessions.create({
    mode: tier === "lifetime" ? "payment" : "subscription",
    line_items: [{ price, quantity: 1 }],
    customer_email: user?.email,
    client_reference_id: userId,
    success_url: `${config.webBaseUrl}/dashboard?upgraded=1`,
    cancel_url: `${config.webBaseUrl}/pricing`,
  });
  return c.json({ sessionId: session.id, checkoutUrl: session.url });
});

// ── Stripe: subscription details ─────────────────────────────────────────────────
accounts.get("/api/billing/subscription", async (c) => {
  if (!features.auth) return c.json({ error: "Not configured" }, 503);
  const userId = c.req.header("x-clerk-user-id");
  if (!userId) return c.json({ error: "Unauthenticated" }, 401);
  const user = await getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({
    tier: user.subscriptionTier,
    status: user.subscriptionStatus,
    currentPeriodEnd: user.subscriptionEndDate,
  });
});

// ── Stripe: cancel ───────────────────────────────────────────────────────────────
accounts.post("/api/billing/cancel", async (c) => {
  if (!features.payments) return c.json({ error: "Payments not configured" }, 503);
  const userId = c.req.header("x-clerk-user-id");
  if (!userId) return c.json({ error: "Unauthenticated" }, 401);
  const user = await getUser(userId);
  if (!user?.stripeSubscriptionId) return c.json({ error: "No active subscription" }, 400);
  const sub = await stripe().subscriptions.update(user.stripeSubscriptionId, { cancel_at_period_end: true });
  const periodEnd = (sub as any).current_period_end as number | undefined;
  return c.json({
    status: "cancelling",
    activeUntil: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
  });
});

// ── Stripe: webhook ──────────────────────────────────────────────────────────────
accounts.post("/api/billing/webhook", async (c) => {
  if (!features.payments || !config.stripeWebhookSecret) return c.json({ error: "Payments not configured" }, 503);
  const sig = c.req.header("stripe-signature") ?? "";
  const raw = await c.req.text();
  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(raw, sig, config.stripeWebhookSecret);
  } catch {
    return c.json({ error: "Invalid signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      const userId = s.client_reference_id;
      if (userId) {
        const lifetime = s.mode === "payment";
        await setSubscription(userId, {
          tier: lifetime ? "lifetime" : "monthly",
          status: "active",
          stripeCustomerId: typeof s.customer === "string" ? s.customer : undefined,
          stripeSubscriptionId: typeof s.subscription === "string" ? s.subscription : undefined,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const user = await getUserByStripeCustomer(customerId);
      if (user) {
        const active = sub.status === "active" || sub.status === "trialing";
        const periodEnd = (sub as any).current_period_end as number | undefined;
        await setSubscription(user.id, {
          tier: active ? user.subscriptionTier ?? "monthly" : "free",
          status: sub.status,
          endDate: periodEnd ? new Date(periodEnd * 1000) : null,
        });
      }
      break;
    }
  }
  return c.json({ received: true });
});
