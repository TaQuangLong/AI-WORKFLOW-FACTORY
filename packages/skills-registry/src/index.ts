import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { homedir } from "node:os";

export interface SkillInfo {
  id: string;
  dir: string;
  skillMdPath: string;
}

/** Project-local roots only (deterministic Runs / tests). */
export function defaultSkillRoots(projectRoot: string): string[] {
  return [
    path.join(projectRoot, ".agents", "skills"),
    path.join(projectRoot, ".cursor", "skills"),
  ];
}

/** Optional user-global roots (opt-in via SkillsRegistry scanHome). */
export function homeSkillRoots(): string[] {
  const home = homedir();
  return [
    path.join(home, ".agents", "skills"),
    path.join(home, ".cursor", "skills"),
  ];
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export class SkillsRegistry {
  constructor(
    readonly projectRoot: string,
    readonly extraRoots: string[] = [],
    readonly scanHome = false,
  ) {}

  roots(): string[] {
    return [
      ...defaultSkillRoots(this.projectRoot),
      ...(this.scanHome ? homeSkillRoots() : []),
      ...this.extraRoots,
    ];
  }

  async list(): Promise<SkillInfo[]> {
    const found: SkillInfo[] = [];
    const seen = new Set<string>();
    for (const root of this.roots()) {
      if (!(await exists(root))) continue;
      let entries: string[];
      try {
        entries = await readdir(root);
      } catch {
        continue;
      }
      for (const name of entries) {
        const dir = path.join(root, name);
        const skillMdPath = path.join(dir, "SKILL.md");
        if (!(await exists(skillMdPath))) continue;
        if (seen.has(name)) continue;
        seen.add(name);
        found.push({ id: name, dir, skillMdPath });
      }
    }
    return found;
  }

  async has(skillId: string): Promise<boolean> {
    const all = await this.list();
    return all.some((s) => s.id === skillId);
  }

  async resolve(skillId: string): Promise<SkillInfo | null> {
    const all = await this.list();
    return all.find((s) => s.id === skillId) ?? null;
  }

  /**
   * Create a minimal SKILL.md under project `.agents/skills/<id>/`.
   */
  async createSkill(
    skillId: string,
    description: string,
    body?: string,
  ): Promise<SkillInfo> {
    const safe = skillId.replace(/[^a-zA-Z0-9._-]/g, "-");
    const dir = path.join(this.projectRoot, ".agents", "skills", safe);
    await mkdir(dir, { recursive: true });
    const skillMdPath = path.join(dir, "SKILL.md");
    const content = [
      "---",
      `name: ${safe}`,
      `description: ${description}`,
      "---",
      "",
      `# ${safe}`,
      "",
      body?.trim() || description,
      "",
    ].join("\n");
    await writeFile(skillMdPath, content, "utf8");
    return { id: safe, dir, skillMdPath };
  }
}

export async function annotateBlockedStatuses<
  T extends { skillId: string; ticked: boolean; status: string },
>(
  registry: SkillsRegistry,
  steps: T[],
): Promise<T[]> {
  return Promise.all(
    steps.map(async (s) => {
      if (!s.ticked) return { ...s, status: "ignored" as T["status"] };
      const ok = await registry.has(s.skillId);
      if (!ok) return { ...s, status: "blocked" as T["status"] };
      if (s.status === "blocked") return { ...s, status: "pending" as T["status"] };
      return s;
    }),
  );
}
