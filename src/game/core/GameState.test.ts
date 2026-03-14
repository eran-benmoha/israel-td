import { describe, it, expect } from "vitest";
import { GameState } from "./GameState";

describe("GameState", () => {
  it("initializes with correct default wave state", () => {
    const state = new GameState();

    expect(state.wave.number).toBe(0);
    expect(state.wave.activeFactionId).toBeNull();
    expect(state.wave.upcomingFactionId).toBeNull();
    expect(state.wave.simulationClockMs).toBe(0);
  });

  it("initializes with correct default resources", () => {
    const state = new GameState();

    expect(state.resources.money).toBe(120);
    expect(state.resources.morale).toBe(100);
    expect(state.resources.population).toBe(100);
    expect(state.resources.army).toBe(100);
    expect(state.resources.economy).toBe(100);
  });

  it("initializes with correct max resources", () => {
    const state = new GameState();

    expect(state.maxResources.money).toBe(1000);
    expect(state.maxResources.morale).toBe(100);
    expect(state.maxResources.population).toBe(100);
    expect(state.maxResources.army).toBe(100);
    expect(state.maxResources.economy).toBe(100);
  });

  it("initializes with empty purchased units", () => {
    const state = new GameState();
    expect(state.purchasedUnits).toEqual({});
  });

  it("allows mutation of wave state", () => {
    const state = new GameState();
    state.wave.number = 5;
    state.wave.activeFactionId = "hamas-gaza";

    expect(state.wave.number).toBe(5);
    expect(state.wave.activeFactionId).toBe("hamas-gaza");
  });

  it("allows mutation of resources", () => {
    const state = new GameState();
    state.resources.money = 500;

    expect(state.resources.money).toBe(500);
  });

  it("allows adding purchased units", () => {
    const state = new GameState();
    state.purchasedUnits["iron-dome-battery"] = 2;

    expect(state.purchasedUnits["iron-dome-battery"]).toBe(2);
  });
});
