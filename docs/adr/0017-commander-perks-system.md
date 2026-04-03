# ADR 0017: Commander Perks System

## Status

Accepted

## Date

2026-04-03

## Context

The game lacked a progression mechanic that rewarded players for surviving waves beyond the immediate resource income. Players needed a meaningful way to invest in long-term strategic advantages that persisted throughout a session.

## Decision

Introduce a **Commander Perks** system — a passive perk tree with the following design:

### Core Mechanics
- Players earn **1 Command Point** per wave survived
- Points are spent to unlock permanent in-session buffs
- 8 perks across 3 categories: Defense, Economy, Morale
- Some perks have prerequisites, forming a simple tree structure

### Perk Categories

**Defense**
- Reinforced Dome (cost 1): +8% interception chance
- Advanced Tracking (cost 2, requires Reinforced Dome): +12% interception chance

**Economy**
- War Economy (cost 1): +30% wave income
- Arms Dealer (cost 2, requires War Economy): -15% unit purchase cost

**Morale**
- Rally the Troops (cost 1): -30% morale loss from impacts
- National Resolve (cost 2, requires Rally the Troops): +2 morale regen per wave
- Hardened Shelters (cost 1): -25% overall impact damage
- Deep Bunkers (cost 2, requires Hardened Shelters): -20% additional impact damage

### Architecture
- **Data-driven**: `src/data/perks.json` defines all perks, costs, prerequisites, and effects
- **PerkSystem**: Manages point tracking, perk unlocking with prerequisite validation, and effect queries
- **PerkView**: Collapsible panel with category-grouped perk cards, unlock buttons, and toast notifications
- **Effect wiring**: Perk effects are applied via `getEffectTotal(effectType)` in InterceptionSystem, ImpactSystem, and ResourceSystem
- **GameState extension**: New `perks` field with `points` and `unlocked` map

### Events
- `PERK_UNLOCK` — Player requests perk unlock
- `UI_PERKS` — Updated perk state for view rendering
- `UI_PERK_UNLOCKED` — Toast notification trigger

## Consequences

- Adds strategic depth without complexity; perk choices are permanent per session
- Integrates with existing systems via simple additive/multiplicative modifiers
- Data-driven config allows easy addition of new perks
- No localStorage persistence for perks (session-only); could be added later
- Perk panel is mobile-friendly with toggle button access
