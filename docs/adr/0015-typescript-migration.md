# ADR 0015: TypeScript Migration

- **Status:** Accepted
- **Date:** 2026-03-14
- **Supersedes:** ADR 0001 (partially — updates the "no TypeScript in initial phase" decision)

## Context

ADR 0001 chose Vanilla JavaScript ES modules for the initial phase, noting "less compile-time safety without TypeScript" as a trade-off. The codebase has grown to ~19 modules with complex event-driven interactions, making type safety increasingly valuable for maintainability and developer experience.

## Decision

Migrate all source files from JavaScript to TypeScript:

- Convert `.js` files to `.ts` within the existing `src/` directory structure.
- Add a `tsconfig.json` with strict mode.
- Vite handles TypeScript natively — no additional build tooling required.
- Add Vitest as the test runner (Vite-native, zero-config for TS).
- The `npm run build` script now includes `tsc --noEmit` to catch type errors before bundling.

## Consequences

### Positive

- Compile-time type safety catches bugs before runtime.
- Improved IDE support with autocomplete and inline documentation.
- Explicit interfaces make system boundaries (MapSystem, WaveSystem, etc.) clearer.
- Vitest integrates naturally with the existing Vite toolchain.

### Negative

- Slightly higher barrier for quick prototyping.
- Initial migration effort required.

## Migration notes

- All Phaser APIs already have bundled type definitions.
- JSON data files remain `.json` with `resolveJsonModule` enabled.
- The import map in `index.html` still provides the runtime Phaser module for the browser; TypeScript types come from `node_modules`.
