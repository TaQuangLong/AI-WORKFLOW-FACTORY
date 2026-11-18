import { mkdtemp, mkdir, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { FakeAdapter } from "@awf/adapters";
import { WorkflowRuntime } from "./runtime.js";

async function seedSkill(root: string, id: string) {
  const dir = path.join(root, ".agents", "skills", id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "SKILL.md"), `# ${id}\n`, "utf8");
}

describe("Run history (Seam A)", () => {
  it("writes History Entry after Run and Load as Draft replaces draft", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-hist-rt-"));
    await seedSkill(root, "grill-with-docs");
    await seedSkill(root, "to-spec");
    await seedSkill(root, "implement");

    const rt = new WorkflowRuntime(root, "fake");
    rt.replaceAdapter(new FakeAdapter(10));

    const { draft } = await rt.postChat("history smoke goal");
    // Keep only first step for a fast run
    await rt.saveDraft({
      ...draft,
      steps: draft.steps.map((s, i) =>
        i === 0
          ? { ...s, ticked: true, status: "pending" as const }
          : { ...s, ticked: false, status: "ignored" as const },
      ),
    });
    await rt.acceptDraft();
    await rt.startRun();

    const histDir = path.join(root, ".workflow", "history");
    const files = (await readdir(histDir)).filter((f) => f.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(1);

    const entries = await rt.listHistory();
    expect(entries[0]?.workflow.goal).toContain("history smoke");
    expect(
      entries[0]?.workflow.steps.some((s) => s.status === "succeeded"),
    ).toBe(true);

    const before = await rt.store.loadDraft();
    expect(before).toBeTruthy();

    const loaded = await rt.loadHistoryAsDraft(entries[0]!.id);
    expect(loaded.goal).toContain("history smoke");
    const pending = loaded.steps.filter((s) => s.ticked);
    expect(pending.every((s) => s.status === "pending" || s.status === "blocked")).toBe(
      true,
    );
    const disk = await rt.store.loadDraft();
    expect(disk?.id).toBe(loaded.id);
  }, 15_000);
});
