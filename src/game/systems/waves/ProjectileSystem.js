import Phaser from "phaser";

const EARTH_RADIUS_KM = 6371;

export class ProjectileSystem {
  constructor({ scene, mapSystem, factionSystem, targets, interceptionSystem, impactSystem }) {
    this.scene = scene;
    this.mapSystem = mapSystem;
    this.factionSystem = factionSystem;
    this.targets = targets;
    this.interceptionSystem = interceptionSystem;
    this.impactSystem = impactSystem;
  }

  spawnRocketWave(faction, wave, waveNumber) {
    const intensityBonus = wave.intensityBonus ?? 0;
    const rocketCount = Phaser.Math.Clamp(
      faction.baseVolley + waveNumber + intensityBonus,
      faction.baseVolley,
      faction.maxVolley,
    );
    const launchCadenceMs = faction.launchCadenceMs ?? 700;

    for (let i = 0; i < rocketCount; i += 1) {
      const missileProfile = this.factionSystem.pickMissileProfile(faction.id);
      this.scene.time.delayedCall(i * launchCadenceMs, () => this.spawnRocket(faction, missileProfile));
    }
  }

  spawnRocket(faction, missileProfile) {
    const launch = this.mapSystem.randomGeoPointFromRect(faction.bounds);
    const target = this.pickTargetForMissile(launch, missileProfile);
    const launchPoint = launch.point;
    const targetPoint = target.point;
    const trail = this.scene.add.graphics();
    const rocket = this.mapSystem.createMissileVisual(launchPoint.x, launchPoint.y, missileProfile);
    this.mapSystem.mapContainer.add(trail);

    const state = { t: 0 };
    let previousX = launchPoint.x;
    let previousY = launchPoint.y;
    const duration = Phaser.Math.Between(missileProfile.durationMin, missileProfile.durationMax);
    let intercepted = false;

    const rocketTween = this.scene.tweens.add({
      targets: state,
      t: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const x = Phaser.Math.Linear(launchPoint.x, targetPoint.x, state.t);
        const y = Phaser.Math.Linear(launchPoint.y, targetPoint.y, state.t);
        const heading = Phaser.Math.Angle.Between(previousX, previousY, x, y);
        const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
        rocket.container.setPosition(x, y);
        rocket.container.setRotation(heading);
        rocket.container.setScale(sf);
        rocket.flame.alpha = Phaser.Math.FloatBetween(0.58, 0.95);
        previousX = x;
        previousY = y;

        trail.clear();
        trail.lineStyle(16 * sf, missileProfile.trailOuterColor, 0.24);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();

        trail.lineStyle(8 * sf, missileProfile.trailInnerColor, 0.78);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();
      },
      onComplete: () => {
        trail.destroy();
        rocket.container.destroy();
        if (intercepted) {
          return;
        }
        this.impactSystem.createImpact(targetPoint.x, targetPoint.y, faction, missileProfile);
      },
    });

    this.interceptionSystem.tryScheduleInterception({
      launch,
      target,
      launchPoint,
      targetPoint,
      missileProfile,
      trail,
      rocket,
      rocketTween,
      rocketState: state,
      setIntercepted: () => {
        intercepted = true;
      },
      flightDurationMs: duration,
    });
  }

  pickTargetForMissile(launch, missileProfile) {
    const inRange = this.targets.filter((candidate) => {
      const distance = this.distanceKm(launch.lat, launch.lon, candidate.lat, candidate.lon);
      return distance >= missileProfile.minRangeKm && distance <= missileProfile.maxRangeKm;
    });
    const pool = inRange.length > 0 ? inRange : this.targets;
    const picked = Phaser.Utils.Array.GetRandom(pool);
    return { ...picked, point: this.mapSystem.geoToImagePoint(picked.lat, picked.lon) };
  }

  distanceKm(latA, lonA, latB, lonB) {
    const dLat = Phaser.Math.DegToRad(latB - latA);
    const dLon = Phaser.Math.DegToRad(lonB - lonA);
    const lat1 = Phaser.Math.DegToRad(latA);
    const lat2 = Phaser.Math.DegToRad(latB);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return EARTH_RADIUS_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }
}
