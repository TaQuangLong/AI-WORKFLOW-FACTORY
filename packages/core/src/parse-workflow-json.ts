import { WorkflowSchema, type Workflow } from "./schema.js";

/**
 * Extract fenced ```json ... ``` or first `{...}` object, then Zod-parse as Workflow.
 * Adapter drafts default to included Steps (ticked + pending); Ignore is a UI action.
 */
export function parseWorkflowJsonFromText(text: string): Workflow {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? extractBalancedObject(text);
  if (!candidate) {
    throw new Error("No JSON Workflow found in adapter output");
  }
  let raw: unknown;
  try {
    raw = JSON.parse(candidate);
  } catch {
    throw new Error("Adapter draft JSON failed to parse");
  }
  const parsed = WorkflowSchema.parse(raw);
  return {
    ...parsed,
    steps: parsed.steps.map((s) => ({
      ...s,
      ticked: true,
      status: s.status === "blocked" ? "blocked" : "pending",
    })),
  };
}

function extractBalancedObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
