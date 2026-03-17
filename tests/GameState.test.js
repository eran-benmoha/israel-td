import { describe, it, expect } from "vitest";
import { GameState } from "../src/game/core/GameState";

describe("GameState", () => {
  it("initialises with default resource values", () => {
    const state = new GameState();
    expect(state.resources.money).toBe(120);
    expect(state.resources.morale).toBe(100);
    expect(state.resources.population).toBe(100);
    expect(state.resources.army).toBe(100);
    expect(state.resources.economy).toBe(100);
  });

  it("initialises wave state to zero", () => {
    const state = new GameState();
    expect(state.wave.number).toBe(0);
    expect(state.wave.activeFactionId).toBeNull();
    expect(state.wave.upcomingFactionId).toBeNull();
    expect(state.wave.simulationClockMs).toBe(0);
  });

  it("initialises with empty purchasedUnits", () => {
    const state = new GameState();
    expect(state.purchasedUnits).toEqual({});
  });

  it("max resources are set correctly", () => {
    const state = new GameState();
    expect(state.maxResources.money).toBe(1000);
    expect(state.maxResources.morale).toBe(100);
  });
});
