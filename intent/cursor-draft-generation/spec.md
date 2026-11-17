## Problem Statement

After a Chat goal, the Workflow Visualizer always builds the Draft from a fixed heuristic list. Developers expect the selected AI CLI (Cursor by default) to propose Skill-aligned Steps, per ADR 0001 and CODING_STANDARDS. Heuristic fallback is unlabeled, so the UI can imply Cursor drafted when it did not.

## Solution

Add `draftWorkflow` on CliAdapter. On Chat, call the selected adapter to return a fenced JSON Workflow, Zod-validate it, annotate blocked Skills, and save the Draft without running. FakeAdapter returns deterministic JSON for CI. On adapter failure or bad JSON, use heuristicDraft and label the Chat/UI as heuristic fallback.

## User Stories

1. As a developer, I want Chat to ask the selected Adapter to draft a Workflow, so that Steps reflect an AI proposal aligned to Skills.
2. As a developer, I want the Draft to be Zod-validated, so that bad CLI output cannot corrupt `.workflow/draft.json`.
3. As a developer, I want drafting never to start a Run, so that draft-then-run stays intact.
4. As a developer, I want a clear Chat (and UI) label when heuristic fallback is used, so that I know Cursor did not draft.
5. As a developer, I want FakeAdapter to draft deterministically in tests/CI, so that Seam A stays green without Cursor installed.
6. As a developer, I want CursorAdapter.draftWorkflow to spawn a draft-only prompt expecting fenced JSON, so that the happy path matches ADR 0005.
7. As a developer, I want Codex/Claude stubs to fail draftWorkflow so runtime falls back with a label, so that stubs do not pretend success.
8. As a maintainer, I want draft vs run to not corrupt each other’s process state, so that Stop on a Run does not kill an in-flight draft (or vice versa).
9. As a developer, I want README to describe adapter drafting and labeled heuristic fallback, so that docs match behavior.
10. As a maintainer, I want existing Seam A/B tests still passing, with new coverage for adapter draft and labeled fallback.

## Implementation Decisions

- Extend `CliAdapter` with `draftWorkflow({ projectRoot, goal }) => Promise<{ stdout: string } | Workflow-like>` returning text containing fenced JSON, or a structured result Fake can return directly.
- Core: `parseWorkflowJsonFromText(text)` extracts fenced JSON and parses with WorkflowSchema (or a DraftSteps schema then wrap).
- Runtime `postChat`: try `adapter.draftWorkflow`; on success validate + annotateBlocked + save; on failure heuristic + assistant message includes “heuristic fallback”.
- FakeAdapter.draftWorkflow returns fixed three-ish steps as fenced JSON (or object).
- CursorAdapter.draftWorkflow uses spawn with a prompt that demands only fenced JSON Workflow; reuse kill/stop patterns; prefer a dedicated child process distinct from Run’s child.
- Web: show a small draft-source badge/hint when snapshot/chat indicates heuristic.
- ADR 0005 records JSON + draftWorkflow decision.

## Testing Decisions

- Test external behavior at runtime/API and adapter contract.
- Seam A: FakeAdapter postChat yields steps from Fake draft content; inject failing draft adapter → heuristic + labeled chat message; still no Run started.
- Seam B: FakeAdapter.draftWorkflow returns parseable JSON.
- Do not require real Cursor binary in CI.

## Out of Scope

- Streaming partial drafts; Codex/Claude real draft implementations; Accept/Run/Stop semantics changes; VS Code extension.

## Further Notes

- Intent: `intent/cursor-draft-generation/intent.md`
- Explore: `.scratch/cursor-draft-generation/explore.md`
- Parent feature: workflow-visualizer
