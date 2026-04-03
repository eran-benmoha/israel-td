import { describe, it, expect, vi, beforeEach } from "vitest";

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

const { AchievementSystem } = await import("../src/game/systems/AchievementSystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { GameState } = await import("../src/game/core/GameState");
const { Events } = await import("../src/game/core/events");

const achievementsConfig = {
  achievements: [
    {
      id: "first-shield",
      name: "First Shield",
      description: "Purchase your first Iron Dome Battery",
      icon: "🛡️",
      category: "defense",
      trigger: "purchase_unit",
      condition: { unitId: "iron-dome-battery", count: 1 },
    },
    {
      id: "iron-wall",
      name: "Iron Wall",
      description: "Own 3 Iron Dome Batteries",
      icon: "🏰",
      category: "defense",
      trigger: "purchase_unit",
      condition: { unitId: "iron-dome-battery", count: 3 },
    },
    {
      id: "arsenal",
      name: "Arsenal",
      description: "Purchase 5 total units",
      icon: "⚔️",
      category: "military",
      trigger: "total_purchases",
      condition: { count: 5 },
    },
    {
      id: "survivor",
      name: "Survivor",
      description: "Survive 3 waves",
      icon: "🌊",
      category: "survival",
      trigger: "wave_survived",
      condition: { waveNumber: 3 },
    },
    {
      id: "big-spender",
      name: "Big Spender",
      description: "Spend 500 money total",
      icon: "💸",
      category: "economy",
      trigger: "total_spent",
      condition: { amount: 500 },
    },
    {
      id: "wealthy-nation",
      name: "Wealthy Nation",
      description: "Accumulate 500 money at once",
      icon: "💎",
      category: "economy",
      trigger: "money_held",
      condition: { amount: 500 },
    },
    {
      id: "full-spectrum",
      name: "Full Spectrum",
      description: "Purchase from all categories",
      icon: "🌐",
      category: "military",
      trigger: "all_categories",
      condition: { categories: ["air-defense", "air-force", "ground-troops"] },
    },
    {
      id: "air-superiority",
      name: "Air Superiority",
      description: "Purchase 3 air-force units",
      icon: "✈️",
      category: "military",
      trigger: "category_purchases",
      condition: { category: "air-force", count: 3 },
    },
  ],
};

const unitsConfig = {
  units: [
    { id: "iron-dome-battery", name: "Iron Dome Battery", category: "air-defense", cost: 120, moraleBoost: 0.8, armyBoost: 2.2 },
    { id: "arrow-system", name: "Arrow Interceptor", category: "air-defense", cost: 180, moraleBoost: 1.1, armyBoost: 3 },
    { id: "fighter-sortie", name: "Fighter Sortie", category: "air-force", cost: 160, moraleBoost: 1, armyBoost: 2.7 },
    { id: "reserve-brigade", name: "Reserve Brigade", category: "ground-troops", cost: 90, moraleBoost: 0.6, armyBoost: 1.8 },
  ],
};

describe("AchievementSystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    bus = new EventBus();
    state = new GameState();
    sys = new AchievementSystem({ eventBus: bus, gameState: state, achievementsConfig, unitsConfig });
    sys.start();
  });

  it("starts with no achievements unlocked", () => {
    expect(sys.getUnlockedCount()).toBe(0);
    expect(sys.getTotalCount()).toBe(8);
  });

  it("publishes full achievement list on start", () => {
    const handler = vi.fn();
    bus.on(Events.UI_ACHIEVEMENT_LIST, handler);
    const sys2 = new AchievementSystem({ eventBus: bus, gameState: state, achievementsConfig, unitsConfig });
    sys2.start();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        achievements: expect.arrayContaining([
          expect.objectContaining({ id: "first-shield", unlocked: false }),
        ]),
      }),
    );
    sys2.destroy();
  });

  describe("purchase_unit trigger", () => {
    it("unlocks first-shield when 1 Iron Dome is purchased", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ id: "first-shield" }),
      );
      expect(sys.getUnlockedCount()).toBe(1);
    });

    it("unlocks iron-wall when 3 Iron Domes are purchased", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 3;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("iron-wall");
    });

    it("does not unlock on failed purchase", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      bus.emit(Events.UI_SHOP_RESULT, { success: false, message: "Not enough money." });
      expect(handler).not.toHaveBeenCalled();
    });

    it("does not unlock the same achievement twice", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      const firstShieldCalls = handler.mock.calls.filter((c) => c[0].id === "first-shield");
      expect(firstShieldCalls.length).toBe(1);
    });
  });

  describe("total_purchases trigger", () => {
    it("unlocks arsenal when 5 total units are purchased", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 3;
      state.purchasedUnits["reserve-brigade"] = 2;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Reserve Brigade for 90." });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("arsenal");
    });
  });

  describe("wave_survived trigger", () => {
    it("unlocks survivor at wave 3", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.wave.number = 3;
      bus.emit(Events.UI_WAVE, { waveNumber: 3, clockLabel: "Test", originLabel: "Test" });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("survivor");
    });

    it("does not unlock survivor at wave 0", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      bus.emit(Events.UI_WAVE, { waveNumber: 0, clockLabel: "Test", originLabel: "Test" });
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("total_spent trigger", () => {
    it("tracks cumulative spending and unlocks big-spender", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      for (let i = 0; i < 5; i++) {
        bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased item for 120." });
      }

      expect(sys.totalSpent).toBe(600);
      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("big-spender");
    });
  });

  describe("money_held trigger", () => {
    it("unlocks wealthy-nation when resources show 500+ money", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      bus.emit(Events.UI_RESOURCES, {
        resources: { money: 550, morale: 100, population: 100, army: 100, economy: 100 },
        maxResources: { money: 1000, morale: 100, population: 100, army: 100, economy: 100 },
      });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("wealthy-nation");
    });
  });

  describe("all_categories trigger", () => {
    it("unlocks full-spectrum when units from all categories are purchased", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      state.purchasedUnits["fighter-sortie"] = 1;
      state.purchasedUnits["reserve-brigade"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Reserve Brigade for 90." });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("full-spectrum");
    });

    it("does not unlock full-spectrum with only 2 categories", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      state.purchasedUnits["fighter-sortie"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Fighter Sortie for 160." });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).not.toContain("full-spectrum");
    });
  });

  describe("category_purchases trigger", () => {
    it("unlocks air-superiority when 3 air-force units are purchased", () => {
      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["fighter-sortie"] = 3;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Fighter Sortie for 160." });

      const ids = handler.mock.calls.map((c) => c[0].id);
      expect(ids).toContain("air-superiority");
    });
  });

  describe("persistence", () => {
    it("saves unlocked achievements to localStorage", () => {
      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      expect(localStorageMock.setItem).toHaveBeenCalled();
      const savedRaw = localStorageMock.setItem.mock.calls.at(-1)[1];
      const saved = JSON.parse(savedRaw);
      expect(saved.unlocked).toContain("first-shield");
    });

    it("loads previously unlocked achievements from localStorage", () => {
      localStorageMock.getItem.mockReturnValueOnce(
        JSON.stringify({ unlocked: ["first-shield", "survivor"], totalSpent: 200 }),
      );

      const bus2 = new EventBus();
      const state2 = new GameState();
      const sys2 = new AchievementSystem({ eventBus: bus2, gameState: state2, achievementsConfig, unitsConfig });

      expect(sys2.getUnlockedCount()).toBe(2);
      expect(sys2.totalSpent).toBe(200);
      sys2.destroy();
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock.getItem.mockReturnValueOnce("not-valid-json{{{{");

      const bus2 = new EventBus();
      const state2 = new GameState();
      const sys2 = new AchievementSystem({ eventBus: bus2, gameState: state2, achievementsConfig, unitsConfig });

      expect(sys2.getUnlockedCount()).toBe(0);
      sys2.destroy();
    });
  });

  describe("UI events", () => {
    it("emits UI_ACHIEVEMENT on unlock", () => {
      const handler = vi.fn();
      bus.on(Events.UI_ACHIEVEMENT, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "first-shield",
          name: "First Shield",
          icon: "🛡️",
        }),
      );
    });

    it("emits UI_ACHIEVEMENT_LIST on unlock", () => {
      const handler = vi.fn();
      bus.on(Events.UI_ACHIEVEMENT_LIST, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      const lastCall = handler.mock.calls.at(-1)[0];
      const firstShield = lastCall.achievements.find((a) => a.id === "first-shield");
      expect(firstShield.unlocked).toBe(true);
    });
  });

  describe("destroy", () => {
    it("unsubscribes all event handlers", () => {
      sys.destroy();

      const handler = vi.fn();
      bus.on(Events.ACHIEVEMENT_UNLOCKED, handler);

      state.purchasedUnits["iron-dome-battery"] = 1;
      bus.emit(Events.UI_SHOP_RESULT, { success: true, message: "Purchased Iron Dome Battery for 120." });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("unknown trigger", () => {
    it("returns false for an unknown trigger type", () => {
      const result = sys.checkCondition({
        trigger: "unknown_trigger_type",
        condition: {},
      });
      expect(result).toBe(false);
    });
  });
});
