import { describe, it, expect, vi, beforeEach } from "vitest";

const { ScoreSystem } = await import("../src/game/systems/ScoreSystem");
const { EventBus } = await import("../src/game/core/EventBus");
const { GameState } = await import("../src/game/core/GameState");
const { Events } = await import("../src/game/core/events");

const levelConfig = {
  waves: [
    { factionId: "a", intensityBonus: 0 },
    { factionId: "b", intensityBonus: 0 },
    { factionId: "a", intensityBonus: 1 },
  ],
};

describe("ScoreSystem", () => {
  let bus, state, sys;

  beforeEach(() => {
    bus = new EventBus();
    state = new GameState();
    sys = new ScoreSystem({ eventBus: bus, gameState: state, levelConfig });
  });

  it("initializes with zero score", () => {
    expect(state.score.points).toBe(0);
    expect(state.score.missilesIntercepted).toBe(0);
    expect(state.score.missilesImpacted).toBe(0);
    expect(state.score.wavesCompleted).toBe(0);
  });

  it("publishes initial score on start", () => {
    const handler = vi.fn();
    bus.on(Events.UI_SCORE, handler);
    sys.start();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ points: 0, wavesCompleted: 0 }),
    );
  });

  it("tracks missile launches", () => {
    sys.start();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    expect(state.score.totalMissilesFired).toBe(2);
  });

  it("awards 50 points per interception", () => {
    sys.start();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    expect(state.score.missilesIntercepted).toBe(1);
    expect(state.score.points).toBe(50);
  });

  it("penalizes 15 points per impact (min 0)", () => {
    sys.start();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(state.score.missilesImpacted).toBe(1);
    expect(state.score.points).toBe(0);
  });

  it("score never goes negative from impacts alone", () => {
    sys.start();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    state.score.points = 10;
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(state.score.points).toBe(0);
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    const pointsAfterWaveBonus = state.score.points;
    expect(pointsAfterWaveBonus).toBeGreaterThanOrEqual(0);
  });

  it("awards 100 points per wave completed", () => {
    sys.start();
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 1 });
    expect(state.score.wavesCompleted).toBe(1);
    expect(state.score.points).toBe(100);
  });

  it("triggers GAME_OVER when morale reaches 0", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.morale = 0;
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Morale collapsed" }),
    );
    expect(state.gameOver).toBe(true);
  });

  it("triggers GAME_OVER when population reaches 0", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_OVER, handler);
    state.resources.population = 0;
    state.resources.morale = 50;
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "Population devastated" }),
    );
    expect(state.gameOver).toBe(true);
  });

  it("triggers GAME_VICTORY when all waves completed", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.GAME_VICTORY, handler);
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 1 });
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 2 });
    expect(handler).not.toHaveBeenCalled();
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(state.victory).toBe(true);
  });

  it("does not trigger game over after victory", () => {
    sys.start();
    const goHandler = vi.fn();
    bus.on(Events.GAME_OVER, goHandler);
    state.victory = true;
    state.resources.morale = 0;
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(goHandler).not.toHaveBeenCalled();
  });

  it("does not trigger victory after game over", () => {
    sys.start();
    const victoryHandler = vi.fn();
    bus.on(Events.GAME_VICTORY, victoryHandler);
    state.gameOver = true;
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 1 });
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 2 });
    bus.emit(Events.WAVE_COMPLETED, { waveNumber: 3 });
    expect(victoryHandler).not.toHaveBeenCalled();
  });

  it("calculates interception rate correctly", () => {
    sys.start();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(sys.getInterceptionRate()).toBeCloseTo(0.75);
  });

  it("returns 0 interception rate when no missiles resolved", () => {
    expect(sys.getInterceptionRate()).toBe(0);
  });

  it("emits UI_SCORE on interception", () => {
    sys.start();
    const handler = vi.fn();
    bus.on(Events.UI_SCORE, handler);
    handler.mockClear();
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ points: 50, missilesIntercepted: 1 }),
    );
  });

  it("auto-completes wave when all missiles resolve", () => {
    sys.start();
    const waveHandler = vi.fn();
    bus.on(Events.WAVE_COMPLETED, waveHandler);
    state.wave.number = 1;
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    expect(waveHandler).not.toHaveBeenCalled();
    bus.emit(Events.MISSILE_IMPACTED, { factionId: "a", impactScale: 1 });
    expect(waveHandler).toHaveBeenCalledTimes(1);
  });

  it("destroy() unsubscribes all handlers", () => {
    sys.start();
    sys.destroy();
    const scoreBefore = state.score.points;
    bus.emit(Events.MISSILE_LAUNCHED, { factionId: "a" });
    bus.emit(Events.MISSILE_INTERCEPTED, { factionId: "a" });
    expect(state.score.points).toBe(scoreBefore);
    expect(state.score.missilesIntercepted).toBe(0);
  });
});
