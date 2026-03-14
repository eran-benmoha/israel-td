import { describe, it, expect, vi, beforeEach } from "vitest";
import { WaveDirector } from "./WaveDirector";
import { EventBus } from "../../core/EventBus";
import { GameState } from "../../core/GameState";
import type { LevelConfig, Faction, FactionsConfig } from "../../../types";
import { FactionSystem } from "../FactionSystem";

vi.mock("phaser", () => ({
  default: {
    Math: {
      Between: (min: number, max: number) => Math.round((min + max) / 2),
    },
  },
}));

const mockLevelConfig: LevelConfig = {
  id: "level-01",
  name: "Test Level",
  simulation: { startDateUtc: "2022-01-01T00:00:00Z", hoursPerSecond: 3 },
  waveTiming: { minDelayMs: 1000, maxDelayMs: 5000 },
  waves: [
    { factionId: "hamas-gaza", intensityBonus: 0 },
    { factionId: "hezbollah-lebanon", intensityBonus: 1 },
  ],
};

const mockFactionsConfig: FactionsConfig = {
  factions: [
    {
      id: "hamas-gaza",
      name: "Hamas",
      territory: "Gaza Strip",
      bounds: { north: 31.6, south: 31.22, west: 34.2, east: 34.58 },
      trailColor: 0xff6655,
      rocketColor: 0xff998e,
      baseVolley: 8,
      maxVolley: 28,
      impactMultiplier: 1,
      durationMin: 3800,
      durationMax: 6200,
    },
    {
      id: "hezbollah-lebanon",
      name: "Hezbollah",
      territory: "South Lebanon",
      bounds: { north: 34.55, south: 33.05, west: 35.05, east: 36.65 },
      trailColor: 0xffcc6d,
      rocketColor: 0xffdd73,
      baseVolley: 7,
      maxVolley: 24,
      impactMultiplier: 1.05,
      durationMin: 4200,
      durationMax: 7000,
    },
  ],
};

describe("WaveDirector", () => {
  let eventBus: EventBus;
  let gameState: GameState;
  let factionSystem: FactionSystem;
  let mockScene: any;
  let director: WaveDirector;

  beforeEach(() => {
    eventBus = new EventBus();
    gameState = new GameState();
    factionSystem = new FactionSystem(mockFactionsConfig);
    mockScene = {
      time: {
        now: 0,
        addEvent: vi.fn(() => ({ remove: vi.fn() })),
        delayedCall: vi.fn(() => ({ remove: vi.fn() })),
      },
    };
    director = new WaveDirector({
      scene: mockScene,
      eventBus,
      gameState,
      levelConfig: mockLevelConfig,
      factionSystem,
    });
  });

  it("start initializes wave state", () => {
    director.start(vi.fn());

    expect(gameState.wave.number).toBe(0);
    expect(gameState.wave.activeFactionId).toBeNull();
    expect(gameState.wave.upcomingFactionId).toBe("hamas-gaza");
    expect(gameState.wave.simulationClockMs).toBe(Date.parse("2022-01-01T00:00:00Z"));
  });

  it("start schedules clock tick", () => {
    director.start(vi.fn());

    expect(mockScene.time.addEvent).toHaveBeenCalledWith(
      expect.objectContaining({ delay: 250, loop: true }),
    );
  });

  it("start schedules next wave", () => {
    director.start(vi.fn());

    expect(mockScene.time.delayedCall).toHaveBeenCalled();
  });

  it("launchNextWave increments wave number", () => {
    director.start(vi.fn());
    director.launchNextWave({ source: "debug", onWaveDue: vi.fn() });

    expect(gameState.wave.number).toBe(1);
  });

  it("launchNextWave returns wave and faction", () => {
    director.start(vi.fn());
    const result = director.launchNextWave({ source: "debug", onWaveDue: vi.fn() });

    expect(result).not.toBeNull();
    expect(result!.wave.factionId).toBe("hamas-gaza");
    expect(result!.faction.id).toBe("hamas-gaza");
    expect(result!.source).toBe("debug");
  });

  it("launchNextWave updates active and upcoming faction", () => {
    director.start(vi.fn());
    director.launchNextWave({ source: "timer", onWaveDue: vi.fn() });

    expect(gameState.wave.activeFactionId).toBe("hamas-gaza");
    expect(gameState.wave.upcomingFactionId).toBe("hezbollah-lebanon");
  });

  it("launchNextWave wraps around wave definitions", () => {
    director.start(vi.fn());
    director.launchNextWave({ source: "timer", onWaveDue: vi.fn() });
    director.launchNextWave({ source: "timer", onWaveDue: vi.fn() });
    const result = director.launchNextWave({ source: "timer", onWaveDue: vi.fn() });

    expect(result).not.toBeNull();
    expect(result!.wave.factionId).toBe("hamas-gaza");
  });

  it("formatClock returns formatted date string", () => {
    gameState.wave.simulationClockMs = Date.parse("2022-06-15T14:30:00Z");
    const formatted = director.formatClock();

    expect(formatted).toContain("Jun");
    expect(formatted).toContain("2022");
    expect(formatted).toContain("14:30");
    expect(formatted).toContain("UTC");
  });

  it("destroy removes timer events", () => {
    const removeFn = vi.fn();
    mockScene.time.addEvent = vi.fn(() => ({ remove: removeFn }));
    mockScene.time.delayedCall = vi.fn(() => ({ remove: removeFn }));

    director.start(vi.fn());
    director.destroy();

    expect(removeFn).toHaveBeenCalledTimes(2);
  });
});
