# Plan: Run history

Spec: intent/run-history/spec.md. Intent accepted.

## Files that change

- `packages/core/src/schema.ts` — HistoryEntrySchema
- `packages/core/src/store.ts` — history save/list/load
- `packages/core` tests — new file for history
- `apps/server/src/runtime.ts` — snapshot after run segments; loadHistoryAsDraft
- `apps/server/src/http.ts` — history routes
- `apps/server` tests — new Seam A history file
- `apps/web` — types, api, History UI, styles
- `GLOSSARY.md` — History / History Entry
- `README.md` — persistence bullet
- `docs/adr/0006-…` — snapshot History Entry at Run end

## Order of work

1. Core schema + store + tests
2. Runtime + HTTP + Seam A
3. Web UI
4. Glossary / README / ADR
5. `pnpm test` + `typecheck`

## Risks

- Writing history after every Step vs once per Run segment → write only when startRun/continueRun/rerunStep finish
- Filename collisions in same ms → include workflow id; rare collision appends pid

## Proof

- `pnpm test` / `typecheck` green
- Fake run creates history JSON; Load as Draft round-trip
