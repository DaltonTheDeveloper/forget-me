/**
 * Email-ownership verification tokens.
 *
 * A token is `base64url(payload).hex(hmac)`. We store only the HMAC hash in the DB,
 * never the raw token, and require an unexpired, matching, verified row before any
 * deletion request may be sent. This is the core anti-abuse gate (design spec §2.2).
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.ts";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

interface TokenPayload {
  email: string;
  purpose: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac("sha256", config.verificationTokenSecret).update(data).digest("hex");
}

export function createToken(email: string, purpose = "deletion_send"): {
  token: string;
  tokenHash: string;
  expiresAt: Date;
} {
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload: TokenPayload = { email: email.toLowerCase(), purpose, exp };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = sign(encoded);
  const token = `${encoded}.${sig}`;
  return { token, tokenHash: sign(token), expiresAt: new Date(exp) };
}

/** Parse + verify a token's signature and expiry. Returns the payload or null. */
export function parseToken(token: string): TokenPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const encoded = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(encoded);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as TokenPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Hash used to look the token up in the DB. */
export function hashToken(token: string): string {
  return sign(token);
}
