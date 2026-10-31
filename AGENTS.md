# AI Workflow Factory

## Agent skills

### Issue tracker

GitHub Issues on TaQuangLong/AI-WORKFLOW-FACTORY via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Defaults: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

## Commands

- `pnpm install` — install workspace deps
- `pnpm dev` — server (8787) + web (5173) in parallel
- `pnpm --filter @awf/server start -- --project <path> --adapter fake|cursor --port 8787`
- `pnpm test` — Seam A/B and package tests
- `pnpm typecheck` — TypeScript across packages
