import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SkillsRegistry, annotateBlockedStatuses } from "./index.js";

describe("SkillsRegistry", () => {
  it("discovers SKILL.md and marks missing as blocked", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-sk-"));
    const skillDir = path.join(root, ".agents", "skills", "grill-with-docs");
    await mkdir(skillDir, { recursive: true });
    await writeFile(path.join(skillDir, "SKILL.md"), "# grill\n", "utf8");

    const reg = new SkillsRegistry(root);
    expect(await reg.has("grill-with-docs")).toBe(true);
    expect(await reg.has("nope")).toBe(false);

    const steps = await annotateBlockedStatuses(reg, [
      { skillId: "grill-with-docs", ticked: true, status: "pending" },
      { skillId: "nope", ticked: true, status: "pending" },
      { skillId: "x", ticked: false, status: "pending" },
    ]);
    expect(steps[0]?.status).toBe("pending");
    expect(steps[1]?.status).toBe("blocked");
    expect(steps[2]?.status).toBe("ignored");
  });

  it("creates a skill under .agents/skills", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "awf-sk-"));
    const reg = new SkillsRegistry(root);
    const info = await reg.createSkill("my-skill", "Does a thing");
    expect(info.id).toBe("my-skill");
    expect(await reg.has("my-skill")).toBe(true);
  });
});
