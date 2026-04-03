# ADR 0017 — Faction Threat Intelligence System

**Status:** Accepted  
**Date:** 2026-04-03

## Context

Players had no visibility into which enemy factions posed the greatest immediate danger. All factions appeared equally threatening regardless of recent activity, missile volume, or successful impacts. This made resource allocation (e.g., choosing which defense tier to invest in) harder than it should be.

## Decision

Introduce a **Threat Intelligence System** that tracks real-time per-faction threat scores and surfaces them in a compact, expandable HUD bar.

### Architecture

- **ThreatSystem** (`src/game/systems/ThreatSystem.js`): A new game system that subscribes to `THREAT_MISSILE_LAUNCHED`, `THREAT_MISSILE_INTERCEPTED`, and `THREAT_MISSILE_IMPACT` events. It maintains per-faction score counters, applies time-based decay, classifies each faction into five threat tiers (LOW → GUARDED → ELEVATED → HIGH → SEVERE), and publishes `UI_THREAT_UPDATE` events for the UI.
- **ThreatView** (`src/game/ui/ThreatView.js`): A DOM-based view that renders the overall threat badge and an expandable per-faction breakdown with progress bars, level labels, and interception stats.
- **threat-config.json** (`src/data/threat-config.json`): Data-driven configuration for threat level thresholds, scoring weights, decay rate, and update interval.

### Scoring model

| Event | Points |
|-------|--------|
| Missile launched | +2 |
| Missile impacts | +8 |
| Missile intercepted | −3 |
| Time decay | −0.4 per second |

Scores are clamped to [0, 100].

### Threat tiers

| Tier | Score range | Color |
|------|------------|-------|
| LOW | 0–25 | Green |
| GUARDED | 25–50 | Blue |
| ELEVATED | 50–70 | Yellow |
| HIGH | 70–85 | Orange |
| SEVERE | 85–100 | Red |

### Integration

- `ProjectileSystem` and `ImpactSystem` now accept `eventBus` and emit threat events.
- `InterceptionSystem` emits `THREAT_MISSILE_INTERCEPTED` on successful interceptions.
- `BootScene` creates and manages the `ThreatSystem` lifecycle.
- `UiSystem` wires `ThreatView` to the `UI_THREAT_UPDATE` event.

## Consequences

- Players gain situational awareness of which fronts are most active and dangerous.
- The threat bar provides implicit guidance on where to focus defensive spending.
- Decay ensures threat levels reflect recent activity rather than cumulative totals.
- All configuration is externalized in `threat-config.json` for balance tuning.
- The expandable UI keeps the default view compact to avoid cluttering the mobile HUD.
