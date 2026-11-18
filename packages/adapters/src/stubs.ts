import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
  DraftWorkflowInput,
  DraftWorkflowResult,
} from "./types.js";

/**
 * Legacy stub adapters kept for Seam B assertions that import from stubs.js.
 * Production createAdapter() uses codex.ts / claude.ts (real draftWorkflow).
 */
abstract class StubAdapter implements CliAdapter {
  abstract readonly id: "codex" | "claude";

  async start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult> {
    onLog(
      "stderr",
      `[${this.id}] stub only — configure a real binary later. skill=${input.skillId}`,
    );
    return { exitCode: 1, signal: null };
  }

  async draftWorkflow(_input: DraftWorkflowInput): Promise<DraftWorkflowResult> {
    throw new Error(
      `[${this.id}] draftWorkflow stub — not implemented; use Cursor or Fake`,
    );
  }

  async stop(): Promise<void> {
    /* no-op */
  }
}

export class CodexAdapter extends StubAdapter {
  readonly id = "codex" as const;
}

export class ClaudeAdapter extends StubAdapter {
  readonly id = "claude" as const;
}
