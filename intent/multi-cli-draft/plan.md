# Plan: Multi-CLI draft (Codex + Claude)

Spec: intent/multi-cli-draft/spec.md. Intent accepted.

## Files that change

- `packages/adapters/src/draft-prompt.ts` (or shared helper) — shared prompt
- `packages/adapters/src/cursor.ts` — use shared prompt
- `packages/adapters/src/codex.ts` / `claude.ts` — real draftWorkflow; stub start/stop
- `packages/adapters/src/stubs.ts` / `index.ts` — wire real adapters
- Adapter tests — argv + draft with fake binaries
- `README.md` — document draft support + env vars
- Optional `docs/adr/0008-…`

## Order of work

1. Shared draft prompt extract
2. Codex + Claude draftWorkflow implementations
3. Tests (fake binaries / argv)
4. README (+ ADR)
5. `pnpm test` / `typecheck`

## Proof

- Selecting codex/claude with a fake bin that prints fenced JSON → adapter draftSource
- Missing bin → heuristic label
- `start` still stub-fails
