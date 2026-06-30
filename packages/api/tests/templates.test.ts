import { describe, expect, test } from "bun:test";
import { renderDeletionEmail } from "../src/sending/templates.ts";

const base = {
  userEmail: "user@example.com",
  service: "GitHub",
  requestId: "req_123",
  date: "2026-06-30",
};

describe("deletion email templates", () => {
  test("EU → GDPR Article 17 language", () => {
    const e = renderDeletionEmail({ ...base, jurisdiction: "EU" });
    expect(e.regulation).toBe("GDPR");
    expect(e.subject).toContain("Article 17");
    expect(e.body).toContain("user@example.com");
    expect(e.body).toContain("req_123");
  });

  test("California → CCPA language", () => {
    const e = renderDeletionEmail({ ...base, jurisdiction: "US_CA" });
    expect(e.regulation).toBe("CCPA");
    expect(e.subject).toContain("CCPA");
    expect(e.body).toContain("1798");
  });

  test("Brazil → LGPD language", () => {
    const e = renderDeletionEmail({ ...base, jurisdiction: "BR" });
    expect(e.regulation).toBe("LGPD");
    expect(e.body).toContain("LGPD");
  });
});
