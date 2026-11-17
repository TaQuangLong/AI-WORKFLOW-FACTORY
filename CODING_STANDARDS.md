# Coding standards (review-time)

Read during review, not as always-loaded implementer context. Prefer guardrails (CI, typecheck, tests) for mechanical rules.

## Adapter defaults and drafting

Accepted intent and ADRs require Cursor as the default adapter for the happy path. If Draft generation uses a **heuristic** (or any non-LLM) path instead of the Cursor adapter, the UI and README must label that clearly as a deferred fallback — do not silently present it as Cursor drafting.

## Skill discovery in tests

Tests that assert a Skill is missing or blocked must use an isolated Project Root. Do not depend on the developer's home skill directories (`~/.agents/skills`, `~/.cursor/skills`). Production may opt into home scans only via an explicit flag.

## Workflow control semantics

Continue after Stop advances the next ticked `pending` Step; it must not resume the stopped Step. Re-run of Step N must not auto-reset or re-run downstream Steps. Accept Draft is required before Run.
