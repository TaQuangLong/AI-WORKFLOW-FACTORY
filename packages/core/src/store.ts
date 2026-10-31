import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import {
  ChatMessageSchema,
  WorkflowSchema,
  type ChatMessage,
  type Step,
  type Workflow,
} from "./schema.js";
import { z } from "zod";

const ChatFileSchema = z.object({
  messages: z.array(ChatMessageSchema),
});

export function workflowDir(projectRoot: string): string {
  return path.join(projectRoot, ".workflow");
}

export function docsDir(projectRoot: string): string {
  return path.join(workflowDir(projectRoot), "docs");
}

async function ensureDirs(projectRoot: string): Promise<void> {
  await mkdir(docsDir(projectRoot), { recursive: true });
  await mkdir(path.join(workflowDir(projectRoot), "history"), {
    recursive: true,
  });
}

async function atomicWrite(filePath: string, data: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, data, "utf8");
  await rename(tmp, filePath);
}

export async function readJsonIfExists<S extends z.ZodTypeAny>(
  filePath: string,
  schema: S,
): Promise<z.output<S> | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return schema.parse(JSON.parse(raw)) as z.output<S>;
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export class WorkflowStore {
  constructor(readonly projectRoot: string) {}

  draftPath(): string {
    return path.join(workflowDir(this.projectRoot), "draft.json");
  }

  currentPath(): string {
    return path.join(workflowDir(this.projectRoot), "current.json");
  }

  chatPath(): string {
    return path.join(workflowDir(this.projectRoot), "chat.json");
  }

  async init(): Promise<void> {
    await ensureDirs(this.projectRoot);
  }

  async loadDraft(): Promise<Workflow | null> {
    return readJsonIfExists(this.draftPath(), WorkflowSchema);
  }

  async saveDraft(workflow: Workflow): Promise<Workflow> {
    const parsed = WorkflowSchema.parse({
      ...workflow,
      updatedAt: new Date().toISOString(),
    });
    await this.init();
    await atomicWrite(this.draftPath(), JSON.stringify(parsed, null, 2));
    return parsed;
  }

  async loadCurrent(): Promise<Workflow | null> {
    return readJsonIfExists(this.currentPath(), WorkflowSchema);
  }

  async saveCurrent(workflow: Workflow): Promise<Workflow> {
    const parsed = WorkflowSchema.parse({
      ...workflow,
      updatedAt: new Date().toISOString(),
    });
    await this.init();
    await atomicWrite(this.currentPath(), JSON.stringify(parsed, null, 2));
    return parsed;
  }

  /** Accept Draft: copy draft → current. Does not start a Run. */
  async acceptDraft(): Promise<Workflow> {
    const draft = await this.loadDraft();
    if (!draft) throw new Error("No draft to accept");
    const current: Workflow = {
      ...draft,
      id: draft.id,
      steps: draft.steps.map((s) => ({
        ...s,
        status: s.ticked
          ? s.status === "blocked"
            ? "blocked"
            : "pending"
          : "ignored",
      })),
      updatedAt: new Date().toISOString(),
    };
    return this.saveCurrent(current);
  }

  async loadChat(): Promise<ChatMessage[]> {
    const file = await readJsonIfExists(this.chatPath(), ChatFileSchema);
    return file?.messages ?? [];
  }

  async appendChat(message: ChatMessage): Promise<ChatMessage[]> {
    const messages = await this.loadChat();
    messages.push(ChatMessageSchema.parse(message));
    await this.init();
    await atomicWrite(
      this.chatPath(),
      JSON.stringify({ messages }, null, 2),
    );
    return messages;
  }

  async saveChat(messages: ChatMessage[]): Promise<void> {
    await this.init();
    await atomicWrite(
      this.chatPath(),
      JSON.stringify({ messages: z.array(ChatMessageSchema).parse(messages) }, null, 2),
    );
  }

  async exportWorkflowMarkdown(workflow: Workflow): Promise<string> {
    await this.init();
    const lines = [
      `# Workflow: ${workflow.goal}`,
      "",
      `Updated: ${workflow.updatedAt}`,
      "",
      "## Steps",
      "",
      ...workflow.steps.map(
        (s, i) =>
          `${i + 1}. **${s.title}** (\`${s.skillId}\`) — ${s.ticked ? "ticked" : "ignored"} · ${s.status}`,
      ),
      "",
    ];
    const out = path.join(docsDir(this.projectRoot), "workflow.md");
    await writeFile(out, lines.join("\n"), "utf8");
    return out;
  }

  async writeDoc(name: string, content: string): Promise<string> {
    await this.init();
    const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const out = path.join(docsDir(this.projectRoot), safe);
    await writeFile(out, content, "utf8");
    return out;
  }
}

export function updateStep(
  workflow: Workflow,
  stepId: string,
  patch: Partial<Step>,
): Workflow {
  return {
    ...workflow,
    steps: workflow.steps.map((s) =>
      s.id === stepId ? { ...s, ...patch, id: s.id } : s,
    ),
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyDraft(goal: string): Workflow {
  return {
    id: `wf_${Date.now()}`,
    goal,
    steps: [],
    updatedAt: new Date().toISOString(),
  };
}

export function nextRunnableStep(workflow: Workflow): Step | null {
  return (
    workflow.steps.find(
      (s) =>
        s.ticked &&
        s.status !== "ignored" &&
        s.status !== "blocked" &&
        s.status !== "succeeded" &&
        (s.status === "pending" || s.status === "failed" || s.status === "stopped"),
    ) ?? null
  );
}

/** Next ticked pending after a stop (Continue semantics — not resume). */
export function nextPendingAfterStop(
  workflow: Workflow,
  stoppedStepId: string,
): Step | null {
  const idx = workflow.steps.findIndex((s) => s.id === stoppedStepId);
  const rest = idx >= 0 ? workflow.steps.slice(idx + 1) : workflow.steps;
  return (
    rest.find(
      (s) => s.ticked && s.status === "pending",
    ) ?? null
  );
}
