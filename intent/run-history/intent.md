# Intent: Run history

Author: mac. Status: accepted.
Source: grill (follow-up to workflow-visualizer; empty `.workflow/history/`)

## Problem

After Chat → Draft → Accept → Run, the solo developer cannot inspect past Runs. `.workflow/history/` is created but never written; `current.json` only reflects the latest Workflow. “What happened last time?” requires memory or ad-hoc file copies.

## Proposed outcome

1. Whenever a Run leaves `running` (full Run success, mid-Run fail, Stop, or single-Step **Re-run** finish), persist a **History Entry**: Workflow snapshot only as `{ savedAt, workflow }` under `.workflow/history/`.
2. On-disk: one JSON file per entry named with ISO timestamp + workflow id (e.g. `2026-11-18T02-58-27Z_smoke-check.json`). No index file; no auto-prune (manual delete OK).
3. Visualizer **History** UI: newest-first list; select an entry for read-only Step view; files remain source of truth. Skip corrupt/unreadable files in the list.
4. **Load as Draft**: copy the entry’s Workflow into the editable Draft (explicit confirm if a Draft already exists). Chat unchanged. **Accept Draft** still required before Run — never restore straight to `current`.

## Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Trigger | Snapshot when Run leaves `running` (including Re-run) |
| 2 | Payload | Workflow snapshot only — no logs, no Chat |
| 3 | Disk | Timestamped JSON files under `.workflow/history/`; no index; no auto-prune |
| 4 | Surface | UI list + files |
| 5 | Actions | View + Load as Draft (confirm overwrite); not restore→current |
| 6 | Language | **History** / **History Entry** (avoid run log, archive, session) |
| 7 | Boundaries | Localhost only; solo one Project Root; no cloud / VSIX this ship |

## Affected users and systems

- Solo developer using Workflow Visualizer on one Project Root.
- `@awf/core` persistence; `apps/server` runtime Run/Re-run completion; `apps/web` History UI; existing `.workflow/history/` directory.

## Constraints

- Accept-before-Run unchanged.
- Do not weaken existing Seam A/B tests; add coverage for history write + Load as Draft.
- FakeAdapter / CI must exercise history without a real Cursor binary.
- Glossary terms: History, History Entry.

## Non-goals

- Logs or Chat inside History Entries.
- Auto-prune / retention policy.
- Diff between entries.
- Restore History Entry directly to `current` without Accept.
- Cloud sync, multi-user collab, VS Code extension / VSIX.

## Open questions

(none — accepted)
