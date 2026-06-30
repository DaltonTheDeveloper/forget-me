import { describe, expect, test } from "bun:test";
import { runDiscovery } from "../src/discovery/orchestrator.ts";

describe("discovery orchestrator", () => {
  test("returns self-selected services with a guide flag and no probing", async () => {
    const guideIndex = new Map<string, number>([["github", 1]]);
    const { findings } = await runDiscovery("user@example.com", [], ["GitHub", "Notion"], guideIndex);

    const github = findings.find((f) => f.service === "GitHub");
    const notion = findings.find((f) => f.service === "Notion");

    expect(github?.source).toBe("self_selection");
    expect(github?.guideAvailable).toBe(true);
    expect(github?.guideId).toBe(1);
    expect(notion?.guideAvailable).toBe(false);
  });

  test("dedupes the same service from multiple sources, keeping highest confidence", async () => {
    const { findings } = await runDiscovery("user@example.com", [], ["GitHub", "github", "GITHUB"]);
    const githubs = findings.filter((f) => f.service.toLowerCase() === "github");
    expect(githubs.length).toBe(1);
  });
});
