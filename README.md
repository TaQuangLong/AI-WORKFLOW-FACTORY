# AI Workflow Factory — Workflow Visualizer

Localhost control surface for Skill-aligned agent Workflows: Chat → Draft → Accept → sequential Run via pluggable CLI adapters (Cursor default; fake for CI).

## Quick start

```bash
pnpm install
pnpm --filter @awf/server start -- --project "$PWD" --adapter fake --port 8787
# other terminal
pnpm --filter @awf/web dev
```

Open http://127.0.0.1:5173

Or both: `pnpm dev` (server defaults to cwd + fake adapter).

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

## Spec / intent

See `intent/workflow-visualizer/` and GitHub issue #1.
