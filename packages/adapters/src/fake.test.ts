import { describe, expect, it } from "vitest";
import { FakeAdapter } from "./fake.js";

describe("FakeAdapter (Seam B)", () => {
  it("streams logs and exits 0", async () => {
    const adapter = new FakeAdapter(20);
    const lines: string[] = [];
    const result = await adapter.start(
      {
        projectRoot: "/tmp",
        skillId: "grill-with-docs",
        prompt: "hello",
        stepId: "s1",
      },
      (_stream, line) => lines.push(line),
    );
    expect(result.exitCode).toBe(0);
    expect(lines.some((l) => l.includes("grill-with-docs"))).toBe(true);
    expect(lines.some((l) => l.includes("done"))).toBe(true);
  });

  it("stop kills before completion", async () => {
    const adapter = new FakeAdapter(5_000);
    const lines: string[] = [];
    const started = adapter.start(
      {
        projectRoot: "/tmp",
        skillId: "x",
        prompt: "long",
        stepId: "s1",
      },
      (_s, line) => lines.push(line),
    );
    await new Promise((r) => setTimeout(r, 10));
    await adapter.stop();
    const result = await started;
    expect(result.signal).toBe("SIGTERM");
    expect(lines.some((l) => l.includes("stopped"))).toBe(true);
  });
});
