export type AdapterLogHandler = (
  stream: "stdout" | "stderr",
  line: string,
) => void;

export interface AdapterStartInput {
  projectRoot: string;
  skillId: string;
  prompt: string;
  stepId: string;
}

export interface AdapterResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
}

export interface CliAdapter {
  readonly id: "cursor" | "codex" | "claude" | "fake";
  start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult>;
  /** Kill the active CLI process (and process group when possible). */
  stop(): Promise<void>;
}
