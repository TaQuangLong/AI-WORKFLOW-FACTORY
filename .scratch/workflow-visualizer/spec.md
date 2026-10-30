## Problem Statement

Developers run multi-step agent work (Skills via AI CLIs) without a shared visual control surface. They cannot easily draft a Workflow before it runs, Tick or Ignore Steps, watch realtime status, Stop/Continue/Re-run from a simple UI, or keep Chat and Workflow state in the Project Root for teammates who clone the repo.

## Solution

A localhost TypeScript app (Vite/React UI + Node server) that chats with the developer, drafts a Skill-aligned Workflow, lets them edit and Accept Draft, then Runs Steps sequentially through pluggable CliAdapters (Cursor default; Codex and Claude supported). Status syncs over WebSocket; Stop kills the CLI process; artifacts live under `.workflow/` in the Project Root. Team share is clone + run script (no hosting, no VSIX in v1).

## User Stories

1. As a developer, I want start suggestions in Chat, so that I know what to do next when I open the app.
2. As a developer, I want to reply in a chat-like UI, so that I can refine the goal before any Workflow Runs.
3. As a developer, I want Chat persisted under `.workflow/`, so that reopening localhost restores context.
4. As a developer, I want a Draft Workflow after I submit a goal, so that nothing Runs until I approve it.
5. As a developer, I want to see every Step visualized, so that the Workflow is understandable at a glance.
6. As a developer, I want to Tick Steps to include them, so that only chosen work Runs.
7. As a developer, I want to Ignore Steps without deleting them, so that I can exclude work but keep the Draft intact.
8. As a developer, I want to add, remove, reorder, and rename Steps, so that the AI Draft is only a starting point.
9. As a developer, I want to change a Step’s Skill id, so that I can align Steps to the right Skill.
10. As a developer, I want Accept Draft before any Run, so that execution never starts accidentally.
11. As a developer, I want Accept Draft to write `.workflow/current.json`, so that machine state is durable in the Project Root.
12. As a developer, I want a sequential Run of Ticked Steps, so that only one CLI process is active at a time.
13. As a developer, I want realtime Step status on the UI, so that I can see pending/running/succeeded/failed/stopped/blocked/ignored.
14. As a developer, I want Step logs streamed to the UI, so that I can follow Adapter output live.
15. As a developer, I want to Stop a running Step, so that the Adapter CLI process is killed immediately.
16. As a developer, I want Continue after Stop to start the next Ticked pending Step, so that I can move forward without resuming the stopped Step.
17. As a developer, I want to Re-run a single Step, so that I can retry without resetting downstream Steps.
18. As a developer, I want a warning when Re-run may stale downstream results, so that I do not assume later Steps are still valid.
19. As a developer, I want each Step aligned to a Skill, so that Grill means the grill-with-docs Skill (and similarly for others).
20. As a developer, I want missing Skills to block that Step, so that I cannot Run work that has no Skill yet.
21. As a developer, I want a “create Skill with me” Chat flow when a Skill is missing, so that we can author SKILL.md into a skills directory.
22. As a developer, I want Skills discovered from configured local roots, so that `.agents/skills`, `.cursor/skills`, and custom paths work.
23. As a developer, I want the Cursor Adapter as default, so that the happy path stays simple.
24. As a developer, I want to select Codex or Claude Adapters later, so that the core stays vendor-neutral.
25. As a developer, I want Adapters to assume I am already CLI-authenticated, so that the app never handles login secrets.
26. As a developer, I want Markdown docs under `.workflow/docs/`, so that Run/Skill notes and an optional workflow.md export are saved locally.
27. As a developer, I want the server bound to one Project Root via `--project` or cwd, so that `.workflow/` location is explicit.
28. As a developer, I want teammates to clone the repo and run a start script, so that we share without hosting.
29. As a developer, I want a simple, clean UI (Chat + Steps + controls), so that the tool stays easy to use.
30. As a maintainer, I want Workflow runtime behavior tested via HTTP/WebSocket, so that CI does not depend on a real Cursor binary.
31. As a maintainer, I want CliAdapter contract tests with a fake Adapter, so that start/stream/kill behavior stays stable.
32. As a developer, I want Draft state in `.workflow/draft.json`, so that unfinished edits survive restart.
33. As a developer, I want optional history under `.workflow/history/`, so that past Runs can be inspected later (v1 may be minimal).
34. As a developer, I want ignored Steps never started by Run/Continue, so that Ignore is respected.
35. As a developer, I want blocked Steps never started until the Skill exists, so that Create-Skill unblocks them.

## Implementation Decisions

- Monorepo (pnpm): UI app, Node server, `core` (Workflow/Draft/Step/Run model + events), `adapters` (CliAdapter interface + Cursor default + Codex/Claude stubs or thin implementations).
- Persistence under Project Root: `.workflow/draft.json`, `.workflow/current.json`, `.workflow/chat.json` (or jsonl), `.workflow/docs/`, optional `.workflow/history/`.
- Transport: REST (or RPC-style HTTP) for commands; WebSocket for status and logs.
- Step statuses: `pending`, `running`, `succeeded`, `failed`, `stopped`, `ignored`, `blocked`.
- Run is sequential; one active Adapter process.
- Stop = kill process tree for that invocation only; no Skill checkpoint protocol.
- Continue after Stop = next Ticked `pending` Step; Re-run = explicit retry of a chosen Step; downstream not auto-reset.
- Draft generation uses Cursor Adapter by default; never auto-Runs.
- Accept Draft copies Draft → current Workflow; Run operates on current.
- Skill registry scans configured roots for `SKILL.md`; Step stores `skillId`.
- Missing Skill → Step `blocked` + UI create-Skill flow.
- Test seams: (A) Workflow runtime HTTP+WS against temp Project Root; (B) fake CliAdapter contract tests.
- No VS Code extension in v1 (repo + start script only).
- Glossary and ADRs 0001–0004 govern language and architecture.

## Testing Decisions

- Test external behavior only (API/WS effects and `.workflow/` files), not UI internals or private helpers.
- Primary suite: Seam A — command sequences (chat→draft→edit→accept→run→stop→continue→re-run) with fake Adapter.
- Secondary: Seam B — Adapter contract (start, stream, stop/kill, exit).
- Real Cursor/Codex/Claude binaries are out of CI; manual smoke optional.
- Prefer few high-level tests over many unit tests of internals.

## Out of Scope

- Cloud hosting, multi-tenant SaaS, live multi-user collaboration on one Run.
- Full VS Code/Cursor extension webview or marketplace VSIX.
- Skill-level graceful checkpoint on Stop.
- Parallel Step execution.
- In-app CLI authentication / secret storage.
- Generic non-Skill process DAGs.
- Switching issue trackers or CI install of Bugbot.

## Further Notes

- Domain language: Workflow, Draft, Step, Skill, Adapter, Run, Tick, Ignore, Accept Draft, Stop, Continue, Re-run, Chat, Project Root — see `GLOSSARY.md`.
- Intent: `intent/workflow-visualizer/intent.md`.
- Seams: `.scratch/workflow-visualizer/seams.md`.
