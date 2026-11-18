## Problem Statement

After Chat → Draft → Accept → Run, the solo developer cannot inspect past Runs. `.workflow/history/` exists but is never written; only the latest `current.json` remains.

## Solution

On every Run segment end (startRun / continueRun / rerunStep leaving `running`), persist a History Entry `{ savedAt, workflow }` as a timestamped JSON file under `.workflow/history/`. Expose a newest-first History UI to view entries and Load as Draft (confirm overwrite; Accept still required before Run).

## User Stories

1. As a developer, I want a History Entry written when a Run finishes (success, fail, or Stop), so I can inspect outcomes later.
2. As a developer, I want a History Entry written after a single-Step Re-run finishes, so partial retries are also inspectable.
3. As a developer, I want each entry to store a Workflow snapshot only, so files stay small and simple.
4. As a developer, I want entries as individual JSON files under `.workflow/history/`, so the filesystem is the source of truth.
5. As a developer, I want a History list in the UI (newest first), so I do not have to open files by hand.
6. As a developer, I want to open an entry read-only in the UI, so I can see Step statuses for that past Run.
7. As a developer, I want Load as Draft from a History Entry, so I can edit and Accept before running again.
8. As a developer, I want a confirm when Load as Draft would replace an existing Draft, so I do not overwrite silently.
9. As a developer, I want Chat left unchanged on Load as Draft, so History does not rewrite the thread.
10. As a developer, I want corrupt history files skipped in the list, so one bad file does not break History.
11. As a maintainer, I want Seam A coverage for history write + Load as Draft with FakeAdapter, so CI stays green without Cursor.

## Implementation Decisions

- Core: `HistoryEntrySchema` `{ id, savedAt, workflow }` where `id` is the filename; store `saveHistoryEntry` / `listHistoryEntries` / `loadHistoryEntry`.
- Filename: `<ISO-with-colons-as-dashes>_<sanitizedWorkflowId>.json`.
- Runtime: after `startRun`, `continueRun`, and `rerunStep` complete their work, snapshot `current` into history (one entry per segment end, not per intermediate Step inside a multi-step loop).
- HTTP: `GET /api/history`, `GET /api/history/:id`, `POST /api/history/:id/load-as-draft`.
- Web: History panel — list, select for read-only view, Load as Draft with `window.confirm` if Draft exists.
- Glossary: History / History Entry. Optional ADR for snapshot-at-run-end.

## Testing Decisions

- Core store tests: save → list newest-first; skip corrupt file; load by id.
- Seam A: FakeAdapter run writes ≥1 history file; load-as-draft replaces draft.
- No real Cursor in CI.

## Out of Scope

- Logs/Chat in entries; auto-prune; diffs; restore→current without Accept; cloud; VSIX.

## Further Notes

- Intent: `intent/run-history/intent.md`
