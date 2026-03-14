import Phaser from "phaser";
import type { EventBus } from "../../core/EventBus";
import { Events } from "../../core/events";
import { getPurchasedUnitCount } from "../../core/selectors";
import type { GameState } from "../../core/GameState";
import type { FactionSystem } from "../FactionSystem";
import type { MapSystem } from "../MapSystem";
import type { MissileVisual } from "../MapRenderer";
import type { MissileProfile, Target } from "../../../types";

const IRON_DOME_UNIT_ID = "iron-dome-battery";

export interface InterceptionParams {
  launch: { lat: number; lon: number; point: Phaser.Geom.Point };
  target: Target & { point: Phaser.Geom.Point };
  launchPoint: Phaser.Geom.Point;
  targetPoint: Phaser.Geom.Point;
  missileProfile: MissileProfile;
  trail: Phaser.GameObjects.Graphics;
  rocket: MissileVisual;
  rocketTween: Phaser.Tweens.Tween;
  rocketState: { t: number };
  setIntercepted: () => void;
  flightDurationMs: number;
}

interface InterceptionSystemDeps {
  scene: Phaser.Scene;
  eventBus: EventBus;
  gameState: GameState;
  factionSystem: FactionSystem;
  mapSystem: MapSystem;
  targets: Target[];
}

export class InterceptionSystem {
  private scene: Phaser.Scene;
  private eventBus: EventBus;
  private state: GameState;
  private factionSystem: FactionSystem;
  private mapSystem: MapSystem;
  private targets: Target[];

  constructor({ scene, eventBus, gameState, factionSystem, mapSystem, targets }: InterceptionSystemDeps) {
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
  }: InterceptionParams): void {
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
          message: `🛡️ Iron Dome intercepted ${this.factionSystem.describe(activeFactionId ?? "")} missile.`,
        });
      });
    });
  }

  getIronDomeInterceptionChance(missileProfile: MissileProfile, batteryCount: number): number {
    const maxRangeKm = missileProfile.maxRangeKm ?? 250;
    const rangeModifier = maxRangeKm <= 70 ? 1 : maxRangeKm <= 250 ? 0.78 : 0.48;
    const baseChance = 0.22 + batteryCount * 0.16;
    return Phaser.Math.Clamp(baseChance * rangeModifier, 0.08, 0.9);
  }

  private getClosestDefensePoint(target: Target & { point: Phaser.Geom.Point }): Phaser.Geom.Point {
    const closestTarget = this.targets.reduce<{ candidate: Target; distance: number } | null>(
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

  private launchInterceptorMissile(
    startPoint: Phaser.Geom.Point,
    interceptPoint: Phaser.Geom.Point,
    onHit: () => void,
  ): void {
    const interceptorTrail = this.scene.add.graphics();
    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const interceptor = this.scene.add.circle(startPoint.x, startPoint.y, 2.8 * sf, 0x9fe7ff, 0.95);
    interceptor.setStrokeStyle(1 * sf, 0x1c5b79, 0.9);
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

        const currentSf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
        interceptorTrail.clear();
        interceptorTrail.lineStyle(2 * currentSf, 0x83dbff, 0.75);
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

  private createInterceptionFlash(x: number, y: number): void {
    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
    const burst = this.scene.add.circle(x, y, 3 * sf, 0xbef4ff, 0.95);
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

  private distanceKm(latA: number, lonA: number, latB: number, lonB: number): number {
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
