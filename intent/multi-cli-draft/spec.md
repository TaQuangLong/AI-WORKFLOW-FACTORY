## Problem Statement

Codex and Claude adapters still stub `draftWorkflow`, so Chat → Draft falls back to labeled heuristic whenever those adapters are selected. Cursor drafting works; multi-CLI drafting does not.

## Solution

Implement real `draftWorkflow` for Codex and Claude using the shared fenced JSON Workflow prompt and `parseWorkflowJsonFromText`. Keep `start`/`stop` as stubs. Failures continue to use labeled heuristic fallback. Env overrides `AWF_CODEX_BIN` / `AWF_CLAUDE_BIN`.

## User Stories

1. As a developer, I want Codex `draftWorkflow` to spawn `codex exec -C <projectRoot> --sandbox read-only <prompt>`, so Chat can draft via Codex.
2. As a developer, I want Claude `draftWorkflow` to spawn `claude -p <prompt>` with cwd = projectRoot, so Chat can draft via Claude.
3. As a developer, I want the same fenced JSON contract and ticked/`pending` defaults as Cursor, so parse/normalize stay shared.
4. As a developer, I want missing CLI / bad output to use labeled heuristic fallback, so Chat UX stays one path.
5. As a developer, I want Codex/Claude Run (`start`) to remain an explicit stub failure this ship, so we do not pretend Run works.
6. As a developer, I want `AWF_CODEX_BIN` / `AWF_CLAUDE_BIN` overrides, so custom install paths work.
7. As a maintainer, I want argv/contract unit tests without real CLIs in CI, so Seam A stays Fake-green.

## Implementation Decisions

- Extract shared `draftPrompt` (from Cursor) for reuse by Codex/Claude/Cursor.
- Replace stub `draftWorkflow` with spawn implementations; leave stub `start`/`stop`.
- Claude: add `--permission-mode plan` when supported to bias read-only drafting.
- README: note Codex/Claude draft support + Run still stub + env vars.
- Optional ADR: multi-CLI draft argv defaults.

## Testing Decisions

- Unit-test argv builders / draftWorkflow with injected fake spawn or temp script binaries.
- Existing Fake Seam A unchanged; stub `start` tests remain.
- No real Codex/Claude in CI.

## Out of Scope

- Real Codex/Claude Run; streaming drafts; Accept/Run semantics changes; hosting/Marketplace.

## Further Notes

- Intent: `intent/multi-cli-draft/intent.md`
