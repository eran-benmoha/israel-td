import { Events } from "../core/events";

const POINTS_PER_INTERCEPTION = 50;
const POINTS_PER_WAVE = 100;
const PENALTY_PER_IMPACT = -15;

export class ScoreSystem {
  constructor({ eventBus, gameState, levelConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.totalWaves = levelConfig.waves?.length ?? 12;
    this.activeMissiles = 0;
    this.waveJustLaunched = false;
    this.unsubscribers = [];
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.MISSILE_LAUNCHED, () => this.onMissileLaunched()),
      this.eventBus.on(Events.MISSILE_INTERCEPTED, () => this.onMissileIntercepted()),
      this.eventBus.on(Events.MISSILE_IMPACTED, () => this.onMissileImpacted()),
      this.eventBus.on(Events.WAVE_COMPLETED, () => this.onWaveCompleted()),
    );
    this.publishScore();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  onMissileLaunched() {
    this.state.score.totalMissilesFired += 1;
    this.activeMissiles += 1;
    this.waveJustLaunched = true;
  }

  onMissileIntercepted() {
    this.state.score.missilesIntercepted += 1;
    this.state.score.points += POINTS_PER_INTERCEPTION;
    this.activeMissiles = Math.max(0, this.activeMissiles - 1);
    this.publishScore();
    this.checkWaveCleared();
  }

  onMissileImpacted() {
    this.state.score.missilesImpacted += 1;
    this.state.score.points = Math.max(0, this.state.score.points + PENALTY_PER_IMPACT);
    this.activeMissiles = Math.max(0, this.activeMissiles - 1);
    this.publishScore();
    this.checkGameOver();
    this.checkWaveCleared();
  }

  onWaveCompleted() {
    this.state.score.wavesCompleted += 1;
    this.state.score.points += POINTS_PER_WAVE;
    this.publishScore();
    this.checkVictory();
  }

  checkWaveCleared() {
    if (this.activeMissiles <= 0 && this.waveJustLaunched) {
      this.waveJustLaunched = false;
      this.eventBus.emit(Events.WAVE_COMPLETED, {
        waveNumber: this.state.wave.number,
      });
    }
  }

  checkGameOver() {
    if (this.state.gameOver || this.state.victory) return;

    const { morale, population } = this.state.resources;
    if (morale <= 0 || population <= 0) {
      this.state.gameOver = true;
      this.eventBus.emit(Events.GAME_OVER, {
        reason: morale <= 0 ? "Morale collapsed" : "Population devastated",
        score: { ...this.state.score },
        resources: { ...this.state.resources },
      });
    }
  }

  checkVictory() {
    if (this.state.gameOver || this.state.victory) return;

    if (this.state.score.wavesCompleted >= this.totalWaves) {
      this.state.victory = true;
      this.eventBus.emit(Events.GAME_VICTORY, {
        score: { ...this.state.score },
        resources: { ...this.state.resources },
      });
    }
  }

  getInterceptionRate() {
    const total = this.state.score.missilesIntercepted + this.state.score.missilesImpacted;
    if (total === 0) return 0;
    return this.state.score.missilesIntercepted / total;
  }

  publishScore() {
    this.eventBus.emit(Events.UI_SCORE, {
      points: this.state.score.points,
      missilesIntercepted: this.state.score.missilesIntercepted,
      missilesImpacted: this.state.score.missilesImpacted,
      wavesCompleted: this.state.score.wavesCompleted,
      totalWaves: this.totalWaves,
      interceptionRate: this.getInterceptionRate(),
    });
  }
}
