import { describe, it, expect, vi, beforeEach } from "vitest";

const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
globalThis.localStorage = storageMock;

const { DifficultySystem } = await import("../src/game/systems/DifficultySystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { GameState } = await import("../src/game/core/GameState");

const difficultyConfig = {
  difficulties: [
    {
      id: "easy",
      name: "Recruit",
      description: "Relaxed pacing.",
      icon: "🟢",
      modifiers: {
        startingMoney: 200,
        waveTimingMultiplier: 1.5,
        impactDamageMultiplier: 0.6,
        volleySizeMultiplier: 0.7,
        incomeMultiplier: 1.4,
        interceptionBonus: 0.1,
      },
    },
    {
      id: "normal",
      name: "Commander",
      description: "Balanced challenge.",
      icon: "🟡",
      modifiers: {
        startingMoney: 120,
        waveTimingMultiplier: 1.0,
        impactDamageMultiplier: 1.0,
        volleySizeMultiplier: 1.0,
        incomeMultiplier: 1.0,
        interceptionBonus: 0.0,
      },
    },
    {
      id: "hard",
      name: "General",
      description: "Relentless waves.",
      icon: "🔴",
      modifiers: {
        startingMoney: 80,
        waveTimingMultiplier: 0.65,
        impactDamageMultiplier: 1.5,
        volleySizeMultiplier: 1.4,
        incomeMultiplier: 0.7,
        interceptionBonus: -0.08,
      },
    },
  ],
  default: "normal",
};

describe("DifficultySystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    bus = new EventBus();
    state = new GameState();
    sys = new DifficultySystem({ eventBus: bus, gameState: state, difficultyConfig });
    localStorage.clear();
  });

  it("applies default difficulty on start()", () => {
    sys.start();
    expect(state.difficulty.id).toBe("normal");
    expect(state.difficulty.modifiers.startingMoney).toBe(120);
    expect(state.resources.money).toBe(120);
  });

  it("getById returns correct difficulty", () => {
    expect(sys.getById("easy").name).toBe("Recruit");
    expect(sys.getById("hard").name).toBe("General");
    expect(sys.getById("nonexistent")).toBeNull();
  });

  it("selectDifficulty updates state with easy", () => {
    sys.start();
    sys.selectDifficulty("easy");
    expect(state.difficulty.id).toBe("easy");
    expect(state.difficulty.modifiers.startingMoney).toBe(200);
    expect(state.difficulty.modifiers.waveTimingMultiplier).toBe(1.5);
    expect(state.resources.money).toBe(200);
  });

  it("selectDifficulty updates state with hard", () => {
    sys.start();
    sys.selectDifficulty("hard");
    expect(state.difficulty.id).toBe("hard");
    expect(state.difficulty.modifiers.startingMoney).toBe(80);
    expect(state.difficulty.modifiers.impactDamageMultiplier).toBe(1.5);
    expect(state.resources.money).toBe(80);
  });

  it("selectDifficulty ignores unknown difficulty id", () => {
    sys.start();
    sys.selectDifficulty("impossible");
    expect(state.difficulty.id).toBe("normal");
  });

  it("publishes UI_DIFFICULTY event on start", () => {
    const handler = vi.fn();
    bus.on("ui/difficulty", handler);
    sys.start();
    expect(handler).toHaveBeenCalledWith({
      difficulties: difficultyConfig.difficulties,
      selectedId: "normal",
    });
  });

  it("publishes UI_DIFFICULTY event on selectDifficulty", () => {
    sys.start();
    const handler = vi.fn();
    bus.on("ui/difficulty", handler);
    sys.selectDifficulty("hard");
    expect(handler).toHaveBeenCalledWith({
      difficulties: difficultyConfig.difficulties,
      selectedId: "hard",
    });
  });

  it("responds to DIFFICULTY_SELECT event from bus", () => {
    sys.start();
    bus.emit("difficulty/select", { difficultyId: "easy" });
    expect(state.difficulty.id).toBe("easy");
    expect(state.resources.money).toBe(200);
  });

  it("persists selected difficulty to localStorage", () => {
    sys.start();
    sys.selectDifficulty("hard");
    expect(localStorage.getItem("israel-td-difficulty")).toBe("hard");
  });

  it("restores saved difficulty from localStorage", () => {
    localStorage.setItem("israel-td-difficulty", "easy");
    sys.start();
    expect(state.difficulty.id).toBe("easy");
    expect(state.resources.money).toBe(200);
  });

  it("falls back to default if localStorage has invalid value", () => {
    localStorage.setItem("israel-td-difficulty", "nonexistent");
    sys.start();
    expect(state.difficulty.id).toBe("normal");
  });

  it("destroy() unsubscribes from DIFFICULTY_SELECT", () => {
    sys.start();
    sys.destroy();
    bus.emit("difficulty/select", { difficultyId: "hard" });
    expect(state.difficulty.id).toBe("normal");
  });

  it("difficulty modifiers object is a copy (not shared reference)", () => {
    sys.start();
    sys.selectDifficulty("easy");
    state.difficulty.modifiers.startingMoney = 999;
    sys.selectDifficulty("easy");
    expect(state.difficulty.modifiers.startingMoney).toBe(200);
  });
});
