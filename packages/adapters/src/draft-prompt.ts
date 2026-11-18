/** Shared fenced-JSON Workflow draft prompt for Cursor / Codex / Claude. */
export function draftPrompt(goal: string): string {
  return [
    "You are drafting a Workflow for AI Workflow Factory.",
    "Reply with ONLY a fenced json code block containing a Workflow object.",
    "Schema: { id: string, goal: string, updatedAt: ISO string, steps: [{ id, title, skillId, ticked: true, status: \"pending\", prompt?: string }] }",
    "Every step MUST have ticked: true and status: \"pending\". Do not emit ignored or unticked steps — the developer Ignores in the UI after draft.",
    "Each step must align to a Skill id (folder name with SKILL.md).",
    "Do not run any tools. Do not start implementation. Draft only.",
    `Goal: ${goal}`,
  ].join("\n");
}

export function codexDraftArgs(projectRoot: string, prompt: string): string[] {
  return ["exec", "-C", projectRoot, "--sandbox", "read-only", prompt];
}

export function claudeDraftArgs(prompt: string): string[] {
  return ["-p", prompt, "--permission-mode", "plan"];
}

export function cursorDraftArgs(
  projectRoot: string,
  prompt: string,
): string[] {
  return ["agent", "--print", "--trust", "--workspace", projectRoot, prompt];
}
