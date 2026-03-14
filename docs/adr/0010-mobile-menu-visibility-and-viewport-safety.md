# ADR 0010: Mobile Menu Visibility and Viewport Safety

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

As HUD/shop/debug complexity increased, menus could overflow small screens and hurt usability on mobile.

## Decision

1. All major menus (debug and shop) must support explicit show/hide controls.
2. Menu containers must remain viewport-safe using max-height constraints and internal scrolling.
3. On short-height screens, reposition and resize floating panels to remain accessible.

## Consequences

### Positive

- Reduces UI clipping and accidental inaccessible controls.
- Better one-handed mobile usability.
- Scales better as menu content grows.

### Negative

- Slightly more UI state complexity.
- More CSS edge-case handling required.

## Alternatives considered

1. **Always-expanded menus**
   - Rejected: poor small-screen ergonomics.
2. **Remove debug menu in runtime**
   - Rejected: slower iteration/testing loop.
