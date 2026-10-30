import path from "node:path";
import { WorkflowRuntime } from "./runtime.js";
import { createServer } from "./http.js";
import type { AdapterId } from "@awf/adapters";

function argValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

const projectRoot = path.resolve(
  argValue("--project") ?? process.env.AWF_PROJECT ?? process.cwd(),
);
const port = Number(argValue("--port") ?? process.env.AWF_PORT ?? 8787);
const adapterId = (argValue("--adapter") ??
  process.env.AWF_ADAPTER ??
  "cursor") as AdapterId;

const runtime = new WorkflowRuntime(projectRoot, adapterId);
await runtime.ensureChatBootstrapped();
const app = createServer(runtime, port);
await app.listen();

console.log(
  `Workflow Visualizer server on http://127.0.0.1:${port} project=${projectRoot} adapter=${adapterId}`,
);
