import { describe, it, expect } from "vitest";
import { getAbilityState, isAbilityReady, isAbilityActive } from "../src/game/core/selectors";
import { GameState } from "../src/game/core/GameState";

describe("Ability selectors", () => {
  it("getAbilityState returns null for unknown ability", () => {
    const state = new GameState();
    expect(getAbilityState(state, "unknown")).toBeNull();
  });

  it("getAbilityState returns ability state when present", () => {
    const state = new GameState();
    state.abilities["test-ability"] = { remainingCooldownMs: 5000, remainingDurationMs: 0, unlocked: true };
    expect(getAbilityState(state, "test-ability")).toEqual({
      remainingCooldownMs: 5000,
      remainingDurationMs: 0,
      unlocked: true,
    });
  });

  it("isAbilityReady returns true when off cooldown", () => {
    const state = new GameState();
    state.abilities["test"] = { remainingCooldownMs: 0, remainingDurationMs: 0, unlocked: true };
    expect(isAbilityReady(state, "test")).toBe(true);
  });

  it("isAbilityReady returns false when on cooldown", () => {
    const state = new GameState();
    state.abilities["test"] = { remainingCooldownMs: 3000, remainingDurationMs: 0, unlocked: true };
    expect(isAbilityReady(state, "test")).toBe(false);
  });

  it("isAbilityReady returns false for unknown ability", () => {
    const state = new GameState();
    expect(isAbilityReady(state, "unknown")).toBe(false);
  });

  it("isAbilityActive returns true when duration remaining", () => {
    const state = new GameState();
    state.abilities["test"] = { remainingCooldownMs: 5000, remainingDurationMs: 3000, unlocked: true };
    expect(isAbilityActive(state, "test")).toBe(true);
  });

  it("isAbilityActive returns false when no duration remaining", () => {
    const state = new GameState();
    state.abilities["test"] = { remainingCooldownMs: 0, remainingDurationMs: 0, unlocked: true };
    expect(isAbilityActive(state, "test")).toBe(false);
  });
});
