import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
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

describe("postChat adapter draft (Seam A)", () => {
  it("uses FakeAdapter draftWorkflow steps", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-draft-"));
    await seedSkill(root, "grill-with-docs");
    await seedSkill(root, "to-spec");
    const rt = new WorkflowRuntime(root, "fake");
    const { draft, draftSource, assistant } = await rt.postChat("adapter path");
    expect(draftSource).toBe("adapter");
    expect(draft.steps.some((s) => s.id === "fake_draft_step")).toBe(true);
    expect(assistant.content).toMatch(/via fake adapter/i);
    expect(rt.snapshot).toBeDefined();
    const snap = await rt.snapshot();
    expect(snap.draftSource).toBe("adapter");
    expect(snap.run.state).toBe("idle");
  });

  it("labels heuristic fallback when draft fails", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-draft-"));
    const rt = new WorkflowRuntime(root, "fake");
    const fake = new FakeAdapter();
    fake.failDraft = true;
    rt.replaceAdapter(fake);
    const { draft, draftSource, assistant } = await rt.postChat("fallback path");
    expect(draftSource).toBe("heuristic");
    expect(draft.steps.some((s) => s.id === "step_grill")).toBe(true);
    expect(assistant.content).toMatch(/heuristic fallback/i);
  });
});
