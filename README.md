# israel-td

Mobile-first 2D top-down tower defense game built with HTML/JS and Phaser.

## Current prototype

Current implementation includes:

- mobile-first Phaser map gameplay shell
- Middle East map with Israel-focused overlays (outline, regions, city markers)
- hostile faction territory markers and faction-based wave origins
- running simulation clock (starts Jan 2022) with randomized wave intervals
- missile class visuals/range behaviors (including Hamas short/long-range split)
- resource HUD (money, morale, population, army, economy)
- category-based purchase menu (air defense, air force, ground troops)
- debug menu with instant wave launch
- structured historical operations research under `src/data/history/` for future level design
- playable history-inspired level configs selectable with `?level=<level-id>`

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which builds and deploys the game to GitHub Pages.

Expected URL format:

`https://<your-github-username>.github.io/israel-td/`

## Planning docs

- [Documentation index](./docs/README.md)
- [Project blueprint](./docs/PROJECT_BLUEPRINT.md)
- [Roadmap](./docs/ROADMAP.md)
- [Decision log](./docs/DECISION_LOG.md)
- [Historical operations library](./docs/HISTORICAL_OPERATIONS_LIBRARY.md)
- [Historical level conversion notes](./docs/HISTORICAL_LEVEL_CONVERSION.md)
- [Architecture Decision Records](./docs/adr/)
- [Agent Playbook (mandatory rules)](./docs/AGENT_PLAYBOOK.md)

## Agent rules

Future agents should read and follow:

- [`AGENTS.md`](./AGENTS.md)
- [`docs/AGENT_PLAYBOOK.md`](./docs/AGENT_PLAYBOOK.md)
