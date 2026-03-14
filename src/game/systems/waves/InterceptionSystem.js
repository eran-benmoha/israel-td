import Phaser from "phaser";
import { Events } from "../../core/events";
import { getPurchasedUnitCount } from "../../core/selectors";

const IRON_DOME_UNIT_ID = "iron-dome-battery";

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
    const batteryCount = getPurchasedUnitCount(this.state, IRON_DOME_UNIT_ID);
    if (batteryCount <= 0) {
      return;
    }

    const interceptionChance = this.getIronDomeInterceptionChance(missileProfile, batteryCount);
    if (Math.random() > interceptionChance) {
      return;
    }

    const interceptDelay = Math.floor(flightDurationMs * Phaser.Math.FloatBetween(0.35, 0.82));
    this.scene.time.delayedCall(interceptDelay, () => {
      if (!rocket.container?.active || !trail?.active || !rocketTween?.isPlaying()) {
        return;
      }

      const progress = Phaser.Math.Clamp(rocketState.t, 0.1, 0.95);
      const interceptPoint = new Phaser.Geom.Point(
        Phaser.Math.Linear(launchPoint.x, targetPoint.x, progress),
        Phaser.Math.Linear(launchPoint.y, targetPoint.y, progress),
      );
      const interceptorLaunchPoint = this.getClosestDefensePoint(target);

      this.launchInterceptorMissile(interceptorLaunchPoint, interceptPoint, () => {
        if (!rocket.container?.active || !trail?.active || !rocketTween?.isPlaying()) {
          return;
        }

        setIntercepted();
        rocketTween.stop();
        trail.destroy();
        rocket.container.destroy();
        this.createInterceptionFlash(interceptPoint.x, interceptPoint.y);
        const activeFactionId = this.state.wave.activeFactionId;
        this.eventBus.emit(Events.UI_DEBUG_STATUS, {
          message: `🛡️ Iron Dome intercepted ${this.factionSystem.describe(activeFactionId)} missile.`,
        });
      });
    });
  }

  getIronDomeInterceptionChance(missileProfile, batteryCount) {
    const maxRangeKm = missileProfile.maxRangeKm ?? 250;
    const rangeModifier = maxRangeKm <= 70 ? 1 : maxRangeKm <= 250 ? 0.78 : 0.48;
    const baseChance = 0.22 + batteryCount * 0.16;
    return Phaser.Math.Clamp(baseChance * rangeModifier, 0.08, 0.9);
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

  launchInterceptorMissile(startPoint, interceptPoint, onHit) {
    const interceptorTrail = this.scene.add.graphics();
    const interceptor = this.scene.add.circle(startPoint.x, startPoint.y, 2.8, 0x9fe7ff, 0.95);
    interceptor.setStrokeStyle(1, 0x1c5b79, 0.9);
    this.mapSystem.mapContainer.add(interceptorTrail);
    this.mapSystem.mapContainer.add(interceptor);

    const state = { t: 0 };
    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration: Phaser.Math.Between(220, 380),
      ease: "Sine.easeIn",
      onUpdate: () => {
        const x = Phaser.Math.Linear(startPoint.x, interceptPoint.x, state.t);
        const y = Phaser.Math.Linear(startPoint.y, interceptPoint.y, state.t);
        interceptor.setPosition(x, y);

        interceptorTrail.clear();
        interceptorTrail.lineStyle(2, 0x83dbff, 0.75);
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

  createInterceptionFlash(x, y) {
    const burst = this.scene.add.circle(x, y, 3, 0xbef4ff, 0.95);
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
