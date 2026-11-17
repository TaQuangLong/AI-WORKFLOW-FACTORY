# Shipping (greenfield / empty remote)

When the GitHub remote has **no commits** yet and you need a draft PR:

1. Create and push an empty (or README-only) `main` first.
2. Branch from that `main` for the feature work.
3. Open the draft PR `feature` → `main`.

Do **not** push an orphan feature branch as the only history and then invent an unrelated empty `main` afterward — GitHub rejects PRs with no common history.

Include `intent/<slug>/` on the feature branch. Ask before push; human owns merge.
