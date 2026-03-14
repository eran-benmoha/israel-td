# ADR 0002: Map Imagery Source and Licensing Policy

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game requires a satellite-style map of Israel as the base environment. Because the project is public and deployed via GitHub Pages, all map assets must be legal to redistribute and use in a game.

## Decision

1. Only use map imagery with clearly documented, permissive terms for redistribution in open/public projects.
2. Keep a machine-readable attribution file (`public/assets/maps/ATTRIBUTION.md`) in the repo.
3. Treat map art as a processed game texture, while pathing/build zones remain separate data overlays.
4. Block use of screenshot-based sources with unclear or restrictive terms.

## Consequences

### Positive

- Low legal risk for public hosting.
- Clear audit trail for future contributors.
- Flexibility to swap map sources without code rewrites.

### Negative

- May reduce choice of imagery providers.
- Extra setup time for attribution and license verification.

## Alternatives considered

1. **Use arbitrary web map screenshots**
   - Rejected: high legal uncertainty and possible TOS violations.
2. **Generate fully fictional non-satellite map**
   - Rejected for now: does not satisfy current product direction.
