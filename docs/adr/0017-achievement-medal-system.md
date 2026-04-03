# ADR 0017 — Achievement / Medal System

**Status:** Accepted  
**Date:** 2026-04-03  
**Author:** Cursor Agent

## Context

The game lacked a meta-progression layer to keep players engaged between waves. Players could purchase units and survive waves, but there was no acknowledgement of milestones or long-term goals beyond the immediate wave-by-wave loop.

## Decision

Add a **data-driven achievement system** that tracks player milestones and awards medals during gameplay, with toast notifications on unlock and a persistent achievement panel.

### Architecture

| Component | Path | Role |
|-----------|------|------|
| `achievements.json` | `src/data/achievements.json` | Achievement definitions (trigger type, condition, icon, text) |
| `AchievementSystem` | `src/game/systems/AchievementSystem.js` | Listens to EventBus events, evaluates conditions, emits unlock events |
| `AchievementView` | `src/game/ui/AchievementView.js` | Toast notifications and collapsible achievement panel |

### Supported trigger types

- `purchase_unit` — specific unit reaches a purchase count
- `total_purchases` — total units purchased across all types
- `wave_survived` — wave number threshold reached
- `total_spent` — cumulative money spent on purchases
- `money_held` — money resource reaches a threshold
- `all_categories` — at least one unit purchased from each listed category
- `category_purchases` — total units in a specific shop category

### Persistence

Unlocked achievement IDs and cumulative spending are stored in `localStorage` under key `israelTD_achievements`, consistent with ADR 0006 (browser localStorage only).

### UI

- **Toast notifications** slide in from top-center when an achievement unlocks, auto-dismiss after 3 seconds, and queue if multiple unlock simultaneously.
- **Achievement panel** toggleable via a medal button (bottom-left of screen), shows all achievements with lock/unlock state.
- Locked achievements show "???" names to encourage exploration.

## Consequences

- New achievements can be added by editing `achievements.json` without code changes.
- The system is decoupled from game systems — it only listens to existing EventBus events (UI_SHOP_RESULT, UI_WAVE, UI_RESOURCES).
- No impact on existing game logic or performance.
