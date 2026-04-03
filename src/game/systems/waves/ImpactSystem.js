import { Events } from "../../core/events";

export class ImpactSystem {
  constructor({ scene, eventBus, mapSystem, resourceSystem }) {
    this.scene = scene;
    this.eventBus = eventBus;
    this.mapSystem = mapSystem;
    this.resourceSystem = resourceSystem;
  }

  createImpact(x, y, faction, missileProfile) {
    const impactScale = (faction.impactMultiplier ?? 1) * (missileProfile.impactScale ?? 1);
    this.resourceSystem.onImpact(impactScale);
    this.eventBus.emit(Events.THREAT_MISSILE_IMPACT, { factionId: faction.id });

    const sf = this.mapSystem.getOverlayScaleFactor?.() ?? 1;
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
}
