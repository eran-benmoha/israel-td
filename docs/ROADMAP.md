# Roadmap

## Phase 0 - Planning and constraints (current)

### Outcomes

- Initial architecture and decision records are documented.
- Legal map-source strategy is defined.
- MVP scope is frozen.

### Exit criteria

- ADRs `0001` to `0005` approved.
- Backlog for Phase 1 created.

---

## Phase 1 - Project bootstrap

### Tasks

- Initialize Vite + Phaser project.
- Add linting/formatting baseline.
- Create folder structure for scenes/systems/data/assets.
- Add GitHub Actions workflow for Pages deployment.

### Exit criteria

- App starts and renders a placeholder map scene.
- CI publishes preview/build artifacts successfully.

---

## Phase 2 - Core gameplay loop (MVP)

### Tasks

- Enemy path following with health and death events.
- Tower placement on predefined slots.
- Targeting + projectile or hitscan damage.
- Currency economy and wave rewards.
- Base health + lose/win conditions.

### Exit criteria

- 1 complete level is playable on mobile browser.
- Round lasts 5-12 minutes.

---

## Phase 3 - UX and mobile polish

### Tasks

- Touch-first HUD and contextual tower panel.
- Responsive layout and safe-area support (notches).
- Settings modal (sound, quality, vibration toggle).
- Tutorial overlays and onboarding hints.

### Exit criteria

- Core interactions comfortably usable one-handed.
- No blocking UI overlap on common mobile viewports.

---

## Phase 4 - Balancing and content

### Tasks

- Add more tower archetypes and enemy roles.
- Tune wave difficulty and economy curve.
- Add map variants and special events.

### Exit criteria

- At least 3 viable strategies to beat the first level.
- Difficulty progression feels fair in playtests.

---

## Phase 5 - Release candidate

### Tasks

- Performance profiling and asset optimization.
- Error handling and fallback states.
- Final attribution/legal docs for map imagery.
- Release notes and version tagging workflow.

### Exit criteria

- Stable in target mobile browsers.
- Public GitHub Pages URL ready to share.
