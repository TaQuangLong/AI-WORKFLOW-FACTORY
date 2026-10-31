# Evidence: workflow-visualizer

| Ticket / slice | Command | Exit | Excerpt | Time |
|----------------|---------|------|---------|------|
| scaffold+packages | `pnpm install` | 0 | 6 workspace projects | ~6s |
| Seam B adapters | `pnpm --filter @awf/adapters test` | 0 | 2 passed | ~1s |
| core persist | `pnpm --filter @awf/core test` | 0 | 3 passed | ~1s |
| skills-registry | `pnpm --filter @awf/skills-registry test` | 0 | 2 passed | ~1s |
| Seam A runtime | `pnpm --filter @awf/server test` | 0 | 2 passed (stop/continue/rerun + blocked skill) | ~0.5s |
| full suite | `pnpm test` | 0 | all packages green | ~5s |
| typecheck | `pnpm typecheck` | 0 | all packages | ~3s |
| web build | `pnpm --filter @awf/web build` | 0 | vite built | ~1s |

Manual smoke: `pnpm --filter @awf/server start -- --project "$PWD" --adapter fake` + `pnpm --filter @awf/web dev` → http://127.0.0.1:5173

