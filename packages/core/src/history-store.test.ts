import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WorkflowStore, historyDir } from "./store.js";
import { createEmptyDraft } from "./store.js";

describe("WorkflowStore history", () => {
  it("saves and lists newest-first; skips corrupt files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-hist-"));
    const store = new WorkflowStore(root);
    const a = createEmptyDraft("first");
    a.id = "wf_a";
    a.steps = [
      {
        id: "1",
        title: "One",
        skillId: "x",
        ticked: true,
        status: "succeeded",
      },
    ];
    const first = await store.saveHistoryEntry(a);
    await new Promise((r) => setTimeout(r, 5));
    const b = createEmptyDraft("second");
    b.id = "wf_b";
    b.steps = [
      {
        id: "1",
        title: "Two",
        skillId: "y",
        ticked: true,
        status: "failed",
      },
    ];
    const second = await store.saveHistoryEntry(b);

    await writeFile(
      path.join(historyDir(root), "broken.json"),
      "{not-json",
      "utf8",
    );

    const list = await store.listHistoryEntries();
    expect(list.map((e) => e.id)).toEqual([second.id, first.id]);
    expect(list.every((e) => e.id !== "broken.json")).toBe(true);

    const loaded = await store.loadHistoryEntry(first.id);
    expect(loaded?.workflow.goal).toBe("first");
    expect(loaded?.workflow.steps[0]?.status).toBe("succeeded");
  });
});
