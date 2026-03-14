# ADR 0008: Running War Clock and Randomized Wave Intervals

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

Fixed countdown-based waves felt too predictable. The game needed a stronger conflict timeline feel and less deterministic pacing.

## Decision

1. Replace fixed next-wave countdown with a continuously running simulation clock.
2. Start simulation timeline at January 2022.
3. Schedule waves using randomized delay windows instead of fixed intervals.
4. Keep wave index and source display in HUD.

## Consequences

### Positive

- Stronger thematic framing with persistent timeline context.
- Less repetitive rhythm and better gameplay variation.

### Negative

- Harder to benchmark exact wave timings manually.
- Requires careful tuning to avoid unfair streaks of short delays.

## Alternatives considered

1. **Keep strict 60-second cadence**
   - Rejected: too predictable and less engaging.
2. **Fully random by probability tick**
   - Rejected: less controllable than bounded randomized intervals.
