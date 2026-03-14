# ADR 0013: Zoom-Responsive Map Rendering and Label Scaling

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The map engine uses a single Phaser container that scales all children (background image, vector overlays, labels) uniformly. At high zoom levels, vector outlines become thick and blurry (because pre-rasterized Graphics objects are stretched), labels grow excessively large, and at low zoom labels shrink to unreadable sizes. The 1500×982 px base map image also pixelates at high zoom.

## Decision

1. **Zoom-compensated vector overlays**: Redraw all Graphics objects (Israel outline, region borders, hostile territory markers) on every zoom change with line widths inversely adjusted by a damped ratio of the reference scale to current container scale. This keeps stroke widths visually consistent at any zoom level. Damping exponent: 0.85.

2. **Zoom-responsive labels**: Apply a counter-scale to all Text objects based on the container scale, using damping exponents per label category (region: 0.75, city: 0.70, hostile: 0.65). Labels grow gently when zooming in and shrink gently when zooming out, staying readable across the full 0.5×–12× zoom range.

3. **Zoom-compensated gameplay visuals**: Missile bodies, trails, interceptor visuals, impact flashes, and interception bursts use a real-time scale factor from `MapSystem.getOverlayScaleFactor()` (damping: 0.80) so they maintain proportional screen size.

4. **Texture quality**: Explicitly set LINEAR texture filtering on the map image. Enable `antialias: true` and `roundPixels: false` in the Phaser game config.

5. **Reference scale**: A reference container scale (baseMapScale × initial zoom level) is used as the anchor point for all compensation calculations. This ensures overlays appear at their designed proportions at the initial view and scale smoothly from there. The reference is recalculated on viewport resize.

## Consequences

### Positive

- Vector overlays (outlines, borders, territory markers) are crisp at all zoom levels.
- Labels remain readable and appropriately sized across the full zoom range.
- Dynamic gameplay elements (missiles, trails, effects) stay proportional.
- Smooth bilinear texture filtering improves image quality at intermediate zoom levels.

### Negative

- Graphics objects are redrawn (clear + re-stroke) on every zoom event, adding per-frame cost proportional to the number of overlay polygons. Current geometry count is small enough that this is negligible.
- Label `setScale()` causes bitmap scaling of pre-rendered text, which can show slight softness at extreme zoom ratios. Acceptable trade-off for smooth real-time zooming.

## Alternatives considered

1. **Dynamic font-size recreation on zoom** — Rejected: triggers expensive internal canvas re-renders per label per frame during active scroll/pinch.
2. **Tile-based multi-resolution map** — Deferred: would require a tile server or pre-sliced tile set, significant architectural change beyond current scope.
3. **No compensation (status quo)** — Rejected: unacceptable visual quality at zoom extremes.
