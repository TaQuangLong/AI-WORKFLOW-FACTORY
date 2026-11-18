## Problem Statement

Developers in Cursor/VS Code must remember `http://127.0.0.1:5173` and keep terminals straight to open the Workflow Visualizer. They want a one-command open when the UI is already running, plus a repo helper that starts server+web with the correct Project Root.

## Solution

Ship a minimal in-monorepo extension with **Workflow Visualizer: Open** that probes `http://127.0.0.1:5173` and opens Simple Browser only if reachable; otherwise an error toast with start instructions. Add `pnpm open:visualizer` that starts server+web for cwd when needed and prints the URL. Local install only — no Marketplace.

## User Stories

1. As a developer, I want a command **Workflow Visualizer: Open**, so I can open the UI from the Command Palette.
2. As a developer, I want the command to open Simple Browser at `http://127.0.0.1:5173`, so the UI stays in the editor.
3. As a developer, I want an error toast (and no Simple Browser) when 5173 is down, so I know to start the stack.
4. As a developer, I want toast text to mention `pnpm open:visualizer` / README, so I can recover quickly.
5. As a developer, I want `pnpm open:visualizer` to start server+web bound to cwd when needed, then print the URL.
6. As a developer, I want the helper to pass `--project` = cwd to the server, so Project Root matches the workspace.
7. As a maintainer, I want the extension under `extensions/visualizer-launcher` with local install docs, so we skip Marketplace.
8. As a maintainer, I want a small automated check for the helper’s reachability/start messaging path, so CI covers the script without VS Code.

## Implementation Decisions

- Extension: `extensions/visualizer-launcher` — one command, HTTP probe to 5173 (short timeout), `simpleBrowser.show` on success.
- Fixed URL only; no settings/port probe.
- Helper: `scripts/open-visualizer.mjs` + root script `open:visualizer`; starts `start:server -- --project <cwd>` and `@awf/web` dev if web down; waits for 5173; prints URL.
- README: local install (`code --install-extension` / Cursor equivalent path) + helper usage.
- ADR 0007 records open-only extension + helper starts processes.

## Testing Decisions

- Node test or script self-check for `isReachable` against a temp listener / refused port.
- No VS Code integration test harness required this ship.
- Existing `pnpm test` / `typecheck` remain green (extension typecheck separate or included).

## Out of Scope

- Marketplace; webview app rewrite; multi-root picker; auto ports; extension start/stop of processes.

## Further Notes

- Intent: `intent/visualizer-launcher/intent.md`
