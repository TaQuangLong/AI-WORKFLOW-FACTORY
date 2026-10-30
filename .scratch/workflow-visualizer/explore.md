# Explore: workflow-visualizer

## Goal

Localhost app: chat → draft workflow (Skill-aligned steps) → human edit → run via pluggable CLI adapters → realtime UI → stop (kill process) / continue / re-run / skip. Persist under `.workflow/`.

## Modules (proposed)

| Module | Responsibility |
|--------|----------------|
| `apps/web` | Simple UI: chat, step list, controls, status |
| `apps/server` (or `packages/server`) | HTTP + WebSocket; draft generation orchestration; process supervisor; FS persistence |
| `packages/core` | Workflow model: draft/current state machine, step schema, events |
| `packages/adapters` | Pluggable `CliAdapter`: Cursor / Codex / Claude — spawn, stream logs, kill |
| `packages/skills-registry` | Resolve step → Skill path/name; detect missing; prompt create flow |
| `.workflow/` (project data) | `draft.json`, `current.json`, `docs/`, `history/` |

## Seams

1. **UI ↔ server**: REST for commands (draft, run, stop, skip, tick); WebSocket/SSE for status + logs.
2. **Server ↔ adapters**: common interface `start(step) / stop() / onStdout / onExit`.
3. **Step ↔ Skill**: step carries `skillId` + optional args; registry maps to skill folder / invoke args per adapter.
4. **Persistence**: atomic write of JSON state; docs as Markdown files.
5. **Draft generation**: LLM (via selected adapter or local prompt) returns structured steps — never auto-executes.

## Tech lean (explore only — plan will lock)

- TypeScript monorepo (pnpm workspaces) — matches Skills/agent ecosystem.
- Vite + React for UI (simple, fast).
- Node server with `ws` or SSE.
- `zod` for workflow schema.

## Risks

- Adapter differences (Cursor vs Codex vs Claude CLI flags, streaming, auth) — largest unknown.
- Mapping “Skill” across CLIs that don’t share Cursor’s skill format.
- Process kill may leave orphan child processes.
- Draft quality / schema drift without strong validation.
- Empty repo: need AGENTS.md + verify scripts as we go.

## Open questions for grill

- Exact workflow state machine (statuses, legal transitions).
- Who generates the draft (which adapter by default)?
- Skill creation UX when missing.
- Single active run vs queue.
- How “continue” resumes after kill (next pending step vs same step).
