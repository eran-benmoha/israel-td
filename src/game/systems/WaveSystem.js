import Phaser from "phaser";

const EARTH_RADIUS_KM = 6371;

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

    this.scene.tweens.add({
      targets: state,
      t: 1,
      duration,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        const x = Phaser.Math.Linear(launchPoint.x, targetPoint.x, state.t);
        const y = Phaser.Math.Linear(launchPoint.y, targetPoint.y, state.t);
        const heading = Phaser.Math.Angle.Between(previousX, previousY, x, y);
        rocket.container.setPosition(x, y);
        rocket.container.setRotation(heading);
        rocket.flame.alpha = Phaser.Math.FloatBetween(0.58, 0.95);
        previousX = x;
        previousY = y;

        trail.clear();
        trail.lineStyle(4, missileProfile.trailOuterColor, 0.24);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();

        trail.lineStyle(2, missileProfile.trailInnerColor, 0.78);
        trail.beginPath();
        trail.moveTo(launchPoint.x, launchPoint.y);
        trail.lineTo(x, y);
        trail.strokePath();
      },
      onComplete: () => {
        trail.destroy();
        rocket.container.destroy();
        this.createImpact(targetPoint.x, targetPoint.y, faction, missileProfile);
      },
    });
  }

  createImpact(x, y, faction, missileProfile) {
    const impactScale = (faction.impactMultiplier ?? 1) * (missileProfile.impactScale ?? 1);
    this.resourceSystem.onImpact(impactScale);

    const impact = this.scene.add.circle(x, y, 3, missileProfile.rocketColor ?? faction.rocketColor, 0.95);
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
