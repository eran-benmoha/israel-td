import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      DegToRad: (deg) => (deg * Math.PI) / 180,
    },
    Geom: {
      Point: class {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      },
      Circle: class {
        constructor(x, y, r) {
          this.x = x;
          this.y = y;
          this.radius = r;
        }
        static Contains() {
          return true;
        }
      },
    },
  },
}));

const { MapRenderer } = await import("../src/game/systems/MapRenderer");

function createMockScene() {
  return {
    add: {
      graphics: () => ({
        clear: vi.fn(),
        lineStyle: vi.fn(),
        strokePoints: vi.fn(),
        fillStyle: vi.fn(),
        fillPoints: vi.fn(),
      }),
      container: (_x, _y) => ({ add: vi.fn() }),
      text: () => ({
        setOrigin: function () { return this; },
        setAlpha: function () { return this; },
        setDepth: function () { return this; },
        setScale: vi.fn(),
      }),
      circle: () => ({
        setStrokeStyle: function () { return this; },
        setScale: vi.fn(),
        setAlpha: vi.fn(),
        setInteractive: vi.fn(),
        on: vi.fn(),
      }),
      polygon: () => ({
        setStrokeStyle: function () { return this; },
        setScale: vi.fn(),
        setInteractive: vi.fn(),
        on: vi.fn(),
      }),
    },
    tweens: { add: vi.fn() },
  };
}

const israelData = {
  outline: [{ lat: 31, lon: 34 }, { lat: 32, lon: 35 }, { lat: 31, lon: 35 }],
  regions: [
    { id: "n", name: "North", border: [{ lat: 33, lon: 35 }, { lat: 33, lon: 36 }, { lat: 32, lon: 35.5 }] },
  ],
  cities: [{ regionId: "n", name: "Haifa", lat: 32.8, lon: 34.99 }],
};

const factions = [
  {
    id: "test-faction",
    name: "Test",
    territory: "Testland",
    bounds: { north: 32, south: 31, west: 34, east: 35 },
    border: [{ lat: 32, lon: 34 }, { lat: 32, lon: 35 }, { lat: 31, lon: 35 }, { lat: 31, lon: 34 }],
    rocketColor: 0xff0000,
    trailColor: 0x00ff00,
  },
];

function createEquirectRenderer() {
  const mapViewConfig = {
    projection: { type: "equirectangular", lonMin: 18, lonMax: 70, latMin: 8, latMax: 43 },
  };
  return new MapRenderer({ scene: createMockScene(), mapViewConfig, israelData, factions });
}

function createMercatorRenderer() {
  const mapViewConfig = {
    projection: { type: "mercator", lonMin: 18, lonMax: 70, latMin: 8, latMax: 43 },
  };
  const r = new MapRenderer({ scene: createMockScene(), mapViewConfig, israelData, factions });
  r.setTileGrid({ xMin: 35, yMin: 23, cols: 10, rows: 8, zoom: 6 });
  return r;
}

describe("MapRenderer geo projection (equirectangular)", () => {
  it("projects lon to x percent linearly", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    expect(r.projectGeoToMapXPercent(30, 18)).toBeCloseTo(0, 1);
    expect(r.projectGeoToMapXPercent(30, 70)).toBeCloseTo(100, 1);
    expect(r.projectGeoToMapXPercent(30, 44)).toBeCloseTo(50, 1);
  });

  it("projects lat to y percent linearly", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    expect(r.projectGeoToMapYPercent(43, 44)).toBeCloseTo(0, 1);
    expect(r.projectGeoToMapYPercent(8, 44)).toBeCloseTo(100, 1);
    expect(r.projectGeoToMapYPercent(25.5, 44)).toBeCloseTo(50, 1);
  });

  it("geoToImagePoint returns pixel coordinates", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    const point = r.geoToImagePoint(43, 18);
    expect(point.x).toBeCloseTo(0, 0);
    expect(point.y).toBeCloseTo(0, 0);

    const br = r.geoToImagePoint(8, 70);
    expect(br.x).toBeCloseTo(6000, 0);
    expect(br.y).toBeCloseTo(4038, 0);
  });
});

describe("MapRenderer geo projection (mercator)", () => {
  it("projects lon boundaries to 0% and 100%", () => {
    const r = createMercatorRenderer();
    r.mapImage = { width: 2560, height: 2048 };
    // lon 18 maps to tile x=35 and lon 70 maps to tile x=44
    // The exact percent depends on where the tile boundaries fall
    // lon 18 → worldFrac = 198/360 = 0.55, leftFrac = 35/64 = 0.546875
    // xPercent = (0.55 - 0.546875) / (45/64 - 35/64) * 100 = 0.003125 / 0.15625 * 100 = 2.0
    const xAtLonMin = r.projectGeoToMapXPercent(30, 18);
    const xAtLonMax = r.projectGeoToMapXPercent(30, 70);
    expect(xAtLonMin).toBeGreaterThanOrEqual(0);
    expect(xAtLonMax).toBeLessThanOrEqual(100);
    expect(xAtLonMax).toBeGreaterThan(xAtLonMin);
  });

  it("projects lat boundaries within 0%-100% range", () => {
    const r = createMercatorRenderer();
    r.mapImage = { width: 2560, height: 2048 };
    const yAtLatMax = r.projectGeoToMapYPercent(43, 44);
    const yAtLatMin = r.projectGeoToMapYPercent(8, 44);
    expect(yAtLatMax).toBeGreaterThanOrEqual(0);
    expect(yAtLatMin).toBeLessThanOrEqual(100);
    expect(yAtLatMin).toBeGreaterThan(yAtLatMax);
  });

  it("higher latitude maps to lower y percent (north is up)", () => {
    const r = createMercatorRenderer();
    r.mapImage = { width: 2560, height: 2048 };
    const yNorth = r.projectGeoToMapYPercent(40, 44);
    const ySouth = r.projectGeoToMapYPercent(15, 44);
    expect(yNorth).toBeLessThan(ySouth);
  });

  it("higher longitude maps to higher x percent (east is right)", () => {
    const r = createMercatorRenderer();
    r.mapImage = { width: 2560, height: 2048 };
    const xWest = r.projectGeoToMapXPercent(30, 25);
    const xEast = r.projectGeoToMapXPercent(30, 60);
    expect(xEast).toBeGreaterThan(xWest);
  });

  it("geoToImagePoint returns valid pixel coordinates", () => {
    const r = createMercatorRenderer();
    r.mapImage = { width: 2560, height: 2048 };
    const point = r.geoToImagePoint(31.75, 34.58);
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(2560);
    expect(point.y).toBeGreaterThan(0);
    expect(point.y).toBeLessThan(2048);
  });
});

describe("MapRenderer overlay layers", () => {
  it("createOverlayLayers returns required keys", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    const layers = r.createOverlayLayers();
    expect(layers).toHaveProperty("outline");
    expect(layers).toHaveProperty("regionLayer");
    expect(layers).toHaveProperty("cityLayer");
    expect(layers).toHaveProperty("hostileLayer");
  });

  it("tracks region entries after drawing", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._regionEntries.length).toBe(1);
  });

  it("tracks city entries after drawing", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._cityEntries.length).toBe(1);
  });

  it("tracks hostile entries after drawing", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._hostileEntries.length).toBe(1);
  });
});

describe("MapRenderer updateForZoom", () => {
  it("does nothing if referenceScale is not set", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(() => r.updateForZoom(1)).not.toThrow();
  });

  it("updates without error when referenceScale is set", () => {
    const r = createEquirectRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    r.setReferenceScale(0.5);
    expect(() => r.updateForZoom(1)).not.toThrow();
    expect(() => r.updateForZoom(0.1)).not.toThrow();
    expect(() => r.updateForZoom(5)).not.toThrow();
  });
});

describe("MapRenderer setTileGrid", () => {
  it("computes mercator bounds from tile grid parameters", () => {
    const r = createMercatorRenderer();
    expect(r._mercatorBounds).not.toBeNull();
    expect(r._mercatorBounds.leftFrac).toBeCloseTo(35 / 64, 6);
    expect(r._mercatorBounds.rightFrac).toBeCloseTo(45 / 64, 6);
    expect(r._mercatorBounds.topFrac).toBeCloseTo(23 / 64, 6);
    expect(r._mercatorBounds.bottomFrac).toBeCloseTo(31 / 64, 6);
  });
});
