import { describe, it, expect } from "vitest";
import { getPurchasedUnitCount, getWaveDefinition, getUpcomingFactionId } from "../src/game/core/selectors";

const levelConfig = {
  waves: [
    { factionId: "hamas-gaza", intensityBonus: 0 },
    { factionId: "hezbollah-lebanon", intensityBonus: 0 },
    { factionId: "iran-regime", intensityBonus: 1 },
  ],
};

describe("getPurchasedUnitCount", () => {
  it("returns 0 for unpurchased units", () => {
    expect(getPurchasedUnitCount({ purchasedUnits: {} }, "iron-dome-battery")).toBe(0);
  });

  it("returns correct count for purchased units", () => {
    const state = { purchasedUnits: { "iron-dome-battery": 3 } };
    expect(getPurchasedUnitCount(state, "iron-dome-battery")).toBe(3);
  });
});

describe("getWaveDefinition", () => {
  it("returns the correct wave for a given number (1-indexed)", () => {
    expect(getWaveDefinition(levelConfig, 1).factionId).toBe("hamas-gaza");
    expect(getWaveDefinition(levelConfig, 2).factionId).toBe("hezbollah-lebanon");
    expect(getWaveDefinition(levelConfig, 3).factionId).toBe("iran-regime");
  });

  it("wraps around when wave number exceeds wave count", () => {
    expect(getWaveDefinition(levelConfig, 4).factionId).toBe("hamas-gaza");
    expect(getWaveDefinition(levelConfig, 6).factionId).toBe("iran-regime");
  });

  it("returns null for empty wave list", () => {
    expect(getWaveDefinition({ waves: [] }, 1)).toBeNull();
  });
});

describe("getUpcomingFactionId", () => {
  it("returns faction id for the specified wave", () => {
    expect(getUpcomingFactionId(levelConfig, 1)).toBe("hamas-gaza");
  });

  it("returns null for empty waves", () => {
    expect(getUpcomingFactionId({ waves: [] }, 1)).toBeNull();
  });
});
