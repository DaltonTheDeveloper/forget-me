/**
 * `config` — show (or set) the resolved API base URL.
 *
 * Precedence: FORGETME_API_URL  >  ~/.forgetme/config.json  >  default.
 */
import type { Command } from "commander";
import { CONFIG_PATH, DEFAULT_API_URL, resolveConfig, writeApiBaseUrl } from "../config.ts";
import { pc, dim, heading } from "../ui.ts";

const SOURCE_LABEL: Record<string, string> = {
  env: "FORGETME_API_URL (env)",
  file: `${CONFIG_PATH} (file)`,
  default: "built-in default",
};

export function registerConfig(program: Command) {
  program
    .command("config")
    .description("Show or set the forget-me API base URL")
    .option("--set <url>", "persist apiBaseUrl to ~/.forgetme/config.json")
    .action((opts: { set?: string }) => {
      if (opts.set) {
        const written = writeApiBaseUrl(opts.set);
        console.log();
        console.log(`  ${pc.green("✓")} Saved apiBaseUrl = ${pc.cyan(written)}`);
        console.log(`  ${dim("at")} ${CONFIG_PATH}`);
        if (process.env.FORGETME_API_URL) {
          console.log(pc.yellow(`  Note: FORGETME_API_URL is set and overrides the config file.`));
        }
        console.log();
        return;
      }

      const { apiBaseUrl, source } = resolveConfig();
      console.log();
      console.log(heading("  forget-me config"));
      console.log(`  ${dim("API base URL:")} ${pc.cyan(apiBaseUrl)}`);
      console.log(`  ${dim("Resolved from:")} ${SOURCE_LABEL[source]}`);
      console.log();
      console.log(dim("  Precedence (highest first):"));
      console.log(dim("    1. FORGETME_API_URL env var"));
      console.log(dim(`    2. ${CONFIG_PATH}  ->  { "apiBaseUrl": "..." }`));
      console.log(dim(`    3. default  ->  ${DEFAULT_API_URL}`));
      console.log();
      console.log(`  ${dim("Set it:")} ${pc.bold("forget-me config --set http://localhost:3001")}`);
      console.log();
    });
}
