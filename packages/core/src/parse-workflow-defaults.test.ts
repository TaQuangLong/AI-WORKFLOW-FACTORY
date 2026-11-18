import { describe, expect, it } from "vitest";
import { parseWorkflowJsonFromText } from "./parse-workflow-json.js";

describe("parseWorkflowJsonFromText draft defaults", () => {
  it("defaults adapter steps to ticked pending (not ignored)", () => {
    const text = `
\`\`\`json
{
  "id": "wf_test",
  "goal": "smoke",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "steps": [
    {
      "id": "smoke-check-step",
      "title": "Smoke check",
      "skillId": "grill-with-docs",
      "ticked": false,
      "status": "ignored"
    }
  ]
}
\`\`\`
`;
    const wf = parseWorkflowJsonFromText(text);
    expect(wf.steps[0]?.ticked).toBe(true);
    expect(wf.steps[0]?.status).toBe("pending");
  });
});
