import { Events } from "../core/events";
import { getWaveDefinition } from "../core/selectors";

export function computeThreatScore(wave, faction) {
  const intensity = wave?.intensityBonus ?? 0;
  const multiplier = faction?.impactMultiplier ?? 1;
  return intensity * multiplier + (multiplier - 1) * 2;
}

export function getThreatLevel(score, threatLevels) {
  let matched = threatLevels[0];
  for (const level of threatLevels) {
    if (score >= level.minScore) {
      matched = level;
    }
  }
  return matched;
}

export class EarlyWarningSystem {
  constructor({ eventBus, gameState, levelConfig, factionSystem, earlyWarningConfig }) {
    this.eventBus = eventBus;
    this.state = gameState;
    this.levelConfig = levelConfig;
    this.factionSystem = factionSystem;
    this.config = earlyWarningConfig;
    this.unsubscribers = [];
    this.isWarning = false;
  }

  start() {
    this.unsubscribers.push(
      this.eventBus.on(Events.UI_WAVE, () => this.publishForecast()),
      this.eventBus.on(Events.UI_WAVE_PROGRESS, ({ remainingMs }) => this.checkWarning(remainingMs)),
    );
    this.publishForecast();
  }

  destroy() {
    this.unsubscribers.forEach((off) => off());
    this.unsubscribers = [];
  }

  buildForecast() {
    const currentWave = this.state.wave.number;
    const depth = this.config.forecastDepth ?? 3;
    const entries = [];

    for (let i = 1; i <= depth; i++) {
      const futureWaveNumber = currentWave + i;
      const waveDef = getWaveDefinition(this.levelConfig, futureWaveNumber);
      if (!waveDef) continue;

      const faction = this.factionSystem.getById(waveDef.factionId);
      if (!faction) continue;

      const score = computeThreatScore(waveDef, faction);
      const threatLevel = getThreatLevel(score, this.config.threatLevels);

      entries.push({
        waveNumber: futureWaveNumber,
        factionId: faction.id,
        factionName: faction.name,
        territory: faction.territory,
        intensityBonus: waveDef.intensityBonus,
        threatScore: score,
        threatLevel,
      });
    }

    return entries;
  }

  publishForecast() {
    const entries = this.buildForecast();
    this.eventBus.emit(Events.UI_EARLY_WARNING, { entries });
  }

  checkWarning(remainingMs) {
    const threshold = this.config.warningThresholdMs ?? 3000;
    const shouldWarn = remainingMs > 0 && remainingMs <= threshold;

    if (shouldWarn !== this.isWarning) {
      this.isWarning = shouldWarn;
      this.eventBus.emit(Events.UI_EARLY_WARNING_ALERT, { active: shouldWarn, remainingMs });
    }
  }
}
