import {
  WorkflowStore,
  heuristicDraft,
  nextPendingAfterStop,
  updateStep,
  type ChatMessage,
  type Step,
  type Workflow,
  type WorkflowEvent,
} from "@awf/core";
import {
  createAdapter,
  type AdapterId,
  type CliAdapter,
} from "@awf/adapters";
import {
  SkillsRegistry,
  annotateBlockedStatuses,
} from "@awf/skills-registry";
import { randomUUID } from "node:crypto";

export type RunState = "idle" | "running" | "stopped";

export class WorkflowRuntime {
  readonly store: WorkflowStore;
  readonly skills: SkillsRegistry;
  private adapter: CliAdapter;
  private adapterId: AdapterId;
  private listeners = new Set<(e: WorkflowEvent) => void>();
  private runState: RunState = "idle";
  private activeStepId: string | null = null;
  private stopRequested = false;

  constructor(
    projectRoot: string,
    adapterId: AdapterId = "fake",
  ) {
    this.store = new WorkflowStore(projectRoot);
    this.skills = new SkillsRegistry(projectRoot);
    this.adapterId = adapterId;
    this.adapter = createAdapter(adapterId);
  }

  get projectRoot(): string {
    return this.store.projectRoot;
  }

  getAdapterId(): AdapterId {
    return this.adapterId;
  }

  setAdapter(id: AdapterId): void {
    this.adapterId = id;
    this.adapter = createAdapter(id);
  }

  /** Test/CI hook to inject a custom adapter instance. */
  replaceAdapter(adapter: CliAdapter): void {
    this.adapterId = adapter.id;
    this.adapter = adapter;
  }

  onEvent(fn: (e: WorkflowEvent) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private emit(e: WorkflowEvent): void {
    for (const fn of this.listeners) fn(e);
  }

  private emitRun(): void {
    this.emit({
      type: "run",
      state: this.runState,
      activeStepId: this.activeStepId,
    });
  }

  async snapshot(): Promise<{
    projectRoot: string;
    adapterId: AdapterId;
    draft: Workflow | null;
    current: Workflow | null;
    chat: ChatMessage[];
    run: { state: RunState; activeStepId: string | null };
  }> {
    return {
      projectRoot: this.projectRoot,
      adapterId: this.adapterId,
      draft: await this.store.loadDraft(),
      current: await this.store.loadCurrent(),
      chat: await this.store.loadChat(),
      run: { state: this.runState, activeStepId: this.activeStepId },
    };
  }

  private async suggestOpener(): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content:
        "What should we build or change? Describe the goal — I'll draft a Skill-aligned Workflow for you to edit before anything runs.",
      createdAt: new Date().toISOString(),
    };
    await this.store.appendChat(msg);
    this.emit({ type: "chat", message: msg });
    return msg;
  }

  async ensureChatBootstrapped(): Promise<ChatMessage[]> {
    await this.store.init();
    let chat = await this.store.loadChat();
    if (chat.length === 0) {
      await this.suggestOpener();
      chat = await this.store.loadChat();
    }
    return chat;
  }

  async postChat(content: string): Promise<{
    user: ChatMessage;
    assistant: ChatMessage;
    draft: Workflow;
  }> {
    const user: ChatMessage = {
      id: randomUUID(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    await this.store.appendChat(user);
    this.emit({ type: "chat", message: user });

    let draft = heuristicDraft(content);
    draft.steps = await annotateBlockedStatuses(this.skills, draft.steps);
    draft = await this.store.saveDraft(draft);
    this.emit({ type: "workflow", kind: "draft", workflow: draft });

    const assistant: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: `Draft ready with ${draft.steps.length} steps. Edit, Tick/Ignore, then Accept Draft before Run. Blocked steps need a Skill created first.`,
      createdAt: new Date().toISOString(),
    };
    await this.store.appendChat(assistant);
    this.emit({ type: "chat", message: assistant });

    return { user, assistant, draft };
  }

  async saveDraft(workflow: Workflow): Promise<Workflow> {
    let steps = await annotateBlockedStatuses(this.skills, workflow.steps);
    const saved = await this.store.saveDraft({ ...workflow, steps });
    this.emit({ type: "workflow", kind: "draft", workflow: saved });
    return saved;
  }

  async acceptDraft(): Promise<Workflow> {
    const current = await this.store.acceptDraft();
    await this.store.exportWorkflowMarkdown(current);
    this.emit({ type: "workflow", kind: "current", workflow: current });
    return current;
  }

  async createMissingSkill(
    skillId: string,
    description: string,
    body?: string,
  ): Promise<{ skillId: string; draft: Workflow | null }> {
    await this.skills.createSkill(skillId, description, body);
    const draft = await this.store.loadDraft();
    if (!draft) return { skillId, draft: null };
    const updated = await this.saveDraft(draft);
    const note: ChatMessage = {
      id: randomUUID(),
      role: "assistant",
      content: `Created Skill \`${skillId}\`. Blocked steps using it are refreshed.`,
      createdAt: new Date().toISOString(),
    };
    await this.store.appendChat(note);
    this.emit({ type: "chat", message: note });
    return { skillId, draft: updated };
  }

  private async persistCurrent(wf: Workflow): Promise<Workflow> {
    const saved = await this.store.saveCurrent(wf);
    this.emit({ type: "workflow", kind: "current", workflow: saved });
    return saved;
  }

  private async runStep(step: Step): Promise<"succeeded" | "failed" | "stopped"> {
    let current = await this.store.loadCurrent();
    if (!current) throw new Error("No accepted Workflow");

    if (step.status === "blocked" || !step.ticked) {
      throw new Error(`Step ${step.id} is not runnable`);
    }

    this.activeStepId = step.id;
    this.runState = "running";
    this.stopRequested = false;
    this.emitRun();

    current = await this.persistCurrent(
      updateStep(current, step.id, { status: "running" }),
    );
    this.emit({ type: "step", stepId: step.id, status: "running" });

    const result = await this.adapter.start(
      {
        projectRoot: this.projectRoot,
        skillId: step.skillId,
        prompt: step.prompt ?? `${step.title}: ${current.goal}`,
        stepId: step.id,
      },
      (stream, line) => {
        this.emit({ type: "log", stepId: step.id, stream, line });
      },
    );

    current = (await this.store.loadCurrent())!;
    let status: "succeeded" | "failed" | "stopped";
    if (this.stopRequested || result.signal) {
      status = "stopped";
    } else if (result.exitCode === 0) {
      status = "succeeded";
    } else {
      status = "failed";
    }

    await this.persistCurrent(updateStep(current, step.id, { status }));
    this.emit({ type: "step", stepId: step.id, status });

    this.activeStepId = null;
    this.runState = status === "stopped" ? "stopped" : "idle";
    this.emitRun();
    return status;
  }

  /** Run all ticked pending steps sequentially until blocked/stop/fail. */
  async startRun(): Promise<void> {
    if (this.runState === "running") throw new Error("Already running");
    let current = await this.store.loadCurrent();
    if (!current) throw new Error("Accept Draft before Run");

    for (;;) {
      current = (await this.store.loadCurrent())!;
      const next = current.steps.find(
        (s) => s.ticked && s.status === "pending",
      );
      if (!next) break;
      if (await this.skills.has(next.skillId) === false) {
        await this.persistCurrent(
          updateStep(current, next.id, { status: "blocked" }),
        );
        this.emit({ type: "step", stepId: next.id, status: "blocked" });
        break;
      }
      const outcome = await this.runStep(next);
      if (outcome !== "succeeded") break;
    }
  }

  async stop(): Promise<void> {
    this.stopRequested = true;
    await this.adapter.stop();
  }

  /** Continue = next ticked pending after the stopped step (not resume). */
  async continueRun(): Promise<void> {
    if (this.runState === "running") throw new Error("Already running");
    let current = await this.store.loadCurrent();
    if (!current) throw new Error("No accepted Workflow");

    const stopped = [...current.steps].reverse().find((s) => s.status === "stopped");
    const next = stopped
      ? nextPendingAfterStop(current, stopped.id)
      : current.steps.find((s) => s.ticked && s.status === "pending");

    if (!next) {
      this.runState = "idle";
      this.emitRun();
      return;
    }

    for (;;) {
      current = (await this.store.loadCurrent())!;
      const step =
        current.steps.find((s) => s.id === next.id && s.status === "pending") ??
        current.steps.find((s) => s.ticked && s.status === "pending");
      if (!step) break;
      const outcome = await this.runStep(step);
      if (outcome !== "succeeded") break;
      // after first continue step, keep going through remaining pending
      const more = (await this.store.loadCurrent())!.steps.find(
        (s) => s.ticked && s.status === "pending",
      );
      if (!more) break;
    }
  }

  /** Re-run one step; does not reset downstream. */
  async rerunStep(stepId: string): Promise<void> {
    if (this.runState === "running") throw new Error("Already running");
    let current = await this.store.loadCurrent();
    if (!current) throw new Error("No accepted Workflow");
    const step = current.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`Unknown step ${stepId}`);
    if (!step.ticked) throw new Error("Cannot re-run an ignored step");
    if (!(await this.skills.has(step.skillId))) {
      current = await this.persistCurrent(
        updateStep(current, stepId, { status: "blocked" }),
      );
      throw new Error(`Skill ${step.skillId} missing`);
    }
    current = await this.persistCurrent(
      updateStep(current, stepId, { status: "pending" }),
    );
    this.emit({
      type: "log",
      stream: "system",
      line: `Re-run ${stepId}: downstream steps were not reset and may be stale.`,
    });
    await this.runStep({ ...step, status: "pending" });
  }
}
