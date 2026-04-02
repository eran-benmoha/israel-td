# ADR 0017 – Score System and Win/Lose Conditions

| Field     | Value                              |
| --------- | ---------------------------------- |
| Status    | Accepted                           |
| Date      | 2026-04-02                         |
| Relates   | ADR 0004 (Core game loop), ADR 0006 (localStorage), ADR 0011 (Resource model) |

## Context

The game currently runs indefinitely: waves repeat via modulo on the level's
`waves` array, resources drain from impacts, but there is no explicit end state.
The roadmap (Phase 2, "Remaining for full phase completion") calls for an
explicit win/lose loop and persistence of campaign progress.

Players need:

- A **score** that rewards good play (surviving waves, intercepting missiles).
- A **lose condition** when critical resources are exhausted.
- A **victory condition** when the player survives the full wave roster.
- An **end screen** with score summary and restart option.
- **High-score persistence** via `localStorage` (per ADR 0006).

## Decision

1. **Add a `ScoreSystem`** (`src/game/systems/ScoreSystem.js`) that:
   - Tracks a running score: `+100` per wave survived, `+50` per interception,
     `−25` per impact.
   - Monitors resource thresholds each time resources update:
     lose if morale ≤ 0 **or** population ≤ 0 **or** army ≤ 0.
   - Detects victory when `wave.number` reaches the level's total wave count
     (length of the `waves` array) and no loss condition is triggered.
   - Emits `GAME_OVER` or `GAME_VICTORY` events via `EventBus`.

2. **Extend `GameState`** with `score`, `gameOver`, and `gameWon` fields.

3. **Add new events** to `events.js`:
   - `GAME_OVER`, `GAME_VICTORY`, `SCORE_UPDATED`, `GAME_RESTART`.

4. **Add an `EndScreenView`** (`src/game/ui/EndScreenView.js`) that renders a
   modal overlay on `GAME_OVER` / `GAME_VICTORY` with score, waves survived,
   and a restart button that emits `GAME_RESTART`.

5. **Persist high score** in `localStorage` under key `israel-td-highscore`.

6. **Stop wave scheduling** when game ends (WaveDirector listens for end
   events).

7. **Show score in the HUD** as a new resource chip.

## Consequences

### Positive

- The game loop now has a clear end, motivating strategic play.
- High-score persistence adds replayability.
- Modular: `ScoreSystem` follows the existing system boundary pattern.

### Negative

- Tuning thresholds and point values may need iteration.
- Adds one more system to `BootScene` wiring.
