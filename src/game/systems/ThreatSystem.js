import { Events } from "../core/events";

export class ThreatSystem {
  constructor({ eventBus, factionsConfig, threatConfig }) {
    this.eventBus = eventBus;
    this.factions = factionsConfig.factions ?? [];
    this.config = threatConfig;
    this.scoring = threatConfig.scoring;
    this.levels = threatConfig.threatLevels;
    this.unsubscribers = [];
    this.tickEvent = null;
    this.lastTickTime = 0;

    this.factionThreats = new Map();
    for (const faction of this.factions) {
      this.factionThreats.set(faction.id, {
        score: 0,
        totalLaunched: 0,
        totalImpacts: 0,
        totalIntercepted: 0,
      });
    }
  }

  start(scene) {
    this.scene = scene;
    this.lastTickTime = scene.time.now;

    this.unsubscribers.push(
      this.eventBus.on(Events.THREAT_MISSILE_LAUNCHED, (payload) => this.onMissileLaunched(payload)),
      this.eventBus.on(Events.THREAT_MISSILE_INTERCEPTED, (payload) => this.onMissileIntercepted(payload)),
      this.eventBus.on(Events.THREAT_MISSILE_IMPACT, (payload) => this.onMissileImpact(payload)),
    );

    this.tickEvent = scene.time.addEvent({
      delay: this.config.updateIntervalMs,
      loop: true,
      callback: this.tick,
      callbackScope: this,
    });

    this.publish();
  }

  destroy() {
    for (const off of this.unsubscribers) {
      off();
    }
    this.unsubscribers = [];
    if (this.tickEvent) {
      this.tickEvent.remove(false);
      this.tickEvent = null;
    }
  }

  onMissileLaunched({ factionId }) {
    const data = this.factionThreats.get(factionId);
    if (!data) return;
    data.totalLaunched += 1;
    data.score = Math.min(this.scoring.maxScore, data.score + this.scoring.launchPoints);
  }

  onMissileIntercepted({ factionId }) {
    const data = this.factionThreats.get(factionId);
    if (!data) return;
    data.totalIntercepted += 1;
    data.score = Math.max(0, data.score + this.scoring.interceptPoints);
  }

  onMissileImpact({ factionId }) {
    const data = this.factionThreats.get(factionId);
    if (!data) return;
    data.totalImpacts += 1;
    data.score = Math.min(this.scoring.maxScore, data.score + this.scoring.impactPoints);
  }

  tick() {
    const now = this.scene.time.now;
    const elapsedSec = Math.max(0, (now - this.lastTickTime) / 1000);
    this.lastTickTime = now;

    const decay = this.scoring.decayPerSecond * elapsedSec;
    for (const [, data] of this.factionThreats) {
      data.score = Math.max(0, data.score - decay);
    }

    this.publish();
  }

  getThreatLevel(score) {
    for (let i = this.levels.length - 1; i >= 0; i -= 1) {
      if (score >= this.levels[i].minScore) {
        return this.levels[i];
      }
    }
    return this.levels[0];
  }

  getOverallScore() {
    let max = 0;
    for (const [, data] of this.factionThreats) {
      if (data.score > max) max = data.score;
    }
    return max;
  }

  publish() {
    const factionDetails = [];
    for (const faction of this.factions) {
      const data = this.factionThreats.get(faction.id);
      const level = this.getThreatLevel(data.score);
      factionDetails.push({
        factionId: faction.id,
        factionName: faction.name,
        score: Math.round(data.score),
        level,
        totalLaunched: data.totalLaunched,
        totalImpacts: data.totalImpacts,
        totalIntercepted: data.totalIntercepted,
      });
    }

    const overallScore = this.getOverallScore();
    const overallLevel = this.getThreatLevel(overallScore);

    this.eventBus.emit(Events.UI_THREAT_UPDATE, {
      overall: { score: Math.round(overallScore), level: overallLevel },
      factions: factionDetails,
    });
  }
}
