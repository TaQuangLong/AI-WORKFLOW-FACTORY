# AI Workflow Factory — Workflow Visualizer

Localhost control surface for Skill-aligned agent Workflows: Chat → Draft → Accept → sequential Run via pluggable CLI adapters (Cursor default; fake for CI).

## Quick start

```bash
pnpm install
pnpm start:server -- --project "$PWD" --adapter fake --port 8787
# other terminal
pnpm --filter @awf/web dev
```

Open **http://127.0.0.1:5173** (Vite binds IPv4).

Or both: `pnpm dev` (server defaults to cwd; pick adapter via `AWF_ADAPTER` / `--adapter`).

Prefer **`pnpm open:visualizer`** from the Project Root you want bound: starts server (`--project` = cwd) + web if needed, then prints `http://127.0.0.1:5173`. Adapter via `AWF_ADAPTER` (default `fake`).

Optional Cursor/VS Code command **Workflow Visualizer: Open** (local extension under `extensions/visualizer-launcher`) opens Simple Browser to that URL when the UI is already up — it does not start processes. See `extensions/visualizer-launcher/README.md`.

Chat drafting calls the selected Adapter’s `draftWorkflow` (Cursor by default; also Codex and Claude; Fake in CI). The CLI must return a fenced JSON Workflow. If that fails, a **labeled heuristic fallback** is used (shown in Chat and the UI header) — never silently presented as Cursor-drafted.

Binary overrides: `AWF_CURSOR_BIN`, `AWF_CODEX_BIN`, `AWF_CLAUDE_BIN`. Codex/Claude **Run** (`start`) is still a stub this ship — use Cursor or Fake to execute Steps.

## Verify

```bash
pnpm test
pnpm typecheck
```

## Persistence

Under the Project Root:

- `.workflow/draft.json` — editable Draft
- `.workflow/current.json` — accepted Workflow
- `.workflow/chat.json` — Chat
- `.workflow/docs/` — Markdown artifacts (`workflow.md`)
- `.workflow/history/` — History Entries (Workflow snapshots at Run end)

## Spec / intent

See `intent/workflow-visualizer/`, `intent/run-history/`, `intent/visualizer-launcher/`, `intent/multi-cli-draft/`, and GitHub issues.
