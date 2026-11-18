import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
  DraftWorkflowInput,
  DraftWorkflowResult,
} from "./types.js";
import { claudeDraftArgs, draftPrompt } from "./draft-prompt.js";
import { spawnDraftCli } from "./spawn-draft.js";

/**
 * Claude adapter: real draftWorkflow; Run start/stop remain stubs this ship.
 * Override binary with AWF_CLAUDE_BIN.
 */
export class ClaudeAdapter implements CliAdapter {
  readonly id = "claude" as const;

  async start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult> {
    onLog(
      "stderr",
      `[claude] start stub — Run via Claude not implemented this ship. skill=${input.skillId}`,
    );
    return { exitCode: 1, signal: null };
  }

  async draftWorkflow(input: DraftWorkflowInput): Promise<DraftWorkflowResult> {
    const bin = process.env.AWF_CLAUDE_BIN ?? "claude";
    const prompt = draftPrompt(input.goal);
    const args = claudeDraftArgs(prompt);
    return spawnDraftCli({
      bin,
      args,
      cwd: input.projectRoot,
      label: "Claude",
    });
  }

  async stop(): Promise<void> {
    /* no-op — Run not implemented */
  }
}
