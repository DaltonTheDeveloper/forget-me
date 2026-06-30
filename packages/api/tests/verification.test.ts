import { describe, expect, test } from "bun:test";
import { createToken, parseToken, hashToken } from "../src/verification/token.ts";

describe("verification tokens", () => {
  test("round-trips a valid token", () => {
    const { token } = createToken("user@example.com");
    const payload = parseToken(token);
    expect(payload?.email).toBe("user@example.com");
    expect(payload?.purpose).toBe("deletion_send");
  });

  test("rejects a tampered token", () => {
    const { token } = createToken("user@example.com");
    // Flip the payload to a different email while keeping the old signature.
    const forged = Buffer.from(JSON.stringify({ email: "victim@example.com", purpose: "deletion_send", exp: Date.now() + 1000 })).toString("base64url") + "." + token.split(".")[1];
    expect(parseToken(forged)).toBeNull();
  });

  test("rejects a garbage token", () => {
    expect(parseToken("not-a-real-token")).toBeNull();
    expect(parseToken("")).toBeNull();
  });

  test("hashToken is stable and differs from the raw token", () => {
    const { token } = createToken("user@example.com");
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});
