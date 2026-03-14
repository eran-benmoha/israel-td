# Project Blueprint: Israel Satellite Tower Defense

## 1) Product Direction

### Core fantasy

Protect key zones on a satellite-style map of Israel by placing towers, upgrading defenses, and surviving escalating enemy waves.

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
- **Data format:** JSON for towers, enemies, waves, and map metadata
- **Deployment:** GitHub Actions -> GitHub Pages

Why this stack:

- Phaser is battle-tested for 2D gameplay loops.
- Vite gives fast local iteration and clean static build output.
- Keeps project aligned with pure HTML/JS requirements.

## 3) Proposed Repository Structure

```txt
/
├─ docs/
│  ├─ README.md
│  ├─ PROJECT_BLUEPRINT.md
│  ├─ ROADMAP.md
│  └─ adr/
├─ public/
│  ├─ assets/
│  │  ├─ maps/
│  │  ├─ sprites/
│  │  ├─ audio/
│  │  └─ ui/
├─ src/
│  ├─ main.js
│  ├─ game/
│  │  ├─ scenes/
│  │  ├─ systems/
│  │  ├─ entities/
│  │  └─ config/
│  ├─ ui/
│  └─ data/
├─ index.html
└─ package.json
```

## 4) System Architecture

### Runtime layers

1. **Core game loop (Phaser Scene):**
   - spawn waves
   - path enemies
   - apply tower targeting and damage
   - resolve win/lose state
2. **Gameplay systems:**
   - economy (money, costs, rewards)
   - upgrade system
   - difficulty scaling
3. **UI layer:**
   - build buttons, wave status, health, currency
   - tower details panel
4. **Persistence layer (browser-only):**
   - Browser `localStorage` is the only persistence mechanism.
   - Store settings, unlocks, and lightweight progression snapshots.
   - No backend/database dependency for game state storage.

### Data-driven configuration

Balance should live in JSON files:

- `towers.json`
- `enemies.json`
- `waves/level-01.json`
- `levels/israel-core.json`

This reduces code churn while tuning.

## 5) Map Strategy (Important)

We must use imagery that is legal to redistribute in a public repo and web build.

Approach:

1. Source a map image with clear permissive license.
2. Store source attribution and license in repo.
3. Process image into optimized web textures (compressed + downscaled variants).
4. Overlay path nodes and build zones as separate metadata, not painted permanently.

## 6) Mobile-First Implementation Standards

- Target portrait mode first (`9:16` baseline; adapt to landscape).
- Minimum touch target: `44x44` CSS px.
- Keep all critical actions reachable with thumb in lower 2/3 of screen.
- Avoid hover interactions.
- Support pausing on tab/app background.
- Performance budget: stable 60 FPS on mid-tier mobile devices, acceptable floor 30 FPS.

## 7) Milestones

1. **Foundation**
   - project scaffold
   - asset loading
   - single map scene
2. **Core gameplay**
   - one enemy type, two tower types, fixed waves
3. **Playable vertical slice**
   - economy, upgrades, lose/win, HUD polish
4. **Content expansion**
   - additional towers/enemies, balancing pass
5. **Release hardening**
   - mobile UX polish, accessibility, analytics hooks, performance

## 8) Definition of "Buildable"

A phase is done when:

- feature is documented in `docs/`
- runs locally via `npm run dev`
- passes agreed sanity checks
- is deployable to GitHub Pages via CI
