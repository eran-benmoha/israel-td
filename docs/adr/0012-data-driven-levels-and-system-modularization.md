# ADR 0012: Data-Driven Levels and Modular Phaser Systems

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

Core gameplay logic had accumulated in a single scene class, making evolution and testing difficult. Level content also needed to be defined externally as data.

## Decision

1. Introduce JSON-driven gameplay configs:
   - `src/data/levels/level-01.json` for wave sequence and timing model
   - `src/data/factions.json`
   - `src/data/units.json`
   - `src/data/israel.json`
   - `src/data/map-view.json`
2. Split scene responsibilities into lightweight systems:
   - `MapSystem`
   - `WaveSystem`
   - `ResourceSystem`
   - `FactionSystem`
   - `UiSystem`
3. Add an event bus and shared game state layer:
   - `EventBus`
   - `GameState`

## Consequences

### Positive

- Better maintainability and clearer ownership boundaries.
- Level iteration becomes data edits rather than code rewrites.
- Easier future extension to multiple levels.

### Negative

- More files and wiring complexity.
- Requires discipline in event naming and state update consistency.

## Alternatives considered

1. **Keep all logic in one scene**
   - Rejected: poor scalability and higher regression risk.
2. **Move directly to a heavy ECS architecture**
   - Deferred: unnecessary complexity for current project stage.
