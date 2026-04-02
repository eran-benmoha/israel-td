import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      FloatBetween: (a, b) => (a + b) / 2,
    },
  },
}));

const { AbilitySystem } = await import("../src/game/systems/AbilitySystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { GameState } = await import("../src/game/core/GameState");

const abilitiesConfig = {
  abilities: [
    {
      id: "emergency-siren",
      name: "Emergency Siren",
      icon: "🚨",
      description: "Doubles interception chance for 15 seconds.",
      cooldownMs: 60000,
      durationMs: 15000,
      moneyCost: 30,
      unlockWave: 2,
      effect: { type: "interception-boost", multiplier: 2 },
    },
    {
      id: "airstrike",
      name: "Airstrike",
      icon: "💥",
      description: "Destroys all in-flight enemy missiles instantly.",
      cooldownMs: 90000,
      durationMs: 0,
      moneyCost: 80,
      unlockWave: 3,
      effect: { type: "destroy-all-missiles" },
    },
    {
      id: "emergency-funding",
      name: "Emergency Fund",
      icon: "💸",
      description: "Grants 100 money but costs 5 morale.",
      cooldownMs: 45000,
      durationMs: 0,
      moneyCost: 0,
      unlockWave: 1,
      effect: { type: "resource-grant", grants: { money: 100 }, penalties: { morale: -5 } },
    },
  ],
};

function createMockResourceSystem(state) {
  return {
    adjust: (key, delta) => {
      const max = state.maxResources[key];
      state.resources[key] = Math.min(Math.max(state.resources[key] + delta, 0), max);
    },
    publishResourceState: vi.fn(),
  };
}

function createMockInterceptionSystem() {
  return {
    interceptionBoostMultiplier: 1,
    setInterceptionBoost: vi.fn(function (m) {
      this.interceptionBoostMultiplier = m;
    }),
  };
}

function createMockProjectileSystem() {
  return {
    destroyAllActiveRockets: vi.fn(() => 5),
  };
}

describe("AbilitySystem", () => {
  let bus, state, resourceSystem, interceptionSystem, projectileSystem, sys;

  beforeEach(() => {
    vi.useFakeTimers();
    bus = new EventBus();
    state = new GameState();
    state.wave.number = 5;
    resourceSystem = createMockResourceSystem(state);
    interceptionSystem = createMockInterceptionSystem();
    projectileSystem = createMockProjectileSystem();
    sys = new AbilitySystem({
      eventBus: bus,
      gameState: state,
      resourceSystem,
      interceptionSystem,
      projectileSystem,
      abilitiesConfig,
    });
  });

  afterEach(() => {
    sys.destroy();
    vi.useRealTimers();
  });

  it("initializes ability state on start", () => {
    sys.start();
    expect(state.abilities["emergency-siren"]).toBeDefined();
    expect(state.abilities["emergency-siren"].remainingCooldownMs).toBe(0);
    expect(state.abilities["emergency-siren"].unlocked).toBe(true);
  });

  it("emits UI_ABILITY_STATE on start", () => {
    const handler = vi.fn();
    bus.on("ui/ability-state", handler);
    sys.start();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        abilities: expect.arrayContaining([expect.objectContaining({ id: "emergency-siren" })]),
      }),
    );
  });

  it("activating emergency-funding grants money and penalizes morale", () => {
    sys.start();
    const moneyBefore = state.resources.money;
    const moraleBefore = state.resources.morale;
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    expect(state.resources.money).toBe(moneyBefore + 100);
    expect(state.resources.morale).toBe(moraleBefore - 5);
  });

  it("activating emergency-siren sets interception boost", () => {
    sys.start();
    bus.emit("ability/activate", { abilityId: "emergency-siren" });
    expect(interceptionSystem.setInterceptionBoost).toHaveBeenCalledWith(2);
  });

  it("activating airstrike calls destroyAllActiveRockets", () => {
    sys.start();
    state.resources.money = 500;
    bus.emit("ability/activate", { abilityId: "airstrike" });
    expect(projectileSystem.destroyAllActiveRockets).toHaveBeenCalled();
  });

  it("deducts money cost on activation", () => {
    sys.start();
    state.resources.money = 200;
    bus.emit("ability/activate", { abilityId: "emergency-siren" });
    expect(state.resources.money).toBe(200 - 30);
  });

  it("rejects activation when insufficient money", () => {
    sys.start();
    state.resources.money = 10;
    const resultHandler = vi.fn();
    bus.on("ui/ability-result", resultHandler);
    bus.emit("ability/activate", { abilityId: "emergency-siren" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("sets cooldown after activation", () => {
    sys.start();
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    expect(state.abilities["emergency-funding"].remainingCooldownMs).toBe(45000);
  });

  it("rejects activation when on cooldown", () => {
    sys.start();
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    const resultHandler = vi.fn();
    bus.on("ui/ability-result", resultHandler);
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("cooldown decreases over time via tick", () => {
    sys.start();
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    expect(state.abilities["emergency-funding"].remainingCooldownMs).toBe(45000);

    vi.advanceTimersByTime(1000);
    expect(state.abilities["emergency-funding"].remainingCooldownMs).toBeLessThan(45000);
  });

  it("ability is not unlocked if wave number is below threshold", () => {
    state.wave.number = 0;
    sys.start();
    expect(state.abilities["emergency-siren"].unlocked).toBe(false);
    const resultHandler = vi.fn();
    bus.on("ui/ability-result", resultHandler);
    bus.emit("ability/activate", { abilityId: "emergency-siren" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("rejects unknown ability id", () => {
    sys.start();
    const resultHandler = vi.fn();
    bus.on("ui/ability-result", resultHandler);
    bus.emit("ability/activate", { abilityId: "nonexistent" });
    expect(resultHandler).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it("duration expires and resets interception boost", () => {
    sys.start();
    bus.emit("ability/activate", { abilityId: "emergency-siren" });
    expect(state.abilities["emergency-siren"].remainingDurationMs).toBe(15000);

    vi.advanceTimersByTime(16000);
    expect(state.abilities["emergency-siren"].remainingDurationMs).toBe(0);
    expect(interceptionSystem.setInterceptionBoost).toHaveBeenCalledWith(1);
  });

  it("destroy() cleans up subscriptions and timers", () => {
    sys.start();
    sys.destroy();
    const moneyBefore = state.resources.money;
    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    expect(state.resources.money).toBe(moneyBefore);
  });

  it("publishState returns correct ready flag", () => {
    sys.start();
    let lastPayload = null;
    bus.on("ui/ability-state", (p) => {
      lastPayload = p;
    });

    bus.emit("ability/activate", { abilityId: "emergency-funding" });
    const fundingState = lastPayload.abilities.find((a) => a.id === "emergency-funding");
    expect(fundingState.ready).toBe(false);
  });
});
