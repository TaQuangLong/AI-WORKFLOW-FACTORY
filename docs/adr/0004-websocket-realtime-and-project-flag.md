# WebSocket realtime and explicit project root

Status and logs sync over a single WebSocket. The server binds to one project via `--project <path>` (default: process cwd); v1 has no multi-project picker. Machine state stays in `.workflow/*.json`; `docs/` is Markdown artifacts only.
