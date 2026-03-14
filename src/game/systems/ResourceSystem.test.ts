import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../core/EventBus";
import { Events } from "../core/events";
import { GameState } from "../core/GameState";
import { ResourceSystem } from "./ResourceSystem";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (value: number, min: number, max: number) => Math.min(Math.max(value, min), max),
      FloatBetween: (min: number, max: number) => (min + max) / 2,
    },
  },
}));

const mockUnits = {
  units: [
    { id: "iron-dome-battery", name: "Iron Dome Battery", category: "air-defense", cost: 120, moraleBoost: 0.8, armyBoost: 2.2 },
    { id: "fighter-sortie", name: "Fighter Sortie", category: "air-force", cost: 160, moraleBoost: 1, armyBoost: 2.7 },
  ],
};

describe("ResourceSystem", () => {
  let eventBus: EventBus;
  let gameState: GameState;
  let system: ResourceSystem;

  beforeEach(() => {
    eventBus = new EventBus();
    gameState = new GameState();
    system = new ResourceSystem({ eventBus, gameState, unitsConfig: mockUnits });
  });

  it("publishes shop catalog on start", () => {
    const handler = vi.fn();
    eventBus.on(Events.UI_SHOP_CATALOG, handler);
    system.start();

    expect(handler).toHaveBeenCalledWith({ units: mockUnits.units });
  });

  it("publishes resource state on start", () => {
    const handler = vi.fn();
    eventBus.on(Events.UI_RESOURCES, handler);
    system.start();

    expect(handler).toHaveBeenCalled();
    const payload = handler.mock.calls[0][0];
    expect(payload.resources.money).toBe(120);
  });

  it("adjusts resources without exceeding max", () => {
    system.adjust("money", 5000);
    expect(gameState.resources.money).toBe(1000);
  });

  it("adjusts resources without going below 0", () => {
    system.adjust("money", -5000);
    expect(gameState.resources.money).toBe(0);
  });

  it("adjusts resources by the correct delta", () => {
    system.adjust("money", 50);
    expect(gameState.resources.money).toBe(170);
  });

  it("onWaveLaunched increases money and army", () => {
    gameState.resources.money = 50;
    gameState.resources.army = 50;
    system.onWaveLaunched(1);

    expect(gameState.resources.money).toBe(50 + 28 + 1 * 3);
    expect(gameState.resources.army).toBe(50.75);
  });

  it("onImpact decreases resources", () => {
    system.onImpact(1);

    expect(gameState.resources.morale).toBeLessThan(100);
    expect(gameState.resources.population).toBeLessThan(100);
    expect(gameState.resources.army).toBeLessThan(100);
    expect(gameState.resources.money).toBeLessThan(120);
  });

  it("purchaseUnit deducts cost and increments count", () => {
    system.purchaseUnit("iron-dome-battery");

    expect(gameState.resources.money).toBe(0);
    expect(gameState.purchasedUnits["iron-dome-battery"]).toBe(1);
  });

  it("purchaseUnit fails when not enough money", () => {
    gameState.resources.money = 50;
    const handler = vi.fn();
    eventBus.on(Events.UI_SHOP_RESULT, handler);

    system.purchaseUnit("iron-dome-battery");

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
    expect(gameState.purchasedUnits["iron-dome-battery"]).toBeUndefined();
  });

  it("purchaseUnit emits success result", () => {
    const handler = vi.fn();
    eventBus.on(Events.UI_SHOP_RESULT, handler);

    system.purchaseUnit("iron-dome-battery");

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, message: "Purchased Iron Dome Battery for 120." }),
    );
  });

  it("purchaseUnit fails for unknown unit", () => {
    const handler = vi.fn();
    eventBus.on(Events.UI_SHOP_RESULT, handler);

    system.purchaseUnit("nonexistent-unit");

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Unit not found." }),
    );
  });

  it("purchaseUnit boosts army and morale", () => {
    gameState.resources.money = 500;
    gameState.resources.army = 50;
    gameState.resources.morale = 50;
    system.purchaseUnit("iron-dome-battery");

    expect(gameState.resources.army).toBe(50 + 2.2);
    expect(gameState.resources.morale).toBe(50 + 0.8);
  });

  it("purchaseUnit increments count for multiple purchases", () => {
    gameState.resources.money = 500;

    system.purchaseUnit("iron-dome-battery");
    system.purchaseUnit("iron-dome-battery");

    expect(gameState.purchasedUnits["iron-dome-battery"]).toBe(2);
  });

  it("recalculateEconomy computes weighted average", () => {
    gameState.resources.money = 500;
    gameState.resources.morale = 80;
    gameState.resources.population = 90;
    gameState.resources.army = 70;

    system.recalculateEconomy();

    const expected = (500 / 1000) * 100 * 0.45 + 80 * 0.2 + 90 * 0.2 + 70 * 0.15;
    expect(gameState.resources.economy).toBeCloseTo(expected);
  });

  it("destroy unsubscribes from purchase events", () => {
    system.start();
    system.destroy();

    gameState.resources.money = 500;
    eventBus.emit(Events.SHOP_PURCHASE_UNIT, { unitId: "iron-dome-battery" });

    expect(gameState.purchasedUnits["iron-dome-battery"]).toBeUndefined();
  });
});
