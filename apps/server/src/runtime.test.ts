import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowRuntime } from "./runtime.js";

async function seedSkill(root: string, id: string) {
  const dir = path.join(root, ".agents", "skills", id);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "SKILL.md"), `# ${id}\n`, "utf8");
}

describe("WorkflowRuntime Seam A", () => {
  it("chat → draft → accept → run → stop → continue → rerun", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-rt-"));
    await seedSkill(root, "grill-with-docs");
    await seedSkill(root, "to-spec");
    await seedSkill(root, "implement");

    const rt = new WorkflowRuntime(root, "fake");
    const events: string[] = [];
    rt.onEvent((e) => {
      if (e.type === "step") events.push(`${e.stepId}:${e.status}`);
      if (e.type === "run") events.push(`run:${e.state}`);
    });

    const { draft } = await rt.postChat("build a workflow visualizer");
    expect(draft.steps.length).toBeGreaterThan(0);
    expect(await readFile(path.join(root, ".workflow", "draft.json"), "utf8")).toContain(
      "build a workflow visualizer",
    );

    // Ignore middle step
    const mid = draft.steps[1]!;
    draft.steps = draft.steps.map((s) =>
      s.id === mid.id ? { ...s, ticked: false, status: "ignored" as const } : s,
    );
    await rt.saveDraft(draft);

    const current = await rt.acceptDraft();
    expect(current.steps.find((s) => s.id === mid.id)?.status).toBe("ignored");
    const currentDisk = await readFile(
      path.join(root, ".workflow", "current.json"),
      "utf8",
    );
    expect(currentDisk).toContain("build a workflow visualizer");

    const docs = await readFile(
      path.join(root, ".workflow", "docs", "workflow.md"),
      "utf8",
    );
    expect(docs).toContain("# Workflow:");

    // Slow fake so we can stop
    rt.setAdapter("fake");
    // Replace with slow fake via private access — use start then stop
    const { FakeAdapter } = await import("@awf/adapters");
    (rt as unknown as { adapter: unknown }).adapter = new FakeAdapter(2_000);

    const runPromise = rt.startRun();
    await new Promise((r) => setTimeout(r, 30));
    await rt.stop();
    await runPromise;

    const afterStop = await rt.store.loadCurrent();
    const stopped = afterStop!.steps.find((s) => s.status === "stopped");
    expect(stopped).toBeTruthy();

    (rt as unknown as { adapter: unknown }).adapter = new FakeAdapter(20);
    await rt.continueRun();
    const afterContinue = await rt.store.loadCurrent();
    // stopped step stays stopped; a later ticked step should have progressed
    expect(
      afterContinue!.steps.find((s) => s.id === stopped!.id)?.status,
    ).toBe("stopped");
    const later = afterContinue!.steps.filter(
      (s) => s.ticked && s.id !== mid.id && s.id !== stopped!.id,
    );
    expect(later.some((s) => s.status === "succeeded")).toBe(true);

    const firstSucceeded = afterContinue!.steps.find(
      (s) => s.status === "succeeded",
    );
    if (firstSucceeded) {
      await rt.rerunStep(firstSucceeded.id);
      const afterRerun = await rt.store.loadCurrent();
      // downstream unchanged statuses (still succeeded or whatever they were)
      expect(
        afterRerun!.steps.find((s) => s.id === firstSucceeded.id)?.status,
      ).toBe("succeeded");
    }
  }, 15_000);

  it("blocks missing skills and create-skill unblocks", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-rt-"));
    const rt = new WorkflowRuntime(root, "fake");
    const { draft } = await rt.postChat("anything");
    expect(draft.steps.some((s) => s.status === "blocked")).toBe(true);

    await rt.createMissingSkill("grill-with-docs", "Grill with docs");
    await rt.createMissingSkill("to-spec", "To spec");
    await rt.createMissingSkill("implement", "Implement");

    const refreshed = await rt.store.loadDraft();
    expect(refreshed!.steps.every((s) => s.status !== "blocked")).toBe(true);
  });
});
