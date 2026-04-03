# ADR 0017: Score System and Win/Lose Conditions

## Status

Accepted

## Context

The game previously ran as an endless sandbox with no explicit win/lose feedback or scoring. Players had no way to measure performance, and the game continued indefinitely even when resources reached zero.

## Decision

Introduce a **ScoreSystem** that:

1. **Tracks statistics**: missiles intercepted, missiles impacted, waves completed, total missiles fired.
2. **Awards points**: +50 per interception, +100 per wave survived, −15 per impact (floor at 0).
3. **Detects game over**: when morale or population drops to 0.
4. **Detects victory**: when all waves in the level are survived (based on `levelConfig.waves.length`).
5. **Auto-detects wave completion**: tracks active in-flight missiles and fires `WAVE_COMPLETED` when all resolve.

### New Events

| Event | Emitted By | Purpose |
|-------|-----------|---------|
| `MISSILE_LAUNCHED` | ProjectileSystem | Tracks each missile spawn |
| `MISSILE_INTERCEPTED` | InterceptionSystem | Tracks successful interceptions |
| `MISSILE_IMPACTED` | ImpactSystem | Tracks impacts |
| `WAVE_COMPLETED` | ScoreSystem | Auto-fired when all missiles in a wave resolve |
| `UI_SCORE` | ScoreSystem | Pushes score data to HUD |
| `GAME_OVER` | ScoreSystem | Triggers end screen (defeat) |
| `GAME_VICTORY` | ScoreSystem | Triggers end screen (victory) |

### UI Changes

- **Score bar** in HUD showing points, waves progress, and interception rate.
- **End screen overlay** with full statistics displayed on game over or victory.

### Architecture

- `ScoreSystem` follows existing system patterns (EventBus-driven, constructor injection, `start()`/`destroy()` lifecycle).
- `GameState` extended with `score` object and `gameOver`/`victory` flags.
- `EndScreenView` follows existing UI view pattern (DOM element bindings).
- `ImpactSystem` and `ProjectileSystem` now receive `eventBus` via constructor.

## Consequences

- The game now has clear win/lose feedback and a scoring mechanic.
- Score data can be used for future features (leaderboards, achievements, difficulty scaling).
- Existing systems (`InterceptionSystem`, `ImpactSystem`, `ProjectileSystem`) gain event emissions but no behavioral changes.
- 17 new tests added; all 89 tests pass.
