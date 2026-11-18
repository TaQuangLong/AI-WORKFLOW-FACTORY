# Intent: Visualizer launcher

Author: mac. Status: accepted.
Source: grill (thin launcher deferred from workflow-visualizer)

## Problem

Opening the localhost Workflow Visualizer from Cursor/VS Code means remembering the URL and juggling terminals. Developers want a one-command entry point in the editor. Starting/stopping the server from the extension is out of scope for this thin ship; the gap is “open the UI when it’s already up,” plus a repo helper so starting with the right Project Root is easy.

## Proposed outcome

1. A **minimal Cursor/VS Code extension** in this monorepo (local install, no Marketplace) with one command: **Workflow Visualizer: Open**.
2. The command opens **Simple Browser** to fixed `http://127.0.0.1:5173`.
3. If that URL is unreachable: show an **error toast** with how to start (helper / README) and **do not** open Simple Browser.
4. Project Root for Runs remains the **workspace folder** that invoked the command — the extension does not start the server; docs state the server must be started with `--project` matching that workspace.
5. A **small repo helper script** / `pnpm` command starts server+web bound to cwd when needed, then prints the URL — closes the “already running” gap without putting process management in the extension.

## Decisions (locked)

| # | Topic | Decision |
|---|--------|----------|
| 1 | Extension job | Open already-running UI only |
| 2 | Command | Workflow Visualizer: Open |
| 3 | URL | Fixed `http://127.0.0.1:5173` |
| 4 | Open target | Simple Browser |
| 5 | Unreachable | Toast + instructions; do not open |
| 6 | Project Root | Workspace folder that invoked the command (server started separately) |
| 7 | Repo helper | Start server+web for cwd if needed, then print URL |
| 8 | Packaging | In-monorepo + local install |

## Affected users and systems

- Solo developer using Cursor/VS Code on one workspace / Project Root.
- New `extensions/visualizer-launcher` (name TBD); root `pnpm` helper; README.

## Constraints

- Localhost-only; no cloud.
- No Marketplace publish this ship.
- Do not rewrite the Visualizer as an extension webview.
- Accept / Run / Adapter semantics unchanged.

## Non-goals

- Marketplace publish.
- Full webview rewrite of the app.
- Multi-root workspace picker.
- Auto-detect arbitrary ports.
- Extension-managed start/stop/kill of server processes (helper script may start; extension does not).

## Open questions

(none — accepted)
