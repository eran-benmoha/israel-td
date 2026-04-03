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
const { getUnitLevel } = await import("../src/game/core/selectors");

const unitsConfig = {
  units: [
    {
      id: "iron-dome-battery",
      name: "Iron Dome Battery",
      category: "air-defense",
      cost: 120,
      moraleBoost: 0.8,
      armyBoost: 2.2,
      upgrades: [
        { level: 2, cost: 72, armyBoost: 1.0, moraleBoost: 0.4, interceptionBonus: 0.12 },
        { level: 3, cost: 120, armyBoost: 1.8, moraleBoost: 0.8, interceptionBonus: 0.25 },
      ],
    },
    {
      id: "reserve-brigade",
      name: "Reserve Brigade",
      category: "ground-troops",
      cost: 90,
      moraleBoost: 0.6,
      armyBoost: 1.8,
      upgrades: [
        { level: 2, cost: 54, armyBoost: 1.2, moraleBoost: 0.5 },
        { level: 3, cost: 90, armyBoost: 2.5, moraleBoost: 1.0 },
      ],
    },
  ],
};

describe("Unit Upgrade System", () => {
  let bus, state, sys;

  beforeEach(() => {
    bus = new EventBus();
    state = new GameState();
    sys = new ResourceSystem({ eventBus: bus, gameState: state, unitsConfig });
    sys.start();
  });

  describe("getUnitLevel selector", () => {
    it("returns 0 for unpurchased unit", () => {
      expect(getUnitLevel(state, "iron-dome-battery")).toBe(0);
    });

    it("returns 1 after purchase", () => {
      state.resources.money = 200;
      bus.emit("shop/purchase-unit", { unitId: "iron-dome-battery" });
      expect(getUnitLevel(state, "iron-dome-battery")).toBe(1);
    });
  });

  describe("upgradeUnit", () => {
    it("upgrades unit from level 1 to level 2", () => {
      state.resources.money = 500;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      const moneyAfterPurchase = state.resources.money;

      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.unitLevels["reserve-brigade"]).toBe(2);
      expect(state.resources.money).toBe(moneyAfterPurchase - 54);
    });

    it("upgrades unit from level 2 to level 3", () => {
      state.resources.money = 1000;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.unitLevels["reserve-brigade"]).toBe(2);

      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.unitLevels["reserve-brigade"]).toBe(3);
    });

    it("rejects upgrade beyond max level", () => {
      state.resources.money = 1000;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.unitLevels["reserve-brigade"]).toBe(3);

      const resultHandler = vi.fn();
      bus.on("ui/shop-result", resultHandler);
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(resultHandler).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("max level") })
      );
      expect(state.unitLevels["reserve-brigade"]).toBe(3);
    });

    it("rejects upgrade if unit not purchased", () => {
      const resultHandler = vi.fn();
      bus.on("ui/shop-result", resultHandler);
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(resultHandler).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Must purchase") })
      );
    });

    it("rejects upgrade if not enough money", () => {
      state.resources.money = 120;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      state.resources.money = 10;

      const resultHandler = vi.fn();
      bus.on("ui/shop-result", resultHandler);
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(resultHandler).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Not enough money") })
      );
      expect(state.unitLevels["reserve-brigade"]).toBe(1);
    });

    it("rejects upgrade for unknown unit", () => {
      const resultHandler = vi.fn();
      bus.on("ui/shop-result", resultHandler);
      bus.emit("shop/upgrade-unit", { unitId: "nonexistent" });
      expect(resultHandler).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it("applies army and morale boost on upgrade", () => {
      state.resources.money = 500;
      state.resources.army = 50;
      state.resources.morale = 50;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      const armyAfterPurchase = state.resources.army;
      const moraleAfterPurchase = state.resources.morale;

      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.resources.army).toBeGreaterThan(armyAfterPurchase);
      expect(state.resources.morale).toBeGreaterThan(moraleAfterPurchase);
    });

    it("publishes UI_SHOP_STATE with levels after upgrade", () => {
      state.resources.money = 500;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });

      const stateHandler = vi.fn();
      bus.on("ui/shop-state", stateHandler);
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(stateHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          levels: expect.objectContaining({ "reserve-brigade": 2 }),
        })
      );
    });

    it("emits success result on upgrade", () => {
      state.resources.money = 500;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });

      const resultHandler = vi.fn();
      bus.on("ui/shop-result", resultHandler);
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(resultHandler).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.stringContaining("Lv.2") })
      );
    });
  });

  describe("GameState.unitLevels", () => {
    it("initializes as empty object", () => {
      const gs = new GameState();
      expect(gs.unitLevels).toEqual({});
    });

    it("is set to 1 on first purchase", () => {
      state.resources.money = 200;
      bus.emit("shop/purchase-unit", { unitId: "iron-dome-battery" });
      expect(state.unitLevels["iron-dome-battery"]).toBe(1);
    });
  });

  describe("destroy cleans up upgrade handler", () => {
    it("stops handling upgrade events after destroy", () => {
      state.resources.money = 500;
      bus.emit("shop/purchase-unit", { unitId: "reserve-brigade" });
      sys.destroy();

      const levelBefore = state.unitLevels["reserve-brigade"];
      bus.emit("shop/upgrade-unit", { unitId: "reserve-brigade" });
      expect(state.unitLevels["reserve-brigade"]).toBe(levelBefore);
    });
  });
});
