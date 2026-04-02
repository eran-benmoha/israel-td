import { Events } from "../core/events";

const HIGHSCORE_KEY = "israel-td-highscore";
const POINTS_PER_WAVE = 100;
const POINTS_PER_INTERCEPT = 50;
const POINTS_PER_IMPACT = -25;

export class ScoreSystem {
  constructor({ eventBus, gameState, totalWaves }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.totalWaves = totalWaves;
    this.unsubscribers = [];
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.UI_RESOURCES, () => this.checkLoseCondition()),
      this.eventBus.on(Events.MISSILE_INTERCEPTED, () => this.onInterception()),
      this.eventBus.on(Events.MISSILE_IMPACT, () => this.onImpact()),
      this.eventBus.on(Events.UI_WAVE, ({ waveNumber }) => this.onWaveUpdate(waveNumber)),
    );
    this.publishScore();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  onWaveUpdate(waveNumber) {
    if (this.state.gameOver || this.state.gameWon) return;
    if (waveNumber < 1) return;

    this.addScore(POINTS_PER_WAVE);

    if (waveNumber >= this.totalWaves) {
      this.triggerVictory();
    }
  }

  onInterception() {
    if (this.state.gameOver || this.state.gameWon) return;
    this.state.interceptedCount += 1;
    this.addScore(POINTS_PER_INTERCEPT);
  }

  onImpact() {
    if (this.state.gameOver || this.state.gameWon) return;
    this.state.impactCount += 1;
    this.addScore(POINTS_PER_IMPACT);
  }

  addScore(points) {
    this.state.score = Math.max(0, this.state.score + points);
    this.publishScore();
  }

  checkLoseCondition() {
    if (this.state.gameOver || this.state.gameWon) return;

    const { morale, population, army } = this.state.resources;
    if (morale <= 0 || population <= 0 || army <= 0) {
      this.triggerGameOver();
    }
  }

  triggerGameOver() {
    this.state.gameOver = true;
    this.persistHighScore();
    this.eventBus.emit(Events.GAME_OVER, this.buildEndPayload());
  }

  triggerVictory() {
    this.state.gameWon = true;
    this.persistHighScore();
    this.eventBus.emit(Events.GAME_VICTORY, this.buildEndPayload());
  }

  buildEndPayload() {
    return {
      score: this.state.score,
      wavesCompleted: this.state.wave.number,
      totalWaves: this.totalWaves,
      intercepted: this.state.interceptedCount,
      impacts: this.state.impactCount,
      highScore: this.getHighScore(),
      isNewHighScore: this.state.score >= this.getHighScore(),
    };
  }

  publishScore() {
    this.eventBus.emit(Events.SCORE_UPDATED, {
      score: this.state.score,
      highScore: this.getHighScore(),
    });
  }

  persistHighScore() {
    try {
      const current = this.getHighScore();
      if (this.state.score > current) {
        localStorage.setItem(HIGHSCORE_KEY, String(this.state.score));
      }
    } catch {
      // localStorage unavailable — silently ignore
    }
  }

  getHighScore() {
    try {
      return parseInt(localStorage.getItem(HIGHSCORE_KEY), 10) || 0;
    } catch {
      return 0;
    }
  }
}
