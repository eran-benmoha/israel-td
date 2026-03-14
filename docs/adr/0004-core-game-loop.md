# ADR 0004: MVP Core Game Loop

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

We need a clear MVP that is achievable quickly and can be balanced iteratively.

## Decision

Define MVP loop:

1. Player starts with finite currency and base health.
2. Enemies spawn in timed waves and follow predefined path nodes.
3. Player builds towers on allowed slots.
4. Towers auto-target enemies in range.
5. Killed enemies reward currency.
6. Leaked enemies reduce base health.
7. Win: survive all waves. Lose: base health reaches zero.

All unit stats, costs, wave schedules, and spawn patterns are data-driven in JSON.

## Consequences

### Positive

- Simple, understandable gameplay foundation.
- Faster balancing through data edits.
- Easy to test and extend with new tower/enemy types.

### Negative

- Initial gameplay may feel basic until more mechanics are added.
- Requires discipline in JSON schema versioning as content scales.

## Alternatives considered

1. **Complex status effects and hero units in MVP**
   - Rejected: risks delaying playable baseline.
2. **Procedural path generation**
   - Rejected: unnecessary complexity for first level.
