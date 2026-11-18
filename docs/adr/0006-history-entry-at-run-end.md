# ADR 0006: History Entry at Run end

When a Run segment ends (`startRun`, `continueRun`, or `rerunStep`), persist a History Entry (Workflow snapshot only) under `.workflow/history/`. Files are the source of truth; the UI lists them newest-first and can Load as Draft (Accept still required before Run).
