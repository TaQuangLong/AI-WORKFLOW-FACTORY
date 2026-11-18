# Plan: Visualizer launcher

Spec: intent/visualizer-launcher/spec.md. Intent accepted.

## Files that change

- `extensions/visualizer-launcher/` — package.json, tsconfig, src/extension.ts, README
- `scripts/open-visualizer.mjs` (+ small reachability helper / test)
- root `package.json` — `open:visualizer`
- `README.md`, ADR 0007, glossary if needed

## Order of work

1. Scripts helper + test
2. Extension scaffold + compile
3. README / ADR
4. Verify

## Proof

- Helper: when 5173 down, starts stack (manual) or dry unit for probe
- Extension compiles; command registered
- `pnpm test` / `typecheck` green
