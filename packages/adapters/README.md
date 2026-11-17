# @awf/adapters

Pluggable CLI adapters for Workflow Visualizer.

| Adapter | Behavior |
|---------|----------|
| `fake` | CI / Seam B — timed start, stream, kill on stop; `draftWorkflow` returns deterministic fenced JSON |
| `cursor` | Run: `cursor agent --print --workspace <root> <prompt>`; Draft: separate spawn with JSON-only prompt (override `AWF_CURSOR_BIN`) |
| `codex` / `claude` | Stubs — `start` exits 1; `draftWorkflow` throws (runtime falls back) |

Stop kills the **Run** process group only (not an in-flight draft). Auth is out-of-band.
