# Agent Task Splits (Parallel Work Board)

Use this file to run multiple agents in parallel with low merge-conflict risk.

## How to use

1. Pick one workstream per agent.
2. Each agent must stay inside the file ownership boundary for that workstream.
3. Do not modify shared contracts unless the task explicitly says so.
4. If contract changes are needed, add them in a **small separate commit**.

---

## Shared contracts (do not break)

- Event names: `src/game/core/events.js`
- State selectors: `src/game/core/selectors.js`
- Game state shape: `src/game/core/GameState.js`
- Scene wiring: `src/game/scenes/BootScene.js`

If a workstream needs contract updates, coordinate by:

- adding backward-compatible changes first
- then migrating consumers
- then removing old paths

---

## Ownership map by area

### Map stack
- `src/game/systems/MapSystem.js`
- `src/game/systems/MapRenderer.js`
- `src/data/map-view.json`
- `src/assets/maps/*`

### Wave/combat stack
- `src/game/systems/WaveSystem.js`
- `src/game/systems/waves/WaveDirector.js`
- `src/game/systems/waves/ProjectileSystem.js`
- `src/game/systems/waves/InterceptionSystem.js`
- `src/game/systems/waves/ImpactSystem.js`

### UI stack
- `src/game/systems/UiSystem.js`
- `src/game/ui/HudView.js`
- `src/game/ui/DebugView.js`
- `src/game/ui/ShopView.js`
- `src/style.css`
- `index.html` (only if markup updates are required)

### Economy/shop stack
- `src/game/systems/ResourceSystem.js`
- `src/data/units.json`

### Content/data stack
- `src/data/levels/*.json`
- `src/data/factions.json`
- `src/data/israel.json`

### Documentation/governance
- `docs/*.md`
- `docs/adr/*.md`
- `AGENTS.md`

---

## Ready-to-run parallel agent prompts

### Agent A — Map quality and rendering performance
**Scope:** map stack only.  
**Prompt:**
> Improve map rendering quality and responsiveness in `MapSystem` + `MapRenderer` only. Keep current controls/behavior intact. Focus on zoom smoothness, label readability at different zoom levels, and rendering performance on mobile. Do not modify wave/resource/UI logic files.

### Agent B — Wave pacing and faction behavior
**Scope:** wave/combat stack + data files needed for wave balance.  
**Prompt:**
> Tune wave pacing and faction attack behavior for better gameplay progression. Work in `WaveDirector`, `ProjectileSystem`, and related level/faction JSON only. Keep event names and public method contracts stable.

### Agent C — Interception balance and visuals
**Scope:** `InterceptionSystem`, `ImpactSystem`, relevant faction/units data.  
**Prompt:**
> Improve Iron Dome interception feel: clearer interceptor timing, readable interception FX, and balanced interception probability. Keep resource impact logic compatible and avoid changing unrelated UI code.

### Agent D — UI clarity and mobile ergonomics
**Scope:** UI stack only.  
**Prompt:**
> Improve HUD/debug/shop usability on mobile without changing game mechanics. Keep menus slim, non-obstructive, and viewport-safe. Work only in `UiSystem`, `HudView`, `DebugView`, `ShopView`, CSS, and minimal HTML if needed.

### Agent E — Economy system modularization
**Scope:** resource/economy/shop stack.  
**Prompt:**
> Split purchase logic from `ResourceSystem` into a separate `ShopSystem` while preserving behavior and event contracts. Keep resource calculations stable and avoid touching map/wave modules.

### Agent F — Data/content expansion
**Scope:** JSON content + optional docs updates.  
**Prompt:**
> Expand level content and faction tuning using only `src/data/*` plus docs updates. Do not modify runtime systems except for strictly required schema compatibility.

---

## Integration checklist (after parallel work)

- [ ] `npm run build` passes
- [ ] Map drag/pinch/wheel still work
- [ ] Shop purchases still work
- [ ] Wave launch + impacts still work
- [ ] Debug wave launch button still works
- [ ] Iron Dome interception still triggers after purchase
- [ ] Docs updated for behavior changes (and ADR if decision-level)

