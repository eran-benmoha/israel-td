# Agent Playbook (Mandatory)

This file defines mandatory rules for any future agent/contributor working on this project.

## 1) Non-negotiable workflow rules

1. Read this file and `docs/adr/` before making behavior-changing edits.
2. If gameplay behavior changes, update docs in the same PR/commit set.
3. Do not remove or overwrite existing ADR history; add a new ADR instead.
4. Keep GitHub Pages deployment working after each significant change.

## 2) Product and gameplay guardrails

1. Map is Middle East context; Israel is the defended area.
2. Hostile wave sources are modeled by territories/factions currently represented in code:
   - Gaza Strip (Hamas)
   - South Lebanon (Hezbollah)
   - Western Yemen (Houthis)
   - Iran (Iran regime)
3. Wave pacing uses a running simulation clock and randomized intervals (not fixed interval countdown).
4. Missile visuals and trail colors communicate missile type/range classes.
5. Israel regional overlays and city markers are part of map readability and should remain visible unless explicitly redesigned.

## 3) UX rules

1. Mobile-first interactions are required.
2. Drag + pinch zoom (mobile) and wheel zoom (desktop) must remain functional.
3. Debug and shop menus must:
   - support show/hide toggles
   - stay within viewport bounds
   - be usable on short-height screens

## 4) Economy and systems rules

1. Resource HUD includes:
   - money
   - morale
   - population
   - army
   - economy (derived)
2. Purchase menu remains category-based:
   - air defense
   - air force
   - ground troops
3. Purchases must update resources and UI state consistently.

## 5) Technical constraints

1. Stack remains Phaser + Vite + JavaScript ES modules unless superseded by ADR.
2. Browser `localStorage` is the only persistence approach unless superseded by ADR.
3. Map assets must remain legally redistributable with attribution file updates.
4. Keep data-driven configs in `src/data/` as source of truth for levels/factions/units/map metadata.
5. Preserve modular system boundaries (`MapSystem`, `InputSystem`, `WaveSystem`, `ResourceSystem`, `FactionSystem`, `UiSystem`) unless formally redesigned.

## 6) Agent team workflow

This project uses a structured multi-agent pipeline. All agents must follow
the conventions in [`docs/AGENT_TEAM_PIPELINE.md`](./AGENT_TEAM_PIPELINE.md):

1. **Branches** — use `feature/`, `fix/`, `docs/`, `chore/` prefixes.
2. **Pull requests** — use the PR template at `.github/PULL_REQUEST_TEMPLATE.md`.
3. **Labels** — apply type, scope, status, and priority labels (defined in `.github/labels.yml`).
4. **Commits** — follow conventional format: `<type>(<scope>): <summary>`.
5. **Reviews** — use `[MUST]`, `[SHOULD]`, `[NIT]` prefixes in review comments.
6. **Handoffs** — push all work, update PR description, and leave a structured handoff comment before ending a session.
7. **Issues** — use the issue templates in `.github/ISSUE_TEMPLATE/`.

## 7) Change policy

Before shipping major changes, verify:

- `npm run build` succeeds
- `npm test` passes
- key UI panels still open/close correctly
- map navigation/zoom still works
- docs reflect new behavior
