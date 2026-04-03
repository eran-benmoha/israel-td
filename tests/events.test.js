import { describe, it, expect } from "vitest";
import { Events } from "../src/game/core/events";

describe("Events constants", () => {
  it("exports all required event keys", () => {
    const required = [
      "DEBUG_LAUNCH_WAVE",
      "SHOP_PURCHASE_UNIT",
      "UI_WAVE",
      "UI_RESOURCES",
      "UI_SHOP_CATALOG",
      "UI_SHOP_STATE",
      "UI_SHOP_RESULT",
      "UI_DEBUG_STATUS",
      "UI_DEBUG_ZOOM",
      "CAMERA_FLY_TO",
      "CAMERA_FLY_TO_PRESET",
      "UI_WAVE_PROGRESS",
      "THREAT_MISSILE_LAUNCHED",
      "THREAT_MISSILE_INTERCEPTED",
      "THREAT_MISSILE_IMPACT",
      "UI_THREAT_UPDATE",
    ];
    required.forEach((key) => {
      expect(Events).toHaveProperty(key);
      expect(typeof Events[key]).toBe("string");
      expect(Events[key].length).toBeGreaterThan(0);
    });
  });

  it("has no duplicate values", () => {
    const values = Object.values(Events);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});
