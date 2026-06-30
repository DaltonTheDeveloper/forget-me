/**
 * Centralized, env-gated configuration. Every integration is optional;
 * `has*` flags let the rest of the app degrade cleanly when a key is absent.
 */
export const config = {
  port: Number(process.env.PORT ?? 3001),
  apiBaseUrl: process.env.API_BASE_URL ?? "http://localhost:3001",
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:3000",

  databaseUrl: process.env.DATABASE_URL,
  verificationTokenSecret: process.env.VERIFICATION_TOKEN_SECRET ?? "dev-insecure-secret-change-me",

  hibpApiKey: process.env.HIBP_API_KEY,
  githubToken: process.env.GITHUB_TOKEN,

  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? "privacy@forget-me.dev",

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  clerkSecretKey: process.env.CLERK_SECRET_KEY,
  clerkWebhookSecret: process.env.CLERK_WEBHOOK_SECRET,
} as const;

export const features = {
  get db() {
    return Boolean(config.databaseUrl);
  },
  get hibp() {
    return Boolean(config.hibpApiKey);
  },
  get sending() {
    return Boolean(config.resendApiKey);
  },
  get auth() {
    return Boolean(config.clerkSecretKey);
  },
  get payments() {
    return Boolean(config.stripeSecretKey);
  },
};
