export class GameState {
  constructor({ levelConfig } = {}) {
    const defaultResources = {
      money: 120,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };
    const defaultMaxResources = {
      money: 1000,
      morale: 100,
      population: 100,
      army: 100,
      economy: 100,
    };
    const startingResources = levelConfig?.startingResources ?? {};
    const maxResources = levelConfig?.maxResources ?? {};

    this.wave = {
      number: 0,
      activeFactionId: null,
      upcomingFactionId: null,
      simulationClockMs: 0,
    };

    this.resources = {
      ...defaultResources,
      ...startingResources,
    };

    this.maxResources = {
      ...defaultMaxResources,
      ...maxResources,
    };

    this.purchasedUnits = {};
  }
}
