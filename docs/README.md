# Tower Defense Planning Docs

This folder is the source of truth for product and technical decisions.

## Goals

- Build a **2D top-down tower defense** game.
- Use a **satellite-style map of Israel** as the area to defend.
- Ship as a **mobile-first web game**.
- Implement using **HTML/CSS/JavaScript**.
- Deploy to **GitHub Pages**.

## Document Map

- [Project Blueprint](./PROJECT_BLUEPRINT.md) - high-level build strategy.
- [Roadmap](./ROADMAP.md) - phased delivery plan.
- [ADRs](./adr/) - architecture/design decisions and rationale.

## Decision Process

We use ADRs (Architecture Decision Records):

1. Open a new file in `docs/adr/` with the next number (`0006-...`, etc.).
2. Include: context, decision, consequences, alternatives.
3. Never rewrite history in older ADRs; supersede with a new ADR.

## Current Decision Snapshot

1. Phaser 3 + Vite + vanilla JS.
2. Open-licensed/safe-to-redistribute base map image only.
3. Portrait-first mobile controls and UI scaling.
4. Deterministic wave loop with data-driven balance files.
5. GitHub Actions deployment to GitHub Pages.
6. Browser `localStorage` only for persistence.
