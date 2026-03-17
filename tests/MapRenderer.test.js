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

function createRenderer() {
  const scene = {
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

  const mapViewConfig = {
    projection: { type: "equirectangular", lonMin: 18, lonMax: 70, latMin: 8, latMax: 43 },
  };

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

  return new MapRenderer({ scene, mapViewConfig, israelData, factions });
}

describe("MapRenderer geo projection", () => {
  it("projects lon to x percent linearly (equirectangular)", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    expect(r.projectGeoToMapXPercent(30, 18)).toBeCloseTo(0, 1);
    expect(r.projectGeoToMapXPercent(30, 70)).toBeCloseTo(100, 1);
    expect(r.projectGeoToMapXPercent(30, 44)).toBeCloseTo(50, 1);
  });

  it("projects lat to y percent linearly (equirectangular)", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    expect(r.projectGeoToMapYPercent(43, 44)).toBeCloseTo(0, 1);
    expect(r.projectGeoToMapYPercent(8, 44)).toBeCloseTo(100, 1);
    expect(r.projectGeoToMapYPercent(25.5, 44)).toBeCloseTo(50, 1);
  });

  it("geoToImagePoint returns pixel coordinates", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    const point = r.geoToImagePoint(43, 18);
    expect(point.x).toBeCloseTo(0, 0);
    expect(point.y).toBeCloseTo(0, 0);

    const br = r.geoToImagePoint(8, 70);
    expect(br.x).toBeCloseTo(6000, 0);
    expect(br.y).toBeCloseTo(4038, 0);
  });
});

describe("MapRenderer overlay layers", () => {
  it("createOverlayLayers returns required keys", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    const layers = r.createOverlayLayers();
    expect(layers).toHaveProperty("outline");
    expect(layers).toHaveProperty("regionLayer");
    expect(layers).toHaveProperty("cityLayer");
    expect(layers).toHaveProperty("hostileLayer");
  });

  it("tracks region entries after drawing", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._regionEntries.length).toBe(1);
  });

  it("tracks city entries after drawing", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._cityEntries.length).toBe(1);
  });

  it("tracks hostile entries after drawing", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(r._hostileEntries.length).toBe(1);
  });
});

describe("MapRenderer updateForZoom", () => {
  it("does nothing if referenceScale is not set", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    expect(() => r.updateForZoom(1)).not.toThrow();
  });

  it("updates without error when referenceScale is set", () => {
    const r = createRenderer();
    r.mapImage = { width: 6000, height: 4038 };
    r.createOverlayLayers();
    r.setReferenceScale(0.5);
    expect(() => r.updateForZoom(1)).not.toThrow();
    expect(() => r.updateForZoom(0.1)).not.toThrow();
    expect(() => r.updateForZoom(5)).not.toThrow();
  });
});
