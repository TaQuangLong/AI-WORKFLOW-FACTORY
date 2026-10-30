import type { Step, Workflow } from "./schema.js";
import { createEmptyDraft } from "./store.js";

/** Structured Draft when no LLM binary is available. Never starts a Run. */
export function heuristicDraft(goal: string): Workflow {
  const draft = createEmptyDraft(goal);
  const steps: Step[] = [
    {
      id: "step_grill",
      title: "Grill the idea",
      skillId: "grill-with-docs",
      ticked: true,
      status: "pending",
      prompt: `Grill and sharpen: ${goal}`,
    },
    {
      id: "step_spec",
      title: "Write a spec",
      skillId: "to-spec",
      ticked: true,
      status: "pending",
      prompt: `Turn the goal into a spec: ${goal}`,
    },
    {
      id: "step_plan",
      title: "Plan implementation",
      skillId: "implement",
      ticked: true,
      status: "pending",
      prompt: `Plan and implement against the spec for: ${goal}`,
    },
  ];
  return { ...draft, steps };
}
