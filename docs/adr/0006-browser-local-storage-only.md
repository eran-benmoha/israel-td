# ADR 0006: Browser Local Storage Only for Persistence

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The project targets GitHub Pages static hosting and mobile web usage. We need persistence for player settings and lightweight progression, without introducing backend complexity.

## Decision

1. Implement all storage needs with browser `localStorage`.
2. Use a versioned save schema (for example: `saveVersion`) to support future migrations.
3. Persist only small, non-sensitive data:
   - audio/settings flags
   - unlocked towers/levels
   - best scores and run summaries
4. Do not store secrets, authentication tokens, or server-dependent data.
5. Add graceful fallback behavior if storage is unavailable (private mode, quota limits, or user-disabled storage).

## Consequences

### Positive

- Works with static hosting and no backend.
- Fast implementation and low operational overhead.
- Offline-friendly for core settings/progression.

### Negative

- Data is device/browser specific and can be cleared by users.
- Limited capacity and no cross-device sync.
- Requires defensive handling around quota and availability.

## Alternatives considered

1. **Remote database or API-backed saves**
   - Rejected: conflicts with static-hosting-first scope.
2. **IndexedDB for all persistence**
   - Deferred: more complexity than needed for MVP storage volume.
