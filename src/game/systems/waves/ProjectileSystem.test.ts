import { describe, it, expect } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      DegToRad: (deg: number) => (deg * Math.PI) / 180,
      FloatBetween: (min: number, max: number) => (min + max) / 2,
      Linear: (a: number, b: number, t: number) => a + (b - a) * t,
      Between: (min: number, max: number) => Math.round((min + max) / 2),
      Angle: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.atan2(y2 - y1, x2 - x1) },
    },
    Utils: { Array: { GetRandom: (arr: unknown[]) => arr[0] } },
    Geom: { Point: class Point { x: number; y: number; constructor(x: number, y: number) { this.x = x; this.y = y; } } },
  },
}));

import { vi } from "vitest";
import { ProjectileSystem } from "./ProjectileSystem";

function createMinimalSystem(): ProjectileSystem {
  return new ProjectileSystem({
    scene: { time: { delayedCall: vi.fn() }, tweens: { add: vi.fn() }, add: { graphics: vi.fn() } } as any,
    mapSystem: {
      randomGeoPointFromRect: vi.fn(),
      geoToImagePoint: vi.fn(),
      createMissileVisual: vi.fn(),
      mapContainer: { add: vi.fn() },
      getOverlayScaleFactor: () => 1,
    } as any,
    factionSystem: { pickMissileProfile: vi.fn() } as any,
    targets: [{ lat: 32.0, lon: 34.78 }],
    interceptionSystem: { tryScheduleInterception: vi.fn() } as any,
    impactSystem: { createImpact: vi.fn() } as any,
  });
}

describe("ProjectileSystem.distanceKm", () => {
  const system = createMinimalSystem();

  it("returns 0 for same point", () => {
    expect(system.distanceKm(32.0, 34.78, 32.0, 34.78)).toBeCloseTo(0, 5);
  });

  it("computes approximate distance between Tel Aviv and Jerusalem", () => {
    const dist = system.distanceKm(32.0853, 34.7818, 31.7683, 35.2137);
    expect(dist).toBeGreaterThan(50);
    expect(dist).toBeLessThan(80);
  });

  it("computes approximate distance between Tel Aviv and Haifa", () => {
    const dist = system.distanceKm(32.0853, 34.7818, 32.794, 34.9896);
    expect(dist).toBeGreaterThan(70);
    expect(dist).toBeLessThan(110);
  });

  it("is symmetric", () => {
    const d1 = system.distanceKm(32.0, 34.0, 33.0, 35.0);
    const d2 = system.distanceKm(33.0, 35.0, 32.0, 34.0);
    expect(d1).toBeCloseTo(d2, 5);
  });
});
