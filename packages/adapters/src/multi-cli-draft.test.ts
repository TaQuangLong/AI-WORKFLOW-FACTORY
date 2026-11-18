import { chmod, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseWorkflowJsonFromText } from "@awf/core";
import {
  ClaudeAdapter,
  CodexAdapter,
  claudeDraftArgs,
  codexDraftArgs,
  draftPrompt,
} from "./index.js";

const sampleWorkflow = (goal: string) => `{
  "id": "wf_cli",
  "goal": ${JSON.stringify(goal)},
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "steps": [
    {
      "id": "s1",
      "title": "One",
      "skillId": "grill-with-docs",
      "ticked": true,
      "status": "pending"
    }
  ]
}`;

async function writeFakeCli(
  dir: string,
  name: string,
  mode: "ok" | "fail",
): Promise<string> {
  const file = path.join(dir, name);
  const body =
    mode === "ok"
      ? `#!/usr/bin/env node
const goal = process.argv.join(" ").includes("Goal:")
  ? process.argv.join(" ").split("Goal:").pop().trim()
  : "demo";
process.stdout.write("\`\`\`json\\n${sampleWorkflow("PLACEHOLDER").replace(
        '"PLACEHOLDER"',
        '"\' + goal.replace(/"/g, \'\\\\"\') + \'"',
      )}\\n\`\`\`\\n".replace("PLACEHOLDER", goal));
`
      : `#!/usr/bin/env node
console.error("boom");
process.exit(2);
`;
  // Simpler ok script: fixed JSON with goal from env
  const okScript = `#!/usr/bin/env node
const goal = process.env.AWF_TEST_GOAL || "demo";
const wf = ${JSON.stringify({
    id: "wf_cli",
    goal: "__GOAL__",
    updatedAt: "2026-01-01T00:00:00.000Z",
    steps: [
      {
        id: "s1",
        title: "One",
        skillId: "grill-with-docs",
        ticked: true,
        status: "pending",
      },
    ],
  })}.replace("__GOAL__", goal);
process.stdout.write("\`\`\`json\\n" + JSON.stringify(JSON.parse(wf), null, 2) + "\\n\`\`\`\\n");
`;
  // Wait, the replace approach is messy. Use clean script:
  const cleanOk = `#!/usr/bin/env node
const goal = process.env.AWF_TEST_GOAL || "demo";
const wf = {
  id: "wf_cli",
  goal,
  updatedAt: "2026-01-01T00:00:00.000Z",
  steps: [{ id: "s1", title: "One", skillId: "grill-with-docs", ticked: true, status: "pending" }]
};
process.stdout.write("\`\`\`json\\n" + JSON.stringify(wf, null, 2) + "\\n\`\`\`\\n");
`;
  const cleanFail = `#!/usr/bin/env node
console.error("boom");
process.exit(2);
`;
  await writeFile(file, mode === "ok" ? cleanOk : cleanFail, "utf8");
  await chmod(file, 0o755);
  return file;
}

describe("multi-cli draft argv", () => {
  it("builds Codex and Claude draft argv", () => {
    const prompt = draftPrompt("ship it");
    expect(codexDraftArgs("/proj", prompt)).toEqual([
      "exec",
      "-C",
      "/proj",
      "--sandbox",
      "read-only",
      prompt,
    ]);
    expect(claudeDraftArgs(prompt)).toEqual([
      "-p",
      prompt,
      "--permission-mode",
      "plan",
    ]);
  });
});

describe("CodexAdapter.draftWorkflow", () => {
  it("parses fenced JSON from fake codex bin", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "awf-codex-"));
    const bin = await writeFakeCli(dir, "fake-codex", "ok");
    const prev = process.env.AWF_CODEX_BIN;
    const prevGoal = process.env.AWF_TEST_GOAL;
    process.env.AWF_CODEX_BIN = bin;
    process.env.AWF_TEST_GOAL = "codex goal";
    try {
      const adapter = new CodexAdapter();
      const { text } = await adapter.draftWorkflow({
        projectRoot: dir,
        goal: "codex goal",
      });
      const wf = parseWorkflowJsonFromText(text);
      expect(wf.goal).toBe("codex goal");
      expect(wf.steps[0]?.ticked).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.AWF_CODEX_BIN;
      else process.env.AWF_CODEX_BIN = prev;
      if (prevGoal === undefined) delete process.env.AWF_TEST_GOAL;
      else process.env.AWF_TEST_GOAL = prevGoal;
    }
  });

  it("rejects failing fake codex bin", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "awf-codex-fail-"));
    const bin = await writeFakeCli(dir, "fake-codex-fail", "fail");
    const prev = process.env.AWF_CODEX_BIN;
    process.env.AWF_CODEX_BIN = bin;
    try {
      const adapter = new CodexAdapter();
      await expect(
        adapter.draftWorkflow({ projectRoot: dir, goal: "x" }),
      ).rejects.toThrow(/Codex draft exited/);
    } finally {
      if (prev === undefined) delete process.env.AWF_CODEX_BIN;
      else process.env.AWF_CODEX_BIN = prev;
    }
  });

  it("start remains stub failure", async () => {
    const adapter = new CodexAdapter();
    const lines: string[] = [];
    const result = await adapter.start(
      {
        projectRoot: "/tmp",
        skillId: "x",
        prompt: "p",
        stepId: "s",
      },
      (_s, line) => lines.push(line),
    );
    expect(result.exitCode).toBe(1);
    expect(lines.some((l) => /stub/i.test(l))).toBe(true);
  });
});

describe("ClaudeAdapter.draftWorkflow", () => {
  it("parses fenced JSON from fake claude bin", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "awf-claude-"));
    const bin = await writeFakeCli(dir, "fake-claude", "ok");
    const prev = process.env.AWF_CLAUDE_BIN;
    process.env.AWF_CLAUDE_BIN = bin;
    process.env.AWF_TEST_GOAL = "claude goal";
    try {
      const adapter = new ClaudeAdapter();
      const { text } = await adapter.draftWorkflow({
        projectRoot: dir,
        goal: "claude goal",
      });
      const wf = parseWorkflowJsonFromText(text);
      expect(wf.goal).toBe("claude goal");
    } finally {
      if (prev === undefined) delete process.env.AWF_CLAUDE_BIN;
      else process.env.AWF_CLAUDE_BIN = prev;
      delete process.env.AWF_TEST_GOAL;
    }
  });
});
