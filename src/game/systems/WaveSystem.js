import Phaser from "phaser";

const EARTH_RADIUS_KM = 6371;
const IRON_DOME_UNIT_ID = "iron-dome-battery";

export class WaveSystem {
  constructor({ scene, eventBus, gameState, levelConfig, israelData, factionSystem, mapSystem, resourceSystem }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.state = gameState;
    this.level = levelConfig;
    this.targets = israelData.targets ?? [];
    this.factionSystem = factionSystem;
    this.mapSystem = mapSystem;
    this.resourceSystem = resourceSystem;
    this.nextWaveAt = 0;
    this.nextWaveEvent = null;
    this.clockTickEvent = null;
    this.lastSimulationUpdateAt = 0;
    this.unsubscribeDebugLaunch = null;
  }

  start() {
    this.state.wave.number = 0;
    this.state.wave.activeFactionId = null;
    this.state.wave.upcomingFactionId = this.getWaveDefinition(1).factionId;
    this.state.wave.simulationClockMs = Date.parse(this.level.simulation.startDateUtc);
    this.lastSimulationUpdateAt = this.scene.time.now;
    this.scheduleNextWave(this.getRandomWaveDelayMs());
    this.clockTickEvent = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: this.tickClock,
      callbackScope: this,
    });
    this.unsubscribeDebugLaunch = this.eventBus.on("debug/launch-wave", () => this.launchWave({ source: "debug" }));
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

    if (this.unsubscribeDebugLaunch) {
      this.unsubscribeDebugLaunch();
      this.unsubscribeDebugLaunch = null;
    }
  }

  getRandomWaveDelayMs() {
    return Phaser.Math.Between(this.level.waveTiming.minDelayMs, this.level.waveTiming.maxDelayMs);
  }

  scheduleNextWave(delayMs) {
    if (this.nextWaveEvent) {
      this.nextWaveEvent.remove(false);
    }

    this.nextWaveAt = this.scene.time.now + delayMs;
    this.nextWaveEvent = this.scene.time.delayedCall(delayMs, () => this.launchWave({ source: "timer" }));
  }

  launchWave({ source }) {
    this.state.wave.number += 1;
    const wave = this.getWaveDefinition(this.state.wave.number);
    this.state.wave.activeFactionId = wave.factionId;
    this.state.wave.upcomingFactionId = this.getWaveDefinition(this.state.wave.number + 1).factionId;
    const faction = this.factionSystem.getById(wave.factionId);
    if (!faction) {
      return;
    }

    this.spawnRocketWave(faction, wave);
    this.scheduleNextWave(this.getRandomWaveDelayMs());
    this.resourceSystem.onWaveLaunched(this.state.wave.number);
    this.publishWaveHud();
    this.eventBus.emit("ui/debug-status", {
      message:
        source === "debug"
          ? `Instant wave ${this.state.wave.number} launched from ${this.factionSystem.describe(faction.id)}.`
          : `Wave ${this.state.wave.number} launched from ${this.factionSystem.describe(faction.id)}.`,
    });
  }

  tickClock() {
    const now = this.scene.time.now;
    const elapsedRealMs = Math.max(0, now - this.lastSimulationUpdateAt);
    this.lastSimulationUpdateAt = now;
    this.state.wave.simulationClockMs +=
      (elapsedRealMs * this.level.simulation.hoursPerSecond * 60 * 60 * 1000) / 1000;
    this.publishWaveHud();
  }

  publishWaveHud() {
    const clockLabel = this.formatClock();
    const originLabel =
      this.state.wave.number === 0
        ? `Next source: ${this.factionSystem.describe(this.state.wave.upcomingFactionId)}`
        : `Active source: ${this.factionSystem.describe(this.state.wave.activeFactionId)}`;

    this.eventBus.emit("ui/wave", {
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

  getWaveDefinition(waveNumber) {
    const waves = this.level.waves ?? [];
    const index = (waveNumber - 1 + waves.length) % waves.length;
    return waves[Math.max(0, index)];
  }

  spawnRocketWave(faction, wave) {
    const intensityBonus = wave.intensityBonus ?? 0;
    const rocketCount = Phaser.Math.Clamp(
      faction.baseVolley + this.state.wave.number + intensityBonus,
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
        const sf = this.mapSystem.getOverlayScaleFactor();
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
        this.createImpact(targetPoint.x, targetPoint.y, faction, missileProfile);
      },
    });

    this.scheduleIronDomeInterception({
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

  scheduleIronDomeInterception({
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
    const batteryCount = this.getPurchasedUnitCount(IRON_DOME_UNIT_ID);
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
        this.eventBus.emit("ui/debug-status", {
          message: `🛡️ Iron Dome intercepted ${this.factionSystem.describe(this.state.wave.activeFactionId)} missile.`,
        });
      });
    });
  }

  getPurchasedUnitCount(unitId) {
    return this.state.purchasedUnits[unitId] ?? 0;
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
    const sf = this.mapSystem.getOverlayScaleFactor();
    const interceptor = this.scene.add.circle(startPoint.x, startPoint.y, 10 * sf, 0x9fe7ff, 0.95);
    interceptor.setStrokeStyle(3 * sf, 0x1c5b79, 0.9);
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

        const currentSf = this.mapSystem.getOverlayScaleFactor();
        interceptorTrail.clear();
        interceptorTrail.lineStyle(8 * currentSf, 0x83dbff, 0.75);
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
    const sf = this.mapSystem.getOverlayScaleFactor();
    const burst = this.scene.add.circle(x, y, 12 * sf, 0xbef4ff, 0.95);
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

  createImpact(x, y, faction, missileProfile) {
    const impactScale = (faction.impactMultiplier ?? 1) * (missileProfile.impactScale ?? 1);
    this.resourceSystem.onImpact(impactScale);

    const sf = this.mapSystem.getOverlayScaleFactor();
    const impact = this.scene.add.circle(x, y, 12 * sf, missileProfile.rocketColor ?? faction.rocketColor, 0.95);
    this.mapSystem.mapContainer.add(impact);
    this.scene.tweens.add({
      targets: impact,
      scale: 6,
      alpha: 0,
      duration: 280,
      ease: "Cubic.easeOut",
      onComplete: () => impact.destroy(),
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
