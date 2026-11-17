import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
  DraftWorkflowInput,
  DraftWorkflowResult,
} from "./types.js";

export class FakeAdapter implements CliAdapter {
  readonly id = "fake" as const;
  private stopped = false;
  private resolveStop: (() => void) | null = null;
  /** Milliseconds to wait before succeeding if not stopped. */
  delayMs: number;
  /** When true, draftWorkflow throws (for fallback tests). */
  failDraft = false;

  constructor(delayMs = 50) {
    this.delayMs = delayMs;
  }

  async draftWorkflow(input: DraftWorkflowInput): Promise<DraftWorkflowResult> {
    if (this.failDraft) {
      throw new Error("FakeAdapter draft forced failure");
    }
    const workflow = {
      id: `wf_fake_${Date.now()}`,
      goal: input.goal,
      updatedAt: new Date().toISOString(),
      steps: [
        {
          id: "fake_draft_step",
          title: "Adapter draft step",
          skillId: "grill-with-docs",
          ticked: true,
          status: "pending",
          prompt: `From FakeAdapter for: ${input.goal}`,
        },
        {
          id: "fake_draft_step_2",
          title: "Second adapter step",
          skillId: "to-spec",
          ticked: true,
          status: "pending",
          prompt: `Spec for: ${input.goal}`,
        },
        {
          id: "fake_draft_step_3",
          title: "Third adapter step",
          skillId: "implement",
          ticked: true,
          status: "pending",
          prompt: `Implement for: ${input.goal}`,
        },
      ],
    };
    return {
      text: `\`\`\`json\n${JSON.stringify(workflow, null, 2)}\n\`\`\`\n`,
    };
  }

  async start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult> {
    this.stopped = false;
    onLog("stdout", `[fake] start skill=${input.skillId} step=${input.stepId}`);
    onLog("stdout", `[fake] ${input.prompt}`);

    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => resolve(), this.delayMs);
      this.resolveStop = () => {
        clearTimeout(timer);
        resolve();
      };
    });

    if (this.stopped) {
      onLog("stderr", "[fake] stopped");
      return { exitCode: null, signal: "SIGTERM" };
    }
    onLog("stdout", "[fake] done");
    return { exitCode: 0, signal: null };
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.resolveStop?.();
    this.resolveStop = null;
  }
}
