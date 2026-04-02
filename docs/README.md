# Tower Defense Planning Docs

This folder is the source of truth for product and technical decisions.

## Goals

- Build a **2D top-down tower defense** game.
- Use a **Middle East map context** with Israel as the defended area.
- Ship as a **mobile-first web game**.
- Implement using **HTML/CSS/JavaScript**.
- Deploy to **GitHub Pages**.

## Document Map

- [Project Blueprint](./PROJECT_BLUEPRINT.md) - high-level build strategy.
- [Roadmap](./ROADMAP.md) - phased delivery plan.
- [Decision Log](./DECISION_LOG.md) - concise snapshot of implemented choices.
- [Agent Playbook](./AGENT_PLAYBOOK.md) - mandatory implementation rules and guardrails.
- [Agent Team Pipeline](./AGENT_TEAM_PIPELINE.md) - multi-agent communication and workflow conventions.
- [Cursor Agent Guide](./CURSOR_AGENT_GUIDE.md) - prompt templates for running the pipeline with Cursor agents.
- [ADRs](./adr/) - architecture/design decisions and rationale.

## Decision Process

We use ADRs (Architecture Decision Records):

1. Open a new file in `docs/adr/` with the next number (`0012-...`, etc.).
2. Include: context, decision, consequences, alternatives.
3. Never rewrite history in older ADRs; supersede with a new ADR.

## Current Decision Snapshot

1. Phaser 3 + Vite + vanilla JS.
2. Open-licensed/safe-to-redistribute base map image only.
3. Portrait-first mobile controls and UI scaling.
4. Browser `localStorage` only for persistence.
5. Middle East high-resolution relief map with projection-based geo alignment.
6. Hostile factions and territory-origin wave model (Gaza, Lebanon, Yemen, Iran).
7. Running in-game clock (Jan 2022 start) with randomized wave intervals.
8. Resource model: money, morale, population, army, economy.
9. Categorized purchase menu (air defense, air force, ground troops).
10. All menus must be viewport-safe and support show/hide.
11. Data-driven level/faction/unit/map configs stored in JSON files.
12. Modular system architecture with event bus + shared state layer.
13. GitHub Actions deployment to GitHub Pages.
14. Multi-agent team pipeline using Git-native communication (PRs, labels, issues, CI).
