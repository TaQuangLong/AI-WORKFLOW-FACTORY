import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  WorkflowStore,
  createEmptyDraft,
  nextPendingAfterStop,
  nextRunnableStep,
} from "./store.js";
import type { Workflow } from "./schema.js";

describe("WorkflowStore", () => {
  it("accepts draft into current without running", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-"));
    const store = new WorkflowStore(root);
    const draft = createEmptyDraft("ship visualizer");
    draft.steps = [
      {
        id: "a",
        title: "Grill",
        skillId: "grill-with-docs",
        ticked: true,
        status: "pending",
      },
      {
        id: "b",
        title: "Skip me",
        skillId: "to-spec",
        ticked: false,
        status: "pending",
      },
      {
        id: "c",
        title: "Blocked skill",
        skillId: "missing-skill",
        ticked: true,
        status: "blocked",
      },
    ];
    await store.saveDraft(draft);
    const current = await store.acceptDraft();
    expect(current.steps[0]?.status).toBe("pending");
    expect(current.steps[1]?.status).toBe("ignored");
    expect(current.steps[2]?.status).toBe("blocked");
    const onDisk = await readFile(store.currentPath(), "utf8");
    expect(JSON.parse(onDisk).goal).toBe("ship visualizer");
  });

  it("Continue picks next pending after stopped, not the stopped step", () => {
    const wf: Workflow = {
      id: "w",
      goal: "g",
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "1",
          title: "A",
          skillId: "a",
          ticked: true,
          status: "stopped",
        },
        {
          id: "2",
          title: "B",
          skillId: "b",
          ticked: true,
          status: "pending",
        },
      ],
    };
    expect(nextPendingAfterStop(wf, "1")?.id).toBe("2");
    expect(nextRunnableStep({ ...wf, steps: [wf.steps[0]!] })?.id).toBe("1");
  });

  it("exports workflow.md under docs", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-"));
    const store = new WorkflowStore(root);
    const draft = createEmptyDraft("docs");
    draft.steps = [
      {
        id: "1",
        title: "One",
        skillId: "x",
        ticked: true,
        status: "pending",
      },
    ];
    const out = await store.exportWorkflowMarkdown(draft);
    const text = await readFile(out, "utf8");
    expect(text).toContain("# Workflow: docs");
    expect(text).toContain("One");
  });
});
