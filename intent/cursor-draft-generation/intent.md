# Intent: Cursor draft generation

Author: mac. Status: accepted.
Source: idea (follow-up to workflow-visualizer; CODING_STANDARDS / ADR 0001)

## Problem

Chat → Draft always uses a fixed **heuristic** step list. Intent and ADR 0001 require the **Cursor adapter** (default happy path) to draft Skill-aligned Workflows. Heuristic is unlabeled deferred behavior and does not match CODING_STANDARDS.

## Proposed outcome

When the developer sends a Chat goal:

1. The selected Adapter (default **Cursor**) is invoked to **propose a Draft** as structured Steps (`skillId`, title, prompt) — **never auto-Runs**.
2. Output is **Zod-validated** into the existing Workflow/Draft schema; invalid/partial output is repaired or rejected with a clear Chat message.
3. If Cursor CLI is missing, fails, or returns unparseable output: fall back to **heuristic Draft** and **label it in Chat + UI** as heuristic fallback (CODING_STANDARDS).
4. **FakeAdapter** (CI) can produce a deterministic structured Draft so Seam A stays green without a real Cursor binary.
5. README/UI no longer imply Cursor drafted when the heuristic path ran.

## Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Draft payload | Fenced JSON Workflow blob matching Zod schema |
| 2 | Adapter API | Dedicated `draftWorkflow` on `CliAdapter`; `start()` remains for Runs |

## Affected users and systems

- Developers using Workflow Visualizer Chat.
- `apps/server` runtime `postChat`; `@awf/adapters` (Cursor + Fake); `@awf/core` schema/heuristic as fallback; web Chat copy.

## Constraints

- Draft-then-run unchanged: drafting must not start a Run.
- Keep pluggable Adapters; Cursor default; Fake for CI.
- Project-local Skill discovery rules unchanged.
- No hosting / no VS Code extension in this ship.
- Do not weaken existing Seam A/B tests; extend or add tests for draft-via-adapter.

## Non-goals

- Streaming partial Drafts mid-CLI (final JSON parse is enough).
- Codex/Claude draft quality beyond sharing the same `draftWorkflow` contract.
- Changing Accept / Run / Stop / Continue semantics.

## Open questions

(none — accepted)
