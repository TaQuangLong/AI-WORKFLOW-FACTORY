import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
} from "./types.js";

export class FakeAdapter implements CliAdapter {
  readonly id = "fake" as const;
  private stopped = false;
  private resolveStop: (() => void) | null = null;
  /** Milliseconds to wait before succeeding if not stopped. */
  delayMs: number;

  constructor(delayMs = 50) {
    this.delayMs = delayMs;
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
