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

export interface DraftWorkflowInput {
  projectRoot: string;
  goal: string;
}

export interface DraftWorkflowResult {
  /** Full CLI stdout (should include fenced JSON Workflow). */
  text: string;
}

export interface CliAdapter {
  readonly id: "cursor" | "codex" | "claude" | "fake";
  start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult>;
  /**
   * Propose a Draft Workflow as text containing fenced JSON.
   * Must not start a Run. Uses a process separate from start()/stop().
   */
  draftWorkflow(input: DraftWorkflowInput): Promise<DraftWorkflowResult>;
  /** Kill the active CLI process (and process group when possible). */
  stop(): Promise<void>;
}
