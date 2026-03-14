import { describe, it, expect } from "vitest";
import { getPurchasedUnitCount, getWaveDefinition, getUpcomingFactionId } from "./selectors";
import { GameState } from "./GameState";
import type { LevelConfig } from "../../types";

const mockLevelConfig: LevelConfig = {
  id: "level-01",
  name: "Test Level",
  simulation: { startDateUtc: "2022-01-01T00:00:00Z", hoursPerSecond: 3 },
  waveTiming: { minDelayMs: 1000, maxDelayMs: 5000 },
  waves: [
    { factionId: "hamas-gaza", intensityBonus: 0 },
    { factionId: "hezbollah-lebanon", intensityBonus: 1 },
    { factionId: "iran-regime", intensityBonus: 2 },
  ],
};

describe("getPurchasedUnitCount", () => {
  it("returns 0 for unpurchased units", () => {
    const state = new GameState();
    expect(getPurchasedUnitCount(state, "iron-dome-battery")).toBe(0);
  });

  it("returns the count for purchased units", () => {
    const state = new GameState();
    state.purchasedUnits["iron-dome-battery"] = 3;
    expect(getPurchasedUnitCount(state, "iron-dome-battery")).toBe(3);
  });

  it("returns 0 for undefined unit ids", () => {
    const state = new GameState();
    expect(getPurchasedUnitCount(state, "nonexistent-unit")).toBe(0);
  });
});

describe("getWaveDefinition", () => {
  it("returns the correct wave for wave number 1", () => {
    const wave = getWaveDefinition(mockLevelConfig, 1);
    expect(wave).toEqual({ factionId: "hamas-gaza", intensityBonus: 0 });
  });

  it("returns the correct wave for wave number 2", () => {
    const wave = getWaveDefinition(mockLevelConfig, 2);
    expect(wave).toEqual({ factionId: "hezbollah-lebanon", intensityBonus: 1 });
  });

  it("wraps around for wave numbers exceeding array length", () => {
    const wave = getWaveDefinition(mockLevelConfig, 4);
    expect(wave).toEqual({ factionId: "hamas-gaza", intensityBonus: 0 });
  });

  it("returns null when waves array is empty", () => {
    const emptyConfig: LevelConfig = {
      ...mockLevelConfig,
      waves: [],
    };
    expect(getWaveDefinition(emptyConfig, 1)).toBeNull();
  });

  it("handles wave number 0 by returning the last wave (wraps)", () => {
    const wave = getWaveDefinition(mockLevelConfig, 0);
    expect(wave).toEqual({ factionId: "iran-regime", intensityBonus: 2 });
  });
});

describe("getUpcomingFactionId", () => {
  it("returns the faction id of the next wave", () => {
    expect(getUpcomingFactionId(mockLevelConfig, 1)).toBe("hamas-gaza");
  });

  it("returns the faction id for wave 2", () => {
    expect(getUpcomingFactionId(mockLevelConfig, 2)).toBe("hezbollah-lebanon");
  });

  it("returns null for empty wave config", () => {
    const emptyConfig: LevelConfig = { ...mockLevelConfig, waves: [] };
    expect(getUpcomingFactionId(emptyConfig, 1)).toBeNull();
  });

  it("wraps around correctly", () => {
    expect(getUpcomingFactionId(mockLevelConfig, 4)).toBe("hamas-gaza");
  });
});
