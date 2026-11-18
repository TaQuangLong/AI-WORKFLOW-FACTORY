# ADR 0008: Multi-CLI draftWorkflow (Codex + Claude)

Codex and Claude implement real `draftWorkflow` with the shared fenced-JSON prompt. Defaults: `codex exec -C <root> --sandbox read-only <prompt>` and `claude -p <prompt> --permission-mode plan` (cwd = project root). Binaries override via `AWF_CODEX_BIN` / `AWF_CLAUDE_BIN`. Run `start`/`stop` remain stubs this ship; failures still use labeled heuristic fallback.
