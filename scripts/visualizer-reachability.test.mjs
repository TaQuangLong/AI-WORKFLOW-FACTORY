import { createServer } from "node:http";
import { describe, expect, it } from "vitest";
import { isReachable } from "./visualizer-reachability.mjs";

describe("isReachable", () => {
  it("returns true for a live listener", async () => {
    const server = createServer((_req, res) => {
      res.writeHead(200);
      res.end("ok");
    });
    await new Promise((r) => server.listen(0, "127.0.0.1", r));
    const { port } = /** @type {import('node:net').AddressInfo} */ (
      server.address()
    );
    expect(await isReachable(`http://127.0.0.1:${port}`)).toBe(true);
    await new Promise((r) => server.close(r));
  });

  it("returns false for a closed port", async () => {
    expect(await isReachable("http://127.0.0.1:9", 300)).toBe(false);
  });
});
