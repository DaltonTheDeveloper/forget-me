/**
 * `verify` — prove ownership of an email. Nothing sends until this completes.
 */
import type { Command } from "commander";
import { api, type VerifyStartResponse } from "../api.ts";
import { pc, dim, heading } from "../ui.ts";

export function registerVerify(program: Command) {
  program
    .command("verify")
    .description("Send an ownership-verification email (required before any deletion request)")
    .argument("<email>", "email address to verify")
    .action(async (email: string) => {
      const res = await api.post<VerifyStartResponse>("/api/verify/start", { email });

      console.log();
      console.log(heading("  Verification started"));
      console.log(`  ${dim("Status:")} ${res.status}`);
      if (res.expiresAt) console.log(`  ${dim("Expires:")} ${res.expiresAt}`);
      console.log();

      if (res.devConfirmUrl) {
        console.log(pc.yellow("  Dev mode — open this link to confirm (no email was actually sent):"));
        console.log(`  ${pc.underline(res.devConfirmUrl)}`);
      } else if (res.delivered) {
        console.log(`  ${pc.green("✓")} A confirmation email was sent to ${pc.bold(email)}.`);
        console.log(dim("  Open the link in that email to confirm ownership."));
      } else {
        console.log(pc.yellow(`  We could not confirm delivery to ${email}. Check your email configuration.`));
      }

      console.log();
      console.log(dim("  Nothing is sent to any service until this email is verified."));
      console.log(dim("  Once confirmed, run:"));
      console.log(`    ${pc.bold(`forget-me request-send <jobId> --email ${email} --jurisdiction EU`)}`);
      console.log();
    });
}
