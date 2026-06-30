/**
 * `guides` — list deletion guides.
 * `guide`  — show one guide (by service name or numeric id).
 */
import type { Command } from "commander";
import { api, type GuideDetail, type GuidesResponse } from "../api.ts";
import { pc, table, dim, heading, difficultyText } from "../ui.ts";

function methodLabel(method: string): string {
  switch (method) {
    case "email":
      return pc.green("email");
    case "user_form":
      return pc.cyan("user_form");
    case "manual_only":
      return pc.yellow("manual_only");
    default:
      return method;
  }
}

export function registerGuides(program: Command) {
  program
    .command("guides")
    .description("List available deletion guides")
    .option("--difficulty <level>", "filter by difficulty (easy,medium,hard,impossible)")
    .option("--search <term>", "filter by service name")
    .option("--limit <n>", "max results", "20")
    .option("--json", "output raw JSON")
    .action(async (opts: { difficulty?: string; search?: string; limit?: string; json?: boolean }) => {
      const params = new URLSearchParams();
      if (opts.search) params.set("search", opts.search);
      if (opts.difficulty) params.set("difficulty", opts.difficulty);
      if (opts.limit) params.set("limit", opts.limit);
      const qs = params.toString();

      const res = await api.get<GuidesResponse>(`/api/guides${qs ? `?${qs}` : ""}`);

      if (opts.json) {
        console.log(JSON.stringify(res, null, 2));
        return;
      }

      console.log();
      if (!res.guides.length) {
        console.log(dim("  No guides matched."));
        console.log();
        return;
      }
      const rows = res.guides.map((g) => [
        dim(String(g.id)),
        pc.bold(g.serviceName),
        difficultyText(g.difficulty),
        g.estimatedTimeMinutes ? `${g.estimatedTimeMinutes}m` : dim("—"),
        g.communityVerified ? pc.green("✓") : dim("—"),
        methodLabel(g.method),
      ]);
      console.log(table(["ID", "Service", "Difficulty", "Time", "Verified", "Method"], rows));
      console.log();
      console.log(`  ${dim(`Showing ${res.guides.length} of ${res.total} guides.`)}`);
      console.log(`  ${dim("Details:")} ${pc.bold("forget-me guide <service>")}`);
      console.log();
    });
}

export function registerGuide(program: Command) {
  program
    .command("guide")
    .description("Show a single deletion guide")
    .argument("<serviceOrId>", "service name or numeric guide id")
    .option("--json", "output raw JSON")
    .action(async (serviceOrId: string, opts: { json?: boolean }) => {
      const g = await api.get<GuideDetail>(`/api/guides/${encodeURIComponent(serviceOrId)}`);

      if (opts.json) {
        console.log(JSON.stringify(g, null, 2));
        return;
      }

      console.log();
      console.log(heading(`  ${g.serviceName}`));
      const meta: string[] = [];
      meta.push(`${dim("Difficulty:")} ${difficultyText(g.difficulty)}`);
      if (g.estimatedTimeMinutes) meta.push(`${dim("Time:")} ${g.estimatedTimeMinutes}m`);
      meta.push(`${dim("Method:")} ${methodLabel(g.method)}`);
      if (g.communityVerified) meta.push(pc.green("community-verified"));
      console.log("  " + meta.join("   "));
      if (g.website) console.log(`  ${dim("Website:")} ${pc.underline(g.website)}`);
      console.log();

      const steps = Array.isArray(g.steps) ? g.steps : [];
      if (!steps.length) {
        console.log(dim("  No steps recorded for this guide."));
      } else {
        steps.forEach((step, i) => {
          console.log(`  ${pc.bold(pc.cyan(`${i + 1}.`))} ${pc.bold(step.title)}`);
          if (step.description) console.log(`     ${step.description}`);
          if (step.url) console.log(`     ${dim("→")} ${pc.underline(step.url)}`);
          if (step.substeps?.length) {
            for (const sub of step.substeps) console.log(`       ${dim("•")} ${sub}`);
          }
          if (step.warning) console.log(`     ${pc.yellow("⚠")}  ${pc.yellow(step.warning)}`);
          console.log();
        });
      }

      if (g.notes) {
        console.log(`  ${dim("Notes:")} ${g.notes}`);
        console.log();
      }
    });
}
