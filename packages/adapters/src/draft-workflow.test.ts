import { describe, expect, it } from "vitest";
import { parseWorkflowJsonFromText } from "@awf/core";
import { FakeAdapter } from "./fake.js";
import { CodexAdapter } from "./stubs.js";

describe("FakeAdapter.draftWorkflow (Seam B)", () => {
  it("returns fenced JSON parseable as Workflow", async () => {
    const adapter = new FakeAdapter();
    const { text } = await adapter.draftWorkflow({
      projectRoot: "/tmp",
      goal: "demo goal",
    });
    const wf = parseWorkflowJsonFromText(text);
    expect(wf.goal).toBe("demo goal");
    expect(wf.steps.some((s) => s.id === "fake_draft_step")).toBe(true);
  });

  it("can force failure for fallback tests", async () => {
    const adapter = new FakeAdapter();
    adapter.failDraft = true;
    await expect(
      adapter.draftWorkflow({ projectRoot: "/tmp", goal: "x" }),
    ).rejects.toThrow(/forced failure/);
  });
});

describe("Stub draftWorkflow", () => {
  it("fails so runtime can fall back", async () => {
    const adapter = new CodexAdapter();
    await expect(
      adapter.draftWorkflow({ projectRoot: "/tmp", goal: "x" }),
    ).rejects.toThrow(/stub/);
  });
});
