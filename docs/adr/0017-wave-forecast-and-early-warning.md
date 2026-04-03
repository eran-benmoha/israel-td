# ADR 0017 – Wave Forecast & Early Warning System

**Status:** Accepted  
**Date:** 2026-04-03

## Context

Players currently see only the active wave source and a countdown progress bar. There is no visibility into upcoming waves, making it hard to plan purchases or anticipate threats from specific factions. The game lacks a strategic intelligence layer that would reward forward planning.

## Decision

Add a **Wave Forecast & Early Warning System** consisting of:

1. **Forecast Panel** — A collapsible intelligence panel (positioned between the HUD and game canvas) that previews the next N upcoming waves. Each entry shows the faction name, territory, estimated threat level (based on `intensityBonus` and faction stats), and a color-coded threat badge.

2. **Early Warning Alerts** — When a wave countdown drops below a configurable threshold (default 3 seconds), an urgent visual alert pulses on the forecast panel to signal imminent attack.

3. **Data-Driven Configuration** — All tuning (forecast depth, warning threshold, threat level labels/colors) lives in `src/data/early-warning.json`.

4. **EarlyWarningSystem** — A new system (`src/game/systems/EarlyWarningSystem.js`) that:
   - Subscribes to `UI_WAVE` and `UI_WAVE_PROGRESS` events from `WaveDirector`
   - Computes forecast entries from the level config and faction data
   - Emits `UI_EARLY_WARNING` events for the view layer

5. **EarlyWarningView** — A new view (`src/game/ui/EarlyWarningView.js`) that renders the forecast panel and warning state into the DOM.

### Threat Level Calculation

Threat level for a forecasted wave is derived from:
- The wave's `intensityBonus` value
- The faction's `impactMultiplier`
- Combined into a numeric score mapped to named tiers (LOW, MODERATE, HIGH, SEVERE)

### Integration Points

- `BootScene` creates `EarlyWarningSystem` in `create()` and destroys it in `destroySystems()`
- `UiSystem` creates `EarlyWarningView` and binds it to the `UI_EARLY_WARNING` event
- New events added to `src/game/core/events.js`: `UI_EARLY_WARNING`, `UI_EARLY_WARNING_ALERT`
- HTML elements added to `index.html` for the forecast panel
- CSS styles added to `src/style.css`

## Consequences

- Players gain strategic foresight, allowing them to plan defense purchases before specific faction attacks
- The imminent-wave alert adds tension and urgency to gameplay
- All configuration is data-driven and easily tunable
- Mobile-first: the panel is compact and collapsible, respecting viewport constraints (ADR 0010)
- No changes to existing systems beyond new event subscriptions
