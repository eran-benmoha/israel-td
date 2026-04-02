import Phaser from "phaser";
import { Events } from "../../core/events";
import { getPurchasedUnitCount } from "../../core/selectors";

export const DEFENSE_TIERS = [
  {
    unitId: "iron-dome-battery",
    label: "Iron Dome",
    interceptorColor: 0x9fe7ff,
    interceptorStroke: 0x1c5b79,
    trailColor: 0x83dbff,
    flashColor: 0xbef4ff,
    interceptDelayMin: 0.35,
    interceptDelayMax: 0.82,
    interceptorDurationMin: 220,
    interceptorDurationMax: 380,
    baseChance: 0.22,
    chancePerUnit: 0.16,
    minChance: 0.08,
    maxChance: 0.88,
    rangeModifiers: { short: 1.0, medium: 0.55, long: 0.15 },
  },
  {
    unitId: "davids-sling",
    label: "David's Sling",
    interceptorColor: 0x7dffb3,
    interceptorStroke: 0x1b7a4a,
    trailColor: 0x5ae89c,
    flashColor: 0xb0ffd4,
    interceptDelayMin: 0.25,
    interceptDelayMax: 0.68,
    interceptorDurationMin: 280,
    interceptorDurationMax: 450,
    baseChance: 0.18,
    chancePerUnit: 0.17,
    minChance: 0.06,
    maxChance: 0.85,
    rangeModifiers: { short: 0.25, medium: 1.0, long: 0.45 },
  },
  {
    unitId: "arrow-system",
    label: "Arrow",
    interceptorColor: 0xffd966,
    interceptorStroke: 0x8b6914,
    trailColor: 0xffbf3f,
    flashColor: 0xfff0b3,
    interceptDelayMin: 0.15,
    interceptDelayMax: 0.55,
    interceptorDurationMin: 340,
    interceptorDurationMax: 520,
    baseChance: 0.15,
    chancePerUnit: 0.18,
    minChance: 0.05,
    maxChance: 0.85,
    rangeModifiers: { short: 0.1, medium: 0.4, long: 1.0 },
  },
];

export function getRangeBracket(missileProfile) {
  const maxRange = missileProfile.maxRangeKm ?? 250;
  if (maxRange <= 70) return "short";
  if (maxRange <= 300) return "medium";
  return "long";
}

export function getTierInterceptionChance(tier, missileProfile, unitCount) {
  const bracket = getRangeBracket(missileProfile);
  const rangeMod = tier.rangeModifiers[bracket];
  const raw = (tier.baseChance + unitCount * tier.chancePerUnit) * rangeMod;
  return Phaser.Math.Clamp(raw, tier.minChance, tier.maxChance);
}

export class InterceptionSystem {
  constructor({ scene, eventBus, gameState, factionSystem, mapSystem, targets }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.factionSystem = factionSystem;
    this.mapSystem = mapSystem;
    this.targets = targets;
  }

  tryScheduleInterception({
    launch,
    target,
    launchPoint,
    targetPoint,
    missileProfile,
    trail,
    rocket,
    rocketTween,
    rocketState,
    setIntercepted,
    flightDurationMs,
  }) {
    let alreadyIntercepted = false;

    for (const tier of DEFENSE_TIERS) {
      const unitCount = getPurchasedUnitCount(this.state, tier.unitId);
      if (unitCount <= 0) continue;

      const chance = getTierInterceptionChance(tier, missileProfile, unitCount);
      if (Math.random() > chance) continue;

      const delayFraction = Phaser.Math.FloatBetween(tier.interceptDelayMin, tier.interceptDelayMax);
      const interceptDelay = Math.floor(flightDurationMs * delayFraction);

      this.scene.time.delayedCall(interceptDelay, () => {
        if (alreadyIntercepted) return;
        if (!rocket.container?.active || !trail?.active || !rocketTween?.isPlaying()) return;

        alreadyIntercepted = true;

        const progress = Phaser.Math.Clamp(rocketState.t, 0.1, 0.95);
        const interceptPoint = new Phaser.Geom.Point(
          Phaser.Math.Linear(launchPoint.x, targetPoint.x, progress),
          Phaser.Math.Linear(launchPoint.y, targetPoint.y, progress),
        );
        const interceptorLaunchPoint = this.getClosestDefensePoint(target);

        this.launchInterceptorMissile(interceptorLaunchPoint, interceptPoint, tier, () => {
          if (!rocket.container?.active || !trail?.active || !rocketTween?.isPlaying()) return;

          setIntercepted();
          rocketTween.stop();
          trail.destroy();
          rocket.container.destroy();
          this.createInterceptionFlash(interceptPoint.x, interceptPoint.y, tier);
          const activeFactionId = this.state.wave.activeFactionId;
          this.eventBus.emit(Events.UI_DEBUG_STATUS, {
            message: `🛡️ ${tier.label} intercepted ${this.factionSystem.describe(activeFactionId)} missile.`,
          });
        });
      });
    }
  }

  getClosestDefensePoint(target) {
    const closestTarget = this.targets.reduce(
      (closest, candidate) => {
        const distance = this.distanceKm(target.lat, target.lon, candidate.lat, candidate.lon);
        if (!closest || distance < closest.distance) {
          return { candidate, distance };
        }
        return closest;
      },
      null,
    );

    const launchGeo = closestTarget?.candidate ?? target;
    return this.mapSystem.geoToImagePoint(launchGeo.lat, launchGeo.lon);
  }

  launchInterceptorMissile(startPoint, interceptPoint, tier, onHit) {
    const interceptorTrail = this.scene.add.graphics();
    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const interceptor = this.scene.add.circle(startPoint.x, startPoint.y, 10 * sf, tier.interceptorColor, 0.95);
    interceptor.setStrokeStyle(3 * sf, tier.interceptorStroke, 0.9);
    this.mapSystem.mapContainer.add(interceptorTrail);
    this.mapSystem.mapContainer.add(interceptor);

    const state = { t: 0 };
    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: Phaser.Math.Between(tier.interceptorDurationMin, tier.interceptorDurationMax),
      ease: "Sine.easeIn",
      onUpdate: () => {
        const x = Phaser.Math.Linear(startPoint.x, interceptPoint.x, state.t);
        const y = Phaser.Math.Linear(startPoint.y, interceptPoint.y, state.t);
        interceptor.setPosition(x, y);

        const currentSf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
        interceptorTrail.clear();
        interceptorTrail.lineStyle(8 * currentSf, tier.trailColor, 0.75);
        interceptorTrail.beginPath();
        interceptorTrail.moveTo(startPoint.x, startPoint.y);
        interceptorTrail.lineTo(x, y);
        interceptorTrail.strokePath();
      },
      onComplete: () => {
        interceptorTrail.destroy();
        interceptor.destroy();
        onHit();
      },
    });
  }

  createInterceptionFlash(x, y, tier) {
    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const burst = this.scene.add.circle(x, y, 12 * sf, tier.flashColor, 0.95);
    this.mapSystem.mapContainer.add(burst);
    this.scene.tweens.add({
      targets: burst,
      scale: 4.5,
      alpha: 0,
      duration: 210,
      ease: "Cubic.easeOut",
      onComplete: () => burst.destroy(),
    });
  }

  distanceKm(latA, lonA, latB, lonB) {
    const dLat = Phaser.Math.DegToRad(latB - latA);
    const dLon = Phaser.Math.DegToRad(lonB - lonA);
    const lat1 = Phaser.Math.DegToRad(latA);
    const lat2 = Phaser.Math.DegToRad(latB);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
}
