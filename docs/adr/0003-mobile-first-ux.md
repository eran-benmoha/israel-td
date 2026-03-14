# ADR 0003: Mobile-First UX and Control Model

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

Primary target is mobile web. Tower defense interaction can become frustrating on touch devices if controls require pixel-perfect placement or dense UI.

## Decision

1. Design for portrait-first layout, then adapt for landscape.
2. Use pre-defined tower slots (tap-to-build) for MVP instead of freeform drag placement.
3. Enforce minimum 44x44 touch targets for interactive UI.
4. Use HTML/CSS overlay for HUD and menus, with Phaser canvas for playfield.
5. Avoid hover/secondary-click interactions entirely.

## Consequences

### Positive

- Better touch reliability and accessibility.
- Lower input complexity for first release.
- Cleaner separation of game rendering and UI widgets.

### Negative

- Reduced placement freedom vs desktop-style TD games.
- Requires careful synchronization between canvas and DOM overlays.

## Alternatives considered

1. **Desktop-first with later responsive pass**
   - Rejected: would create expensive redesign for core interactions.
2. **Full-canvas UI only**
   - Rejected: harder to build adaptive and accessible interface quickly.
