# ADR 0017 — Difficulty Selection System

**Status:** Accepted  
**Date:** 2026-04-03

## Context

The game had a single fixed difficulty with no way for players to customize the challenge level. New and casual players found the default pacing too aggressive, while experienced players wanted a harder challenge. A pre-game difficulty selection lets all player skill levels enjoy the game.

## Decision

Introduce a data-driven difficulty selection system with three presets:

| ID | Name | Concept |
|----|------|---------|
| `easy` | Recruit | Relaxed pacing, generous resources, improved interception |
| `normal` | Commander | Balanced default (matches previous hardcoded values) |
| `hard` | General | Fast waves, scarce income, heavier impact damage |

### Modifier Keys

Each difficulty defines numeric modifiers consumed by existing systems:

- **startingMoney** — initial money on game start
- **waveTimingMultiplier** — scales delay between waves (higher = slower)
- **impactDamageMultiplier** — scales resource losses on missile impact
- **volleySizeMultiplier** — scales number of rockets per wave
- **incomeMultiplier** — scales money earned each wave
- **interceptionBonus** — additive bonus/penalty to Iron Dome interception chance

### Architecture

- `src/data/difficulty.json` — data-driven config for all presets and their modifiers
- `DifficultySystem` — reads config, applies modifiers to `GameState.difficulty`, persists selection in `localStorage`, publishes `UI_DIFFICULTY` event
- `DifficultyView` — full-screen overlay shown on game start with card-based selection UI
- `GameState.difficulty` — holds active difficulty id and modifiers object
- Existing systems (`WaveDirector`, `ResourceSystem`, `ProjectileSystem`, `InterceptionSystem`) read modifiers from `GameState.difficulty.modifiers` at runtime

### Events

- `DIFFICULTY_SELECT` — emitted by UI when player picks a preset
- `UI_DIFFICULTY` — emitted by system to render the selection overlay

### Persistence

Selected difficulty is saved to `localStorage` under `israel-td-difficulty` and restored on next visit.

## Consequences

- Players can choose their preferred challenge level before each session
- "Commander" preset matches all previous hardcoded values, so existing behavior is unchanged for returning players
- Adding new difficulty presets requires only editing `difficulty.json`
- No breaking changes to existing systems; modifiers are read with optional chaining and fallback defaults
