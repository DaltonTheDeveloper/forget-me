/**
 * Simple in-memory sliding-window IP rate limiter (per route group).
 * Good enough for v1 / self-host; swap for Redis behind a load balancer.
 */
import type { Context, Next } from "hono";

interface Bucket {
  count: number;
  resetAt: number;
}

export function rateLimit(opts: { limit: number; windowMs: number; key?: string }) {
  const buckets = new Map<string, Bucket>();
  return async (c: Context, next: Next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
      c.req.header("x-real-ip") ||
      "local";
    const bucketKey = `${opts.key ?? "default"}:${ip}`;
    const now = Date.now();
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + opts.windowMs });
      return next();
    }
    if (bucket.count >= opts.limit) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      c.header("retry-after", String(retryAfter));
      return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
    }
    bucket.count++;
    return next();
  };
}
