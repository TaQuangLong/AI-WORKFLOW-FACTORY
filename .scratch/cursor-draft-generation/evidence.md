# Evidence: cursor-draft-generation

| Ticket | Command | Exit | Excerpt |
|--------|---------|------|---------|
| T1–T4 | `pnpm test` | 0 | core 5, adapters 5, server 4 (incl. draft-chat + runtime) |
| T1–T4 | `pnpm typecheck` | 0 | all packages |

Seam A: draft-chat.test adapter path + heuristic label. Seam B: draft-workflow.test Fake JSON parse.
Compliance: ADR 0005, intent cursor-draft-generation, CODING_STANDARDS labeled heuristic.
