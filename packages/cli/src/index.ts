#!/usr/bin/env bun
/**
 * forget-me CLI — a thin, pretty terminal client over the forget-me API.
 *
 * Discover where an email is registered and send verification-gated
 * GDPR/CCPA deletion requests. The API base URL is resolved from
 * FORGETME_API_URL, then ~/.forgetme/config.json, then a localhost default.
 */
import { Command } from "commander";
import { ApiConnectionError, ApiError } from "./api.ts";
import { pc, dim } from "./ui.ts";
import { registerSearch, registerTrack } from "./commands/search.ts";
import { registerGuides, registerGuide } from "./commands/guides.ts";
import { registerVerify } from "./commands/verify.ts";
import {
  registerRequestSend,
  registerRequestStatus,
  registerRequestRetry,
  registerRequestVerify,
} from "./commands/requests.ts";
import { registerExport, registerExportRequests } from "./commands/exports.ts";
import { registerConfig } from "./commands/config.ts";

const program = new Command();

program
  .name("forget-me")
  .description("Discover where your email is registered and send GDPR/CCPA deletion requests.")
  .version("0.1.0", "-v, --version", "print the CLI version")
  .configureHelp({ sortSubcommands: true });

// Register all commands.
registerSearch(program);
registerGuides(program);
registerGuide(program);
registerVerify(program);
registerRequestSend(program);
registerRequestStatus(program);
registerRequestRetry(program);
registerRequestVerify(program);
registerTrack(program);
registerExport(program);
registerExportRequests(program);
registerConfig(program);

program.addHelpText(
  "after",
  `
${dim("Configuration:")}
  API base URL resolves from FORGETME_API_URL, then ~/.forgetme/config.json,
  then defaults to http://localhost:3001.  See: forget-me config

${dim("Typical flow:")}
  forget-me search you@example.com
  forget-me verify you@example.com
  forget-me request-send <jobId> --email you@example.com --jurisdiction EU
  forget-me request-status <jobId>
`,
);

/** Turn any thrown error into a friendly, stack-free message + non-zero exit. */
function reportError(err: unknown): never {
  if (err instanceof ApiConnectionError) {
    console.error();
    console.error(pc.red(`  Could not reach the forget-me API at ${err.baseUrl}.`));
    console.error(dim("  Is it running?  Start it with:  bun run api:dev"));
    console.error(dim("  Or point the CLI elsewhere:  forget-me config --set <url>"));
    console.error();
  } else if (err instanceof ApiError) {
    console.error();
    console.error(pc.red(`  API error (HTTP ${err.status}): ${err.message}`));
    console.error();
  } else {
    const message = err instanceof Error ? err.message : String(err);
    console.error();
    console.error(pc.red(`  Error: ${message}`));
    console.error();
  }
  process.exit(1);
}

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    // Commander throws for --help/--version via process.exit; those won't reach here.
    reportError(err);
  }
}

main();
