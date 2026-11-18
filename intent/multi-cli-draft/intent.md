# Intent: Multi-CLI draft (Codex + Claude)

Author: mac. Status: accepted.
Source: grill (follow-up to cursor-draft-generation; Adapter stubs)

## Problem

Selecting Codex or Claude in the Visualizer still hits stub `draftWorkflow` implementations that throw, so Chat → Draft always falls back to the **labeled heuristic**. Cursor drafting works; multi-CLI drafting does not match the pluggable Adapter promise for the draft path.

## Proposed outcome

1. Real **`draftWorkflow`** for **Codex** and **Claude** using the same fenced JSON Workflow contract as Cursor (shared prompt; `parseWorkflowJsonFromText` + ticked/`pending` defaults).
2. On missing binary, non-zero exit, or unparseable output: existing **labeled heuristic fallback** — no new Chat UX fork.
3. **`start` / `stop` remain stubs** for Codex/Claude this ship (clear failure); Run stays Cursor/Fake until a later intent.
4. Binary overrides via `AWF_CODEX_BIN` / `AWF_CLAUDE_BIN` (mirror `AWF_CURSOR_BIN`).
5. Auth remains out-of-band; CI does not require real Codex/Claude binaries (argv/contract unit tests + Fake Seam A).

## Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Scope | `draftWorkflow` only; `start`/`stop` stay stubs |
| 2 | Both CLIs | Codex and Claude in one ship |
| 3 | Codex argv | `codex exec -C <projectRoot> --sandbox read-only <draftPrompt>` |
| 4 | Claude argv | `claude -p <draftPrompt>` with cwd = projectRoot (plan/read-only permission flag if added) |
| 5 | Prompt / parse | Shared with Cursor; existing heuristic label on failure |
| 6 | Env | `AWF_CODEX_BIN`, `AWF_CLAUDE_BIN` |
| 7 | Auth | Out-of-band |
| 8 | Boundaries | Localhost; solo one Project Root |

## Affected users and systems

- Solo developer selecting Codex/Claude adapter in Chat.
- `@awf/adapters` (replace stub draft paths); runtime `postChat` unchanged in behavior; README adapter notes.

## Constraints

- Draft-then-run unchanged; drafting must not start a Run.
- Do not weaken existing Seam A/B; add argv/contract coverage without real CLIs in CI.
- Cursor default happy path unchanged.

## Non-goals

- Real Codex/Claude **Run** (`start`/`stop`).
- Streaming partial Drafts.
- Changing Accept / Stop / Continue / Re-run semantics.
- Marketplace / hosting / VSIX beyond existing launcher.

## Open questions

(none — accepted)
