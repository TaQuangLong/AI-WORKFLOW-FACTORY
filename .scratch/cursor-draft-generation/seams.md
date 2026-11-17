# Seams: cursor-draft-generation

## Seam A — postChat / runtime (primary)

Black-box WorkflowRuntime (or HTTP): Chat → Draft via FakeAdapter.draftWorkflow; failing draft → heuristic + labeled message; drafting does not start a Run.

## Seam B — CliAdapter.draftWorkflow (secondary)

FakeAdapter.draftWorkflow returns fenced JSON parseable by core Zod helpers.
