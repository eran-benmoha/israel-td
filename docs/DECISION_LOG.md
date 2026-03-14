# Decision Log (Implemented State)

This file is a compact "what is true now" reference.

## Implemented product choices

1. Game context is the Middle East, with Israel as defended area.
2. Hostile factions modeled in waves:
   - Hamas (Gaza Strip)
   - Hezbollah (South Lebanon)
   - Houthis (Western Yemen)
   - Iran regime (Iran)
3. Wave pacing uses a running simulation clock (Jan 2022 start) and randomized intervals.
4. Missile visuals are explicit (missile bodies + trails) with type-based visual differences.
5. Hamas launches include short-range and long-range classes with long-range less frequent.

## Implemented map/readability choices

1. High-resolution Middle East relief map is the base image.
2. Geographic overlays use projection-based coordinate conversion.
3. Israel overlay layers include:
   - national outline
   - internal region lines (north, central, south, Gaza border, West Bank)
   - major city markers per region
4. Hostile territories are drawn and labeled on-map.
5. Initial camera is Israel-focused and map view is slightly counter-clockwise.
6. Map supports drag + pinch zoom (mobile) and wheel zoom (desktop).

## Implemented systems/UI choices

1. Resource bars: money, morale, population, army, economy (derived).
2. Purchase menu categories:
   - air defense
   - air force
   - ground troops
3. Purchase actions update resources and UI state.
4. Debug menu supports instant wave launch.
5. Shop and debug menus are show/hide capable and viewport-safe.

## Technical/deployment choices

1. Stack: Phaser + Vite + JavaScript ES modules.
2. Hosting: GitHub Pages via GitHub Actions.
3. Persistence policy: browser `localStorage` only (when persistence is used).
4. Map assets must remain legally redistributable and attributed.
5. Gameplay config is now data-driven from JSON under `src/data/`.
6. Historical operations research for future levels is stored in structured JSON under `src/data/history/`.
7. Each historical entry tracks map-region fit, resource pressure, and faction/data gaps before implementation.
8. Runtime architecture is modularized with:
   - `MapSystem`
   - `WaveSystem`
   - `ResourceSystem`
   - `FactionSystem`
   - `UiSystem`
   - `EventBus`
   - `GameState`

## Governance choices

1. ADRs are append-only decision history.
2. Any behavior change should update docs in the same change set.
3. Future agents must follow `AGENTS.md` and `docs/AGENT_PLAYBOOK.md`.
