# ADR 0014: NASA Blue Marble Satellite Map Image

- **Status:** Accepted (supersedes image choice in ADR 0002 and ADR 0007)
- **Date:** 2026-03-14

## Context

The original map asset (`middle-east-relief.jpg`, 1500×982 px) was visually adequate at low zoom levels but became heavily pixelated at higher zoom. The game supports 0.5×–12× zoom, meaning the map can be magnified up to ~24× relative to the minimum view. A higher-resolution source image is needed to maintain visual quality across the full zoom range.

## Decision

1. Replace the relief map with a crop of NASA's **Blue Marble: Next Generation with Topography and Bathymetry** dataset.
2. Source tile: C1 (0°–90°E, 0°–90°N) from the 500 m/pixel (86400×43200 global) dataset.
3. Crop bounds: 18°E–70°E, 8°N–43°N — covering all game factions (Gaza, Lebanon, Yemen, Iran) and Israel with surrounding context.
4. Output resolution: **6000×4038 px** (4× width, 4.1× height vs. previous asset).
5. JPEG quality 78, file size ~2.9 MB.
6. Switch projection from custom conic to **equirectangular (Plate Carrée)**, matching the Blue Marble dataset's native projection. The MapRenderer retains backward compatibility with the legacy conic formula via the `projection.type` field in `map-view.json`.
7. License: Public domain (NASA). Attribution updated in both `src/assets/maps/ATTRIBUTION.md` and `public/assets/maps/ATTRIBUTION.md`.

## Consequences

### Positive

- Dramatically improved visual clarity at all zoom levels.
- True satellite imagery gives a modern, Google Maps-like appearance.
- Equirectangular projection simplifies geo-to-pixel math.
- Public domain license — no redistribution concerns.

### Negative

- Larger asset size (2.9 MB vs. 337 KB) increases initial load time on slow connections.
- Equirectangular projection has visible area distortion at high latitudes (minimal impact for the 8°–43°N range used).

## Alternatives considered

1. **Wikimedia Satellite Relief Map (3434×2400)** — Rejected: only 2× improvement, CC BY-SA license adds attribution complexity.
2. **NASA MODIS single-scene (6400×5000)** — Rejected: coverage area too narrow, excluded Yemen and most of Iran.
3. **Tile-based OpenStreetMap rendering** — Deferred: requires significant architectural changes and tile server dependency.
