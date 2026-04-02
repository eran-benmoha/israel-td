# Roadmap

## Phase 0 - Planning and constraints ✅

### Outcomes

- Initial architecture and decision records are documented.
- Legal map-source strategy is defined.
- MVP scope is frozen.

### Exit criteria

- ADR baseline approved and extended.
- Backlog for implementation created.

---

## Phase 1 - Project bootstrap ✅

### Tasks

- Initialize Vite + Phaser project.
- Add linting/formatting baseline.
- Create folder structure for scenes/systems/data/assets.
- Add GitHub Actions workflow for Pages deployment.

### Exit criteria

- App starts and renders map scene.
- CI publishes to GitHub Pages successfully.

---

## Phase 2 - Core gameplay loop (MVP) ✅ (initial)

### Tasks completed

- Running simulation clock + randomized wave intervals.
- Hostile territory/faction wave sources and missile visuals.
- Resource economy model and purchase categories.
- Regional overlays, city markers, and map navigation controls.

### Remaining for full phase completion

- ~~Explicit win/lose loop and persistence of campaign progress.~~ ✅ (ADR 0017 — ScoreSystem, game-over/victory conditions, high-score persistence)
- Defense effects tied to actual interception/survivability mechanics.

---

## Phase 3 - UX and mobile polish 🚧

### Tasks

- Keep viewport-safe menu behavior across all supported screen sizes.
- Add settings panel and tutorial guidance.
- Improve readability of layered map overlays at multiple zoom levels.

### Exit criteria

- Core interactions comfortably usable one-handed.
- No blocking UI overlap on common mobile viewports.

---

## Phase 4 - Balancing and content 🚧

### Tasks

- Externalize current hardcoded gameplay constants to data files.
- Add more unit archetypes and faction-specific behaviors.
- Tune wave difficulty and economy progression.

### Exit criteria

- At least 3 viable strategies to beat the first level.
- Difficulty progression feels fair in playtests.

---

## Phase 5 - Release candidate 🚧

### Tasks

- Performance profiling and asset optimization.
- Error handling and fallback states.
- Final attribution/legal docs for map imagery.
- Release notes and version tagging workflow.

### Exit criteria

- Stable in target mobile browsers.
- Public GitHub Pages URL ready to share.
