# Historical Operations Library

This document explains the curated historical-content library added under `src/data/history/`.

## Purpose

The project already uses JSON as the source of truth for gameplay data. This library extends that approach to campaign research:

- it keeps historical level inspiration in structured files
- it groups operations into separate libraries by theme/front
- it tracks which operations already fit the current game systems and which would need new faction/content data

This is **not** an exhaustive military chronology. It is a curated set of major operations and campaigns that are useful as level seeds.

## Directory layout

```txt
src/data/history/
├─ index.json
└─ libraries/
   ├─ state-formation-and-interstate-wars.json
   ├─ special-operations-and-strategic-strikes.json
   ├─ northern-front-and-lebanon.json
   └─ palestinian-fronts-and-gaza.json
```

## What each operation tracks

Each operation entry includes:

- `name`
- `dateRange`
- `theater`
- `operationTypes`
- `adversaries`
- `summary`
- `historicalDynamics`
- `gameHooks`

`gameHooks` is the part intended for future level design. It tracks:

- `candidateLevelName` - short scenario title
- `defenseRegionIds` - current map regions most relevant to the scenario
- `pressureStyle` - what kind of threat pattern the level should emphasize
- `pacingModel` - whether the level should feel like a decisive strike, short burst, long attritional round, etc.
- `resourcePressure` - which HUD resources should be stressed
- `existingFactionIds` - current faction data that can already support the scenario
- `needsNewFactionData` - new factions/profiles needed before the level is fully implementable
- `candidateObjectives` - broad mission goals
- `mechanicIdeas` - level-specific system ideas

## Library breakdown

### 1. State formation and interstate wars

Use this library for:

- 1948 war levels
- large conventional fronts
- route reopening, reserve mobilization, and desert campaigns
- future campaign arcs that need Egyptian, Jordanian, or Syrian faction data

### 2. Special operations and strategic strikes

Use this library for:

- short one-off mission scenarios
- intelligence-heavy levels
- strike planning, timing, extraction, and stealth mechanics

These scenarios are less compatible with the current endless-wave structure and are better suited to bespoke missions later.

### 3. Northern front and Lebanon campaigns

Use this library for:

- north-focused rocket and deterrence levels
- large-salvo defense
- cross-border pressure from Lebanon

This library is the closest match to the current `hezbollah-lebanon` faction and the existing northern map framing.

### 4. West Bank and Gaza campaigns

Use this library for:

- Gaza-border and southern-defense levels
- central-city extended-range pressure
- tunnel mechanics
- urban attrition and home-front resilience

This is the best fit for the current `hamas-gaza` faction and present resource HUD model.

## Fastest path to new levels

If you want to turn this research into playable levels quickly, start with entries whose `existingFactionIds` are already populated:

1. `operation-accountability`
2. `operation-grapes-of-wrath`
3. `second-lebanon-war`
4. `operation-cast-lead`
5. `operation-pillar-of-defense`
6. `operation-protective-edge`
7. `operation-guardian-of-the-walls`

These can be converted into new level JSON first, because they map more naturally onto the existing faction system and current region overlays.

## Recommended next implementation steps

1. Create a `src/data/levels/` file per chosen operation-inspired scenario.
2. Add optional metadata in future level configs:
   - `historySourceId`
   - `historyLibraryId`
   - `levelTags`
3. Expand `src/data/factions.json` only when a historical scenario requires a new actor not already modeled.
4. Keep level mechanics abstracted; use history for framing, pacing, and constraints rather than literal simulation.

## Content note

These files are intended for broad historical framing and level design research. Before turning any entry into player-facing text, verify dates, names, and wording again so scenario copy remains careful and consistent.
