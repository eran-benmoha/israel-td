import { describe, it, expect } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      DegToRad: (deg: number) => (deg * Math.PI) / 180,
      FloatBetween: (min: number, max: number) => (min + max) / 2,
      Linear: (a: number, b: number, t: number) => a + (b - a) * t,
      Between: (min: number, max: number) => Math.round((min + max) / 2),
      Distance: { Between: (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) },
    },
    Geom: { Point: class Point { x: number; y: number; constructor(x: number, y: number) { this.x = x; this.y = y; } } },
  },
}));

import { vi } from "vitest";
import { InterceptionSystem } from "./InterceptionSystem";
import type { MissileProfile } from "../../../types";

function createMinimalSystem(): InterceptionSystem {
  return new InterceptionSystem({
    scene: {} as any,
    eventBus: { on: vi.fn(), off: vi.fn(), emit: vi.fn() } as any,
    gameState: { wave: { activeFactionId: null }, purchasedUnits: {} } as any,
    factionSystem: { getById: vi.fn(), describe: vi.fn(() => "Test") } as any,
    mapSystem: { geoToImagePoint: vi.fn(), mapContainer: { add: vi.fn() }, getOverlayScaleFactor: () => 1 } as any,
    targets: [],
  });
}

describe("InterceptionSystem.getIronDomeInterceptionChance", () => {
  const system = createMinimalSystem();

  const shortRange: MissileProfile = {
    id: "test-short",
    label: "short",
    minRangeKm: 0,
    maxRangeKm: 45,
    rocketColor: 0,
    trailOuterColor: 0,
    trailInnerColor: 0,
    flameColor: 0,
    durationMin: 1000,
    durationMax: 2000,
    impactScale: 1,
  };

  const medRange: MissileProfile = {
    ...shortRange,
    id: "test-med",
    maxRangeKm: 200,
  };

  const longRange: MissileProfile = {
    ...shortRange,
    id: "test-long",
    maxRangeKm: 500,
  };

  it("returns higher chance for short-range missiles", () => {
    const chance = system.getIronDomeInterceptionChance(shortRange, 2);
    expect(chance).toBeGreaterThan(0);
    expect(chance).toBeLessThanOrEqual(0.9);
  });

  it("returns lower chance for long-range missiles", () => {
    const shortChance = system.getIronDomeInterceptionChance(shortRange, 2);
    const longChance = system.getIronDomeInterceptionChance(longRange, 2);
    expect(shortChance).toBeGreaterThan(longChance);
  });

  it("increases chance with more batteries", () => {
    const oneChance = system.getIronDomeInterceptionChance(shortRange, 1);
    const threeChance = system.getIronDomeInterceptionChance(shortRange, 3);
    expect(threeChance).toBeGreaterThan(oneChance);
  });

  it("clamps to minimum 0.08", () => {
    const chance = system.getIronDomeInterceptionChance(longRange, 0);
    expect(chance).toBeGreaterThanOrEqual(0.08);
  });

  it("clamps to maximum 0.9", () => {
    const chance = system.getIronDomeInterceptionChance(shortRange, 100);
    expect(chance).toBeLessThanOrEqual(0.9);
  });

  it("applies medium range modifier for mid-range missiles", () => {
    const medChance = system.getIronDomeInterceptionChance(medRange, 2);
    const shortChance = system.getIronDomeInterceptionChance(shortRange, 2);
    expect(medChance).toBeLessThan(shortChance);
    expect(medChance).toBeGreaterThan(0);
  });
});
