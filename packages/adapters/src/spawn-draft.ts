import { spawn } from "node:child_process";

/** Spawn a draft-only CLI; collect stdout+stderr text. */
export function spawnDraftCli(input: {
  bin: string;
  args: string[];
  cwd: string;
  label: string;
}): Promise<{ text: string }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const child = spawn(input.bin, input.args, {
      cwd: input.cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: process.platform !== "win32",
    });

    child.stdout?.on("data", (buf: Buffer) => chunks.push(buf));
    child.stderr?.on("data", (buf: Buffer) => chunks.push(buf));

    child.on("error", (err) => reject(err));

    child.on("close", (code) => {
      const text = Buffer.concat(chunks).toString("utf8");
      if (code !== 0 && !text.includes("{")) {
        reject(
          new Error(
            `${input.label} draft exited ${code}: ${text.slice(0, 400) || "(empty)"}`,
          ),
        );
        return;
      }
      resolve({ text });
    });
  });
}
