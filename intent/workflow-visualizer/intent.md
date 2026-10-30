# Intent: Workflow Visualizer

Author: mac. Status: accepted.
Source: idea

## Problem

Developers run multi-step agent workflows (Skills / AI CLI) without a shared, visual control surface. Steps are opaque, hard to pause/resume/skip, and teammates cannot see or share the same workflow state from the editor.

## Proposed outcome

A **simple local tool** that:

1. **Suggests** what the developer should do next (start guidance).
2. Lets the developer **reply in a chat-like UI** (Q&A with the agent).
3. On receiving a goal/input: **drafts a workflow first** (no auto-run); developer can **edit, tick/ignore, reorder** steps before run.
4. **Visualizes every step** on localhost UI — clean, simple UX (no hosting required for v1).
5. **Syncs workflow status in realtime** to the UI as steps run.
6. Supports **stop / continue mid-run**, and **re-run a single step**.
7. Lets the developer **run/stop any step** from the UI by invoking the aligned **AI CLI / Skill** via a **pluggable adapter**.
8. **Persists documents and workflow state** under the local project.
9. When a step maps to a Skill that does not exist yet, **work with the developer to create that Skill** before/while defining the step.

## Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Delivery | **Standalone localhost web app as core** (simplest). Optional thin VS Code command later that launches the app — not required for v1 MVP. |
| 2 | AI CLI | **Pluggable adapters**: Cursor, Codex, Claude (and stubs for more). |
| 3 | Step ↔ Skill | Each step **aligns to a Skill** (e.g. Grill → `grill-with-docs`). Missing skill → create with developer. |
| 4 | Persistence | **`.workflow/` in project root**: `draft.json` / `current.json` for machine state; `docs/` for Markdown artifacts; `history/` optional for past runs. |
| 5 | Stop | **Kill CLI process only** (no Skill checkpoint protocol in v1). |
| 6 | Team share | **Simplest now: share the repo + run script** (`npm`/`pnpm` start). VSIX / marketplace later. |

## Affected users and systems

- Primary: developers using Cursor / VS Code + Skills + AI CLIs (Cursor, Codex, Claude).
- Systems: local project filesystem (`.workflow/`); localhost UI; pluggable CLI adapters; Skills on disk.

## Constraints

- **v1 = localhost only** — no cloud hosting.
- UI: good UX but **simple** — steps + chat + run controls.
- Workflow must be **draft-then-run**.
- Steps map to Skills; adapters invoke the chosen CLI.
- Artifacts under **`.workflow/`**.
- Greenfield repo.

## Non-goals (v1)

- Hosted / cloud sync of live sessions.
- Full VS Code extension webview (deferred; thin launcher optional later).
- Skill-level graceful checkpoint on stop.
- Multi-user realtime collaboration on one live session.
- Marketplace publish.

## Open questions

(none — accepted)
