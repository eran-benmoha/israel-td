import Phaser from "phaser";
import { Events } from "../../core/events";
import { getUpcomingFactionId, getWaveDefinition } from "../../core/selectors";

export class WaveDirector {
  constructor({ scene, eventBus, gameState, levelConfig, factionSystem }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.level = levelConfig;
    this.factionSystem = factionSystem;
    this.nextWaveAt = 0;
    this.nextWaveScheduledAt = 0;
    this.nextWaveDelayMs = 0;
    this.nextWaveEvent = null;
    this.clockTickEvent = null;
    this.lastSimulationUpdateAt = 0;
  }

  start(onWaveDue) {
    this.state.wave.number = 0;
    this.state.wave.activeFactionId = null;
    this.state.wave.upcomingFactionId = getUpcomingFactionId(this.level, 1);
    this.state.wave.simulationClockMs = Date.parse(this.level.simulation.startDateUtc);
    this.lastSimulationUpdateAt = this.scene.time.now;
    this.scheduleNextWave(this.getRandomWaveDelayMs(), onWaveDue);
    this.clockTickEvent = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: this.tickClock,
      callbackScope: this,
    });
    this.publishWaveHud();
  }

  destroy() {
    if (this.clockTickEvent) {
      this.clockTickEvent.remove(false);
      this.clockTickEvent = null;
    }

    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
      this.nextWaveEvent = null;
    }
  }

  launchNextWave({ source, onWaveDue }) {
    this.state.wave.number += 1;
    const wave = getWaveDefinition(this.level, this.state.wave.number);
    const factionId = wave?.factionId;
    this.state.wave.activeFactionId = factionId;
    this.state.wave.upcomingFactionId = getUpcomingFactionId(this.level, this.state.wave.number + 1);
    const faction = this.factionSystem.getById(factionId);
    if (!wave || !faction) {
      return null;
    }

    this.scheduleNextWave(this.getRandomWaveDelayMs(), onWaveDue);
    this.publishWaveHud();
    return { wave, faction, source };
  }

  tickClock() {
    const now = this.scene.time.now;
    const elapsedRealMs = Math.max(0, now - this.lastSimulationUpdateAt);
    this.lastSimulationUpdateAt = now;
    this.state.wave.simulationClockMs +=
      (elapsedRealMs * this.level.simulation.hoursPerSecond * 60 * 60 * 1000) / 1000;
    this.publishWaveHud();
    this.publishWaveProgress();
  }

  publishWaveProgress() {
    if (this.nextWaveDelayMs <= 0) return;
    const now = this.scene.time.now;
    const elapsed = now - this.nextWaveScheduledAt;
    const progress = Math.min(elapsed / this.nextWaveDelayMs, 1);
    const remainingMs = Math.max(0, this.nextWaveAt - now);
    this.eventBus.emit(Events.UI_WAVE_PROGRESS, { progress, remainingMs });
  }

  publishWaveHud() {
    const clockLabel = this.formatClock();
    const originLabel =
      this.state.wave.number === 0
        ? `Next source: ${this.factionSystem.describe(this.state.wave.upcomingFactionId)}`
        : `Active source: ${this.factionSystem.describe(this.state.wave.activeFactionId)}`;

    this.eventBus.emit(Events.UI_WAVE, {
      waveNumber: this.state.wave.number,
      clockLabel,
      originLabel,
    });
  }

  formatClock() {
    const date = new Date(this.state.wave.simulationClockMs);
    const month = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const day = String(date.getUTCDate()).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day} ${month} ${year} ${hours}:${minutes} UTC`;
  }

  getRandomWaveDelayMs() {
    return Phaser.Math.Between(this.level.waveTiming.minDelayMs, this.level.waveTiming.maxDelayMs);
  }

  scheduleNextWave(delayMs, onWaveDue) {
    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
    }

    const now = this.scene.time.now;
    this.nextWaveScheduledAt = now;
    this.nextWaveDelayMs = delayMs;
    this.nextWaveAt = now + delayMs;
    this.nextWaveEvent = this.scene.time.delayedCall(delayMs, () => onWaveDue({ source: "timer" }));
  }
}
