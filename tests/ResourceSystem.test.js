import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      FloatBetween: (a, b) => (a + b) / 2,
    },
  },
}));

const { ResourceSystem } = await import("../src/game/systems/ResourceSystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { GameState } = await import("../src/game/core/GameState");

const unitsConfig = {
  units: [
    { id: "iron-dome-battery", name: "Iron Dome Battery", category: "air-defense", cost: 120, moraleBoost: 0.8, armyBoost: 2.2 },
    { id: "reserve-brigade", name: "Reserve Brigade", category: "ground-troops", cost: 90, moraleBoost: 0.6, armyBoost: 1.8 },
  ],
};

describe("ResourceSystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    bus = new EventBus();
    state = new GameState();
    sys = new ResourceSystem({ eventBus: bus, gameState: state, unitsConfig });
  });

  it("adjust() clamps resources within bounds", () => {
    sys.adjust("money", -200);
    expect(state.resources.money).toBe(0);

    sys.adjust("money", 99999);
    expect(state.resources.money).toBe(1000);
  });

  it("onWaveLaunched increases money", () => {
    const moneyBefore = state.resources.money;
    sys.onWaveLaunched(1);
    expect(state.resources.money).toBeGreaterThan(moneyBefore);
  });

  it("onWaveLaunched adds army (clamped at max)", () => {
    state.resources.army = 50;
    sys.onWaveLaunched(1);
    expect(state.resources.army).toBeGreaterThan(50);
  });

  it("onImpact decreases resources", () => {
    sys.onImpact(1);
    expect(state.resources.morale).toBeLessThan(100);
    expect(state.resources.population).toBeLessThan(100);
    expect(state.resources.army).toBeLessThan(100);
  });

  it("purchaseUnit deducts cost and tracks purchase", () => {
    sys.start();
    bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
    expect(state.resources.money).toBe(120 - 90);
    expect(state.purchasedUnits["reserve-brigade"]).toBe(1);
  });

  it("purchaseUnit rejects when not enough money", () => {
    state.resources.money = 10;
    sys.start();
    const resultHandler = vi.fn();
    bus.on("ui/shop-result", resultHandler);
    bus.emit("shop/purchase-unit", { unitId: "iron-dome-battery" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(state.purchasedUnits["iron-dome-battery"]).toBeUndefined();
  });

  it("purchaseUnit rejects unknown unit", () => {
    sys.start();
    const resultHandler = vi.fn();
    bus.on("ui/shop-result", resultHandler);
    bus.emit("shop/purchase-unit", { unitId: "nonexistent" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("recalculateEconomy computes weighted average", () => {
    state.resources.money = 500;
    state.resources.morale = 80;
    state.resources.population = 90;
    state.resources.army = 70;
    sys.recalculateEconomy();
    expect(state.resources.economy).toBeGreaterThan(0);
    expect(state.resources.economy).toBeLessThanOrEqual(100);
  });

  it("destroy() unsubscribes purchase handler", () => {
    sys.start();
    sys.destroy();
    const moneyBefore = state.resources.money;
    bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
    expect(state.resources.money).toBe(moneyBefore);
  });
});
