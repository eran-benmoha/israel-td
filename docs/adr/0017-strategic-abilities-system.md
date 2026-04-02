# ADR 0017: Strategic Abilities (Active Powers) System

- **Status:** Accepted
- **Date:** 2026-04-02

## Context

The current gameplay loop consists of passive unit purchases and watching interceptions. Players lack active, in-the-moment tactical options that create meaningful decisions during waves. Adding time-limited active abilities with cooldowns introduces a layer of strategic depth and player agency.

## Decision

1. Introduce a data-driven abilities config in `src/data/abilities.json` with three initial abilities:
   - **Emergency Siren** — temporarily doubles interception chance for all active defense systems (15 s duration, 60 s cooldown, costs 30 money).
   - **Airstrike** — instantly destroys all in-flight enemy missiles (90 s cooldown, costs 80 money).
   - **Emergency Funding** — grants an immediate cash injection of 100 money (45 s cooldown, costs 0 money but has a morale penalty).
2. Add `AbilitySystem` under `src/game/systems/` that:
   - Manages cooldown timers per ability.
   - Validates activation preconditions (sufficient money, off cooldown, meets wave unlock threshold).
   - Applies effects via `ResourceSystem` and exposes an interception-boost flag read by `InterceptionSystem`.
   - Emits `UI_ABILITY_STATE` on every cooldown tick so the UI stays in sync.
3. Add `AbilityView` under `src/game/ui/` — a horizontal ability bar positioned above the shop footer with circular cooldown-overlay buttons.
4. Wire the system into `BootScene` (Phaser side) and `UiSystem` (DOM side) following existing patterns.
5. New events: `ABILITY_ACTIVATE`, `UI_ABILITY_STATE`, `UI_ABILITY_RESULT`.

## Consequences

### Positive

- Adds meaningful real-time decisions during wave defense.
- Data-driven design allows easy addition of future abilities.
- Follows existing modular system + EventBus architecture.

### Negative

- Increases total system count and wiring in BootScene.
- Interception-boost coupling between AbilitySystem and InterceptionSystem needs clear ownership boundary.

## Alternatives considered

1. **Passive-only upgrades** — Rejected: does not address lack of active player agency.
2. **Abilities as purchasable units** — Rejected: cooldown-based active powers are fundamentally different from persistent unit purchases.
