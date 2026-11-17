import { describe, expect, it } from "vitest";
import { parseWorkflowJsonFromText } from "./parse-workflow-json.js";

describe("parseWorkflowJsonFromText", () => {
  it("parses fenced JSON Workflow", () => {
    const text = `
Here is a draft:
\`\`\`json
{
  "id": "wf_test",
  "goal": "ship it",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "steps": [
    {
      "id": "fake_draft_step",
      "title": "From adapter",
      "skillId": "grill-with-docs",
      "ticked": true,
      "status": "pending"
    }
  ]
}
\`\`\`
`;
    const wf = parseWorkflowJsonFromText(text);
    expect(wf.goal).toBe("ship it");
    expect(wf.steps[0]?.id).toBe("fake_draft_step");
  });

  it("rejects missing JSON", () => {
    expect(() => parseWorkflowJsonFromText("no json here")).toThrow(/No JSON/);
  });
});
