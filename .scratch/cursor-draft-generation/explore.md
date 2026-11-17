# Explore: cursor-draft-generation

## Goal

Replace unlabeled `heuristicDraft` in `postChat` with Adapter.`draftWorkflow` (Cursor default; Fake for CI); Zod-parse fenced JSON; labeled heuristic fallback.

## Modules

| Module | Change |
|--------|--------|
| `packages/adapters` | Add `draftWorkflow(goal, projectRoot)` to `CliAdapter`; Fake returns fixed JSON; Cursor spawns with draft prompt; stubs fail → caller falls back |
| `packages/core` | JSON extract + Zod parse helpers; keep `heuristicDraft` as fallback |
| `apps/server` | `postChat` calls adapter draft → validate → annotateBlocked → save; Chat message notes source (adapter vs heuristic) |
| `apps/web` | Show draft source label when heuristic |
| Tests | Fake draftWorkflow Seam B; Seam A postChat uses Fake and gets structured draft (not only heuristic shape) |

## Seams (proposed)

- **A (primary):** `postChat` via runtime/API → Draft persisted; with FakeAdapter, steps come from Fake draft JSON; with forced failure, heuristic + labeled message.
- **B:** `FakeAdapter.draftWorkflow` returns parseable Workflow JSON; Cursor unit-tested only if mocked spawn (optional).

## Risks

- Cursor CLI output shape drift → strict fenced JSON + fallback.
- Draft call blocks Chat UI → acceptable v1; show “drafting…” later if needed.
- Concurrent Run + Draft sharing one Adapter instance → use separate adapter instance or mutex for draft vs run.

## Open

None blocking.
