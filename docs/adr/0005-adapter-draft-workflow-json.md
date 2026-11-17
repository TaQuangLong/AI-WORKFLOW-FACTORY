# Adapter draftWorkflow returns fenced Zod JSON

Draft generation is a first-class Adapter method (`draftWorkflow`), separate from Run `start()`. The CLI must return a fenced JSON Workflow matching the core Zod schema. FakeAdapter returns deterministic JSON for CI; Cursor uses a draft-only prompt. On failure or unparseable output, the runtime falls back to heuristicDraft and must label that path in Chat/UI.
