export class GameState {
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

    this.perks = {
      points: 0,
      unlocked: {},
    };
  }
}
