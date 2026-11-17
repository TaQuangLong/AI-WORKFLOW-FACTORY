import { spawn, type ChildProcess } from "node:child_process";
import type {
  AdapterLogHandler,
  AdapterResult,
  AdapterStartInput,
  CliAdapter,
  DraftWorkflowInput,
  DraftWorkflowResult,
} from "./types.js";

function draftPrompt(goal: string): string {
  return [
    "You are drafting a Workflow for AI Workflow Factory.",
    "Reply with ONLY a fenced json code block containing a Workflow object.",
    "Schema: { id: string, goal: string, updatedAt: ISO string, steps: [{ id, title, skillId, ticked: boolean, status: \"pending\", prompt?: string }] }",
    "Each step must align to a Skill id (folder name with SKILL.md).",
    "Do not run any tools. Do not start implementation. Draft only.",
    `Goal: ${goal}`,
  ].join("\n");
}

/**
 * Spawns Cursor agent CLI when available.
 * Auth is out-of-band. Stop kills the Run process group only (not draft).
 * Override binary with AWF_CURSOR_BIN.
 */
export class CursorAdapter implements CliAdapter {
  readonly id = "cursor" as const;
  private runChild: ChildProcess | null = null;
  private draftChild: ChildProcess | null = null;

  async start(
    input: AdapterStartInput,
    onLog: AdapterLogHandler,
  ): Promise<AdapterResult> {
    const bin = process.env.AWF_CURSOR_BIN ?? "cursor";
    const args = [
      "agent",
      "--print",
      "--workspace",
      input.projectRoot,
      input.prompt,
    ];

    onLog("stdout", `[cursor] ${bin} ${args.join(" ")}`);

    return new Promise<AdapterResult>((resolve) => {
      const child = spawn(bin, args, {
        cwd: input.projectRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      });
      this.runChild = child;

      const onData = (stream: "stdout" | "stderr") => (buf: Buffer) => {
        for (const line of buf.toString("utf8").split(/\r?\n/)) {
          if (line.length) onLog(stream, line);
        }
      };
      child.stdout?.on("data", onData("stdout"));
      child.stderr?.on("data", onData("stderr"));

      child.on("error", (err) => {
        onLog("stderr", `[cursor] ${err.message}`);
        this.runChild = null;
        resolve({ exitCode: 127, signal: null });
      });

      child.on("close", (code, signal) => {
        this.runChild = null;
        resolve({
          exitCode: code,
          signal: signal as NodeJS.Signals | null,
        });
      });
    });
  }

  async draftWorkflow(input: DraftWorkflowInput): Promise<DraftWorkflowResult> {
    const bin = process.env.AWF_CURSOR_BIN ?? "cursor";
    const prompt = draftPrompt(input.goal);
    const args = ["agent", "--print", "--workspace", input.projectRoot, prompt];

    return new Promise<DraftWorkflowResult>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const child = spawn(bin, args, {
        cwd: input.projectRoot,
        env: process.env,
        stdio: ["ignore", "pipe", "pipe"],
        detached: process.platform !== "win32",
      });
      this.draftChild = child;

      child.stdout?.on("data", (buf: Buffer) => chunks.push(buf));
      child.stderr?.on("data", (buf: Buffer) => chunks.push(buf));

      child.on("error", (err) => {
        this.draftChild = null;
        reject(err);
      });

      child.on("close", (code) => {
        this.draftChild = null;
        const text = Buffer.concat(chunks).toString("utf8");
        if (code !== 0 && !text.includes("{")) {
          reject(
            new Error(
              `Cursor draft exited ${code}: ${text.slice(0, 400) || "(empty)"}`,
            ),
          );
          return;
        }
        resolve({ text });
      });
    });
  }

  async stop(): Promise<void> {
    const child = this.runChild;
    if (!child?.pid) return;
    try {
      if (process.platform !== "win32") {
        process.kill(-child.pid, "SIGTERM");
      } else {
        child.kill("SIGTERM");
      }
    } catch {
      child.kill("SIGTERM");
    }
  }
}
