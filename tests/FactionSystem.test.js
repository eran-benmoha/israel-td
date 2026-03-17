import { describe, it, expect, vi } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Utils: {
      Array: {
        GetRandom: (arr) => arr[0],
      },
    },
  },
}));

const { FactionSystem } = await import("../src/game/systems/FactionSystem");

const factionsConfig = {
  factions: [
    {
      id: "hamas-gaza",
      name: "Hamas",
      territory: "Gaza Strip",
      bounds: { north: 31.6, south: 31.22, west: 34.2, east: 34.56 },
      rocketColor: 0xff8a1e,
      trailColor: 0xff5a35,
      durationMin: 3800,
      durationMax: 6200,
      baseVolley: 8,
      maxVolley: 28,
      missileProfiles: [
        { id: "short", weight: 8, minRangeKm: 0, maxRangeKm: 45 },
        { id: "long", weight: 1, minRangeKm: 45, maxRangeKm: 260 },
      ],
    },
    {
      id: "hezbollah-lebanon",
      name: "Hezbollah",
      territory: "South Lebanon",
      bounds: { north: 34.0, south: 33.05, west: 35.1, east: 36.6 },
      rocketColor: 0xffdd73,
      trailColor: 0xffa74d,
      durationMin: 4200,
      durationMax: 7000,
      baseVolley: 7,
      maxVolley: 24,
    },
  ],
};

describe("FactionSystem", () => {
  it("loads factions by id", () => {
    const sys = new FactionSystem(factionsConfig);
    const hamas = sys.getById("hamas-gaza");
    expect(hamas).not.toBeNull();
    expect(hamas.name).toBe("Hamas");
  });

  it("returns null for unknown faction id", () => {
    const sys = new FactionSystem(factionsConfig);
    expect(sys.getById("nonexistent")).toBeNull();
  });

  it("describe() returns name and territory", () => {
    const sys = new FactionSystem(factionsConfig);
    expect(sys.describe("hamas-gaza")).toBe("Hamas • Gaza Strip");
  });

  it("describe() returns Unknown for missing faction", () => {
    const sys = new FactionSystem(factionsConfig);
    expect(sys.describe("missing")).toBe("Unknown");
  });

  it("pickMissileProfile returns a profile from defined profiles", () => {
    const sys = new FactionSystem(factionsConfig);
    const profile = sys.pickMissileProfile("hamas-gaza");
    expect(profile).not.toBeNull();
    expect(profile.id).toBe("short");
  });

  it("pickMissileProfile returns a synthetic profile for factions without profiles", () => {
    const sys = new FactionSystem(factionsConfig);
    const profile = sys.pickMissileProfile("hezbollah-lebanon");
    expect(profile).not.toBeNull();
    expect(profile.id).toBe("hezbollah-lebanon-standard");
    expect(profile.maxRangeKm).toBe(9999);
  });

  it("pickMissileProfile returns null for unknown faction", () => {
    const sys = new FactionSystem(factionsConfig);
    expect(sys.pickMissileProfile("missing")).toBeNull();
  });

  it("handles empty factions config gracefully", () => {
    const sys = new FactionSystem({});
    expect(sys.factions).toEqual([]);
    expect(sys.getById("anything")).toBeNull();
  });
});
