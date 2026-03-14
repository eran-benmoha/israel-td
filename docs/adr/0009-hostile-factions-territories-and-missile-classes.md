# ADR 0009: Hostile Factions, Territory Origins, and Missile Classes

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game requires multiple hostile sources and clearer differentiation between attack profiles to support both authenticity and gameplay variety.

## Decision

1. Model attacks via hostile factions tied to territory bounds:
   - Hamas (Gaza Strip)
   - Hezbollah (South Lebanon)
   - Houthis (Western Yemen)
   - Iran regime (Iran)
2. Rotate wave source by faction according to wave index.
3. Use faction-specific visual/timing parameters.
4. For Hamas specifically, split launches into short-range and long-range classes:
   - different trail/missile visuals
   - different target-range filtering
   - long-range launches intentionally less frequent

## Consequences

### Positive

- Better source readability and strategic variety.
- Enables future faction-specific balancing.
- Supports map-level threat communication.

### Negative

- More balancing complexity.
- Requires careful messaging to avoid confusing players.

## Alternatives considered

1. **Single generic enemy source**
   - Rejected: too limited for intended scope.
2. **Fully random launch source each rocket**
   - Rejected: weak wave identity and less coherent pacing.
