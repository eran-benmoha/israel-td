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

    this.score = {
      points: 0,
      missilesIntercepted: 0,
      missilesImpacted: 0,
      wavesCompleted: 0,
      totalMissilesFired: 0,
    };

    this.gameOver = false;
    this.victory = false;
  }
}
