import { describe, it, expect } from "vitest";
import israelData from "../src/data/israel.json";
import factionsConfig from "../src/data/factions.json";
import mapViewConfig from "../src/data/map-view.json";
import unitsConfig from "../src/data/units.json";
import level01 from "../src/data/levels/level-01.json";
import earlyWarningConfig from "../src/data/early-warning.json";

describe("israel.json", () => {
  it("has a non-empty outline with lat/lon pairs", () => {
    expect(israelData.outline.length).toBeGreaterThan(5);
    israelData.outline.forEach((p) => {
      expect(typeof p.lat).toBe("number");
      expect(typeof p.lon).toBe("number");
    });
  });

  it("has at least 3 regions with borders", () => {
    expect(israelData.regions.length).toBeGreaterThanOrEqual(3);
    israelData.regions.forEach((region) => {
      expect(region.id).toBeTruthy();
      expect(region.name).toBeTruthy();
      expect(region.border.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("has cities with regionId, name, lat, lon", () => {
    expect(israelData.cities.length).toBeGreaterThan(0);
    israelData.cities.forEach((city) => {
      expect(city.regionId).toBeTruthy();
      expect(city.name).toBeTruthy();
      expect(typeof city.lat).toBe("number");
      expect(typeof city.lon).toBe("number");
    });
  });

  it("every city references an existing region", () => {
    const regionIds = new Set(israelData.regions.map((r) => r.id));
    israelData.cities.forEach((city) => {
      expect(regionIds.has(city.regionId)).toBe(true);
    });
  });

  it("has at least 5 missile targets", () => {
    expect(israelData.targets.length).toBeGreaterThanOrEqual(5);
    israelData.targets.forEach((t) => {
      expect(typeof t.lat).toBe("number");
      expect(typeof t.lon).toBe("number");
    });
  });
});

describe("factions.json", () => {
  it("has at least 4 factions", () => {
    expect(factionsConfig.factions.length).toBeGreaterThanOrEqual(4);
  });

  it("each faction has required fields", () => {
    factionsConfig.factions.forEach((f) => {
      expect(f.id).toBeTruthy();
      expect(f.name).toBeTruthy();
      expect(f.territory).toBeTruthy();
      expect(f.bounds).toBeDefined();
      expect(f.bounds.north).toBeGreaterThan(f.bounds.south);
      expect(f.bounds.east).toBeGreaterThan(f.bounds.west);
      expect(typeof f.rocketColor).toBe("number");
      expect(typeof f.trailColor).toBe("number");
      expect(typeof f.baseVolley).toBe("number");
      expect(typeof f.maxVolley).toBe("number");
    });
  });

  it("each faction has a border polygon with at least 3 points", () => {
    factionsConfig.factions.forEach((f) => {
      expect(f.border).toBeDefined();
      expect(f.border.length).toBeGreaterThanOrEqual(3);
      f.border.forEach((p) => {
        expect(typeof p.lat).toBe("number");
        expect(typeof p.lon).toBe("number");
      });
    });
  });

  it("faction ids are unique", () => {
    const ids = factionsConfig.factions.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("map-view.json", () => {
  it("has valid projection config", () => {
    const p = mapViewConfig.projection;
    expect(["equirectangular", "mercator"]).toContain(p.type);
    expect(p.lonMax).toBeGreaterThan(p.lonMin);
    expect(p.latMax).toBeGreaterThan(p.latMin);
  });

  it("has tiles config when using mercator projection", () => {
    if (mapViewConfig.projection.type === "mercator") {
      expect(mapViewConfig.tiles).toBeDefined();
      expect(mapViewConfig.tiles.urlTemplate).toBeTruthy();
      expect(mapViewConfig.tiles.baseZoom).toBeGreaterThan(0);
      expect(mapViewConfig.tiles.tileSize).toBeGreaterThan(0);
    }
  });

  it("has valid zoom range", () => {
    expect(mapViewConfig.zoom.min).toBeGreaterThan(0);
    expect(mapViewConfig.zoom.max).toBeGreaterThan(mapViewConfig.zoom.min);
    expect(mapViewConfig.zoom.designZoom).toBeGreaterThan(0);
  });

  it("initial focus is within projection bounds", () => {
    const { focus } = mapViewConfig.initial;
    const p = mapViewConfig.projection;
    expect(focus.lat).toBeGreaterThanOrEqual(p.latMin);
    expect(focus.lat).toBeLessThanOrEqual(p.latMax);
    expect(focus.lon).toBeGreaterThanOrEqual(p.lonMin);
    expect(focus.lon).toBeLessThanOrEqual(p.lonMax);
  });

  it("has camera presets", () => {
    expect(mapViewConfig.cameraPresets).toBeDefined();
    const keys = Object.keys(mapViewConfig.cameraPresets);
    expect(keys.length).toBeGreaterThanOrEqual(1);
    keys.forEach((key) => {
      const preset = mapViewConfig.cameraPresets[key];
      expect(typeof preset.lat).toBe("number");
      expect(typeof preset.lon).toBe("number");
      expect(typeof preset.zoom).toBe("number");
    });
  });
});

describe("units.json", () => {
  it("has at least 3 units", () => {
    expect(unitsConfig.units.length).toBeGreaterThanOrEqual(3);
  });

  it("each unit has required fields", () => {
    unitsConfig.units.forEach((u) => {
      expect(u.id).toBeTruthy();
      expect(u.name).toBeTruthy();
      expect(u.category).toBeTruthy();
      expect(typeof u.cost).toBe("number");
      expect(u.cost).toBeGreaterThan(0);
      expect(typeof u.moraleBoost).toBe("number");
      expect(typeof u.armyBoost).toBe("number");
    });
  });

  it("unit ids are unique", () => {
    const ids = unitsConfig.units.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("level-01.json", () => {
  it("has simulation config", () => {
    expect(level01.simulation.startDateUtc).toBeTruthy();
    expect(level01.simulation.hoursPerSecond).toBeGreaterThan(0);
  });

  it("has wave timing", () => {
    expect(level01.waveTiming.minDelayMs).toBeGreaterThan(0);
    expect(level01.waveTiming.maxDelayMs).toBeGreaterThan(level01.waveTiming.minDelayMs);
  });

  it("has waves referencing valid faction ids", () => {
    const factionIds = new Set(factionsConfig.factions.map((f) => f.id));
    expect(level01.waves.length).toBeGreaterThan(0);
    level01.waves.forEach((wave) => {
      expect(factionIds.has(wave.factionId)).toBe(true);
    });
  });
});

describe("early-warning.json", () => {
  it("has a positive forecastDepth", () => {
    expect(earlyWarningConfig.forecastDepth).toBeGreaterThan(0);
  });

  it("has a positive warningThresholdMs", () => {
    expect(earlyWarningConfig.warningThresholdMs).toBeGreaterThan(0);
  });

  it("has at least 2 threat levels in ascending minScore order", () => {
    const levels = earlyWarningConfig.threatLevels;
    expect(levels.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].minScore).toBeGreaterThan(levels[i - 1].minScore);
    }
  });

  it("each threat level has required fields", () => {
    earlyWarningConfig.threatLevels.forEach((level) => {
      expect(level.id).toBeTruthy();
      expect(level.label).toBeTruthy();
      expect(typeof level.minScore).toBe("number");
      expect(level.color).toBeTruthy();
    });
  });

  it("first threat level starts at minScore 0", () => {
    expect(earlyWarningConfig.threatLevels[0].minScore).toBe(0);
  });
});
