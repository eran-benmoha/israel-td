# ADR 0007: Middle East Map, Projection Mapping, and Overlay Layers

- **Status:** Accepted
- **Date:** 2026-03-14

## Context

The game requires a draggable/zoomable Middle East map while preserving reasonable alignment between geographic coordinates and gameplay overlays (Israel outline, hostile areas, cities, regions).

## Decision

1. Use a higher-resolution Middle East relief map asset as primary background.
2. Convert geo coordinates to map coordinates using the adopted Middle East projection constants.
3. Draw all tactical annotations as runtime overlays:
   - Israel outline
   - hostile territory markers
   - regional boundaries
   - major city markers

## Consequences

### Positive

- Better visual quality than initial low-res prototype.
- Improved overlay alignment vs linear lat/lon interpolation.
- Flexible layering for UI/gameplay iteration.

### Negative

- Projection constants are tightly coupled to the selected map source.
- Any map source swap requires recalibration and validation.

## Alternatives considered

1. **Linear lat/lon bounding box mapping**
   - Rejected: visible alignment errors on conic/projection-distorted maps.
2. **No overlays (image-only)**
   - Rejected: insufficient gameplay readability.
