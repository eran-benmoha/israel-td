# ADR 0015 – Input System and Desktop Mouse/Keyboard Controls

| Field     | Value                         |
| --------- | ----------------------------- |
| Status    | Accepted                      |
| Date      | 2026-03-16                    |
| Relates   | ADR 0003 (Mobile-first UX), ADR 0012 (System modularization) |

## Context

All canvas input handling (pointer drag, pinch-zoom, wheel-zoom) lived inside
`MapSystem.registerInputHandlers()`. This made `MapSystem` responsible for both
map projection/rendering **and** raw input processing, which violated the
modular-system boundary guidance in ADR 0012.

Additionally, the game had **no keyboard controls** and no desktop-specific
affordances. Testing on a computer required using only mouse drag and wheel,
with no keyboard shortcuts for common actions (zoom, pan, launching waves,
toggling UI panels).

## Decision

1. **Extract input into `InputSystem`** (`src/game/systems/InputSystem.js`).
   - Owns all Phaser pointer listeners (drag, pinch, wheel) and DOM keyboard
     listeners.
   - Receives a reference to `MapSystem` via `bindMapControls()` so it can
     call map-manipulation methods (`applyZoomAtScreenPoint`, `panBy`,
     `clampMapPosition`).
   - `MapSystem` keeps its projection/rendering responsibilities but no longer
     registers input handlers directly.

2. **Add desktop controls** handled by `InputSystem`:
   | Input                | Action                              |
   | -------------------- | ----------------------------------- |
   | Arrow keys / WASD    | Continuous map pan (while held)     |
   | `+` / `-`            | Step zoom in / out (centre-screen)  |
   | `B`                  | Toggle shop panel                   |
   | `` ` `` (backtick)   | Toggle debug panel                  |
   | `Space`              | Launch debug wave                   |
   | Right-click (canvas) | Suppressed browser context menu     |

3. **Crosshair cursor** on the game canvas for desktop clarity.

4. **`MapSystem.panBy(dx, dy, vw, vh)`** added so `InputSystem` can apply
   per-frame keyboard panning without reaching into container internals.

5. **`BootScene.update()`** now calls `inputSystem.update()` each frame to
   process held-key panning.

## Consequences

- Mobile touch behaviour is unchanged; pinch-zoom and single-finger drag
  continue to work identically.
- `MapSystem` is slimmer and focused on map geometry.
- Future input features (gamepad, click-to-interact on missiles, etc.) have a
  single home in `InputSystem`.
- The system boundary list in `AGENT_PLAYBOOK.md` should be updated to include
  `InputSystem`.
