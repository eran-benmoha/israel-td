# ADR 0001: Game Stack (Phaser + Vite + JavaScript)

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

We need a browser-based 2D top-down tower defense game that is mobile-first, simple to host on GitHub Pages, and written with HTML/JS.

## Decision

Use:

- Phaser 3 for rendering/game loop and scene management.
- Vite for local dev and static production builds.
- Vanilla JavaScript ES modules (no TypeScript in initial phase).

## Consequences

### Positive

- Fast startup and low complexity.
- Strong 2D game primitives out of the box.
- Easy static hosting compatibility.

### Negative

- Less compile-time safety without TypeScript.
- Need disciplined architecture to avoid logic sprawl.

## Alternatives considered

1. **Pure Canvas API without engine**
   - Rejected: slower development and more boilerplate.
2. **Godot/Unity Web export**
   - Rejected: heavier pipeline and less HTML/JS-native workflow.
3. **React + game lib**
   - Rejected: unnecessary complexity for canvas-heavy gameplay loop.
