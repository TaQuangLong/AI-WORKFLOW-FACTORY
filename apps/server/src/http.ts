import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import type { WorkflowRuntime } from "./runtime.js";
import type { AdapterId } from "@awf/adapters";
import type { Workflow } from "@awf/core";

async function readJson<T>(req: http.IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  if (!chunks.length) return {} as T;
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(data);
}

export function createServer(runtime: WorkflowRuntime, port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.method === "OPTIONS") {
      send(res, 204, {});
      return;
    }

    const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
    const path = url.pathname;

    try {
      if (req.method === "GET" && path === "/api/health") {
        send(res, 200, { ok: true });
        return;
      }

      if (req.method === "GET" && path === "/api/snapshot") {
        await runtime.ensureChatBootstrapped();
        send(res, 200, await runtime.snapshot());
        return;
      }

      if (req.method === "POST" && path === "/api/adapter") {
        const body = await readJson<{ adapterId: AdapterId }>(req);
        runtime.setAdapter(body.adapterId);
        send(res, 200, { adapterId: runtime.getAdapterId() });
        return;
      }

      if (req.method === "POST" && path === "/api/chat") {
        const body = await readJson<{ content: string }>(req);
        const result = await runtime.postChat(body.content);
        send(res, 200, result);
        return;
      }

      if (req.method === "PUT" && path === "/api/draft") {
        const body = await readJson<{ workflow: Workflow }>(req);
        const draft = await runtime.saveDraft(body.workflow);
        send(res, 200, { draft });
        return;
      }

      if (req.method === "POST" && path === "/api/accept") {
        const current = await runtime.acceptDraft();
        send(res, 200, { current });
        return;
      }

      if (req.method === "POST" && path === "/api/run") {
        void runtime.startRun().catch((err) => {
          console.error(err);
        });
        send(res, 202, { ok: true });
        return;
      }

      if (req.method === "POST" && path === "/api/stop") {
        await runtime.stop();
        send(res, 200, { ok: true });
        return;
      }

      if (req.method === "POST" && path === "/api/continue") {
        void runtime.continueRun().catch((err) => {
          console.error(err);
        });
        send(res, 202, { ok: true });
        return;
      }

      if (req.method === "POST" && path === "/api/rerun") {
        const body = await readJson<{ stepId: string }>(req);
        void runtime.rerunStep(body.stepId).catch((err) => {
          console.error(err);
        });
        send(res, 202, { ok: true });
        return;
      }

      if (req.method === "POST" && path === "/api/skills/create") {
        const body = await readJson<{
          skillId: string;
          description: string;
          body?: string;
        }>(req);
        const result = await runtime.createMissingSkill(
          body.skillId,
          body.description,
          body.body,
        );
        send(res, 200, result);
        return;
      }

      if (req.method === "GET" && path === "/api/skills") {
        send(res, 200, { skills: await runtime.skills.list() });
        return;
      }

      send(res, 404, { error: "not found" });
    } catch (err) {
      send(res, 400, {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  const sockets = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    sockets.add(ws);
    ws.on("close", () => sockets.delete(ws));
  });

  runtime.onEvent((event) => {
    const payload = JSON.stringify(event);
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) ws.send(payload);
    }
  });

  return {
    listen(): Promise<number> {
      return new Promise((resolve) => {
        server.listen(port, "127.0.0.1", () => resolve(port));
      });
    },
    close(): Promise<void> {
      return new Promise((resolve, reject) => {
        wss.close();
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
    server,
  };
}
