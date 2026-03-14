import type { Resources } from "../../types";

export interface WaveState {
  number: number;
  activeFactionId: string | null;
  upcomingFactionId: string | null;
  simulationClockMs: number;
}

export class GameState {
  wave: WaveState;
  resources: Resources;
  maxResources: Resources;
  purchasedUnits: Record<string, number>;

  constructor() {
    this.wave = {
      number: 0,
      activeFactionId: null,
      upcomingFactionId: null,
      simulationClockMs: 0,
    };

    this.resources = {
      money: 120,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };

    this.maxResources = {
      money: 1000,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };

    this.purchasedUnits = {};
  }
}
