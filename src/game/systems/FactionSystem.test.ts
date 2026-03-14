import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Utils: {
      Array: {
        GetRandom: (arr: unknown[]) => arr[0],
      },
    },
  },
}));

import { FactionSystem } from "./FactionSystem";
import type { FactionsConfig } from "../../types";

const mockConfig: FactionsConfig = {
  factions: [
    {
      id: "hamas-gaza",
      name: "Hamas",
      territory: "Gaza Strip",
      bounds: { north: 31.6, south: 31.22, west: 34.2, east: 34.58 },
      trailColor: 0xff6655,
      rocketColor: 0xff998e,
      baseVolley: 8,
      maxVolley: 28,
      impactMultiplier: 1,
      durationMin: 3800,
      durationMax: 6200,
      launchCadenceMs: 600,
      missileProfiles: [
        {
          id: "hamas-short-range",
          label: "short-range",
          weight: 8,
          minRangeKm: 0,
          maxRangeKm: 45,
          rocketColor: 0xffbb77,
          trailOuterColor: 0xffcc8c,
          trailInnerColor: 0xffeea0,
          flameColor: 0xffe58a,
          durationMin: 3600,
          durationMax: 5400,
          impactScale: 1,
        },
        {
          id: "hamas-long-range",
          label: "long-range",
          weight: 1,
          minRangeKm: 45,
          maxRangeKm: 260,
          rocketColor: 0xff664f,
          trailOuterColor: 0xf6720d,
          trailInnerColor: 0xffd748,
          flameColor: 0xffce1f,
          durationMin: 6200,
          durationMax: 9300,
          impactScale: 1.18,
        },
      ],
    },
    {
      id: "hezbollah-lebanon",
      name: "Hezbollah",
      territory: "South Lebanon",
      bounds: { north: 34.55, south: 33.05, west: 35.05, east: 36.65 },
      trailColor: 0xffcc6d,
      rocketColor: 0xffdd73,
      baseVolley: 7,
      maxVolley: 24,
      impactMultiplier: 1.05,
      durationMin: 4200,
      durationMax: 7000,
      launchCadenceMs: 680,
    },
  ],
};

describe("FactionSystem", () => {
  it("returns a faction by id", () => {
    const system = new FactionSystem(mockConfig);
    const faction = system.getById("hamas-gaza");

    expect(faction).not.toBeNull();
    expect(faction!.name).toBe("Hamas");
    expect(faction!.territory).toBe("Gaza Strip");
  });

  it("returns null for unknown faction id", () => {
    const system = new FactionSystem(mockConfig);
    expect(system.getById("nonexistent")).toBeNull();
  });

  it("describes a faction correctly", () => {
    const system = new FactionSystem(mockConfig);
    expect(system.describe("hamas-gaza")).toBe("Hamas • Gaza Strip");
  });

  it("returns 'Unknown' for unknown faction id", () => {
    const system = new FactionSystem(mockConfig);
    expect(system.describe("nonexistent")).toBe("Unknown");
  });

  it("picks a missile profile from weighted profiles", () => {
    const system = new FactionSystem(mockConfig);
    const profile = system.pickMissileProfile("hamas-gaza");

    expect(profile).not.toBeNull();
    expect(["hamas-short-range", "hamas-long-range"]).toContain(profile!.id);
  });

  it("generates a default missile profile when none are configured", () => {
    const system = new FactionSystem(mockConfig);
    const profile = system.pickMissileProfile("hezbollah-lebanon");

    expect(profile).not.toBeNull();
    expect(profile!.id).toBe("hezbollah-lebanon-standard");
    expect(profile!.label).toBe("standard");
    expect(profile!.maxRangeKm).toBe(9999);
  });

  it("returns null for unknown faction when picking missile", () => {
    const system = new FactionSystem(mockConfig);
    expect(system.pickMissileProfile("nonexistent")).toBeNull();
  });

  it("handles empty factions config", () => {
    const system = new FactionSystem({ factions: [] });
    expect(system.getById("anything")).toBeNull();
    expect(system.describe("anything")).toBe("Unknown");
    expect(system.pickMissileProfile("anything")).toBeNull();
  });
});
