import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../src/game/core/EventBus";
import { Events } from "../src/game/core/events";
import { GameState } from "../src/game/core/GameState";
import {
  EarlyWarningSystem,
  computeThreatScore,
  getThreatLevel,
} from "../src/game/systems/EarlyWarningSystem";
import earlyWarningConfig from "../src/data/early-warning.json";

const factionsConfig = {
  factions: [
    {
      id: "hamas-gaza",
      name: "Hamas",
      territory: "Gaza Strip",
      bounds: { north: 31.6, south: 31.22, west: 34.2, east: 34.56 },
      rocketColor: 0xff8a1e,
      trailColor: 0xff5a35,
      baseVolley: 8,
      maxVolley: 28,
      impactMultiplier: 1,
    },
    {
      id: "hezbollah-lebanon",
      name: "Hezbollah",
      territory: "South Lebanon",
      bounds: { north: 34.0, south: 33.05, west: 35.1, east: 36.6 },
      rocketColor: 0xffdd73,
      trailColor: 0xffa74d,
      baseVolley: 7,
      maxVolley: 24,
      impactMultiplier: 1.05,
    },
    {
      id: "iran-regime",
      name: "Iran regime",
      territory: "Iran",
      bounds: { north: 38.6, south: 25.5, west: 44.0, east: 63.0 },
      rocketColor: 0xd66fff,
      trailColor: 0xe5a3ff,
      baseVolley: 6,
      maxVolley: 22,
      impactMultiplier: 1.25,
    },
  ],
};

const levelConfig = {
  id: "test-level",
  simulation: { startDateUtc: "2022-01-01T00:00:00Z", hoursPerSecond: 3 },
  waveTiming: { minDelayMs: 5000, maxDelayMs: 15000 },
  waves: [
    { factionId: "hamas-gaza", intensityBonus: 0 },
    { factionId: "hezbollah-lebanon", intensityBonus: 1 },
    { factionId: "iran-regime", intensityBonus: 2 },
    { factionId: "hamas-gaza", intensityBonus: 3 },
  ],
};

function makeFactionSystem() {
  const byId = new Map(factionsConfig.factions.map((f) => [f.id, f]));
  return {
    getById: (id) => byId.get(id) ?? null,
    describe: (id) => {
      const f = byId.get(id);
      return f ? `${f.name} • ${f.territory}` : "Unknown";
    },
  };
}

describe("computeThreatScore", () => {
  it("returns 0 for no intensity and multiplier of 1", () => {
    const score = computeThreatScore({ intensityBonus: 0 }, { impactMultiplier: 1 });
    expect(score).toBe(0);
  });

  it("increases with intensityBonus", () => {
    const s1 = computeThreatScore({ intensityBonus: 1 }, { impactMultiplier: 1 });
    const s2 = computeThreatScore({ intensityBonus: 3 }, { impactMultiplier: 1 });
    expect(s2).toBeGreaterThan(s1);
  });

  it("increases with impactMultiplier", () => {
    const s1 = computeThreatScore({ intensityBonus: 2 }, { impactMultiplier: 1 });
    const s2 = computeThreatScore({ intensityBonus: 2 }, { impactMultiplier: 1.25 });
    expect(s2).toBeGreaterThan(s1);
  });

  it("handles null wave/faction gracefully", () => {
    expect(computeThreatScore(null, null)).toBe(0);
    expect(computeThreatScore(undefined, undefined)).toBe(0);
  });
});

describe("getThreatLevel", () => {
  const levels = earlyWarningConfig.threatLevels;

  it("returns LOW for score 0", () => {
    expect(getThreatLevel(0, levels).id).toBe("low");
  });

  it("returns MODERATE for score 1.5", () => {
    expect(getThreatLevel(1.5, levels).id).toBe("moderate");
  });

  it("returns HIGH for score 2.5", () => {
    expect(getThreatLevel(2.5, levels).id).toBe("high");
  });

  it("returns SEVERE for score 4", () => {
    expect(getThreatLevel(4, levels).id).toBe("severe");
  });

  it("returns LOW for score between 0 and 1.5", () => {
    expect(getThreatLevel(1, levels).id).toBe("low");
  });
});

describe("EarlyWarningSystem", () => {
  let eventBus;
  let gameState;
  let factionSystem;
  let system;

  beforeEach(() => {
    eventBus = new EventBus();
    gameState = new GameState();
    factionSystem = makeFactionSystem();
    system = new EarlyWarningSystem({
      eventBus,
      gameState,
      levelConfig,
      factionSystem,
      earlyWarningConfig,
    });
  });

  it("buildForecast returns next N waves from current wave", () => {
    gameState.wave.number = 0;
    const entries = system.buildForecast();
    expect(entries.length).toBe(3);
    expect(entries[0].waveNumber).toBe(1);
    expect(entries[0].factionId).toBe("hamas-gaza");
    expect(entries[1].waveNumber).toBe(2);
    expect(entries[1].factionId).toBe("hezbollah-lebanon");
    expect(entries[2].waveNumber).toBe(3);
    expect(entries[2].factionId).toBe("iran-regime");
  });

  it("forecast advances as waves progress", () => {
    gameState.wave.number = 2;
    const entries = system.buildForecast();
    expect(entries[0].waveNumber).toBe(3);
    expect(entries[0].factionId).toBe("iran-regime");
  });

  it("each forecast entry has threat level info", () => {
    gameState.wave.number = 0;
    const entries = system.buildForecast();
    entries.forEach((entry) => {
      expect(entry.threatLevel).toBeDefined();
      expect(entry.threatLevel.id).toBeTruthy();
      expect(entry.threatLevel.label).toBeTruthy();
      expect(entry.threatLevel.color).toBeTruthy();
      expect(typeof entry.threatScore).toBe("number");
    });
  });

  it("emits UI_EARLY_WARNING on start", () => {
    const handler = vi.fn();
    eventBus.on(Events.UI_EARLY_WARNING, handler);
    system.start();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].entries).toBeInstanceOf(Array);
  });

  it("emits UI_EARLY_WARNING when UI_WAVE fires", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING, handler);
    eventBus.emit(Events.UI_WAVE, { waveNumber: 1, clockLabel: "", originLabel: "" });
    expect(handler).toHaveBeenCalled();
  });

  it("emits UI_EARLY_WARNING_ALERT when remaining time drops below threshold", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING_ALERT, handler);

    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 2500, progress: 0.8 });
    expect(handler).toHaveBeenCalledWith({ active: true, remainingMs: 2500 });
  });

  it("does not re-emit alert if already in warning state", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING_ALERT, handler);

    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 2500, progress: 0.8 });
    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 2000, progress: 0.85 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("emits alert deactivation when time goes above threshold", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING_ALERT, handler);

    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 2500, progress: 0.8 });
    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 5000, progress: 0.5 });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler.mock.calls[1][0].active).toBe(false);
  });

  it("does not emit alert when remainingMs is 0", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING_ALERT, handler);

    eventBus.emit(Events.UI_WAVE_PROGRESS, { remainingMs: 0, progress: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("destroy unsubscribes from events", () => {
    const handler = vi.fn();
    system.start();
    eventBus.on(Events.UI_EARLY_WARNING, handler);
    system.destroy();
    handler.mockClear();

    eventBus.emit(Events.UI_WAVE, { waveNumber: 1, clockLabel: "", originLabel: "" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("forecast wraps around level waves using getWaveDefinition", () => {
    gameState.wave.number = 3;
    const entries = system.buildForecast();
    expect(entries.length).toBe(3);
    expect(entries[0].waveNumber).toBe(4);
  });
});
