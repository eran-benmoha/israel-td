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

    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.interceptedCount = 0;
    this.impactCount = 0;
  }

  reset() {
    this.wave.number = 0;
    this.wave.activeFactionId = null;
    this.wave.upcomingFactionId = null;
    this.wave.simulationClockMs = 0;
    this.resources.money = 120;
    this.resources.morale = 100;
    this.resources.population = 100;
    this.resources.army = 100;
    this.resources.economy = 100;
    this.purchasedUnits = {};
    this.score = 0;
    this.gameOver = false;
    this.gameWon = false;
    this.interceptedCount = 0;
    this.impactCount = 0;
  }
}
