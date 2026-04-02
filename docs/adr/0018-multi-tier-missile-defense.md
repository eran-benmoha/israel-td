# ADR 0018: Multi-Tier Missile Defense System

**Status:** Accepted  
**Date:** 2026-04-02

## Context

The game previously had only one functional interception system (Iron Dome), while the Arrow Interceptor was a purchasable unit that only provided stat boosts without any interception capability. All factions except Hamas launched "generic" missiles with no range classification. This limited strategic depth: players had no incentive to diversify their defense purchases.

Real-world Israeli missile defense operates in layered tiers:
- **Iron Dome** — effective against short-range rockets (4–70 km)
- **David's Sling** — effective against medium-range cruise and ballistic missiles (70–300 km)
- **Arrow** — effective against long-range ballistic missiles (300+ km)

## Decision

Implement a **three-tier layered missile defense system** where each tier is optimized for a different missile range bracket:

1. **Iron Dome** (`iron-dome-battery`) — best against **short-range** (≤ 70 km), reduced effectiveness at longer ranges.
2. **David's Sling** (`davids-sling`) — new purchasable unit, best against **medium-range** (71–300 km).
3. **Arrow** (`arrow-system`) — existing unit made functional, best against **long-range** (> 300 km) ballistic threats.

Each tier independently attempts interception with range-modulated probability. Multiple tiers may fire at the same missile; once one succeeds, others abort. All factions now have detailed missile profiles with range classifications.

### Range Bracket Classification

| Bracket | `maxRangeKm` | Primary Interceptor |
|---------|-------------|---------------------|
| Short   | ≤ 70        | Iron Dome           |
| Medium  | 71–300      | David's Sling       |
| Long    | > 300       | Arrow               |

### Visual Differentiation

Each tier has distinct interceptor visuals:
- **Iron Dome** — cyan/light blue trail and projectile
- **David's Sling** — green trail and projectile
- **Arrow** — golden/amber trail and projectile

## Consequences

- Players must invest in all three tiers to defend effectively against all factions.
- Faction threat profiles are more differentiated: Hamas is mostly short-range, Iran is mostly long-range, Hezbollah spans all ranges, Houthis fire medium-to-long range.
- The `InterceptionSystem` iterates over all tiers per missile, adding slight computational overhead proportional to tier count (3).
- All tier configuration is data-driven via the exported `DEFENSE_TIERS` array, making future tiers easy to add.
- The David's Sling unit adds a new purchase option to the air-defense shop category.
