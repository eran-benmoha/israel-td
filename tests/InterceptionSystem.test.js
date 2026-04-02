import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      FloatBetween: (a, b) => (a + b) / 2,
      Between: (a, b) => Math.floor((a + b) / 2),
      Linear: (a, b, t) => a + (b - a) * t,
      DegToRad: (deg) => (deg * Math.PI) / 180,
    },
    Geom: {
      Point: class Point {
        constructor(x, y) {
          this.x = x;
          this.y = y;
        }
      },
    },
  },
}));

const { DEFENSE_TIERS, getRangeBracket, getTierInterceptionChance } = await import(
  "../src/game/systems/waves/InterceptionSystem"
);

describe("DEFENSE_TIERS", () => {
  it("defines three tiers: Iron Dome, David's Sling, Arrow", () => {
    expect(DEFENSE_TIERS).toHaveLength(3);
    expect(DEFENSE_TIERS[0].unitId).toBe("iron-dome-battery");
    expect(DEFENSE_TIERS[1].unitId).toBe("davids-sling");
    expect(DEFENSE_TIERS[2].unitId).toBe("arrow-system");
  });

  it("each tier has all required config fields", () => {
    const requiredFields = [
      "unitId",
      "label",
      "interceptorColor",
      "interceptorStroke",
      "trailColor",
      "flashColor",
      "interceptDelayMin",
      "interceptDelayMax",
      "interceptorDurationMin",
      "interceptorDurationMax",
      "baseChance",
      "chancePerUnit",
      "minChance",
      "maxChance",
      "rangeModifiers",
    ];
    DEFENSE_TIERS.forEach((tier) => {
      requiredFields.forEach((field) => {
        expect(tier[field], `${tier.label} missing ${field}`).toBeDefined();
      });
      expect(tier.rangeModifiers.short).toBeDefined();
      expect(tier.rangeModifiers.medium).toBeDefined();
      expect(tier.rangeModifiers.long).toBeDefined();
    });
  });

  it("Iron Dome excels at short-range", () => {
    const ironDome = DEFENSE_TIERS[0];
    expect(ironDome.rangeModifiers.short).toBeGreaterThan(ironDome.rangeModifiers.medium);
    expect(ironDome.rangeModifiers.short).toBeGreaterThan(ironDome.rangeModifiers.long);
  });

  it("David's Sling excels at medium-range", () => {
    const sling = DEFENSE_TIERS[1];
    expect(sling.rangeModifiers.medium).toBeGreaterThan(sling.rangeModifiers.short);
    expect(sling.rangeModifiers.medium).toBeGreaterThan(sling.rangeModifiers.long);
  });

  it("Arrow excels at long-range", () => {
    const arrow = DEFENSE_TIERS[2];
    expect(arrow.rangeModifiers.long).toBeGreaterThan(arrow.rangeModifiers.short);
    expect(arrow.rangeModifiers.long).toBeGreaterThan(arrow.rangeModifiers.medium);
  });
});

describe("getRangeBracket", () => {
  it("returns 'short' for missiles up to 70km range", () => {
    expect(getRangeBracket({ maxRangeKm: 45 })).toBe("short");
    expect(getRangeBracket({ maxRangeKm: 70 })).toBe("short");
  });

  it("returns 'medium' for missiles 71–300km range", () => {
    expect(getRangeBracket({ maxRangeKm: 100 })).toBe("medium");
    expect(getRangeBracket({ maxRangeKm: 260 })).toBe("medium");
    expect(getRangeBracket({ maxRangeKm: 300 })).toBe("medium");
  });

  it("returns 'long' for missiles over 300km range", () => {
    expect(getRangeBracket({ maxRangeKm: 301 })).toBe("long");
    expect(getRangeBracket({ maxRangeKm: 2000 })).toBe("long");
  });

  it("defaults to 'medium' when maxRangeKm is missing", () => {
    expect(getRangeBracket({})).toBe("medium");
  });
});

describe("getTierInterceptionChance", () => {
  const ironDome = DEFENSE_TIERS[0];
  const sling = DEFENSE_TIERS[1];
  const arrow = DEFENSE_TIERS[2];

  it("higher unit counts produce higher chances", () => {
    const shortMissile = { maxRangeKm: 40 };
    const chance1 = getTierInterceptionChance(ironDome, shortMissile, 1);
    const chance3 = getTierInterceptionChance(ironDome, shortMissile, 3);
    expect(chance3).toBeGreaterThan(chance1);
  });

  it("Iron Dome has higher chance for short-range than long-range", () => {
    const shortMissile = { maxRangeKm: 40 };
    const longMissile = { maxRangeKm: 1500 };
    const chanceShort = getTierInterceptionChance(ironDome, shortMissile, 2);
    const chanceLong = getTierInterceptionChance(ironDome, longMissile, 2);
    expect(chanceShort).toBeGreaterThan(chanceLong);
  });

  it("Arrow has higher chance for long-range than short-range", () => {
    const shortMissile = { maxRangeKm: 40 };
    const longMissile = { maxRangeKm: 1500 };
    const chanceShort = getTierInterceptionChance(arrow, shortMissile, 2);
    const chanceLong = getTierInterceptionChance(arrow, longMissile, 2);
    expect(chanceLong).toBeGreaterThan(chanceShort);
  });

  it("David's Sling has higher chance for medium-range than others", () => {
    const mediumMissile = { maxRangeKm: 200 };
    const shortMissile = { maxRangeKm: 40 };
    const longMissile = { maxRangeKm: 1500 };
    const chanceMedium = getTierInterceptionChance(sling, mediumMissile, 2);
    const chanceShort = getTierInterceptionChance(sling, shortMissile, 2);
    const chanceLong = getTierInterceptionChance(sling, longMissile, 2);
    expect(chanceMedium).toBeGreaterThan(chanceShort);
    expect(chanceMedium).toBeGreaterThan(chanceLong);
  });

  it("chance is clamped within tier bounds", () => {
    const shortMissile = { maxRangeKm: 40 };
    const chanceHigh = getTierInterceptionChance(ironDome, shortMissile, 50);
    expect(chanceHigh).toBeLessThanOrEqual(ironDome.maxChance);

    const chanceLow = getTierInterceptionChance(arrow, shortMissile, 0);
    expect(chanceLow).toBeGreaterThanOrEqual(arrow.minChance);
  });
});
