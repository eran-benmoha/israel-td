import { describe, it, expect, vi, beforeEach } from "vitest";
import { PerkSystem } from "../src/game/systems/PerkSystem";
import { EventBus } from "../src/game/core/EventBus";
import { GameState } from "../src/game/core/GameState";
import { isPerkUnlocked, getPerkPoints, getActiveEffectTotal } from "../src/game/core/selectors";
import perksConfig from "../src/data/perks.json";

describe("PerkSystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    bus = new EventBus();
    state = new GameState();
    sys = new PerkSystem({ eventBus: bus, gameState: state, perksConfig });
  });

  it("starts with 0 perk points and no unlocks", () => {
    expect(getPerkPoints(state)).toBe(0);
    expect(Object.keys(state.perks.unlocked)).toHaveLength(0);
  });

  it("onWaveSurvived grants pointsPerWave", () => {
    sys.onWaveSurvived();
    expect(getPerkPoints(state)).toBe(perksConfig.pointsPerWave);
  });

  it("onWaveSurvived accumulates points across waves", () => {
    sys.onWaveSurvived();
    sys.onWaveSurvived();
    sys.onWaveSurvived();
    expect(getPerkPoints(state)).toBe(perksConfig.pointsPerWave * 3);
  });

  it("unlockPerk deducts cost and marks perk as unlocked", () => {
    state.perks.points = 5;
    sys.start();
    bus.emit("perk/unlock", { perkId: "reinforced-dome" });
    expect(isPerkUnlocked(state, "reinforced-dome")).toBe(true);
    expect(getPerkPoints(state)).toBe(4);
  });

  it("unlockPerk rejects when insufficient points", () => {
    state.perks.points = 0;
    sys.start();
    bus.emit("perk/unlock", { perkId: "reinforced-dome" });
    expect(isPerkUnlocked(state, "reinforced-dome")).toBe(false);
  });

  it("unlockPerk rejects unknown perk", () => {
    state.perks.points = 10;
    sys.start();
    bus.emit("perk/unlock", { perkId: "nonexistent" });
    expect(getPerkPoints(state)).toBe(10);
  });

  it("unlockPerk rejects already unlocked perk", () => {
    state.perks.points = 5;
    state.perks.unlocked["reinforced-dome"] = true;
    sys.start();
    bus.emit("perk/unlock", { perkId: "reinforced-dome" });
    expect(getPerkPoints(state)).toBe(5);
  });

  it("unlockPerk rejects when prerequisite not met", () => {
    state.perks.points = 5;
    sys.start();
    bus.emit("perk/unlock", { perkId: "advanced-tracking" });
    expect(isPerkUnlocked(state, "advanced-tracking")).toBe(false);
    expect(getPerkPoints(state)).toBe(5);
  });

  it("unlockPerk succeeds when prerequisite is met", () => {
    state.perks.points = 5;
    state.perks.unlocked["reinforced-dome"] = true;
    sys.start();
    bus.emit("perk/unlock", { perkId: "advanced-tracking" });
    expect(isPerkUnlocked(state, "advanced-tracking")).toBe(true);
    expect(getPerkPoints(state)).toBe(3);
  });

  it("emits UI_PERK_UNLOCKED when perk is unlocked", () => {
    state.perks.points = 5;
    const handler = vi.fn();
    bus.on("ui/perk-unlocked", handler);
    sys.start();
    bus.emit("perk/unlock", { perkId: "reinforced-dome" });
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ perk: expect.objectContaining({ id: "reinforced-dome" }) }),
    );
  });

  it("emits UI_PERKS on start", () => {
    const handler = vi.fn();
    bus.on("ui/perks", handler);
    sys.start();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        points: 0,
        unlocked: {},
        perks: expect.any(Array),
      }),
    );
  });

  it("emits UI_PERKS after onWaveSurvived", () => {
    const handler = vi.fn();
    bus.on("ui/perks", handler);
    sys.start();
    handler.mockClear();
    sys.onWaveSurvived();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ points: perksConfig.pointsPerWave }),
    );
  });

  it("getEffectTotal returns 0 for unactivated effect type", () => {
    expect(sys.getEffectTotal("interception_bonus")).toBe(0);
  });

  it("getEffectTotal returns sum of active perk effects", () => {
    state.perks.unlocked["reinforced-dome"] = true;
    state.perks.unlocked["advanced-tracking"] = true;
    const total = sys.getEffectTotal("interception_bonus");
    expect(total).toBeCloseTo(0.08 + 0.12);
  });

  it("getEffectTotal only sums matching effect types", () => {
    state.perks.unlocked["reinforced-dome"] = true;
    state.perks.unlocked["hardened-shelters"] = true;
    expect(sys.getEffectTotal("interception_bonus")).toBeCloseTo(0.08);
    expect(sys.getEffectTotal("impact_reduction")).toBeCloseTo(0.25);
  });

  it("destroy unsubscribes event listeners", () => {
    state.perks.points = 5;
    sys.start();
    sys.destroy();
    bus.emit("perk/unlock", { perkId: "reinforced-dome" });
    expect(isPerkUnlocked(state, "reinforced-dome")).toBe(false);
    expect(getPerkPoints(state)).toBe(5);
  });
});

describe("Perk selectors", () => {
  let state;

  beforeEach(() => {
    state = new GameState();
  });

  it("isPerkUnlocked returns false for non-unlocked perk", () => {
    expect(isPerkUnlocked(state, "reinforced-dome")).toBe(false);
  });

  it("isPerkUnlocked returns true for unlocked perk", () => {
    state.perks.unlocked["reinforced-dome"] = true;
    expect(isPerkUnlocked(state, "reinforced-dome")).toBe(true);
  });

  it("getPerkPoints returns current point count", () => {
    state.perks.points = 7;
    expect(getPerkPoints(state)).toBe(7);
  });

  it("getActiveEffectTotal returns 0 when no perks unlocked", () => {
    expect(getActiveEffectTotal(state, perksConfig, "interception_bonus")).toBe(0);
  });

  it("getActiveEffectTotal sums correctly for multiple unlocks", () => {
    state.perks.unlocked["war-economy"] = true;
    state.perks.unlocked["arms-dealer"] = true;
    expect(getActiveEffectTotal(state, perksConfig, "income_bonus")).toBeCloseTo(0.30);
    expect(getActiveEffectTotal(state, perksConfig, "cost_reduction")).toBeCloseTo(0.15);
  });
});

describe("perks.json data integrity", () => {
  it("has pointsPerWave as a positive number", () => {
    expect(perksConfig.pointsPerWave).toBeGreaterThan(0);
  });

  it("has at least 6 perks", () => {
    expect(perksConfig.perks.length).toBeGreaterThanOrEqual(6);
  });

  it("each perk has required fields", () => {
    perksConfig.perks.forEach((perk) => {
      expect(perk.id).toBeTruthy();
      expect(perk.name).toBeTruthy();
      expect(perk.description).toBeTruthy();
      expect(perk.icon).toBeTruthy();
      expect(typeof perk.cost).toBe("number");
      expect(perk.cost).toBeGreaterThan(0);
      expect(perk.category).toBeTruthy();
      expect(perk.effect).toBeDefined();
      expect(perk.effect.type).toBeTruthy();
      expect(typeof perk.effect.value).toBe("number");
    });
  });

  it("perk ids are unique", () => {
    const ids = perksConfig.perks.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("prerequisites reference existing perks or are null", () => {
    const ids = new Set(perksConfig.perks.map((p) => p.id));
    perksConfig.perks.forEach((perk) => {
      if (perk.requires !== null) {
        expect(ids.has(perk.requires)).toBe(true);
      }
    });
  });

  it("all effect types are recognized", () => {
    const validTypes = [
      "interception_bonus",
      "impact_reduction",
      "income_bonus",
      "cost_reduction",
      "morale_shield",
      "morale_regen",
    ];
    perksConfig.perks.forEach((perk) => {
      expect(validTypes).toContain(perk.effect.type);
    });
  });
});
