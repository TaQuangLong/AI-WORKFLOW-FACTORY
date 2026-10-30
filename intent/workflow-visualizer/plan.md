# Plan: Workflow Visualizer (from intent + spec #1)

Spec: intent/workflow-visualizer/spec.md / GitHub #1. Seams: .scratch/workflow-visualizer/seams.md.

## Architecture

pnpm monorepo: apps/web (Vite React) + apps/server (HTTP/WS) + packages/core + packages/adapters + packages/skills-registry. Persist under ProjectRoot/.workflow. FakeAdapter in CI; CursorAdapter for real CLI.

## Files that change (create)

- package.json, pnpm-workspace.yaml, root scripts
- packages/core, packages/adapters, packages/skills-registry
- apps/server, apps/web
- AGENTS.md Commands section
- Colocated vitest Seam A/B tests

## Order of work

1. Scaffold monorepo
2. Core model + persistence + Accept Draft
3. CliAdapter + FakeAdapter + CursorAdapter + stubs
4. Skills registry
5. Server runtime (HTTP + WS + sequential Run)
6. Draft generation (Cursor default, no auto-run)
7. Web UI
8. Missing-Skill UX
9. Docs export
10. Verify pack

## Risks

- Cursor CLI argv unknown → FakeAdapter for CI
- Orphan processes → kill process group
- Draft schema drift → Zod
- Continue = next pending (not resume) — Seam A

## Proof

Seam A/B tests green; typecheck + test exit 0; manual pnpm dev smoke.
