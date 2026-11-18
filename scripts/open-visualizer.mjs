#!/usr/bin/env node
/**
 * Start Workflow Visualizer server+web for cwd if needed, then print the UI URL.
 * Extension stays open-only; this helper owns process start.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  API_HEALTH_URL,
  VISUALIZER_URL,
  isReachable,
} from "./visualizer-reachability.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = process.cwd();
const adapter = process.env.AWF_ADAPTER ?? "fake";

/** @type {import('node:child_process').ChildProcess[]} */
const children = [];

function spawnDetached(command, args, opts = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...opts.env },
    stdio: "ignore",
    detached: true,
    shell: process.platform === "win32",
  });
  child.unref();
  children.push(child);
  return child;
}

async function waitFor(url, label, attempts = 60) {
  for (let i = 0; i < attempts; i++) {
    if (await isReachable(url, 500)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error(`Timed out waiting for ${label} at ${url}`);
  return false;
}

async function main() {
  const webUp = await isReachable(VISUALIZER_URL);
  const apiUp = await isReachable(API_HEALTH_URL);

  if (!apiUp) {
    console.error(
      `Starting server (adapter=${adapter}, project=${project})…`,
    );
    spawnDetached("pnpm", [
      "start:server",
      "--",
      "--project",
      project,
      "--adapter",
      adapter,
      "--port",
      "8787",
    ]);
  }

  if (!webUp) {
    console.error("Starting web (Vite :5173)…");
    spawnDetached("pnpm", ["--filter", "@awf/web", "dev"]);
  }

  if (!webUp || !apiUp) {
    const okWeb = await waitFor(VISUALIZER_URL, "web");
    const okApi = await waitFor(API_HEALTH_URL, "API");
    if (!okWeb || !okApi) process.exit(1);
  }

  console.log(VISUALIZER_URL);
  console.log(
    `Project Root for server should be: ${project} (passed via --project when this helper starts it).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
