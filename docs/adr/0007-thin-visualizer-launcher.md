# ADR 0007: Thin Visualizer launcher

The editor integration is open-only: a minimal extension opens Simple Browser to `http://127.0.0.1:5173` when reachable. Process start lives in a repo `pnpm open:visualizer` helper (server `--project` = cwd), not in the extension. Local install only; no Marketplace this ship.
