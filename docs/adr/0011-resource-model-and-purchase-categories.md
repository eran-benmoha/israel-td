# ADR 0011: Resource Model and Category-Based Purchases

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game needed a clearer strategic layer beyond wave survival, including economic pressure and military investment decisions.

## Decision

1. Maintain five top-level resources:
   - money
   - morale
   - population
   - army
   - economy (derived metric)
2. Use a category-based purchase menu:
   - air defense
   - air force
   - ground troops
3. Purchases must update resources and immediate UI state.

## Consequences

### Positive

- Improves strategic readability and player agency.
- Creates clear expansion path for unit roster.
- Supports balancing through category and cost tuning.

### Negative

- Adds balancing burden as systems interact.
- Derived economy formula requires maintenance/tuning.

## Alternatives considered

1. **Single currency only**
   - Rejected: too shallow for current design goals.
2. **Uncategorized unit list**
   - Rejected: poorer UX and weaker mental model for players.
