import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../src/game/core/EventBus";
import { GameState } from "../src/game/core/GameState";
import { Events } from "../src/game/core/events";

const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage });

const { ScoreSystem } = await import("../src/game/systems/ScoreSystem");

describe("ScoreSystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    mockLocalStorage.clear();
    bus = new EventBus();
    state = new GameState();
    sys = new ScoreSystem({ eventBus: bus, gameState: state, totalWaves: 12 });
  });

  it("starts with score 0 and publishes initial score", () => {
    const handler = vi.fn();
    bus.on(Events.SCORE_UPDATED, handler);
    sys.start();
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ score: 0 }));
  });

  it("adds points on wave update", () => {
    sys.start();
    state.wave.number = 1;
    bus.emit(Events.UI_WAVE, { waveNumber: 1, clockLabel: "", originLabel: "" });
    expect(state.score).toBe(100);
  });

  it("adds points on missile interception", () => {
    sys.start();
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "hamas-gaza" });
    expect(state.score).toBe(50);
    expect(state.interceptedCount).toBe(1);
  });

  it("subtracts points on missile impact (floored at 0)", () => {
    sys.start();
    bus.emit(Events.MISSILE_IMPACT, { factionId: "hamas-gaza", impactScale: 1 });
    expect(state.score).toBe(0);
    expect(state.impactCount).toBe(1);
  });

  it("triggers GAME_OVER when morale reaches 0", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.morale = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(state.gameOver).toBe(true);
  });

  it("triggers GAME_OVER when population reaches 0", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.population = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("triggers GAME_OVER when army reaches 0", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.army = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("triggers GAME_VICTORY when final wave is reached", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_VICTORY, handler);
    state.wave.number = 12;
    bus.emit(Events.UI_WAVE, { waveNumber: 12, clockLabel: "", originLabel: "" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(state.gameWon).toBe(true);
  });

  it("does not trigger events after game is already over", () => {
    sys.start();
    state.gameOver = true;
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.morale = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).not.toHaveBeenCalled();
  });

  it("persists high score to localStorage", () => {
    sys.start();
    state.wave.number = 1;
    bus.emit(Events.UI_WAVE, { waveNumber: 1, clockLabel: "", originLabel: "" });
    state.resources.morale = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(mockLocalStorage.getItem("israel-td-highscore")).toBe("100");
  });

  it("reports isNewHighScore correctly in end payload", () => {
    mockLocalStorage.setItem("israel-td-highscore", "50");
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.wave.number = 1;
    bus.emit(Events.UI_WAVE, { waveNumber: 1, clockLabel: "", originLabel: "" });
    state.resources.morale = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ isNewHighScore: true, score: 100 }));
  });

  it("destroy() unsubscribes all handlers", () => {
    sys.start();
    sys.destroy();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.morale = 0;
    bus.emit(Events.UI_RESOURCES, { resources: state.resources, maxResources: state.maxResources });
    expect(handler).not.toHaveBeenCalled();
  });

  it("GameState.reset() clears score and end-state fields", () => {
    state.score = 500;
    state.gameOver = true;
    state.interceptedCount = 10;
    state.impactCount = 5;
    state.reset();
    expect(state.score).toBe(0);
    expect(state.gameOver).toBe(false);
    expect(state.gameWon).toBe(false);
    expect(state.interceptedCount).toBe(0);
    expect(state.impactCount).toBe(0);
  });
});
