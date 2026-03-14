# Project Blueprint: Israel Defense (Middle East Theater)

## 1) Product Direction

### Core fantasy

Protect key zones in Israel on a Middle East map by purchasing defense capabilities, managing national resources, and surviving escalating hostile waves.

### Design pillars

1. **Readable on mobile first** - quick interactions, large hit targets, no precision drag requirements.
2. **Short tactical sessions** - 5-12 minute rounds.
3. **Clarity over complexity** - players should always understand why they won or lost.
4. **Web-native deployment** - frictionless play via GitHub Pages link.

## 2) Technical Stack

- **Rendering/game framework:** Phaser 3
- **Language:** JavaScript (ES modules)
- **Build tool:** Vite
- **UI:** HTML + CSS overlays (HUD, menus) + Phaser canvas
- **Data format:** JSON-style/data-driven configs (target architecture)
- **Deployment:** GitHub Actions -> GitHub Pages

Why this stack:

- Phaser is battle-tested for 2D gameplay loops.
- Vite gives fast local iteration and clean static build output.
- Keeps project aligned with pure HTML/JS requirements.

## 3) Repository Structure (Current + Target)

```txt
/
├─ docs/
│  ├─ README.md
│  ├─ PROJECT_BLUEPRINT.md
│  ├─ ROADMAP.md
│  └─ adr/
├─ src/
│  ├─ main.js
│  ├─ game/
│  │  ├─ scenes/
│  │  ├─ systems/      (target extraction from scene)
│  │  ├─ entities/     (target extraction from scene)
│  │  └─ config/       (target extraction from scene)
│  ├─ ui/
│  └─ data/
│     ├─ levels/
│     └─ history/      (historical research library for future level seeds)
├─ index.html
└─ package.json
```

## 4) System Architecture

### Runtime layers

1. **Core game loop (Phaser Scene):**
   - running simulation clock (starts Jan 2022)
   - randomized hostile wave scheduling
   - territory-based launches and city-target impacts
2. **Gameplay systems:**
   - resources: money, morale, population, army, economy(derived)
   - purchase categories: air defense, air force, ground troops
   - faction profile variation by missile/range behavior
3. **UI layer:**
   - top HUD (resources, wave index, running clock, wave origin)
   - bottom purchase menu with category tabs
   - debug panel with instant wave launch
   - all menus must support show/hide and viewport-safe behavior
4. **Persistence layer (browser-only):**
   - Browser `localStorage` is the only persistence mechanism.
   - Store settings, unlocks, and lightweight progression snapshots.
   - No backend/database dependency for game state storage.

### Data-driven configuration

Balance and content should move to JSON files:

- `units.json`
- `factions.json`
- `levels/*.json`
- `history/index.json`
- `history/libraries/*.json`
- `map-view.json`

This reduces code churn while tuning.

## 5) Map Strategy (Implemented)

We must use imagery that is legal to redistribute in a public repo and web build.

Current approach:

1. Use high-resolution, redistributable relief map.
2. Keep source attribution in repo.
3. Convert geo points to map coordinates using the adopted map projection constants.
4. Draw overlays as runtime layers (Israel outline, regions, hostile territories, city markers).

## 6) Mobile-First Implementation Standards

- Target portrait mode first (`9:16` baseline; adapt to landscape).
- Minimum touch target: `44x44` CSS px.
- Keep all critical actions reachable with thumb in lower 2/3 of screen.
- Avoid hover interactions.
- Support pausing on tab/app background.
- Performance budget: stable 60 FPS on mid-tier mobile devices, acceptable floor 30 FPS.

## 7) Milestones (Current status)

1. **Foundation** ✅
   - project scaffold
   - asset loading
   - map scene with drag/zoom
2. **Core gameplay** ✅ (initial)
   - faction-based rocket waves
   - resource and economy bars
   - category purchase menu
3. **Playable vertical slice** 🚧
   - defensive unit effects tied to attack mitigation
   - explicit lose/win conditions
4. **Content expansion** 🚧
   - deeper faction behavior and content data externalization
   - historical operation libraries for future level seeds
5. **Release hardening** 🚧
   - tests, optimization, stronger architecture modularization

## 8) Definition of "Buildable"

A phase is done when:

- feature is documented in `docs/`
- runs locally via `npm run dev`
- passes agreed sanity checks
- is deployable to GitHub Pages via CI
