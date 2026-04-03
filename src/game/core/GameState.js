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

    this.difficulty = {
      id: "normal",
      modifiers: {
        startingMoney: 120,
        waveTimingMultiplier: 1.0,
        impactDamageMultiplier: 1.0,
        volleySizeMultiplier: 1.0,
        incomeMultiplier: 1.0,
        interceptionBonus: 0.0,
      },
    };
  }
}
