# Historical Level Conversion Notes

This document explains how to turn entries from `src/data/history/` into actual playable level configs under `src/data/levels/`.

## What the runtime supports today

The current level runtime already supports these fields directly:

- `id`
- `name`
- `subtitle`
- `summary`
- `simulation.startDateUtc`
- `simulation.hoursPerSecond`
- `waveTiming.minDelayMs`
- `waveTiming.maxDelayMs`
- `waves[]`
- optional `startingResources`
- optional `maxResources`

It also safely ignores metadata that is useful for planning:

- `historySourceId`
- `historyLibraryId`
- `levelTags`

## Current playable historical levels

These IDs now load in the game:

- `level-02-accountability`
- `level-03-grapes-of-wrath`
- `level-04-second-lebanon-war`
- `level-05-cast-lead`
- `level-06-protective-edge`
- `level-07-guardian-of-the-walls`

Use them with a query parameter:

```txt
?level=level-06-protective-edge
```

Example local dev URL:

```txt
http://localhost:5173/?level=level-06-protective-edge
```

The selected level is also remembered in browser `localStorage` when available.

## Conversion checklist

### 1. Pick an operation that fits current mechanics

Start with an entry whose `existingFactionIds` is already populated in the history library.

Best current fits:

- Hezbollah/northern barrage scenarios
- Hamas/Gaza rocket-pressure scenarios

Avoid converting these directly until the runtime grows beyond pure wave defense:

- hostage rescues
- covert deep-strike missions
- 1948/1956/1967/1973 interstate campaigns needing new factions and movement rules

### 2. Copy the history identity into level metadata

Every history-based level should keep:

- `historySourceId`
- `historyLibraryId`
- `name`
- `subtitle`
- `summary`
- `levelTags`

This preserves the trace between research and implementation.

### 3. Convert the date into the simulation clock

Map the real operation start date into:

```json
"simulation": {
  "startDateUtc": "2014-07-08T00:00:00Z",
  "hoursPerSecond": 10
}
```

Guideline for `hoursPerSecond`:

- `4-7` for slower, longer-feeling campaigns
- `8-10` for medium-pressure operations
- `11-14` for compressed crisis scenarios

### 4. Convert pacing into `waveTiming`

Map the history library's `pacingModel` to delay windows:

| Pacing model | Suggested delay window |
| --- | --- |
| `single decisive strike` | needs future bespoke mission flow, not just wave timing |
| `time-critical rescue` | needs future bespoke mission flow, not just wave timing |
| `short intense burst` | `10000-30000 ms` |
| `multi-phase campaign` | `14000-50000 ms` |
| `sustained attrition` | `12000-42000 ms` with more waves and smaller recovery windows |

### 5. Convert pressure style into faction sequence

The current runtime only knows how to vary:

- faction origin
- missile profile
- wave intensity
- delay between waves

So pressure styles need to be abstracted:

- `counter-rocket suppression` -> mostly one faction with steadily increasing `intensityBonus`
- `multi-front escalation` -> rotate across multiple already-modeled factions
- `population-center defense` -> favor factions whose range threatens more map targets
- `tunnel and subterranean threat` -> currently model indirectly through tighter delays and lower starting resources until bespoke mechanics exist

### 6. Convert resource pressure into starting resources

Use lower starting values to express scenario stress:

- low `money` -> constrained procurement
- low `morale` -> home-front strain
- low `population` -> already stressed civilian baseline
- low `army` -> military fatigue or thin readiness

Suggested range for history-based starts:

- `money`: `130-160`
- `morale`: `90-96`
- `population`: `98-100`
- `army`: `93-96`

### 7. Build the wave list

For operations compatible with the current system:

- use 10-14 waves
- increase `intensityBonus` gradually
- keep the main faction dominant unless the history strongly supports multi-front framing

Example:

```json
"waves": [
  { "factionId": "hamas-gaza", "intensityBonus": 0 },
  { "factionId": "hamas-gaza", "intensityBonus": 1 },
  { "factionId": "hamas-gaza", "intensityBonus": 1 },
  { "factionId": "hamas-gaza", "intensityBonus": 2 }
]
```

### 8. Record what is still abstracted

If the original operation had mechanics the runtime does not yet support, leave that in the notes or `summary`.

Examples:

- tunnel threats
- ceasefire thresholds
- infiltration raids
- convoy escorts
- hostage extraction
- stealth or electronic warfare

That way the level is playable now, while still documenting what future system work would make it more faithful.

## Worked example: converting Operation Protective Edge

From the history library:

- `historySourceId`: `operation-protective-edge`
- dominant pressure: Gaza rocket fire plus tunnel threat
- pacing: `sustained attrition`
- resource pressure: morale, economy, population, army

Current-runtime translation:

- use `hamas-gaza` as the active faction for all waves
- choose `startDateUtc` of `2014-07-08T00:00:00Z`
- compress the long real-world campaign into a faster `hoursPerSecond`
- reduce starting morale and army to represent strain
- use tighter wave windows and rising intensity to suggest cumulative pressure
- document tunnel threat in metadata/subtitle even though the runtime does not simulate tunnels yet

## When a history entry should NOT become a level yet

Do **not** force an operation into the current schema if its core identity depends on mechanics we do not have.

Examples:

- **Operation Entebbe** needs objective rooms, alarm states, extraction, and a rescue timer.
- **Operation Opera** and **Operation Orchard** need route planning, stealth, and one-pass strike logic.
- **Operation Nachshon** needs convoys, road control, and corridor objectives.

Those entries should stay in `src/data/history/` until the systems can support them properly.
