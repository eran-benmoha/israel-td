import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Clamp: (val, min, max) => Math.min(Math.max(val, min), max),
      FloatBetween: (a, b) => (a + b) / 2,
    },
  },
}));

const { ComboSystem } = await import("../src/game/systems/ComboSystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { Events } = await import("../src/game/core/events");

const comboConfig = {
  decayMs: 8000,
  tiers: [
    { id: "nice", label: "Nice!", minStreak: 2, moneyBonus: 5, moraleBonus: 0.3, color: "#5bb8ff" },
    { id: "great", label: "Great!", minStreak: 5, moneyBonus: 12, moraleBonus: 0.6, color: "#40e0a0" },
    { id: "amazing", label: "Amazing!", minStreak: 10, moneyBonus: 25, moraleBonus: 1.2, color: "#ffd588" },
    { id: "legendary", label: "LEGENDARY!", minStreak: 20, moneyBonus: 50, moraleBonus: 2.5, color: "#ff6af0" },
  ],
};

function makeResourceSystem() {
  return {
    adjust: vi.fn(),
    publishResourceState: vi.fn(),
  };
}

describe("ComboSystem", () => {
  let bus, resourceSystem, combo;

  beforeEach(() => {
    vi.useFakeTimers();
    bus = new EventBus();
    resourceSystem = makeResourceSystem();
    combo = new ComboSystem({ eventBus: bus, resourceSystem, comboConfig });
    combo.start();
  });

  afterEach(() => {
    combo.destroy();
    vi.useRealTimers();
  });

  it("starts with zero streak", () => {
    expect(combo.streak).toBe(0);
    expect(combo.bestStreak).toBe(0);
  });

  it("increments streak on interception", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.streak).toBe(1);
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.streak).toBe(2);
  });

  it("resets streak on impact", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.streak).toBe(2);

    bus.emit(Events.MISSILE_IMPACT, { factionId: "hamas-gaza", impactScale: 1 });
    expect(combo.streak).toBe(0);
  });

  it("tracks best streak across resets", () => {
    for (let i = 0; i < 5; i++) {
      bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    }
    expect(combo.bestStreak).toBe(5);

    bus.emit(Events.MISSILE_IMPACT, { factionId: "hamas-gaza", impactScale: 1 });
    expect(combo.bestStreak).toBe(5);

    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.bestStreak).toBe(5);
  });

  it("returns null tier when streak is below minimum", () => {
    expect(combo.getCurrentTier()).toBeNull();
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.getCurrentTier()).toBeNull();
  });

  it("returns 'nice' tier at streak 2", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.getCurrentTier().id).toBe("nice");
  });

  it("returns 'great' tier at streak 5", () => {
    for (let i = 0; i < 5; i++) {
      bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    }
    expect(combo.getCurrentTier().id).toBe("great");
  });

  it("returns 'amazing' tier at streak 10", () => {
    for (let i = 0; i < 10; i++) {
      bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    }
    expect(combo.getCurrentTier().id).toBe("amazing");
  });

  it("returns 'legendary' tier at streak 20", () => {
    for (let i = 0; i < 20; i++) {
      bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    }
    expect(combo.getCurrentTier().id).toBe("legendary");
  });

  it("awards money bonus at tier threshold", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(resourceSystem.adjust).toHaveBeenCalledWith("money", 5);
    expect(resourceSystem.adjust).toHaveBeenCalledWith("morale", 0.3);
    expect(resourceSystem.publishResourceState).toHaveBeenCalled();
  });

  it("does not award bonus between thresholds", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    resourceSystem.adjust.mockClear();
    resourceSystem.publishResourceState.mockClear();

    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(resourceSystem.adjust).not.toHaveBeenCalled();
    expect(resourceSystem.publishResourceState).not.toHaveBeenCalled();
  });

  it("emits UI_COMBO event on streak change", () => {
    const comboHandler = vi.fn();
    bus.on(Events.UI_COMBO, comboHandler);

    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(comboHandler).toHaveBeenCalledWith(
      expect.objectContaining({ streak: 1, bestStreak: 1, tier: null }),
    );
  });

  it("emits UI_COMBO with tier info when threshold reached", () => {
    const comboHandler = vi.fn();
    bus.on(Events.UI_COMBO, comboHandler);

    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(comboHandler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        streak: 2,
        bestStreak: 2,
        tier: expect.objectContaining({ id: "nice" }),
      }),
    );
  });

  it("streak decays to zero after decayMs timeout", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.streak).toBe(2);

    vi.advanceTimersByTime(8000);
    expect(combo.streak).toBe(0);
  });

  it("decay timer resets on each interception", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    vi.advanceTimersByTime(5000);
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });

    vi.advanceTimersByTime(5000);
    expect(combo.streak).toBe(2);

    vi.advanceTimersByTime(3001);
    expect(combo.streak).toBe(0);
  });

  it("impact clears decay timer", () => {
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    bus.emit(Events.MISSILE_IMPACT, { factionId: "hamas-gaza", impactScale: 1 });
    expect(combo.streak).toBe(0);

    vi.advanceTimersByTime(9000);
    expect(combo.streak).toBe(0);
  });

  it("destroy() unsubscribes handlers", () => {
    combo.destroy();
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(combo.streak).toBe(0);
  });

  it("does not emit combo when impact occurs at zero streak", () => {
    const comboHandler = vi.fn();
    bus.on(Events.UI_COMBO, comboHandler);
    comboHandler.mockClear();

    bus.emit(Events.MISSILE_IMPACT, { factionId: "hamas-gaza", impactScale: 1 });
    expect(comboHandler).not.toHaveBeenCalled();
  });
});
