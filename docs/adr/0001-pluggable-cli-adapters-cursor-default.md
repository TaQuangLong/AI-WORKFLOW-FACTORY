# Pluggable CLI adapters with Cursor as default

We need to invoke different AI CLIs without baking one vendor into the core. Core talks only to an Adapter interface; Cursor, Codex, and Claude are plugins. v1 defaults drafting and runs to the Cursor adapter for the simplest happy path; other adapters stay selectable later.
