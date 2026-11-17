# Plan: Cursor draft generation

Spec: intent/cursor-draft-generation/spec.md / GitHub #5. Intent accepted.

## Files that change

- `packages/adapters/src/types.ts` — add `draftWorkflow`
- `packages/adapters/src/fake.ts` — deterministic fenced JSON draft
- `packages/adapters/src/cursor.ts` — draft prompt + spawn
- `packages/adapters/src/stubs.ts` — draftWorkflow fails
- `packages/adapters` tests — Seam B draftWorkflow
- `packages/core` — `parseWorkflowJsonFromText` (+ test)
- `apps/server/src/runtime.ts` — postChat uses draftWorkflow + labeled fallback
- `apps/server` tests — adapter draft + heuristic label (new file if hooks block existing)
- `apps/web` — draft source hint
- `README.md` — document adapter draft + fallback
- `docs/adr/0005-…` — already drafted

## Order of work

1. Core parse helper + Fake draftWorkflow + adapter types (US2, US5, US6 contract)
2. Runtime postChat wiring + labeled fallback (US1, US3, US4, US7, US8)
3. CursorAdapter.draftWorkflow implementation (US6)
4. Web label + README (US4, US9)
5. Tests green Seam A/B extensions (US10)

## Risks

- Cursor output drift → fenced JSON + fallback
- Shared adapter child for draft+run → separate child / no shared active draft with run
- Existing runtime.test assumes heuristic step ids — Fake draft must stay compatible or tests assert via Fake content

## Proof

- `pnpm test` / `typecheck` green
- Fake postChat draft ≠ unlabeled heuristic-only path; failing draft → chat contains “heuristic”
- Manual optional: `--adapter cursor` once CLI present
