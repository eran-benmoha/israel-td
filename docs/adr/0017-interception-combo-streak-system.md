# ADR 0017: Interception Combo/Streak System

## Status
Accepted

## Date
2026-04-03

## Context
The game's core loop involves waves of missiles being launched at Israel, with purchased defense systems attempting interceptions. While the interception mechanic works, there is no feedback loop that rewards the player for performing well during a wave. Players lack a sense of momentum or reward for consecutive successful interceptions.

## Decision
Introduce a combo/streak system that tracks consecutive missile interceptions and awards escalating bonuses. The system:

1. **Tracks interception streaks** via `MISSILE_INTERCEPTED` and `MISSILE_IMPACT` events emitted by `InterceptionSystem` and `ImpactSystem`.
2. **Resets streak** on any missile impact (enemy hits), creating risk/reward tension.
3. **Decays streak** after 8 seconds of inactivity (configurable via `combo-config.json`).
4. **Awards tier bonuses** (money + morale) at streak thresholds: 2x (Nice), 5x (Great), 10x (Amazing), 20x (Legendary).
5. **Displays a center-screen combo counter** with animated pop-in, tier label, color coding, and best-streak tracker.
6. **Data-driven config** in `src/data/combo-config.json` for easy tuning.

### Components
- `ComboSystem` — listens to interception/impact events, manages streak state, awards bonuses through `ResourceSystem`
- `ComboView` — DOM overlay showing streak count, tier label, and best streak
- New events: `MISSILE_INTERCEPTED`, `MISSILE_IMPACT`, `UI_COMBO`

## Consequences
- Players receive immediate visual and mechanical feedback for consecutive interceptions.
- Money and morale bonuses at tier thresholds create a reward loop encouraging defense investment.
- The combo display does not require canvas rendering—it uses DOM overlays consistent with existing UI patterns.
- The streak decay prevents permanent combo persistence between waves.
- Future extensions could add combo-specific sound effects or screen shake.
