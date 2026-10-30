import type { Snapshot, Workflow } from "./types";

export async function fetchSnapshot(): Promise<Snapshot> {
  const res = await fetch("/api/snapshot");
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postChat(content: string) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function saveDraft(workflow: Workflow) {
  const res = await fetch("/api/draft", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workflow }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function acceptDraft() {
  const res = await fetch("/api/accept", { method: "POST" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function runWorkflow() {
  await fetch("/api/run", { method: "POST" });
}

export async function stopWorkflow() {
  await fetch("/api/stop", { method: "POST" });
}

export async function continueWorkflow() {
  await fetch("/api/continue", { method: "POST" });
}

export async function rerunStep(stepId: string) {
  await fetch("/api/rerun", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stepId }),
  });
}

export async function setAdapter(adapterId: string) {
  await fetch("/api/adapter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ adapterId }),
  });
}

export async function createSkill(
  skillId: string,
  description: string,
  body?: string,
) {
  const res = await fetch("/api/skills/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillId, description, body }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function connectEvents(onMessage: (data: unknown) => void): () => void {
  // Talk to the API host directly so Vite's WS proxy is not required.
  const ws = new WebSocket("ws://127.0.0.1:8787/ws");
  ws.onmessage = (ev) => {
    try {
      onMessage(JSON.parse(String(ev.data)));
    } catch {
      /* ignore */
    }
  };
  return () => ws.close();
}
