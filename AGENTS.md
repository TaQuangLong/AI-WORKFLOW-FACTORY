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
- `pnpm dev` — server (8787) + web; open **http://127.0.0.1:5173** (Vite binds IPv4)
- `pnpm start:server -- --project <path> --adapter fake|cursor --port 8787` — clean flag forwarding (prefer over `pnpm --filter … start --`)
- `pnpm test` — Seam A/B and package tests
- `pnpm typecheck` — TypeScript across packages
- CI: `.github/workflows/ci.yml` runs `test` + `typecheck` on PR/push to main

## Review

Reviewer reads `CODING_STANDARDS.md` and `REVIEW.md`.

## Shipping

Greenfield / empty-remote first push: see `docs/agents/shipping.md`.
