# ADR 0013: Historical Operations Content Library for Level Research

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game already uses JSON in `src/data/` as the source of truth for factions, levels, units, and map metadata. Future level expansion needs a structured way to capture historical inspiration instead of relying on scattered notes.

The project direction is history-informed, but not every historical operation maps cleanly to the current game systems. We need a data format that records:

- what happened in broad terms
- which fronts/regions are relevant to the current map
- whether current factions can already support the scenario
- what new data would be needed before implementation

## Decision

1. Add a curated historical-content library under `src/data/history/`.
2. Split that library into separate JSON files by theater/theme rather than one giant timeline file.
3. Require each operation entry to include:
   - basic historical metadata
   - concise operational summary
   - `gameHooks` for level design translation
4. Keep the library descriptive and abstracted for scenario design. It is not intended to be a detailed tactical simulation source.
5. Document usage in `docs/HISTORICAL_OPERATIONS_LIBRARY.md`.

## Consequences

### Positive

- Future levels can be seeded from structured research instead of ad hoc notes.
- Designers can immediately see which historical operations fit the current map/faction model.
- The content library stays aligned with the existing JSON-first architecture.

### Negative

- Historical entries still require verification before they become player-facing narrative text.
- Some operations will imply new factions, mechanics, or map overlays that do not exist yet.
- The library adds maintenance burden as content scope expands.

## Alternatives considered

1. **Store research only in prose docs**
   - Rejected: harder to reuse directly for level implementation.
2. **Make one giant chronological JSON file**
   - Rejected: weaker usability for front-specific level planning.
3. **Skip historical structure and design fictional levels only**
   - Rejected: conflicts with the current request for history-based content planning.
