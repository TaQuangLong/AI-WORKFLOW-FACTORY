# Proposed test seams (pre-spec)

Prefer few, high seams. Greenfield → one primary seam + thin adapter seam.

## Seam A — Workflow runtime API (primary)

Black-box the server’s HTTP + WebSocket surface as the developer-facing control plane:

- Chat message → Draft produced (structured Steps)
- Edit Draft (add/remove/reorder/Tick/Ignore/skillId)
- Accept Draft → `current` Workflow
- Run / Stop / Continue / Re-run
- Status events over WebSocket
- Persistence readable under `.workflow/` after actions

Tests hit this API (and WS) against a temp Project Root; UI is not the primary test surface.

## Seam B — CliAdapter (secondary)

Contract tests with a **fake Adapter** (no real Cursor CLI in CI):

- `start` / stream stdout / `stop` (kill) / exit codes
- Runtime uses only this interface; real Cursor/Codex/Claude adapters are thin wrappers, smoke-tested manually or skipped in CI without binaries
