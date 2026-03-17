# ADR 0016 – CartoDB Dark Matter Tile Map

| Field     | Value                              |
| --------- | ---------------------------------- |
| Status    | Accepted                           |
| Date      | 2026-03-16                         |
| Supersedes| ADR 0014 (NASA Blue Marble satellite map) |
| Relates   | ADR 0002 (Map data and licensing), ADR 0007 (Map projection) |

## Context

The game used a single ~3 MB static satellite JPEG (NASA Blue Marble) as the
map background. While functional, this approach had drawbacks:

- The satellite image was large and visually busy, making overlays harder to
  read.
- The equirectangular projection did not match standard web-map tile providers,
  limiting upgrade paths.
- A dark-themed map better fits the military aesthetic of the game.

## Decision

1. **Replace the static satellite image with CartoDB Dark Matter raster tiles**
   loaded at runtime from the free public CDN:

   ```
   https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}.png
   ```

   - No API key required.
   - "No labels" variant avoids visual conflict with the game's own overlays.
   - Free tier: 75,000 map views/month (non-commercial).

2. **Switch the geo-projection to Web Mercator** so pixel coordinates align
   exactly with the tile grid.

3. **Load a fixed tile grid at zoom level 6 during Phaser preload**.
   At z=6, the bounding box (lon 18–70, lat 8–43) requires ~80 tiles
   (256×256 px each), totalling ~0.5–1 MB — lighter than the old satellite
   image.

4. **MapSystem** computes the tile grid, loads tiles via `scene.load.image`,
   and positions them in a `_tileContainer` inside the map container. A virtual
   `mapImage` object (`{ width, height }`) replaces the old Phaser image for
   dimension calculations.

5. **MapRenderer.setTileGrid()** receives the grid parameters and computes
   Mercator fractional bounds used by `projectGeoToMapXPercent` /
   `projectGeoToMapYPercent`.

6. The old satellite image (`src/assets/maps/middle-east-satellite.jpg`)
   remains in the repo as a legacy fallback but is no longer imported.

## Consequences

### Positive

- Dramatically better visual contrast for overlays (dark background).
- Lighter initial payload (~80 × 5–15 KB tiles vs. one 3 MB JPEG).
- Standard Web Mercator projection aligns with every major tile provider,
  making future upgrades trivial (e.g., switching to satellite tiles, terrain
  tiles, or higher zoom levels).
- No API key or billing required.

### Negative

- Requires a network connection to load tiles (no offline play).
- CARTO free-tier has a 75k views/month cap for non-commercial use.
- Tile loading adds ~80 HTTP requests at startup (mitigated by browser
  parallelism and small file sizes).
