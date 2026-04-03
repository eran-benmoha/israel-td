# ADR 0017: Unit Upgrade System

## Status

Accepted

## Context

Currently, units are purchased from the shop and tracked as simple counts. Once bought, a unit's effectiveness is fixed. Players have no mid-game progression path for individual units, which limits strategic depth and long-term engagement.

## Decision

Introduce a tiered upgrade system where each purchased unit can be upgraded through three levels (1 → 2 → 3). Upgrades cost increasing amounts of money and improve unit effectiveness:

- **Level 1** (base): The unit as purchased today.
- **Level 2**: Moderate stat boost and improved effectiveness. Costs roughly 60% of the original purchase price.
- **Level 3**: Major stat boost and peak effectiveness. Costs roughly 100% of the original purchase price.

### Upgrade effects

| Unit Type | Level 2 Bonus | Level 3 Bonus |
|-----------|---------------|---------------|
| Iron Dome Battery | +12% interception chance | +25% interception chance |
| Arrow Interceptor | +10% interception chance | +20% interception chance |
| Fighter Sortie | +1.5 army, +0.8 morale | +3.0 army, +1.5 morale |
| Precision Strike | +2.0 army, +1.0 morale | +4.0 army, +2.0 morale |
| Reserve Brigade | +1.2 army, +0.5 morale | +2.5 army, +1.0 morale |
| Border Defense Line | +1.5 army, +0.7 morale | +3.0 army, +1.4 morale |

### Data model changes

- `units.json`: Each unit gains an `upgrades` array with per-level `cost`, `armyBoost`, `moraleBoost`, and optional `interceptionBonus`.
- `GameState`: New `unitLevels` map (`{ [unitId]: number }`) tracking current level per unit (default 1 when purchased).
- `selectors.js`: New `getUnitLevel(state, unitId)` selector.
- `events.js`: New `SHOP_UPGRADE_UNIT` event.
- `ResourceSystem`: New `upgradeUnit(unitId)` method validates level cap, deducts cost, applies stat boosts, and advances level.
- `InterceptionSystem`: `getIronDomeInterceptionChance` consults unit level for an additive bonus.
- `ShopView`: Renders level badge and upgrade button on owned units.

### Shop UI

Owned units display a star-based level indicator (★/★★/★★★) and an "Upgrade" button with cost. Max-level units show "MAX" instead.

## Consequences

- Players gain a meaningful way to invest resources mid-game beyond buying more units.
- Iron Dome and Arrow upgrades create a direct interception improvement path.
- The upgrade data is fully data-driven via `units.json` for easy tuning.
- Existing purchase flow and unit count tracking remain unchanged.
