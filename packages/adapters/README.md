# @awf/adapters

Pluggable CLI adapters for Workflow Visualizer.

| Adapter | Behavior |
|---------|----------|
| `fake` | CI / Seam B — timed start, stream, kill on stop |
| `cursor` | Spawns `cursor agent --print --workspace <root> <prompt>` (override `AWF_CURSOR_BIN`) |
| `codex` / `claude` | Stubs returning exit 1 until wired |

Stop kills the process group when `detached` (Unix). Auth is out-of-band.
