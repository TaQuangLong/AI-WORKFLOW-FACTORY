import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
  DraftWorkflowInput,
  DraftWorkflowResult,
} from "./types.js";
import { codexDraftArgs, draftPrompt } from "./draft-prompt.js";
import { spawnDraftCli } from "./spawn-draft.js";

/**
 * Codex adapter: real draftWorkflow; Run start/stop remain stubs this ship.
 * Override binary with AWF_CODEX_BIN.
 */
export class CodexAdapter implements CliAdapter {
  readonly id = "codex" as const;

  async start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult> {
    onLog(
      "stderr",
      `[codex] start stub — Run via Codex not implemented this ship. skill=${input.skillId}`,
    );
    return { exitCode: 1, signal: null };
  }

  async draftWorkflow(input: DraftWorkflowInput): Promise<DraftWorkflowResult> {
    const bin = process.env.AWF_CODEX_BIN ?? "codex";
    const prompt = draftPrompt(input.goal);
    const args = codexDraftArgs(input.projectRoot, prompt);
    return spawnDraftCli({
      bin,
      args,
      cwd: input.projectRoot,
      label: "Codex",
    });
  }

  async stop(): Promise<void> {
    /* no-op — Run not implemented */
  }
}
