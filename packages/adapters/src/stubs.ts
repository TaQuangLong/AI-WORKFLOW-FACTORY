import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
} from "./types.js";

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
