import { describe, expect, test } from "bun:test";
import { sendDeletionRequests, NotVerifiedError } from "../src/sending/send.ts";

describe("deletion send gate", () => {
  test("refuses to send when the email owner is NOT verified", async () => {
    await expect(
      sendDeletionRequests({
        jobId: "job_test",
        email: "user@example.com",
        services: ["GitHub"],
        jurisdiction: "EU",
        skipManualOnly: true,
        ownerVerified: false,
        webBaseUrl: "http://localhost:3000",
      }),
    ).rejects.toBeInstanceOf(NotVerifiedError);
  });
});
