# ADR 0005: Deployment Pipeline (GitHub Pages + Actions)

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game should be publicly playable with minimum ops overhead.

## Decision

1. Build static assets with Vite.
2. Deploy using GitHub Actions to GitHub Pages on pushes to `main`.
3. Keep deployment fully automated and reproducible.
4. Configure base path for project pages (`/<repo-name>/`) when needed.

## Consequences

### Positive

- No dedicated hosting infrastructure required.
- Public URL updates automatically after merges.
- Works well for a static HTML/JS game.

### Negative

- Static-hosting limitations (no backend runtime).
- Need careful cache/version strategy for assets.

## Alternatives considered

1. **Manual artifact upload**
   - Rejected: error-prone and inconsistent.
2. **Third-party hosting platform**
   - Rejected for now: unnecessary for first release.
